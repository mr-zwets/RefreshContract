// Javascript program for checking BCH address for the smart contract
// Checks initial address initial state given contract parameters
// Can change lastbalance & pkhRecipient to check address different state

// import json artifact that's compiled from refresh.cash with cashc
const smartContractCode = require("./refresh.json");
// import json artifact that's compiled from cashscript code with cashc
const contractParams = require("./contractParams.json");
const { Contract, ElectrumNetworkProvider } = require("cashscript");

// Initialise a network provider for network operations on MAINNET
const provider = new ElectrumNetworkProvider("mainnet");

const increment = contractParams.increment;
const relativeLocktime = contractParams.period;
const pkhFeeAddressHex = contractParams.pkhFeeAddress;
const pkhFeeAddress = Buffer.from(pkhFeeAddressHex, "hex");

const lastbalance = contractParams.initialBalance; // change to balance contract state (in sats)
const pkhRecipient = pkhFeeAddress; // change to pkhRecipient contract state

const lastBalanceBytes = Buffer.from(intToHex(lastbalance), "hex");

const params = [
  increment,
  relativeLocktime,
  pkhFeeAddress,
  lastBalanceBytes,
  pkhRecipient,
];
const contractImplementation = new Contract(
  smartContractCode,
  params,
  provider
);
console.log("The contract parameters from the JSON file contractParams");
console.log("result in a BCH contract with the following address:");
console.log(contractImplementation.address);

function intToHex(int) {
  let hexBigEndian = int.toString(16);
  if (hexBigEndian.length % 2 != 0) hexBigEndian = "0" + hexBigEndian;
  let hexSmallEndian = hexBigEndian.match(/../g).reverse().join("");
  while (hexSmallEndian.length < 16) {
    hexSmallEndian = hexSmallEndian + "00";
  }
  return hexSmallEndian;
}
