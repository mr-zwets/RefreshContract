// Javascript program to use the refresh function of the smart contract
// Should update the lastbalance & payout address in the simulated state
// to the values in the last state of the contract.

const {
  Contract,
  SignatureTemplate,
  ElectrumNetworkProvider,
} = require("cashscript");
const BCHJS = require("@psf/bch-js");
const { intToHex } = require("./utils");
const refreshCashContract = require("./refresh.json");
const contractParams = require("./contractParams.json");

let bchjs = new BCHJS();
const provider = new ElectrumNetworkProvider("mainnet");

// Simulated state last contract
const lastbalance = 0; // change to balance contract state (in sats)
const payoutAddress = ""; // change to payout address
const pkhrecipient = bchjs.Address.toHash160(payoutAddress);
const tx_id = ""; // change to tx_id last state if there are multiple contract UTXOs at the same address
const lastStateContract = {lastbalance,pkhrecipient,tx_id}

// Wallet with UTXO to fund contract and invoke refresh function
const mnemonic = '';
let selectedUtxo;
const hasChangeOutput = false;

sendRefreshTx(lastStateContract)

async function sendRefreshTx() {
  const rootSeed = await bchjs.Mnemonic.toSeed(mnemonic);
  const masterHDNode = bchjs.HDNode.fromSeed(rootSeed);
  const keypairWallet = bchjs.HDNode.toKeyPair(
    bchjs.HDNode.derive(masterHDNode, 0)
  );
  // Derive wallet public key and public key hash
  const walletPk = await bchjs.ECPair.toPublicKey(keypairWallet);
  const walletPkh = await bchjs.Crypto.hash160(walletPk);
  const firstAddr = bchjs.ECPair.toCashAddress(keypairWallet);
  console.log("checking for UTXOs on the first address of provided wallet");

  const utxos = await new ElectrumNetworkProvider().getUtxos(firstAddr);
  console.log(utxos)
  if(selectedUtxo==undefined)return;
  console.log(`Using utxo at index ${selectedUtxo} as input for refresh function`)
  const utxo = utxos[selectedUtxo];

  // invoke refresh function on current contract state
  const increment = contractParams.increment;
  const relativeLocktime = contractParams.period;
  const pkhFeeAddressHex = contractParams.pkhFeeAddress;
  const pkhFeeAddress = Buffer.from(pkhFeeAddressHex, "hex");

  const currentBalance = lastStateContract.lastbalance;
  const currentBalanceBytes = Buffer.from(intToHex(currentBalance), "hex");
  const pkhRecipientHex = lastStateContract.pkhrecipient;
  const pkhRecipient = Buffer.from(pkhRecipientHex, "hex");

  const params = [
    increment,
    relativeLocktime,
    pkhFeeAddress,
    currentBalanceBytes,
    pkhRecipient,
  ];
  const currentContract = new Contract(refreshCashContract, params, provider);

  const utxosContract = await currentContract.getUtxos();
  console.log("utxosContract:");
  console.log(utxosContract);
  let utxoContract;
  if (utxosContract.length === 1) {
    utxoContract = utxosContract[0];
  } else {
    // more than one utxo at contract address -> need to check txid
    console.log("more than one utxo at contract address -> checking txid");
    if(lastStateContract.tx_id==undefined){
      console.log("multiple utxos at contract address -> should specify tx_id");
      return
    }
    utxosContract.forEach((UTXO) => {
      if (contractUTXO.txid == lastStateContract.tx_id) {
        utxoContract = UTXO;
      }
    });
  }

  const newBalance = currentBalance + increment;
  const newBalanceBytes = Buffer.from(intToHex(newBalance), "hex");

  const params2 = [
    increment,
    relativeLocktime,
    pkhFeeAddress,
    newBalanceBytes,
    walletPkh,
  ];
  const nextContract = new Contract(refreshCashContract, params2, provider);
  const nextContractAddr = nextContract.address;

  let amountChangeHex = "00".repeat(8);
  let amountChange;
  const valueInput = utxo.satoshis;
  const minerFeeRefresh = 2000 // hardcoded miner fee for refresh function
  if(hasChangeOutput){
  	amountChange = contractBalance+valueInput-newBalance-minerFeeRefresh;
  	console.log(`value change output: ${contractBalance}+${valueInput}-${newBalance}-${minerFeeRefresh}= ${amountChange}`);
    amountChangeHex = intToHex(amountChange);
  }
  const amountChangeBytes = Buffer.from(amountChangeHex, "hex");
  if(hasChangeOutput && amountChange<560){
    console.log('change output would be under the dust limit');
    return;
  }

  try {
    const refreshTransaction = await currentContract.functions
      .refresh(
        walletPk,
        new SignatureTemplate(keypairWallet),
        walletPkh,
        hasChangeOutput,
        amountChangeBytes
      )
      .from(utxoContract)
      .experimentalFromP2PKH(utxo, new SignatureTemplate(keypairWallet))
      .to(nextContractAddr, newBalance)
      .withoutChange()
      .send();
  } catch (e) {
    console.log(e);
  }
}

function intToHex(int){
  let hexBigEndian = int.toString(16);
  if(hexBigEndian.length%2!=0) hexBigEndian= '0'+ hexBigEndian;
  let hexSmallEndian = hexBigEndian
    .match(/../g)
    .reverse()
    .join("");
  while(hexSmallEndian.length<16){
    hexSmallEndian = hexSmallEndian + '00' 
  }
  return hexSmallEndian
}
