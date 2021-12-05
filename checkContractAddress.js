// Javascript program for checking BCH address for the smart contract given contract parameters

// import json artifact that's compiled from refresh.cash with cashc
const smartContractCode = require("./refresh.json");
// import json artifact that's compiled from cashscript code with cashc
const contractParams = require("./contractParams.json");
const { Contract, ElectrumNetworkProvider } = require("cashscript");

// Initialise a network provider for network operations on MAINNET
const provider = new ElectrumNetworkProvider("mainnet");

checkContractAddress();

async function checkContractAddress() {
  const increment = contractParams.increment;
  const relativeLocktime = contractParams.period;
  const pkhFeeAddressHex = contractParams.pkhFeeAddress;
  const pkhFeeAddress = Buffer.from(pkhFeeAddressHex, "hex");

  const initialBalance = contractParams.initialBalance;
  const initialBalanceBytes = Buffer.from(intToHex(initialBalance), "hex");
  const pkhRecipient = pkhFeeAddress;

  const params = [
    increment,
    relativeLocktime,
    pkhFeeAddress,
    initialBalanceBytes,
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
