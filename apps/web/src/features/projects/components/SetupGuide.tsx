import { useState } from 'react';
import { CodeSnippet } from '@/components/CodeSnippet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SnippetBuilder, type SetupSnippets } from '../utils/snippets';
import type { Project } from '../types/project.types';

interface SetupGuideProps {
  project: Project;
}

const TABS: { value: keyof SetupSnippets; label: string }[] = [
  { value: 'react', label: 'React' },
  { value: 'browser', label: 'Browser' },
  { value: 'node', label: 'Node.js' },
  { value: 'nestjs', label: 'NestJS' },
  { value: 'sourceMaps', label: 'Source maps' },
];

export function SetupGuide({ project }: SetupGuideProps) {
  const key = project.keys.find((candidate) => candidate.active) ?? project.keys[0];
  const snippets = SnippetBuilder.build(key?.dsn ?? '', project.id, window.location.origin);
  const [tab, setTab] = useState<keyof SetupSnippets>(SnippetBuilder.defaultTab(project.platform));

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as keyof SetupSnippets)}>
      <TabsList className="w-full justify-start gap-1 overflow-x-auto overflow-y-hidden sm:w-fit">
        {TABS.map((item) => (
          <TabsTrigger key={item.value} value={item.value}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((item) => (
        <TabsContent key={item.value} value={item.value} className="mt-4 min-w-0">
          <CodeSnippet code={snippets[item.value]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
