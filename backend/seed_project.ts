import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  
  console.log(`Found ${users.length} users in the database.`);
  
  for (const user of users) {
    console.log(`Ensuring project for user: ${user.email}`);
    
    // Check if user already has a project
    const existingProjects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: user.id
          }
        }
      }
    });
    
    if (existingProjects.length > 0) {
      console.log(`User ${user.email} already has ${existingProjects.length} projects.`);
      continue;
    }
    
    // Create a unique project for this user
    const projectCode = 'PRJ-' + user.id.substring(0, 8).toUpperCase();
    
    await prisma.project.create({
      data: {
        name: `DC-2024 (Test for ${user.firstName})`,
        description: 'Test project for Data Centre chat',
        code: projectCode,
        status: 'ACTIVE',
        creatorId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      }
    });
    console.log(`Created project ${projectCode} for ${user.email}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
