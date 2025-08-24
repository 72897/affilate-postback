import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const isConnectionString = !!process.env.DATABASE_URL;

const pool = isConnectionString
	? new Pool({ connectionString: process.env.DATABASE_URL })
	: new Pool({
		host: process.env.DB_HOST || 'postgres',
		port: Number(process.env.DB_PORT || 5432),
		database: process.env.DB_NAME || 'affiliate',
		user: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'postgres'
	});

export { pool };