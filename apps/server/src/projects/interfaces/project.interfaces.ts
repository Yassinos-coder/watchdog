export interface ProjectKeyView {
  id: string;
  label: string;
  publicKey: string;
  active: boolean;
  dsn: string;
  createdAt: Date;
}

export interface ProjectView {
  id: string;
  name: string;
  slug: string;
  platform: string;
  createdAt: Date;
  keys: ProjectKeyView[];
}

export interface CreatedProjectView extends ProjectView {
  uploadToken: string;
}

export interface CreateProjectInput {
  name: string;
  slug: string;
  platform: string;
  uploadTokenHash: string;
  publicKey: string;
}

export interface ResolvedProjectKey {
  projectId: string;
  active: boolean;
}
