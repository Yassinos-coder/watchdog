import { Module } from '@nestjs/common';
import { AlertsModule } from '../alerts/alerts.module';
import { IssuesModule } from '../issues/issues.module';
import { PerformanceModule } from '../performance/performance.module';
import { ProjectsModule } from '../projects/projects.module';
import { ApiKeysController } from './controllers/api-keys.controller';
import { McpController } from './controllers/mcp.controller';
import { ApiKeyRepository } from './repositories/api-key.repository';
import { ApiKeysService } from './services/api-keys.service';
import { McpAuthService } from './services/mcp-auth.service';
import { McpProtocolService } from './services/mcp-protocol.service';
import { McpToolsService } from './services/mcp-tools.service';

@Module({
  imports: [ProjectsModule, IssuesModule, PerformanceModule, AlertsModule],
  controllers: [McpController, ApiKeysController],
  providers: [ApiKeyRepository, ApiKeysService, McpAuthService, McpToolsService, McpProtocolService],
})
export class McpModule {}
