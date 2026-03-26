const API = '/api';

const saveSession = (user) => localStorage.setItem('packback_user', JSON.stringify(user));
const getSession = () => JSON.parse(localStorage.getItem('packback_user') || 'null');
const logout = () => { localStorage.removeItem('packback_user'); window.location.href = '/login.html'; };

async function api(path, options = {}) {
  const user = getSession();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (user?.id) headers['x-user-id'] = user.id;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function setUserBadge() {
  const el = document.getElementById('sessionUser');
  const user = getSession();
  if (el) el.textContent = user ? `${user.name} (${user.role})` : 'Guest';
}

window.PackBack = { api, saveSession, getSession, logout, setUserBadge };
