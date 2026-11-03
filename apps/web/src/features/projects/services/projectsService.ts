import { BaseApiClient } from '@/services/BaseApiClient';
import type {
  CreatedProject,
  CreateProjectInput,
  Project,
  ProjectKey,
  Release,
} from '../types/project.types';

class ProjectsService extends BaseApiClient {
  list(): Promise<Project[]> {
    return this.get('/projects');
  }

  getById(projectId: string): Promise<Project> {
    return this.get(`/projects/${projectId}`);
  }

  listReleases(projectId: string): Promise<Release[]> {
    return this.get(`/projects/${projectId}/releases`);
  }

  create(input: CreateProjectInput): Promise<CreatedProject> {
    return this.post('/projects', input);
  }

  rotateUploadToken(projectId: string): Promise<{ uploadToken: string }> {
    return this.post(`/projects/${projectId}/upload-token`);
  }

  addKey(projectId: string, label: string): Promise<ProjectKey> {
    return this.post(`/projects/${projectId}/keys`, { label });
  }

  update(projectId: string, input: Partial<CreateProjectInput>): Promise<Project> {
    return this.patch(`/projects/${projectId}`, input);
  }

  setKeyActive(projectId: string, keyId: string, active: boolean): Promise<void> {
    return this.patch(`/projects/${projectId}/keys/${keyId}`, { active });
  }

  remove(projectId: string): Promise<void> {
    return this.delete(`/projects/${projectId}`);
  }

  removeKey(projectId: string, keyId: string): Promise<void> {
    return this.delete(`/projects/${projectId}/keys/${keyId}`);
  }
}

export const projectsService = new ProjectsService();
