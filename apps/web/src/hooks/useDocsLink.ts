import { useQuery } from '@tanstack/react-query';
import { configService } from '@/services/configService';

export class DocsLinkBuilder {
  static build(docsUrl: string, extension: string, path: string): string {
    const [page, anchor] = path.split('#');
    return `${docsUrl}/${page}${extension}${anchor ? `#${anchor}` : ''}`;
  }
}

export function useDocsLink(path: string): string | undefined {
  const { data } = useQuery({
    queryKey: ['public-config'],
    queryFn: () => configService.load(),
    staleTime: Infinity,
  });
  return data ? DocsLinkBuilder.build(data.docsUrl, data.docsExtension, path) : undefined;
}
