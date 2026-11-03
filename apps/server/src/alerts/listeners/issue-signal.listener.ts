import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ISSUE_EVENT_RECORDED } from '../constants/alert.constants';
import { IssueSignal } from '../interfaces/alert.interfaces';
import { AlertDispatchService } from '../services/alert-dispatch.service';

@Injectable()
export class IssueSignalListener {
  private readonly logger = new Logger(IssueSignalListener.name);

  constructor(private readonly dispatchService: AlertDispatchService) {}

  @OnEvent(ISSUE_EVENT_RECORDED, { async: true })
  async onIssueEvent(signal: IssueSignal): Promise<void> {
    try {
      await this.dispatchService.handleSignal(signal);
    } catch (error) {
      this.logger.error(`Could not process alerts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
