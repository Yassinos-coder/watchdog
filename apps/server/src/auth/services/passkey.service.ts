import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { UserRepository } from '../../users/repositories/user.repository';
import { AuthContext } from '../interfaces/auth.interfaces';
import { PasskeyRepository } from '../repositories/passkey.repository';
import { SessionRepository } from '../repositories/session.repository';

const DEFAULT_PASSKEY_NAME = 'Passkey';

@Injectable()
export class PasskeyService {
  constructor(
    private readonly configService: ConfigService,
    private readonly passkeyRepository: PasskeyRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async createRegistrationOptions({
    session,
    user,
  }: AuthContext): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const existing = await this.passkeyRepository.findByUser(user.id);
    const options = await generateRegistrationOptions({
      rpName: this.configService.getOrThrow<string>('webauthn.rpName'),
      rpID: this.configService.getOrThrow<string>('webauthn.rpId'),
      userName: user.email,
      userID: new TextEncoder().encode(user.id),
      attestationType: 'none',
      excludeCredentials: existing.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports as AuthenticatorTransport[],
      })),
      authenticatorSelection: { residentKey: 'preferred', userVerification: 'preferred' },
    });
    await this.sessionRepository.setChallenge(session.id, options.challenge);
    return options;
  }

  async verifyRegistration(
    { session, user }: AuthContext,
    response: RegistrationResponseJSON,
    name: string | undefined,
  ): Promise<void> {
    if (!session.webauthnChallenge) {
      throw new BadRequestException('Start passkey registration first');
    }
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: session.webauthnChallenge,
      expectedOrigin: this.configService.getOrThrow<string[]>('webauthn.origins'),
      expectedRPID: this.configService.getOrThrow<string>('webauthn.rpId'),
    }).catch(() => null);
    if (!verification?.verified) {
      throw new BadRequestException('Passkey registration failed');
    }
    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    await this.passkeyRepository.create({
      id: credential.id,
      userId: user.id,
      name: name?.trim() || DEFAULT_PASSKEY_NAME,
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports ?? [],
      deviceType: credentialDeviceType,
      backedUp: credentialBackedUp,
    });
    await this.sessionRepository.setChallenge(session.id, null);
    if (!user.mfaMethods.includes('PASSKEY')) {
      await this.userRepository.setMfaMethods(user.id, [...user.mfaMethods, 'PASSKEY']);
    }
  }

  async createAuthenticationOptions({
    session,
    user,
  }: AuthContext): Promise<PublicKeyCredentialRequestOptionsJSON> {
    const passkeys = await this.passkeyRepository.findByUser(user.id);
    if (passkeys.length === 0) {
      throw new BadRequestException('No passkeys registered');
    }
    const options = await generateAuthenticationOptions({
      rpID: this.configService.getOrThrow<string>('webauthn.rpId'),
      userVerification: 'preferred',
      allowCredentials: passkeys.map((passkey) => ({
        id: passkey.id,
        transports: passkey.transports as AuthenticatorTransport[],
      })),
    });
    await this.sessionRepository.setChallenge(session.id, options.challenge);
    return options;
  }

  async verifyAuthentication(
    { session, user }: AuthContext,
    response: AuthenticationResponseJSON,
  ): Promise<boolean> {
    if (!session.webauthnChallenge) {
      throw new BadRequestException('Request passkey options first');
    }
    const passkey = await this.passkeyRepository.findForUser(user.id, response.id);
    if (!passkey) {
      throw new UnauthorizedException('Unknown passkey');
    }
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: session.webauthnChallenge,
      expectedOrigin: this.configService.getOrThrow<string[]>('webauthn.origins'),
      expectedRPID: this.configService.getOrThrow<string>('webauthn.rpId'),
      credential: {
        id: passkey.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransport[],
      },
    }).catch(() => null);
    if (!verification?.verified) {
      return false;
    }
    await this.passkeyRepository.recordUse(passkey.id, verification.authenticationInfo.newCounter);
    return true;
  }
}
