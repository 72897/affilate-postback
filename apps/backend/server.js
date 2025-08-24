import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './src/db.js';
import { runMigrations } from './src/runMigrations.js';

dotenv.config();

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGIN || '*').split(',') }));
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
	res.json({ status: 'ok' });
});

// List affiliates
app.get('/affiliates', async (req, res) => {
	try {
		const result = await pool.query('SELECT id, name FROM affiliates ORDER BY id');
		res.json(result.rows);
	} catch (err) {
		console.error('Error fetching affiliates', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// List campaigns
app.get('/campaigns', async (req, res) => {
	try {
		const result = await pool.query('SELECT id, name FROM campaigns ORDER BY id');
		res.json(result.rows);
	} catch (err) {
		console.error('Error fetching campaigns', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

// Click tracking endpoint
app.get('/click', async (req, res) => {
	const { affiliate_id, campaign_id, click_id } = req.query;
	if (!affiliate_id || !campaign_id || !click_id) {
		return res.status(400).json({ error: 'Missing affiliate_id, campaign_id, or click_id' });
	}
	try {
		const insertSql = `
			INSERT INTO clicks (affiliate_id, campaign_id, click_id)
			VALUES ($1, $2, $3)
			ON CONFLICT (affiliate_id, campaign_id, click_id) DO NOTHING
			RETURNING id
		`;
		const params = [Number(affiliate_id), Number(campaign_id), String(click_id)];
		const insertResult = await pool.query(insertSql, params);
		let clickRowId = insertResult.rows[0]?.id;
		if (!clickRowId) {
			const existing = await pool.query(
				'SELECT id FROM clicks WHERE affiliate_id=$1 AND campaign_id=$2 AND click_id=$3',
				params
			);
			clickRowId = existing.rows[0]?.id;
		}
		res.json({ status: 'success', click_row_id: clickRowId });
	} catch (err) {
		console.error('Error logging click', err);
		res.status(400).json({ error: 'Failed to log click', detail: err.message });
	}
});

// Postback endpoint
app.get('/postback', async (req, res) => {
	const { affiliate_id, click_id, amount, currency } = req.query;
	if (!affiliate_id || !click_id || !amount || !currency) {
		return res.status(400).json({ error: 'Missing affiliate_id, click_id, amount, or currency' });
	}
	try {
		const clickResult = await pool.query(
			`SELECT id FROM clicks WHERE affiliate_id = $1 AND click_id = $2 LIMIT 1`,
			[Number(affiliate_id), String(click_id)]
		);
		if (clickResult.rowCount === 0) {
			return res.status(404).json({ status: 'error', message: 'No matching click found' });
		}
		const clickRowId = clickResult.rows[0].id;
		await pool.query(
			`INSERT INTO conversions (click_id, amount, currency) VALUES ($1, $2, $3)`,
			[clickRowId, Number(amount), String(currency)]
		);
		res.json({ status: 'success', message: 'Conversion tracked' });
	} catch (err) {
		console.error('Error processing postback', err);
		res.status(400).json({ status: 'error', message: 'Failed to process postback', detail: err.message });
	}
});

// Affiliate overview
app.get('/affiliates/:id/overview', async (req, res) => {
	const affiliateId = Number(req.params.id);
	if (!affiliateId) return res.status(400).json({ error: 'Invalid affiliate id' });
	try {
		const affiliate = await pool.query('SELECT id, name FROM affiliates WHERE id=$1', [affiliateId]);
		if (affiliate.rowCount === 0) return res.status(404).json({ error: 'Affiliate not found' });

		const clicks = await pool.query(
			`SELECT c.id, c.affiliate_id, c.campaign_id, cp.name as campaign_name, c.click_id, c.created_at
			 FROM clicks c
			 JOIN campaigns cp ON cp.id = c.campaign_id
			 WHERE c.affiliate_id = $1
			 ORDER BY c.created_at DESC
			`,
			[affiliateId]
		);
		const conversions = await pool.query(
			`SELECT v.id, v.click_id as click_row_id, c.click_id, c.campaign_id, cp.name as campaign_name, v.amount, v.currency, v.created_at
			 FROM conversions v
			 JOIN clicks c ON c.id = v.click_id
			 JOIN campaigns cp ON cp.id = c.campaign_id
			 WHERE c.affiliate_id = $1
			 ORDER BY v.created_at DESC`,
			[affiliateId]
		);
		res.json({ affiliate: affiliate.rows[0], clicks: clicks.rows, conversions: conversions.rows });
	} catch (err) {
		console.error('Error fetching affiliate overview', err);
		res.status(500).json({ error: 'Internal server error' });
	}
});

app.listen(PORT, async () => {
	try {
		await runMigrations();
		console.log(`Migrations completed`);
	} catch (e) {
		console.error('Migration error:', e);
	}
	console.log(`Affiliate backend listening on port ${PORT}`);
});