#!/bin/sh
# Inject runtime migrations before starting the backend server

echo "Checking if database tables exist..."

# Use Prisma Client to safely check if the users table exists before running migrations
node -e "
async function checkAndMigrate() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const result = await prisma.\$queryRaw\`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');\`;
    if (!result[0].exists) {
      console.log('Tables do not exist. Running migrations...');
      const { execSync } = require('child_process');
      execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    } else {
      console.log('Tables already exist. Skipping migrations.');
    }
  } catch (err) {
    console.log('Error checking tables, falling back to migrations:', err.message);
    const { execSync } = require('child_process');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } finally {
    await prisma.\$disconnect();
  }
}
checkAndMigrate();
"

echo "Starting backend server..."
exec "$@"
