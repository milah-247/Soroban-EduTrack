process.env.JWT_SECRET = 'test_secret';
process.env.ADMIN_SECRET = 'SCT5A62O6JLU3IHOR22D4UAL6WPGCE7HNOWHTKJTMGM5KG53HYY6VPBS';
process.env.CONTRACT_ID = 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM';
process.env.STELLAR_RPC_URL = 'https://soroban-testnet.stellar.org';
process.env.NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015';

const request = require('supertest');
const jwt = require('jsonwebtoken');

// Must mock before requiring app
jest.mock('../src/services/soroban', () => ({
  invokeContract: jest.fn().mockResolvedValue(100n),
  addressVal: jest.fn(a => a),
  stringVal: jest.fn((_, s) => s),
  i128Val: jest.fn(n => n),
  symbolVal: jest.fn(s => s),
  server: {},
  networkPassphrase: 'Test SDF Network ; September 2015',
}));

jest.mock('../src/middleware/auth', () => {
  const jwt = require('jsonwebtoken');
  return {
    requireAuth: (req, res, next) => {
      const auth = req.headers.authorization;
      if (!auth) return res.status(401).json({ error: 'Missing token' });
      try {
        req.user = jwt.verify(auth.slice(7), 'test_secret');
        next();
      } catch {
        res.status(401).json({ error: 'Invalid token' });
      }
    },
    requireRole: () => (req, res, next) => { req.role = 'admin'; next(); },
    setRole: jest.fn(),
    getRole: jest.fn(() => 'admin'),
  };
});

const app = require('../src/index');
const makeToken = () => jwt.sign({ publicKey: 'GABC123' }, 'test_secret');

describe('Health', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Rewards', () => {
  const token = makeToken();

  it('POST /reward returns success', async () => {
    const res = await request(app)
      .post('/reward')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentAddress: 'GABC', activityId: 'course:1', amount: 100 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /reward missing fields returns 400', async () => {
    const res = await request(app)
      .post('/reward')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentAddress: 'GABC' });
    expect(res.status).toBe(400);
  });

  it('POST /reward/bulk returns success', async () => {
    const res = await request(app)
      .post('/reward/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ rewards: [{ studentAddress: 'GABC', activityId: 'quiz:1', amount: 50 }] });
    expect(res.status).toBe(200);
  });

  it('GET /reward/student/:wallet returns balance', async () => {
    const res = await request(app)
      .get('/reward/student/GABC123')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('balance');
  });
});

describe('Redeem', () => {
  it('POST /redeem returns success', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/redeem')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentAddress: 'GABC', rewardType: 'scholarship', amount: 50 });
    expect(res.status).toBe(200);
  });
});

describe('Treasury', () => {
  const token = makeToken();

  it('POST /treasury/fund returns success', async () => {
    const res = await request(app)
      .post('/treasury/fund')
      .set('Authorization', `Bearer ${token}`)
      .send({ proposalId: 'prop1', amount: 1000, targetAddress: 'GABC' });
    expect(res.status).toBe(200);
  });

  it('POST /treasury/approve returns success', async () => {
    const res = await request(app)
      .post('/treasury/approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ proposalId: 'prop1' });
    expect(res.status).toBe(200);
  });
});
