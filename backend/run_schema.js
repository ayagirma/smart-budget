import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './src/db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runSchema = async () => {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'src', 'db', 'schema.sql'), 'utf-8');
    await query(schemaSql);
    console.log('Schema executed successfully!');
  } catch (err) {
    console.error('Error executing schema:', err);
  }
  process.exit(0);
};

runSchema();
