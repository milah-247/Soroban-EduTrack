const router = require('express').Router();
const { buildChallenge, verifyChallenge } = require('../services/auth');

router.post('/sep10', (req, res) => {
  const { publicKey } = req.body;
  if (!publicKey) return res.status(400).json({ error: 'publicKey required' });
  try {
    const challenge = buildChallenge(publicKey);
    res.json(challenge);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', (req, res) => {
  const { signedXdr, publicKey } = req.body;
  if (!signedXdr || !publicKey) return res.status(400).json({ error: 'signedXdr and publicKey required' });
  try {
    const token = verifyChallenge(signedXdr, publicKey);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ error: e.message });
  }
});

module.exports = router;
