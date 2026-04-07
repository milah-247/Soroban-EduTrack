const router = require('express').Router();
const { Keypair } = require('@stellar/stellar-sdk');
const { requireAuth, requireRole } = require('../middleware/auth');
const { invokeContract, addressVal, i128Val, symbolVal } = require('../services/soroban');
const logger = require('../utils/logger');

const adminKeypair = () => Keypair.fromSecret(process.env.ADMIN_SECRET);

// POST /treasury/fund  — propose a fund action
router.post('/fund', requireAuth, requireRole('admin'), async (req, res) => {
  const { proposalId, amount, targetAddress } = req.body;
  if (!proposalId || !amount || !targetAddress) {
    return res.status(400).json({ error: 'proposalId, amount, targetAddress required' });
  }
  try {
    const kp = adminKeypair();
    await invokeContract(kp, 'propose', [
      addressVal(kp.publicKey()),
      symbolVal(proposalId),
      symbolVal('fund'),
      i128Val(amount),
      addressVal(targetAddress),
    ]);
    logger.info('treasury_fund_proposed', { proposalId, amount });
    res.json({ success: true, proposalId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /treasury/approve
router.post('/approve', requireAuth, requireRole('admin'), async (req, res) => {
  const { proposalId } = req.body;
  if (!proposalId) return res.status(400).json({ error: 'proposalId required' });
  try {
    const kp = adminKeypair();
    await invokeContract(kp, 'approve', [
      addressVal(kp.publicKey()),
      symbolVal(proposalId),
    ]);
    logger.info('treasury_approved', { proposalId });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
