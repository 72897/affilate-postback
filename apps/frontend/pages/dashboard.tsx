import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
const postbackBase = process.env.NEXT_PUBLIC_POSTBACK_BASE || 'http://localhost:4000';

export default function Dashboard() {
	const router = useRouter();
	const affiliateId = useMemo(() => Number(router.query.affiliate_id), [router.query.affiliate_id]);
	const [overview, setOverview] = useState<any>(null);
	const [campaigns, setCampaigns] = useState<Array<{ id: number; name: string }>>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [clickId, setClickId] = useState('');
	const [campaignId, setCampaignId] = useState<number | ''>('');

	useEffect(() => {
		if (!affiliateId) return;
		(async () => {
			try {
				const [ovRes, cpRes] = await Promise.all([
					fetch(`${backendUrl}/affiliates/${affiliateId}/overview`),
					fetch(`${backendUrl}/campaigns`)
				]);
			const [ov, cps] = await Promise.all([ovRes.json(), cpRes.json()]);
			setOverview(ov);
			setCampaigns(cps);
		} catch (e: any) {
			setError(e?.message || 'Failed to load overview');
		} finally {
			setLoading(false);
		}
		})();
	}, [affiliateId]);

	async function createClick() {
		if (!affiliateId || !campaignId || !clickId) return;
		try {
			await fetch(`${backendUrl}/click?affiliate_id=${affiliateId}&campaign_id=${campaignId}&click_id=${encodeURIComponent(clickId)}`);
			const ovRes = await fetch(`${backendUrl}/affiliates/${affiliateId}/overview`);
			const ov = await ovRes.json();
			setOverview(ov);
			setClickId('');
			setCampaignId('');
		} catch (e) {}
	}

	if (!affiliateId) return <div style={{ padding: 16 }}>Missing affiliate_id</div>;
	if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
	if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;

	const affiliate = overview?.affiliate;
	const clicks = overview?.clicks || [];
	const conversions = overview?.conversions || [];

	return (
		<div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
			<button onClick={() => router.push('/')}>Back</button>
			<h2>Affiliate: {affiliate?.name} (ID {affiliate?.id})</h2>
			<div style={{ display: 'flex', gap: 24 }}>
				<div style={{ flex: 1 }}>
					<h3>Create a Click</h3>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						<select value={campaignId} onChange={(e) => setCampaignId(Number(e.target.value))}>
							<option value="">Select campaign</option>
							{campaigns.map((c) => (
								<option key={c.id} value={c.id}>{c.name} (ID {c.id})</option>
							))}
						</select>
						<input placeholder="click_id (e.g. abc123)" value={clickId} onChange={(e) => setClickId(e.target.value)} />
						<button onClick={createClick} disabled={!campaignId || !clickId}>Log Click</button>
					</div>
					<p style={{ marginTop: 8, color: '#555' }}>
						Click URL example: {backendUrl}/click?affiliate_id={affiliate?.id}&campaign_id=1&click_id=abc123
					</p>
				</div>
				<div style={{ flex: 1 }}>
					<h3>Postback URL Format</h3>
					<code>
						{postbackBase}/postback?affiliate_id={affiliate?.id}&click_id={'{click_id}'}&amount={'{amount}'}&currency={'{currency}'}
					</code>
				</div>
			</div>

			<h3 style={{ marginTop: 24 }}>Clicks</h3>
			<table border={1} cellPadding={6}>
				<thead>
					<tr>
						<th>ID</th>
						<th>Campaign</th>
						<th>Click ID</th>
						<th>Timestamp</th>
						<th>Simulate Postback</th>
					</tr>
				</thead>
				<tbody>
					{clicks.map((c: any) => (
						<tr key={c.id}>
							<td>{c.id}</td>
							<td>{c.campaign_name} (ID {c.campaign_id})</td>
							<td>{c.click_id}</td>
							<td>{new Date(c.created_at).toLocaleString()}</td>
							<td>
								<PostbackSimulator affiliateId={affiliate.id} clickId={c.click_id} onDone={async () => {
									const ovRes = await fetch(`${backendUrl}/affiliates/${affiliateId}/overview`);
									const ov = await ovRes.json();
									setOverview(ov);
								}} />
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<h3 style={{ marginTop: 24 }}>Conversions</h3>
			<table border={1} cellPadding={6}>
				<thead>
					<tr>
						<th>ID</th>
						<th>Campaign</th>
						<th>Click ID</th>
						<th>Amount</th>
						<th>Currency</th>
						<th>Timestamp</th>
					</tr>
				</thead>
				<tbody>
					{conversions.map((v: any) => (
						<tr key={v.id}>
							<td>{v.id}</td>
							<td>{v.campaign_name} (ID {v.campaign_id})</td>
							<td>{v.click_id}</td>
							<td>{v.amount}</td>
							<td>{v.currency}</td>
							<td>{new Date(v.created_at).toLocaleString()}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function PostbackSimulator({ affiliateId, clickId, onDone }: { affiliateId: number; clickId: string; onDone: () => void }) {
	const [amount, setAmount] = useState('100');
	const [currency, setCurrency] = useState('USD');
	const [loading, setLoading] = useState(false);

	async function firePostback() {
		setLoading(true);
		try {
			await fetch(`${backendUrl}/postback?affiliate_id=${affiliateId}&click_id=${encodeURIComponent(clickId)}&amount=${encodeURIComponent(amount)}&currency=${encodeURIComponent(currency)}`);
			onDone();
		} finally {
			setLoading(false);
		}
	}

	return (
		<div style={{ display: 'flex', gap: 8 }}>
			<input style={{ width: 80 }} value={amount} onChange={(e) => setAmount(e.target.value)} />
			<input style={{ width: 80 }} value={currency} onChange={(e) => setCurrency(e.target.value)} />
			<button onClick={firePostback} disabled={loading}>{loading ? 'Posting...' : 'Postback'}</button>
		</div>
	);
}