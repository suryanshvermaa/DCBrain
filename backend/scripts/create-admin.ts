import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => new Promise(resolve => rl.question(query, resolve));

async function main() {
  console.log('--- DCBrain Admin User Creator ---');

  const email = await question('Email: ');
  if (!email) throw new Error('Email is required');

  const password = await question('Password: ');
  if (!password) throw new Error('Password is required');

  const firstName = await question('First Name: ');
  const lastName = await question('Last Name: ');

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`\nUser ${email} already exists. Updating role to ADMIN...`);
    await prisma.user.update({
      where: { email },
      data: { role: Role.ADMIN }
    });
    console.log('User role successfully updated to ADMIN.');
  } else {
    console.log('\nCreating new ADMIN user...');
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: Role.ADMIN
      }
    });
    console.log(`Admin user ${email} created successfully.`);
  }
}

main()
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
