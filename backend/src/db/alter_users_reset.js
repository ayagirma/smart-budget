import { query } from './index.js';

const alterUsersTable = async () => {
  try {
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);
    console.log('Users table altered successfully with reset columns.');
  } catch (err) {
    console.error('Error altering users table:', err);
  }
  process.exit(0);
};

alterUsersTable();
