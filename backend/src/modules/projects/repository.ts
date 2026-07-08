import { Prisma, Role } from '@prisma/client';
import prisma from '@/lib/prisma';

const projectInclude = {
  creator: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  members: {
    select: {
      userId: true,
      role: true,
    },
  },
} satisfies Prisma.ProjectInclude;

export type ProjectRecord = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;

export interface CreateProjectInput {
  name: string;
  description?: string;
  code: string;
  location?: string;
  creatorId: string;
}

export async function findProjectById(projectId: string): Promise<ProjectRecord | null> {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: projectInclude,
  });
}

export async function listProjectsForUser(userId: string, role: Role): Promise<ProjectRecord[]> {
  return prisma.project.findMany({
    where:
      role === Role.ADMIN
        ? {}
        : {
            members: {
              some: {
                userId,
              },
            },
          },
    include: projectInclude,
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export async function createProject(input: CreateProjectInput): Promise<ProjectRecord> {
  return prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      code: input.code,
      location: input.location,
      creatorId: input.creatorId,
      members: {
        create: {
          userId: input.creatorId,
          role: 'OWNER',
        },
      },
    },
    include: projectInclude,
  });
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const membership = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}
