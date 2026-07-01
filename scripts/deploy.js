import { rpc, Keypair, Horizon, Networks, TransactionBuilder, Operation, Address, StrKey, xdr } from '@stellar/stellar-sdk';
import fs from 'fs';
import path from 'path';

// Setup network parameters
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = Networks.TESTNET;

const server = new Horizon.Server(HORIZON_URL);
const rpcServer = new rpc.Server(RPC_URL);

// Function to poll Soroban transaction status
async function pollTx(txHash) {
  console.log(`Polling transaction status for ${txHash}...`);
  for (let i = 0; i < 30; i++) {
    const statusResponse = await rpcServer.getTransaction(txHash);
    if (statusResponse.status === 'SUCCESS') {
      console.log('Transaction succeeded!');
      return statusResponse;
    } else if (statusResponse.status === 'FAILED') {
      throw new Error(`Transaction failed: ${JSON.stringify(statusResponse.resultErrorXdr)}`);
    }
    // Wait 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  throw new Error('Transaction polling timed out');
}

async function run() {
  try {
    // Generate or load deployer keypair
    console.log('Initializing deployer account...');
    const deployer = Keypair.random();
    console.log(`Deployer Public Key: ${deployer.publicKey()}`);

    // Fund deployer via Friendbot
    console.log('Funding deployer account with Friendbot...');
    const fundResponse = await fetch(`https://friendbot.stellar.org/?addr=${deployer.publicKey()}`);
    if (!fundResponse.ok) {
      throw new Error('Friendbot funding failed');
    }
    console.log('Account successfully funded.');

    // Wait a brief moment for ledger consensus
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Load account details
    const account = await server.loadAccount(deployer.publicKey());

    // 1. Read WASM bytes
    const wasmPath = path.resolve('./contracts/mirror_vault/target/wasm32v1-none/release/mirror_vault.wasm');
    if (!fs.existsSync(wasmPath)) {
      throw new Error(`WASM file not found at ${wasmPath}. Please compile the contract first.`);
    }
    const wasmBytes = fs.readFileSync(wasmPath);
    console.log(`Read ${wasmBytes.length} bytes from mirror_vault.wasm`);

    // 2. Build Upload WASM Transaction
    console.log('Building Upload WASM transaction...');
    let tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.uploadContractWasm({
          wasm: wasmBytes,
        })
      )
      .setTimeout(30)
      .build();

    console.log('Simulating and assembling transaction...');
    const uploadSim = await rpcServer.simulateTransaction(tx);
    tx = rpc.assembleTransaction(tx, uploadSim).build();
    tx.sign(deployer);

    console.log('Submitting Upload WASM transaction...');
    const uploadResult = await rpcServer.sendTransaction(tx);
    if (uploadResult.status === 'ERROR') {
      throw new Error(`Failed to submit upload: ${JSON.stringify(uploadResult)}`);
    }

    const txStatus = await pollTx(uploadResult.hash);
    
    console.log('Parsing WASM hash from transaction result...');
    let wasmHashHex;
    if (txStatus.returnValue) {
      wasmHashHex = txStatus.returnValue.bytes().toString('hex');
    } else {
      const metaSwitch = txStatus.resultMetaXdr.switch().name;
      console.log(`resultMetaXdr switch is: ${metaSwitch}`);
      const meta = txStatus.resultMetaXdr[metaSwitch]();
      wasmHashHex = meta.sorobanMeta().returnValue().val().bytes().toString('hex');
    }
    const wasmHashBuffer = Buffer.from(wasmHashHex, 'hex');
    console.log(`Uploaded successfully! WASM Hash: ${wasmHashHex}`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Build Create Contract Instance Transaction
    console.log('Building Create Contract transaction...');
    const deployerAccount = await server.loadAccount(deployer.publicKey());
    const salt = Keypair.random().rawPublicKey(); // 32-byte random salt
    
    let createContractTx = new TransactionBuilder(deployerAccount, {
      fee: '100',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.createCustomContract({
          wasmHash: wasmHashBuffer,
          address: new Address(deployer.publicKey()),
          salt,
        })
      )
      .setTimeout(30)
      .build();

    console.log('Simulating and assembling Create Contract transaction...');
    const createSim = await rpcServer.simulateTransaction(createContractTx);
    createContractTx = rpc.assembleTransaction(createContractTx, createSim).build();
    createContractTx.sign(deployer);

    console.log('Submitting Create Contract transaction...');
    const createResult = await rpcServer.sendTransaction(createContractTx);
    if (createResult.status === 'ERROR') {
      throw new Error(`Failed to submit create contract: ${JSON.stringify(createResult)}`);
    }

    const createStatus = await pollTx(createResult.hash);
    
    console.log('Parsing Contract ID from transaction result...');
    let contractIdScAddress;
    if (createStatus.returnValue) {
      contractIdScAddress = createStatus.returnValue.address();
    } else {
      const metaSwitch = createStatus.resultMetaXdr.switch().name;
      console.log(`resultMetaXdr switch is: ${metaSwitch}`);
      const meta = createStatus.resultMetaXdr[metaSwitch]();
      contractIdScAddress = meta.sorobanMeta().returnValue().val().address();
    }
    const contractId = StrKey.encodeContract(contractIdScAddress.contractId());
    console.log(`Contract deployed successfully!`);
    console.log(`CONTRACT_ID: ${contractId}`);

    // 4. Update .env files
    const envPath = path.resolve('./.env');
    const envExamplePath = path.resolve('./.env.example');
    
    const envContent = `VITE_STELLAR_NETWORK=testnet
VITE_ORACLE_CONTRACT_ID=CD6ZH3G5WBLPFLV74PDK7JOH3B2W5JHLV637Q6NNSL2SPN5G737V4WEX
VITE_VAULT_CONTRACT_ID=${contractId}
`;
    fs.writeFileSync(envPath, envContent);
    fs.writeFileSync(envExamplePath, envContent);
    console.log('Saved contract ID to .env and .env.example');

    // 5. Output transaction hash for successful deploy
    console.log(`SUCCESSFUL_DEPLOYMENT_TX: ${createResult.hash}`);

  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
}

run();
