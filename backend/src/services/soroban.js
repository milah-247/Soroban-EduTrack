const { SorobanRpc, TransactionBuilder, Networks, BASE_FEE, xdr, Contract, Address, nativeToScVal, scValToNative } = require('@stellar/stellar-sdk');
const { Keypair } = require('@stellar/stellar-sdk');

const server = new SorobanRpc.Server(process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org');
const networkPassphrase = process.env.NETWORK_PASSPHRASE || Networks.TESTNET;
const contractId = process.env.CONTRACT_ID;

async function invokeContract(sourceKeypair, method, args = []) {
  const account = await server.getAccount(sourceKeypair.publicKey());
  const contract = new Contract(contractId);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResult = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simResult)) {
    throw new Error(`Simulation failed: ${simResult.error}`);
  }

  const preparedTx = SorobanRpc.assembleTransaction(tx, simResult).build();
  preparedTx.sign(sourceKeypair);

  const sendResult = await server.sendTransaction(preparedTx);
  if (sendResult.status === 'ERROR') {
    throw new Error(`Send failed: ${JSON.stringify(sendResult.errorResult)}`);
  }

  // poll for result
  let getResult;
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000));
    getResult = await server.getTransaction(sendResult.hash);
    if (getResult.status !== SorobanRpc.Api.GetTransactionStatus.NOT_FOUND) break;
  }

  if (getResult.status === SorobanRpc.Api.GetTransactionStatus.SUCCESS) {
    return getResult.returnValue ? scValToNative(getResult.returnValue) : null;
  }
  throw new Error(`Transaction failed: ${getResult.status}`);
}

function addressVal(addr) {
  return new Address(addr).toScVal();
}

function stringVal(env, str) {
  return xdr.ScVal.scvString(Buffer.from(str));
}

function i128Val(n) {
  return nativeToScVal(BigInt(n), { type: 'i128' });
}

function symbolVal(s) {
  return xdr.ScVal.scvSymbol(s);
}

module.exports = { invokeContract, addressVal, stringVal, i128Val, symbolVal, server, networkPassphrase };
