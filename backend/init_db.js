import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const init = async () => {
  const client1 = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client1.connect();
    const res = await client1.query("SELECT 1 FROM pg_database WHERE datname='budget_app'");
    if (res.rowCount === 0) {
      await client1.query('CREATE DATABASE budget_app');
      console.log("Database 'budget_app' created.");
    } else {
      console.log("Database 'budget_app' already exists.");
    }
  } catch (err) {
    console.error("Error creating database:", err.message);
    // Might fail if password is wrong or postgres isn't running
    process.exit(1);
  } finally {
    await client1.end();
  }

  const client2 = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'budget_app',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
  });

  try {
    await client2.connect();
    const createTableText = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client2.query(createTableText);
    console.log("Table 'users' created successfully or already exists.");
    process.exit(0);
  } catch(e) {
    console.error("Error creating table:", e.message);
    process.exit(1);
  } finally {
    await client2.end();
  }
};
init();
