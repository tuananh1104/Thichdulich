const API_URL = process.env.API_URL || 'http://localhost:8080';

const accounts = {
  user: { email: 'user@demo.com', password: 'demo123' },
  provider: { email: 'provider@demo.com', password: 'demo123' },
  admin: { email: 'admin@demo.com', password: 'admin123' },
};

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
    body: JSON.stringify(account),
  });
  const token = body?.data?.token;
  if (!token) throw new Error(`Login did not return token for ${account.email}`);
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
  const userToken = await login(accounts.user);
  const providerToken = await login(accounts.provider);
  const adminToken = await login(accounts.admin);
  console.log('ok login all roles');

  const userProfile = (await authed(userToken, '/api/auth/me'))?.data;
  await authed(userToken, '/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify({
      name: userProfile.name,
      email: userProfile.email,
      phone: userProfile.phone || '0901234567',
    }),
  });
  console.log('ok user profile update');

  const tours = (await request('/api/tours'))?.data || [];
  const firstTour = tours[0];
  if (firstTour?.id) {
    await authed(userToken, `/api/users/favorites/${firstTour.id}`, { method: 'POST' });
    await authed(userToken, `/api/users/favorites/${firstTour.id}`);
    await authed(userToken, `/api/users/favorites/${firstTour.id}`, { method: 'DELETE' });
    await authed(userToken, '/api/users/interactions', {
      method: 'POST',
      body: JSON.stringify({ tourId: firstTour.id, action: 'click' }),
    });
    await authed(userToken, '/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message: 'Gợi ý tour biển', language: 'vi' }),
    });
    console.log('ok user favorites/interactions/ai');
  } else {
    console.log('skip user favorites/interactions/ai: no public tour');
  }

  const destinationName = `Smoke Destination ${Date.now()}`;
  const createdDestination = (await authed(adminToken, '/api/destinations', {
    method: 'POST',
    body: JSON.stringify({
      name: destinationName,
      description: 'Smoke destination for CRUD verification',
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
      region: 'Bắc',
      country: 'Việt Nam',
    }),
  }))?.data;
  if (!createdDestination?.id) throw new Error('Destination create did not return id');
  await request(`/api/destinations/${createdDestination.id}`);
  await authed(adminToken, `/api/destinations/${createdDestination.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: `${destinationName} Updated`,
      description: 'Smoke destination updated',
      image: createdDestination.image,
      region: 'Trung',
      country: 'Việt Nam',
    }),
  });
  await authed(adminToken, `/api/destinations/${createdDestination.id}`, { method: 'DELETE' });
  console.log('ok admin destination create/read/update/delete');

  const providerProfile = (await authed(providerToken, '/api/provider/profile'))?.data;
  await authed(providerToken, '/api/provider/profile', {
    method: 'PUT',
    body: JSON.stringify({
      companyName: providerProfile.companyName,
      email: providerProfile.email,
      phone: providerProfile.phone,
      address: providerProfile.address,
      website: providerProfile.website,
      description: providerProfile.description,
      licenseNumber: providerProfile.licenseNumber,
      taxCode: providerProfile.taxCode,
    }),
  });
  console.log('ok provider profile update');

  const tempTour = (await authed(providerToken, '/api/tours', {
    method: 'POST',
    body: JSON.stringify({
      name: `Smoke Temp Tour ${Date.now()}`,
      description: 'Smoke temp tour for admin workflow verification',
      location: 'Hà Nội',
      type: 'city',
      duration: 1,
      price: 1000000,
      image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
      included: ['transportation', 'tourGuide'],
      itineraries: [
        { day: 1, title: 'Smoke day', activities: ['Smoke activity'] },
      ],
    }),
  }))?.data;
  if (!tempTour?.id) throw new Error('Temp tour create did not return id');
  try {
    await authed(providerToken, `/api/tours/${tempTour.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: `${tempTour.name} Updated`,
        description: tempTour.description,
        location: tempTour.location,
        type: tempTour.type,
        duration: tempTour.duration,
        price: tempTour.price,
        image: tempTour.image,
        included: tempTour.included || ['transportation', 'tourGuide'],
        itineraries: tempTour.itineraries || [{ day: 1, title: 'Smoke day', activities: ['Smoke activity'] }],
      }),
    });
    await authed(adminToken, `/api/admin/tours/${tempTour.id}/request-edit?notes=${encodeURIComponent('Smoke request edit')}`, { method: 'POST' });
    await authed(adminToken, `/api/admin/tours/${tempTour.id}/reject?reason=${encodeURIComponent('Smoke reject')}&notes=${encodeURIComponent('Smoke notes')}`, { method: 'POST' });
    await authed(adminToken, `/api/admin/tours/${tempTour.id}/approve?notes=${encodeURIComponent('Smoke approve')}`, { method: 'POST' });
    console.log('ok provider tour create/update and admin tour request-edit/reject/approve');
  } finally {
    await authed(adminToken, `/api/tours/${tempTour.id}`, { method: 'DELETE' });
    console.log('ok temp tour cleanup');
  }

  const users = (await authed(adminToken, '/api/admin/users'))?.data || [];
  const demoUser = users.find(user => user.email === accounts.user.email);
  if (demoUser?.id) {
    const wasBanned = Boolean(demoUser.banned);
    try {
      if (wasBanned) {
        await authed(adminToken, `/api/admin/users/${demoUser.id}/unban`, { method: 'POST' });
        await authed(adminToken, `/api/admin/users/${demoUser.id}/ban`, { method: 'POST' });
      } else {
        await authed(adminToken, `/api/admin/users/${demoUser.id}/ban`, { method: 'POST' });
        await authed(adminToken, `/api/admin/users/${demoUser.id}/unban`, { method: 'POST' });
      }
      await authed(adminToken, `/api/admin/users/${demoUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: demoUser.name,
          email: demoUser.email,
          phone: demoUser.phone || '0901234567',
        }),
      });
      console.log('ok admin user ban/unban/update with restore');
    } finally {
      await authed(adminToken, `/api/admin/users/${demoUser.id}/${wasBanned ? 'ban' : 'unban'}`, { method: 'POST' });
    }
  } else {
    console.log('skip admin user ban/update: demo user not found');
  }

  const providers = (await authed(adminToken, '/api/admin/providers'))?.data || [];
  const demoProvider = providers.find(provider => provider.email === accounts.provider.email);
  if (demoProvider?.id) {
    await authed(adminToken, `/api/admin/providers/${demoProvider.id}/status?status=${demoProvider.status || 'approved'}`, { method: 'POST' });
    console.log('ok admin provider status endpoint');
  } else {
    console.log('skip provider status: demo provider not found');
  }

  console.log('ok full safe smoke completed');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
