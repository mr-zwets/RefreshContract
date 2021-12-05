# Refresh.Cash smart contract

### General

The code of the smart contract is located in `refresh.cash`.
It is written with cashscript, hence the extention.

### Contract functionality

The smart contract allows anyone to set their address as the contracts payout address if they increase the contract balance. When the relative locktime expires, anyone can broadcast the payout transaction to this address. Every time someone increases the contract balance and changes the payout address the relative locktime timer is refreshed.

### Contract spending functions

 **1) Refresh**
 
 Requires the balance of the contract to increase and allows the payout pkh of the simulated state to be changed.
 
 This consumes the last contract state and creates a new contract with a new address.
 
 Allows for the option of having a change output.

 **2) Payout**
 
 Requires the relative locktime condition to be fullfilled.
 
 Requires the contract balance (as kept in the state) to be sent to the payout address minus a percentage taken as contract fee sent to a predetermined address.

### Contract constructor parameters

- `increment` amount the contract balance needs to increase each refresh 
- `period` the relative locktime
- `pkhFeeAddress` the address used to pay out the contract fee
- `lastBalance` tracks the balance of the contract, should be eaqual to the initial balance
- `pkhRecipient` the payout address that is changed each refresh

### Contract function parameters
 **1) Refresh**
- `pk` & `s` needed to do the introspection for covenants
- `pkhNewRecipient` public key hash which becomes the payout address in the contract state
- `hasChangeOutput` boolean that allows for change output
- `amountChange` output amount for change address - can be anything if `hasChangeOutput` is false

 **2) Payout**
- `pk` & `s` needed to do the introspection for covenants
- `contractFee` output amount for contract fee, should be 10% of the lastBalance