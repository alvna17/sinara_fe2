const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api`;

async function handleResponse(res) {
  // Kalau response bukan JSON (misal HTML error page), tangkap dengan baik
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server error ${res.status}: response bukan JSON`);
  }
  const data = await res.json();
  if (!res.ok) {
    throw data; // lempar error object dari Laravel (berisi errors, message, dll)
  }
  return data;
}

export async function apiPost(endpoint, data, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // ← penting agar Laravel selalu return JSON
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiGet(endpoint, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // ← sama
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'GET',
    headers,
  });
  return handleResponse(res);
}

export async function apiDelete(endpoint, token) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse(res);
}