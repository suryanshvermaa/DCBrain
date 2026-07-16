import prisma from '@/lib/prisma';
import { hashPassword } from '@/modules/auth/security';
import config from '@/core/config';
import { logger } from '@/lib/logger';
import { Role } from '@prisma/client';

export async function seedInitialAdmin(): Promise<void> {
  try {
    // Check if any ADMIN exists
    const adminCount = await prisma.user.count({
      where: { role: Role.ADMIN },
    });

    if (adminCount > 0) {
      logger.info('Admin user already exists, skipping bootstrap.');
      return;
    }

    if (!config.INITIAL_ADMIN_EMAIL || !config.INITIAL_ADMIN_PASSWORD) {
      logger.warn('No admin exists and INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. System has no admin!');
      return;
    }

    logger.info(`Bootstrapping initial admin user: ${config.INITIAL_ADMIN_EMAIL}`);

    const passwordHash = await hashPassword(config.INITIAL_ADMIN_PASSWORD);
    
    await prisma.user.create({
      data: {
        email: config.INITIAL_ADMIN_EMAIL,
        passwordHash,
        firstName: config.INITIAL_ADMIN_FIRST_NAME || 'Admin',
        lastName: config.INITIAL_ADMIN_LAST_NAME || 'User',
        role: Role.ADMIN,
      },
    });

    logger.info('Initial admin user successfully created.');
  } catch (error) {
    logger.error('Failed to seed initial admin user', { error });
  }
}
