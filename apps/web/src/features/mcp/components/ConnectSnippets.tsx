import { CodeSnippet } from '@/components/CodeSnippet';

interface ConnectSnippetsProps {
  url: string;
  apiKey: string;
}

export function ConnectSnippets({ url, apiKey }: ConnectSnippetsProps) {
  const claudeCode = `claude mcp add --transport http watchdog ${url} --header "Authorization: Bearer ${apiKey}"`;
  const json = JSON.stringify(
    { mcpServers: { watchdog: { type: 'http', url, headers: { Authorization: `Bearer ${apiKey}` } } } },
    null,
    2,
  );
  const check = `curl -s ${url} \\\n  -H "Authorization: Bearer ${apiKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`;

  return (
    <div className="grid gap-4">
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Claude Code</p>
        <CodeSnippet code={claudeCode} />
      </div>
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Any client that reads an MCP config file (Cursor, Windsurf, VS Code and others)</p>
        <CodeSnippet code={json} />
      </div>
      <div className="grid gap-1.5">
        <p className="text-sm font-medium">Check the connection</p>
        <CodeSnippet code={check} />
      </div>
    </div>
  );
}
