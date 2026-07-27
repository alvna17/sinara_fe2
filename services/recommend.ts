const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

export async function getRecommendations(topN = 5) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ top_n: topN }),
  });
  if (!res.ok) throw new Error('Gagal mengambil rekomendasi');
  return res.json();
}