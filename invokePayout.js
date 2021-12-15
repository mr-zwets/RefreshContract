// Javascript program to invoke the payout function of the smart contract
// Should update the lastbalance & payout address in the simulated state 
// to the values in the last state of the contract.

const BCHJS = require("@psf/bch-js");
const {
  Contract,
  SignatureTemplate,
  ElectrumNetworkProvider,
} = require("cashscript");
// Import the refreshCashContract JSON artifact
const refreshCashContract = require("./refresh.json");
const contractParams = require("./contractParams.json");

let bchjs = new BCHJS();

// Initialise a network provider for network operations on MAINNET
const provider = new ElectrumNetworkProvider("mainnet");

// Simulated state
const lastbalance = 0; // change to balance contract state (in sats)
const payoutAddress = ""; // change to payout address
const pkhrecipient = bchjs.Address.toHash160(payoutAddress);

const lastStateContract = {lastbalance,pkhrecipient}

sendPayoutFunction(lastStateContract);

async function sendPayoutFunction(lastStateContract) {
  const increment = contractParams.increment;
  const relativeLocktime = contractParams.period;
  const pkhFeeAddressHex = contractParams.pkhFeeAddress;
  const pkhFeeAddress = Buffer.from(pkhFeeAddressHex, "hex");

  const lastBalance = lastStateContract.lastbalance;
  const lastBalanceBytes = Buffer.from(intToHex(lastBalance), "hex");
  const pkhRecipientHex = lastStateContract.pkhrecipient;
  const pkhRecipient = Buffer.from(pkhRecipientHex, "hex");
  const addrRecipient = await bchjs.Address.hash160ToCash(pkhRecipientHex);

  const params = [
    increment,
    relativeLocktime,
    pkhFeeAddress,
    lastBalanceBytes,
    pkhRecipient,
  ];
  const lastContract = new Contract(refreshCashContract, params, provider);

  // Initialise HD node and alice's keypair
  const rootSeed = await bchjs.Mnemonic.toSeed("CashScript");
  const hdNode = bchjs.HDNode.fromSeed(rootSeed);
  const alice = bchjs.HDNode.toKeyPair(bchjs.HDNode.derive(hdNode, 0));
  // Derive alice's address
  const alicePk = await bchjs.ECPair.toPublicKey(alice);

  const contractFee = lastBalance / 10;
  if (contractFee < 560) return false;
  const withdrawBalance = lastBalance - contractFee - 1000;
  const contractFeeBytes = Buffer.from(intToHex(contractFee), "hex");
  const feeAddress = await bchjs.Address.hash160ToCash(pkhFeeAddress);

  try {
    const claimTransaction = await lastContract.functions
      .payout(alicePk, new SignatureTemplate(alice), contractFeeBytes)
      .to(addrRecipient, withdrawBalance)
      .to(feeAddress, contractFee)
      .withoutChange()
      .withAge(relativeLocktime)
      .send();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
}

function intToHex(int) {
  let hexBigEndian = int.toString(16);
  if (hexBigEndian.length % 2 != 0) hexBigEndian = "0" + hexBigEndian;
  let hexSmallEndian = hexBigEndian.match(/../g).reverse().join("");
  while (hexSmallEndian.length < 16) {
    hexSmallEndian = hexSmallEndian + "00";
  }
  return hexSmallEndian;
}
