#!/usr/bin/env bash
# Deploy EduTrack contract to Stellar testnet
set -euo pipefail

NETWORK="testnet"
RPC_URL="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"

if [ -z "${ADMIN_SECRET:-}" ]; then
  echo "Error: ADMIN_SECRET env var required"
  exit 1
fi

echo "==> Building contract..."
cd "$(dirname "$0")/../contracts/edu_track"
cargo build --target wasm32-unknown-unknown --release

WASM="../../target/wasm32-unknown-unknown/release/edu_track.wasm"

echo "==> Uploading WASM..."
WASM_HASH=$(stellar contract upload \
  --network "$NETWORK" \
  --source "$ADMIN_SECRET" \
  --wasm "$WASM")
echo "WASM hash: $WASM_HASH"

echo "==> Deploying contract..."
CONTRACT_ID=$(stellar contract deploy \
  --network "$NETWORK" \
  --source "$ADMIN_SECRET" \
  --wasm-hash "$WASM_HASH")
echo "Contract ID: $CONTRACT_ID"

echo "==> Initializing contract..."
ADMIN_PK=$(stellar keys address "$ADMIN_SECRET" 2>/dev/null || \
  node -e "const {Keypair}=require('@stellar/stellar-sdk');console.log(Keypair.fromSecret('$ADMIN_SECRET').publicKey())")

# Deploy a test SAC token first (or use existing token address)
TOKEN_ID="${TOKEN_ID:-CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC}"

stellar contract invoke \
  --network "$NETWORK" \
  --source "$ADMIN_SECRET" \
  --id "$CONTRACT_ID" \
  -- initialize \
  --admin "$ADMIN_PK" \
  --token_id "$TOKEN_ID" \
  --threshold 2

echo ""
echo "✅ Deployment complete!"
echo "CONTRACT_ID=$CONTRACT_ID"
echo ""
echo "Add to your .env:"
echo "CONTRACT_ID=$CONTRACT_ID"
