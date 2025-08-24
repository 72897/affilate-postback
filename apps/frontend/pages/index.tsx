import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export default function Home() {
	const router = useRouter();
	const [affiliates, setAffiliates] = useState<Array<{ id: number; name: string }>>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(`${backendUrl}/affiliates`);
				const data = await res.json();
				setAffiliates(data);
			} catch (e: any) {
				setError(e?.message || 'Failed to load affiliates');
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
	if (error) return <div style={{ padding: 16 }}>Error: {error}</div>;

	return (
		<div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
			<h1>Affiliate Dashboard (MVP)</h1>
			<p>Select an affiliate to continue:</p>
			<ul>
				{affiliates.map((a) => (
					<li key={a.id} style={{ marginBottom: 12 }}>
						<button onClick={() => router.push(`/dashboard?affiliate_id=${a.id}`)}>
							{a.name} (ID: {a.id})
						</button>
					</li>
				))}
			</ul>
		</div>
	);
}