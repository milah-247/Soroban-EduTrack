const { Keypair, Networks, TransactionBuilder, BASE_FEE, Operation, hash } = require('@stellar/stellar-sdk');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const networkPassphrase = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;

// In-memory nonce store (use Redis in production)
const usedNonces = new Set();

/**
 * SEP-10: Return a challenge transaction for the client to sign.
 */
function buildChallenge(clientPublicKey) {
  const serverKeypair = Keypair.fromSecret(process.env.ADMIN_SECRET);
  const nonce = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');

  const account = { accountId: () => serverKeypair.publicKey(), sequenceNumber: () => '0', incrementSequenceNumber: () => {} };
  const tx = new TransactionBuilder(
    { id: serverKeypair.publicKey(), sequence: '0', incrementSequenceNumber() {} },
    { fee: BASE_FEE, networkPassphrase }
  )
    .addOperation(
      Operation.manageData({
        name: 'edutrack_auth',
        value: Buffer.from(nonce),
        source: clientPublicKey,
      })
    )
    .setTimeout(300)
    .build();

  tx.sign(serverKeypair);
  return { transaction: tx.toXDR(), nonce };
}

/**
 * SEP-10: Verify signed challenge, return JWT.
 */
function verifyChallenge(signedXdr, expectedPublicKey) {
  const { TransactionBuilder } = require('@stellar/stellar-sdk');
  const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

  // Verify client signed it
  const clientKeypair = Keypair.fromPublicKey(expectedPublicKey);
  const txHash = tx.hash();

  const clientSig = tx.signatures.find(sig =>
    clientKeypair.verify(txHash, sig.signature())
  );
  if (!clientSig) throw new Error('Missing client signature');

  // Extract nonce and check replay
  const op = tx.operations[0];
  const nonce = op.value.toString();
  if (usedNonces.has(nonce)) throw new Error('Replay attack detected');
  usedNonces.add(nonce);

  const token = jwt.sign({ publicKey: expectedPublicKey }, JWT_SECRET, { expiresIn: '24h' });
  return token;
}

module.exports = { buildChallenge, verifyChallenge };
