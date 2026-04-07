const router = require('express').Router();
const { Keypair } = require('@stellar/stellar-sdk');
const { requireAuth, requireRole } = require('../middleware/auth');
const { invokeContract, addressVal, stringVal, i128Val } = require('../services/soroban');
const logger = require('../utils/logger');

// POST /redeem
router.post('/', requireAuth, requireRole('student', 'admin'), async (req, res) => {
  const { studentAddress, rewardType, amount } = req.body;
  if (!studentAddress || !rewardType || !amount) {
    return res.status(400).json({ error: 'studentAddress, rewardType, amount required' });
  }
  try {
    const kp = Keypair.fromSecret(process.env.ADMIN_SECRET);
    await invokeContract(kp, 'redeem', [
      addressVal(studentAddress),
      stringVal(null, rewardType),
      i128Val(amount),
    ]);
    logger.info('redeem', { studentAddress, rewardType, amount });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
