const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '4mb' }));
app.use(express.static('public'));

const POINTS = {
  cardboard: 10,
  plastic: 8,
  mixed: 12,
};

const db = {
  users: [
    {
      id: 'u1',
      name: 'Priya Shah',
      email: 'priya@example.com',
      password: 'password123',
      role: 'user',
      area: 'Mira Road East',
      society: 'Green Heights',
      points: 120,
      impactKg: 18.5,
    },
    {
      id: 'c1',
      name: 'Ravi Collector',
      email: 'collector@example.com',
      password: 'password123',
      role: 'collector',
      area: 'Bhayandar West',
      points: 0,
      impactKg: 0,
    },
    {
      id: 'a1',
      name: 'MBMC Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      area: 'MBMC HQ',
      points: 0,
      impactKg: 0,
    },
  ],
  returnRequests: [
    {
      id: 'r1',
      userId: 'u1',
      packagingType: 'cardboard',
      sourcePlatform: 'Amazon',
      imageUrl: 'https://placehold.co/300x200?text=Cardboard+Box',
      mode: 'pickup',
      pickupDate: '2026-03-28',
      pickupTime: '11:00',
      area: 'Mira Road East',
      society: 'Green Heights',
      status: 'approved',
      collectorId: 'c1',
      pointsAwarded: 10,
      estimatedWeightKg: 1.2,
      createdAt: '2026-03-20T09:00:00.000Z',
    },
  ],
  rewardsCatalog: [
    { id: 'rw1', title: '₹50 Grocery Coupon', cost: 100, type: 'coupon' },
    { id: 'rw2', title: '₹100 Cashback', cost: 180, type: 'cashback' },
    { id: 'rw3', title: 'Movie Voucher', cost: 220, type: 'coupon' },
  ],
  redemptions: [],
  dropOffPoints: [
    { id: 'd1', name: 'MBMC Ward 4 Collection Booth', area: 'Mira Road East', hours: '9:00-18:00' },
    { id: 'd2', name: 'EcoHub Bhayandar', area: 'Bhayandar West', hours: '10:00-19:00' },
    { id: 'd3', name: 'Society Bulk Point - Green Heights', area: 'Mira Road East', hours: '24/7 Locker' },
  ],
};

function sanitizeUser(user) {
  const { password, ...safe } = user;
  return safe;
}

function findNearestCollector(area) {
  const collectors = db.users.filter((u) => u.role === 'collector');
  return collectors.find((c) => c.area === area) || collectors[0] || null;
}

function ensureRole(req, res, role) {
  const userId = req.header('x-user-id');
  const user = db.users.find((u) => u.id === userId);
  if (!user || user.role !== role) {
    return res.status(403).json({ message: `Access denied. ${role} role required.` });
  }
  req.user = user;
  return null;
}

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, area, society, role = 'user' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email and password are required' });
  }

  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const user = {
    id: uuidv4(),
    name,
    email,
    password,
    role,
    area: area || 'Mira Bhayandar',
    society: society || 'Not Provided',
    points: 0,
    impactKg: 0,
  };
  db.users.push(user);

  return res.status(201).json({ message: 'Signup successful', user: sanitizeUser(user) });
});

app.post('/api/auth/google', (req, res) => {
  const { name, email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Google email required' });
  }

  let user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    user = {
      id: uuidv4(),
      name: name || email.split('@')[0],
      email,
      password: null,
      role: 'user',
      area: 'Mira Bhayandar',
      society: 'Not Provided',
      points: 0,
      impactKg: 0,
    };
    db.users.push(user);
  }

  return res.json({ message: 'Google login successful', user: sanitizeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (role && user.role !== role) {
    return res.status(403).json({ message: 'Role mismatch. Please choose the right portal.' });
  }

  return res.json({ message: 'Login successful', token: `mock-token-${user.id}`, user: sanitizeUser(user) });
});

app.get('/api/dropoff-points', (_req, res) => res.json(db.dropOffPoints));

app.post('/api/returns', (req, res) => {
  const guard = ensureRole(req, res, 'user');
  if (guard) return guard;

  const {
    packagingType,
    sourcePlatform,
    imageUrl,
    mode,
    pickupDate,
    pickupTime,
    dropOffPointId,
    area,
    society,
  } = req.body;

  if (!packagingType || !sourcePlatform || !mode) {
    return res.status(400).json({ message: 'packagingType, sourcePlatform and mode are required' });
  }

  const collector = mode === 'pickup' ? findNearestCollector(area || req.user.area) : null;

  const request = {
    id: uuidv4(),
    userId: req.user.id,
    packagingType,
    sourcePlatform,
    imageUrl: imageUrl || 'https://placehold.co/300x200?text=Packaging+Upload',
    mode,
    pickupDate: pickupDate || null,
    pickupTime: pickupTime || null,
    dropOffPointId: dropOffPointId || null,
    area: area || req.user.area,
    society: society || req.user.society,
    status: mode === 'pickup' ? 'assigned' : 'submitted',
    collectorId: collector?.id || null,
    pointsAwarded: 0,
    estimatedWeightKg: packagingType === 'plastic' ? 0.4 : packagingType === 'mixed' ? 0.8 : 1,
    createdAt: new Date().toISOString(),
  };

  db.returnRequests.push(request);
  return res.status(201).json({ message: 'Return request created', request });
});

app.get('/api/users/:userId/dashboard', (req, res) => {
  const user = db.users.find((u) => u.id === req.params.userId && u.role === 'user');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const history = db.returnRequests.filter((r) => r.userId === user.id);
  const totalWasteKg = Number(history.reduce((acc, h) => acc + (h.estimatedWeightKg || 0), 0).toFixed(2));

  const leaderboard = db.users
    .filter((u) => u.role === 'user')
    .map((u) => ({ id: u.id, name: u.name, points: u.points, society: u.society }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  return res.json({ user: sanitizeUser(user), history, totalWasteKg, leaderboard, rewardsCatalog: db.rewardsCatalog });
});

app.get('/api/collectors/:collectorId/requests', (req, res) => {
  const collector = db.users.find((u) => u.id === req.params.collectorId && u.role === 'collector');
  if (!collector) return res.status(404).json({ message: 'Collector not found' });

  const requests = db.returnRequests.filter((r) => r.collectorId === collector.id);
  const completedToday = requests.filter(
    (r) => r.status === 'completed' && r.updatedAt && new Date(r.updatedAt).toDateString() === new Date().toDateString()
  );

  return res.json({ collector: sanitizeUser(collector), requests, summary: { completedToday: completedToday.length } });
});

app.patch('/api/collectors/:collectorId/requests/:requestId', (req, res) => {
  const collector = db.users.find((u) => u.id === req.params.collectorId && u.role === 'collector');
  if (!collector) return res.status(404).json({ message: 'Collector not found' });

  const request = db.returnRequests.find((r) => r.id === req.params.requestId && r.collectorId === collector.id);
  if (!request) return res.status(404).json({ message: 'Assigned request not found' });

  const { action } = req.body;
  if (!['accepted', 'rejected', 'completed'].includes(action)) {
    return res.status(400).json({ message: 'action must be accepted/rejected/completed' });
  }

  request.status = action;
  request.updatedAt = new Date().toISOString();

  if (action === 'completed') {
    const user = db.users.find((u) => u.id === request.userId);
    if (user) {
      user.points += POINTS[request.packagingType] || 5;
      user.impactKg = Number((user.impactKg + request.estimatedWeightKg).toFixed(2));
      request.pointsAwarded = POINTS[request.packagingType] || 5;
    }
  }

  return res.json({ message: 'Request updated', request });
});

app.get('/api/admin/overview', (_req, res) => {
  const totalWasteCollected = Number(
    db.returnRequests.filter((r) => r.status === 'completed').reduce((acc, r) => acc + (r.estimatedWeightKg || 0), 0).toFixed(2)
  );

  const areaStatsMap = {};
  db.returnRequests.forEach((r) => {
    areaStatsMap[r.area] = areaStatsMap[r.area] || { requests: 0, completed: 0 };
    areaStatsMap[r.area].requests += 1;
    if (r.status === 'completed') areaStatsMap[r.area].completed += 1;
  });

  const areaStats = Object.entries(areaStatsMap).map(([area, values]) => ({ area, ...values }));
  const participationRate = db.users.filter((u) => u.role === 'user').length
    ? Number(((db.returnRequests.length / db.users.filter((u) => u.role === 'user').length) * 100).toFixed(1))
    : 0;

  return res.json({
    metrics: {
      totalWasteCollected,
      totalRequests: db.returnRequests.length,
      approvedRequests: db.returnRequests.filter((r) => ['approved', 'completed'].includes(r.status)).length,
      participationRate,
    },
    areaStats,
    pendingApprovals: db.returnRequests.filter((r) => ['submitted', 'assigned'].includes(r.status)),
    users: db.users.filter((u) => u.role === 'user').map(sanitizeUser),
  });
});

app.patch('/api/admin/requests/:requestId', (req, res) => {
  const request = db.returnRequests.find((r) => r.id === req.params.requestId);
  if (!request) return res.status(404).json({ message: 'Request not found' });

  const { decision } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved/rejected' });
  }

  request.status = decision;
  request.updatedAt = new Date().toISOString();
  return res.json({ message: 'Admin decision saved', request });
});

app.patch('/api/admin/rewards', (req, res) => {
  const { packagingType, points } = req.body;
  if (!POINTS[packagingType]) return res.status(404).json({ message: 'Unknown packaging type' });
  POINTS[packagingType] = Number(points);
  return res.json({ message: 'Reward points updated', pointsTable: POINTS });
});

app.post('/api/redeem', (req, res) => {
  const { userId, rewardId } = req.body;
  const user = db.users.find((u) => u.id === userId && u.role === 'user');
  const reward = db.rewardsCatalog.find((r) => r.id === rewardId);

  if (!user || !reward) return res.status(404).json({ message: 'User or reward not found' });
  if (user.points < reward.cost) return res.status(400).json({ message: 'Not enough points' });

  user.points -= reward.cost;
  const redemption = {
    id: uuidv4(),
    userId,
    rewardId,
    pointsUsed: reward.cost,
    status: 'processed',
    createdAt: new Date().toISOString(),
  };
  db.redemptions.push(redemption);

  return res.status(201).json({ message: 'Reward redeemed', redemption, remainingPoints: user.points });
});

app.get('/api/meta/schema', (_req, res) => {
  res.json({
    collections: {
      users: ['id', 'name', 'email', 'password/oauthProvider', 'role', 'area', 'society', 'points', 'impactKg', 'createdAt'],
      returnRequests: [
        'id',
        'userId',
        'packagingType',
        'sourcePlatform',
        'imageUrl',
        'mode',
        'pickupDate',
        'pickupTime',
        'dropOffPointId',
        'collectorId',
        'status',
        'estimatedWeightKg',
        'pointsAwarded',
        'createdAt',
      ],
      rewardsCatalog: ['id', 'title', 'cost', 'type'],
      redemptions: ['id', 'userId', 'rewardId', 'pointsUsed', 'status', 'createdAt'],
    },
  });
});

app.listen(PORT, () => {
  console.log(`PackBack server running on http://localhost:${PORT}`);
});
