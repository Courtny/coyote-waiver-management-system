import db from '../lib/db';
import { createAdminUser } from '../lib/auth';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: npm run create-admin <username> <password>');
    process.exit(1);
  }

  const [username, password] = args;

  try {
    await createAdminUser(username, password);
    console.log(`✓ Admin user "${username}" created successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

main();
