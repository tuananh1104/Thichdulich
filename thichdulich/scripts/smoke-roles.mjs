const API_URL = process.env.API_URL || 'http://localhost:8080';

const accounts = [
  { role: 'user', email: 'user@demo.com', password: 'demo123' },
  { role: 'provider', email: 'provider@demo.com', password: 'demo123' },
  { role: 'admin', email: 'admin@demo.com', password: 'admin123' },
];

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${body?.message || response.statusText}`);
  }

  return body;
}

async function login(account) {
  const body = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  const token = body?.data?.token;
  if (!token) throw new Error(`Login did not return token for ${account.role}`);
  return token;
}

async function authed(token, path, options = {}) {
  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
}

async function main() {
  const tokens = {};
  for (const account of accounts) {
    tokens[account.role] = await login(account);
    console.log(`ok login ${account.role}`);
  }

  await authed(tokens.user, '/api/bookings');
  console.log('ok user bookings');

  await authed(tokens.provider, '/api/provider/tours');
  await authed(tokens.provider, '/api/provider/bookings');
  await authed(tokens.provider, '/api/provider/profile');
  console.log('ok provider dashboard endpoints');

  await authed(tokens.admin, '/api/admin/users');
  await authed(tokens.admin, '/api/admin/providers');
  await authed(tokens.admin, '/api/admin/reports');
  await authed(tokens.admin, '/api/admin/statistics');
  console.log('ok admin dashboard endpoints');

  const tours = await request('/api/tours');
  const firstTourId = tours?.data?.[0]?.id;
  if (firstTourId) {
    await request(`/api/reviews/tour/${firstTourId}`);
    console.log('ok public tour reviews');
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
