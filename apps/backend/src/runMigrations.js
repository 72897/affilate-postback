import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
	const migrationsDir = path.join(__dirname, '..', 'migrations');
	if (!fs.existsSync(migrationsDir)) {
		return;
	}
	const files = fs
		.readdirSync(migrationsDir)
		.filter((f) => f.endsWith('.sql'))
		.sort();

	for (const file of files) {
		const fullPath = path.join(migrationsDir, file);
		const sql = fs.readFileSync(fullPath, 'utf8');
		try {
			await pool.query(sql);
			console.log(`Applied migration: ${file}`);
		} catch (err) {
			console.error(`Failed migration ${file}:`, err.message);
			throw err;
		}
	}
}