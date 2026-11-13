export const MCP_PROTOCOL_VERSIONS = ['2025-06-18', '2025-03-26', '2024-11-05'] as const;
export const MCP_SERVER_NAME = 'watchdog';
export const API_KEY_PREFIX = 'wdmcp_';
export const API_KEY_PREFIX_SHOWN = 12;
export const MAX_API_KEYS = 25;
export const KEY_LAST_USED_THROTTLE_MS = 60_000;
export const MAX_TOOL_RESULT_CHARS = 60_000;
export const MAX_LIST_LIMIT = 50;
export const DEFAULT_LIST_LIMIT = 20;
export const MCP_RATE_LIMIT_PER_MINUTE = 300;
export const MINUTE_MS = 60_000;

export const JSON_RPC_ERRORS = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
} as const;

export interface McpPermissionDefinition {
  id: string;
  label: string;
  description: string;
  tools: string[];
  writes: boolean;
}

export const MCP_PERMISSIONS: McpPermissionDefinition[] = [
  {
    id: 'projects:read',
    label: 'See projects',
    description: 'List your projects and their ids.',
    tools: ['list_projects'],
    writes: false,
  },
  {
    id: 'projects:manage',
    label: 'Set up projects and credentials',
    description:
      'Create projects, read their DSNs and rotate source map upload tokens, so an assistant can wire your apps to Watchdog. This hands out credentials, so keep it off unless you need it.',
    tools: ['create_project', 'get_project_setup', 'rotate_upload_token'],
    writes: true,
  },
  {
    id: 'issues:read',
    label: 'Read issues',
    description: 'List and open issues, with stack traces, and read error statistics.',
    tools: ['get_latest_issue', 'list_issues', 'get_issue', 'list_issue_events', 'get_project_stats'],
    writes: false,
  },
  {
    id: 'issues:write',
    label: 'Change issue status',
    description: 'Mark issues resolved, ignored or unresolved.',
    tools: ['update_issue_status'],
    writes: true,
  },
  {
    id: 'performance:read',
    label: 'Read performance and metrics',
    description: 'Transaction summaries, metric names, chart series and dashboards.',
    tools: ['transactions_summary', 'list_metrics', 'query_series', 'list_dashboards'],
    writes: false,
  },
  {
    id: 'alerts:read',
    label: 'Read alert rules',
    description: 'See the alert rules configured for a project.',
    tools: ['list_alert_rules'],
    writes: false,
  },
];

export const MCP_PERMISSION_IDS = MCP_PERMISSIONS.map((permission) => permission.id);
export const DEFAULT_PERMISSIONS = MCP_PERMISSIONS.filter((permission) => !permission.writes).map(
  (permission) => permission.id,
);
