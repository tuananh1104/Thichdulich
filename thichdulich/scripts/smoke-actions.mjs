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

  const providerTours = (await authed(providerToken, '/api/provider/tours'))?.data || [];
  const firstProviderTour = providerTours[0];
  if (firstProviderTour) {
    const scheduleDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString().slice(0, 10);
    const createdSchedule = (await authed(providerToken, `/api/provider/tours/${firstProviderTour.id}/schedules`, {
      method: 'POST',
      body: JSON.stringify({ departureDate: scheduleDate, availableSlots: 9, status: 'open' }),
    }))?.data;
    if (!createdSchedule?.id) throw new Error('Provider schedule create did not return id');
    await authed(providerToken, `/api/provider/tours/${firstProviderTour.id}/schedules/${createdSchedule.id}`, {
      method: 'PUT',
      body: JSON.stringify({ availableSlots: 8, status: 'closed' }),
    });
    await authed(providerToken, `/api/provider/tours/${firstProviderTour.id}/schedules/${createdSchedule.id}`, {
      method: 'DELETE',
    });
    console.log('ok provider schedule create/update/delete');

    await authed(providerToken, `/api/tours/${firstProviderTour.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: 'Smoke test provider message', senderName: 'Provider Smoke' }),
    });
    await authed(adminToken, `/api/tours/${firstProviderTour.id}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message: 'Smoke test admin reply', senderName: 'Admin Smoke' }),
    });
    console.log('ok admin/provider tour messages');
  } else {
    console.log('skip provider schedule/messages: no provider tour');
  }

  const contactSubject = `Smoke contact ${Date.now()}`;
  await request('/api/contact', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Smoke User',
      email: 'smoke@example.com',
      phone: '0900000000',
      subject: contactSubject,
      message: 'Smoke contact message',
    }),
  });
  const contacts = (await authed(adminToken, '/api/contact'))?.data || [];
  const createdContact = contacts.find(item => item.subject === contactSubject);
  if (!createdContact?.id) throw new Error('Created contact message not found in admin list');
  await authed(adminToken, `/api/contact/${createdContact.id}/reply?reply=${encodeURIComponent('Smoke reply')}`, {
    method: 'POST',
  });
  await authed(adminToken, `/api/contact/${createdContact.id}/resolve`, {
    method: 'POST',
  });
  console.log('ok contact reply/resolve');

  const bookings = (await authed(userToken, '/api/bookings'))?.data || [];
  const reportableBooking = bookings.find(item => item.status !== 'cancelled' && !item.hasReported && item.tourId);
  if (reportableBooking) {
    const report = (await authed(userToken, '/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        tourId: reportableBooking.tourId,
        bookingId: reportableBooking.id,
        reason: 'Smoke test',
        description: 'Smoke report for admin workflow verification',
      }),
    }))?.data;
    if (!report?.id) throw new Error('Report create did not return id');
    await authed(adminToken, `/api/admin/reports/${report.id}/review?note=${encodeURIComponent('Smoke reviewed')}`, {
      method: 'POST',
    });
    await authed(adminToken, `/api/admin/reports/${report.id}/dismiss?reason=${encodeURIComponent('Smoke dismissed after verification')}`, {
      method: 'POST',
    });
    console.log('ok report create/review/dismiss');
  } else {
    console.log('skip report workflow: no reportable user booking');
  }
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
