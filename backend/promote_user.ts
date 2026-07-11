import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'jatinavtani123@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'ADMIN' }
  });
  
  console.log(`Successfully promoted ${user.email} to ADMIN.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
