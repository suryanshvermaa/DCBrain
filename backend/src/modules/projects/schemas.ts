import { z } from 'zod';
import { ProjectRole } from '@prisma/client';

export const projectIdParamSchema = z.object({
  id: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  code: z.string().trim().min(2).max(40),
  location: z.string().trim().max(160).optional(),
});

export type CreateProjectPayload = z.infer<typeof createProjectSchema>;

// Member management schemas
const projectRoleEnum = z.nativeEnum(ProjectRole);

export const inviteMemberSchema = z.object({
  email: z.string().trim().email(),
  role: projectRoleEnum.default(ProjectRole.MEMBER),
});

export const updateMemberRoleSchema = z.object({
  role: projectRoleEnum,
});

export const memberUserIdParamSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});
