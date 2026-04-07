const router = require('express').Router();
const { Keypair } = require('@stellar/stellar-sdk');
const { requireAuth, requireRole } = require('../middleware/auth');
const { invokeContract, addressVal, stringVal, i128Val } = require('../services/soroban');
const logger = require('../utils/logger');

const adminKeypair = () => Keypair.fromSecret(process.env.ADMIN_SECRET);

// POST /reward
router.post('/', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const { studentAddress, activityId, amount } = req.body;
  if (!studentAddress || !activityId || !amount) {
    return res.status(400).json({ error: 'studentAddress, activityId, amount required' });
  }
  try {
    const kp = adminKeypair();
    await invokeContract(kp, 'reward_student', [
      addressVal(kp.publicKey()),
      addressVal(studentAddress),
      stringVal(null, activityId),
      i128Val(amount),
    ]);
    logger.info('reward_student', { studentAddress, activityId, amount });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /reward/bulk
router.post('/bulk', requireAuth, requireRole('admin', 'teacher'), async (req, res) => {
  const { rewards } = req.body; // [{ studentAddress, activityId, amount }]
  if (!Array.isArray(rewards) || rewards.length === 0) {
    return res.status(400).json({ error: 'rewards array required' });
  }
  try {
    const { nativeToScVal, xdr } = require('@stellar/stellar-sdk');
    const kp = adminKeypair();

    const students = rewards.map(r => addressVal(r.studentAddress));
    const acts = rewards.map(r => stringVal(null, r.activityId));
    const amounts = rewards.map(r => i128Val(r.amount));

    const vecOf = (items) => xdr.ScVal.scvVec(items);

    await invokeContract(kp, 'bulk_reward', [
      addressVal(kp.publicKey()),
      vecOf(students),
      vecOf(acts),
      vecOf(amounts),
    ]);
    logger.info('bulk_reward', { count: rewards.length });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /student/:wallet
router.get('/student/:wallet', requireAuth, async (req, res) => {
  try {
    const kp = adminKeypair();
    const balance = await invokeContract(kp, 'balance', [addressVal(req.params.wallet)]);
    res.json({ wallet: req.params.wallet, balance: balance?.toString() || '0' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
