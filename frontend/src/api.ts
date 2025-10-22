const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function signup(payload: any) {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export async function login(payload: any) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload)
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}

export async function me(token: string | null) {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return { ok: res.ok, status: res.status, body: await res.json() };
}
