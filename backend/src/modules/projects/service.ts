import { Role } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import {
  createProject,
  findProjectById,
  isProjectMember,
  listProjectsForUser,
  type CreateProjectInput,
  type ProjectRecord,
} from './repository';

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  code: string;
  status: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  memberCount: number;
}

export function toProjectResponse(project: ProjectRecord): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    code: project.code,
    status: project.status,
    location: project.location,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    creator: project.creator,
    memberCount: project.members.length,
  };
}

export async function assertProjectAccess(projectId: string, user: { id: string; role: Role }): Promise<void> {
  const project = await findProjectById(projectId);
  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  if (user.role === Role.ADMIN) {
    return;
  }

  if (!(await isProjectMember(projectId, user.id))) {
    throw new ForbiddenError('You do not have access to this project');
  }
}

export async function listUserProjects(user: { id: string; role: Role }): Promise<ProjectResponse[]> {
  const projects = await listProjectsForUser(user.id, user.role);
  return projects.map(toProjectResponse);
}

export async function getProject(projectId: string, user: { id: string; role: Role }): Promise<ProjectResponse> {
  await assertProjectAccess(projectId, user);
  const project = await findProjectById(projectId);
  if (!project) {
    throw new NotFoundError('Project', projectId);
  }

  return toProjectResponse(project);
}

export async function createUserProject(input: CreateProjectInput): Promise<ProjectResponse> {
  const project = await createProject(input);
  return toProjectResponse(project);
}
