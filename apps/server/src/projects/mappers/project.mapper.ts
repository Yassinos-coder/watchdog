import type { Project, ProjectKey } from '../../generated/prisma/client';
import { ProjectKeyView, ProjectView } from '../interfaces/project.interfaces';

export interface ProjectWithKeys extends Project {
  keys: ProjectKey[];
}

export class ProjectMapper {
  static toDsn(appUrl: string, publicKey: string, projectId: string): string {
    const url = new URL(appUrl);
    return `${url.protocol}//${publicKey}@${url.host}/${projectId}`;
  }

  static toKeyView(appUrl: string, projectId: string, key: ProjectKey): ProjectKeyView {
    return {
      id: key.id,
      label: key.label,
      publicKey: key.publicKey,
      active: key.active,
      dsn: ProjectMapper.toDsn(appUrl, key.publicKey, projectId),
      createdAt: key.createdAt,
    };
  }

  static toView(appUrl: string, project: ProjectWithKeys): ProjectView {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      platform: project.platform,
      createdAt: project.createdAt,
      keys: project.keys.map((key) => ProjectMapper.toKeyView(appUrl, project.id, key)),
    };
  }
}
