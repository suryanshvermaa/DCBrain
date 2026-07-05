import { Prisma, Role } from '@prisma/client';
import prisma from '@/lib/prisma';

const userInclude = {
  projects: {
    select: {
      projectId: true,
    },
  },
} satisfies Prisma.UserInclude;

export type AuthUserRecord = Prisma.UserGetPayload<{
  include: typeof userInclude;
}>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface AuditLogInput {
  userId?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  details?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function findUserByEmail(email: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { email },
    include: userInclude,
  });
}

export async function findUserById(userId: string): Promise<AuthUserRecord | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
}

export async function createUser(input: CreateUserInput): Promise<AuthUserRecord> {
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role ?? Role.VIEWER,
    },
    include: userInclude,
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      lastLoginAt: new Date(),
    },
  });
}

export async function createAuditLog(entry: AuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      action: entry.action,
      resourceType: entry.resourceType ?? null,
      resourceId: entry.resourceId ?? null,
      details: entry.details ?? Prisma.JsonNull,
      ipAddress: entry.ipAddress ?? null,
      userAgent: entry.userAgent ?? null,
    },
  });
}