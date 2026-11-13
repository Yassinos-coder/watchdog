import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { AlertTrigger } from '../../generated/prisma/enums';
import { ALERT_TRIGGERED, LEVEL_RANK, MAX_ERROR_LENGTH, MINUTE_MS } from '../constants/alert.constants';
import { AlertMessage, IssueSignal } from '../interfaces/alert.interfaces';
import { AlertMessageMapper } from '../mappers/alert-message.mapper';
import { AlertDeliveryRepository } from '../repositories/alert-delivery.repository';
import { AlertRuleRepository, RuleWithChannels } from '../repositories/alert-rule.repository';
import { SpikeDetector } from '../utils/spike-detector';
import { AlertChannelsService } from './alert-channels.service';

@Injectable()
export class AlertDispatchService {
  private readonly logger = new Logger(AlertDispatchService.name);
  private readonly spikes = new SpikeDetector();

  constructor(
    private readonly ruleRepository: AlertRuleRepository,
    private readonly deliveryRepository: AlertDeliveryRepository,
    private readonly channelsService: AlertChannelsService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleSignal(signal: IssueSignal): Promise<void> {
    if (signal.isNewIssue) {
      await this.dispatch(signal, 'NEW_ISSUE', AlertMessageMapper.reason('NEW_ISSUE'));
    } else if (signal.isRegression) {
      await this.dispatch(signal, 'REGRESSION', AlertMessageMapper.reason('REGRESSION'));
    }
    await this.checkSpikes(signal);
  }

  private async checkSpikes(signal: IssueSignal): Promise<void> {
    const rules = this.matching(await this.ruleRepository.findActive(signal.projectId, 'SPIKE'), signal);
    for (const rule of rules) {
      if (!rule.spikeThreshold || !rule.spikeWindowMins) {
        continue;
      }
      const count = this.spikes.record(`${rule.id}:${signal.issueId}`, rule.spikeThreshold, rule.spikeWindowMins);
      if (count !== null) {
        const reason = AlertMessageMapper.reason('SPIKE', { count, windowMins: rule.spikeWindowMins });
        this.eventEmitter.emit(ALERT_TRIGGERED, {
          type: 'issue.spike',
          projectId: signal.projectId,
          rule: { id: rule.id, name: rule.name },
          data: { issueId: signal.issueId, count, windowMins: rule.spikeWindowMins, environment: signal.environment },
        });
        await this.deliver(rule, signal, 'SPIKE', reason);
      }
    }
  }

  private async dispatch(signal: IssueSignal, trigger: AlertTrigger, reason: string): Promise<void> {
    const rules = this.matching(await this.ruleRepository.findActive(signal.projectId, trigger), signal);
    for (const rule of rules) {
      await this.deliver(rule, signal, trigger, reason);
    }
  }

  private matching(rules: RuleWithChannels[], signal: IssueSignal): RuleWithChannels[] {
    return rules.filter((rule) => {
      const levelOk = (LEVEL_RANK[signal.level] ?? 0) >= (LEVEL_RANK[rule.minLevel] ?? 0);
      const environmentOk = !rule.environment || rule.environment === signal.environment;
      return levelOk && environmentOk;
    });
  }

  private async deliver(
    rule: RuleWithChannels,
    signal: IssueSignal,
    trigger: AlertTrigger,
    reason: string,
  ): Promise<void> {
    const channels = rule.channels.filter((channel) => channel.enabled);
    if (channels.length === 0 || (await this.inCooldown(rule, signal.issueId, trigger))) {
      return;
    }
    const issue = await this.deliveryRepository.findIssueWithProject(signal.issueId);
    if (!issue) {
      return;
    }
    const message = AlertMessageMapper.fromIssue(
      trigger,
      reason,
      issue,
      this.configService.getOrThrow<string>('appUrl'),
      { environment: signal.environment, release: signal.release },
    );
    await this.sendToChannels(rule, message, issue.id);
  }

  async sendToChannels(rule: RuleWithChannels, message: AlertMessage, issueId?: string): Promise<void> {
    for (const channel of rule.channels.filter((candidate) => candidate.enabled)) {
      await this.sendOne(rule, channel, message, issueId);
    }
  }

  private async sendOne(
    rule: RuleWithChannels,
    channel: RuleWithChannels['channels'][number],
    message: AlertMessage,
    issueId?: string,
  ): Promise<void> {
    try {
      await this.channelsService.send(channel, message);
      await this.deliveryRepository.record({ ruleId: rule.id, channelId: channel.id, issueId, status: 'SENT' });
    } catch (error) {
      const detail = (error instanceof Error ? error.message : 'Unknown error').slice(0, MAX_ERROR_LENGTH);
      this.logger.warn(`Alert "${rule.name}" to "${channel.name}" failed: ${detail}`);
      await this.deliveryRepository.record({
        ruleId: rule.id,
        channelId: channel.id,
        issueId,
        status: 'FAILED',
        error: detail,
      });
    }
  }

  private async inCooldown(rule: RuleWithChannels, issueId: string, trigger: AlertTrigger): Promise<boolean> {
    if (trigger === 'NEW_ISSUE' || rule.cooldownMins <= 0) {
      return false;
    }
    return this.deliveryRepository.wasSentSince(rule.id, issueId, new Date(Date.now() - rule.cooldownMins * MINUTE_MS));
  }
}
