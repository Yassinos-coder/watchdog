export interface ProjectKey {
  id: string;
  label: string;
  publicKey: string;
  active: boolean;
  dsn: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  platform: string;
  createdAt: string;
  keys: ProjectKey[];
}

export interface CreatedProject extends Project {
  uploadToken: string;
}

export interface Release {
  id: string;
  version: string;
  createdAt: string;
  sourceMapCount: number;
}

export interface CreateProjectInput {
  name: string;
  platform: string;
}

export interface PlatformOption {
  value: string;
  label: string;
}
