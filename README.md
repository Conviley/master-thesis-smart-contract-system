# Availability of Smart Contracts That Rely on External Data
This repository contains the smart contract system built for the master's thesis conducted by Tjelvar Guo and Daniel Herzegh at Linköping University 2020.  
The accompanying Master's thesis report is published and can be read at[TODO: ADD LINK]()  
The remaining part of this readme will detail how to conduct the research experiments performed by the authors.

# Pre-requisites
1. Install [node](https://nodejs.org/en/download/)
2. Install Truffle: `npm install -g truffle`
3. Install dependencies: `npm install` and then `cd client ; npm install`
4. In the root of the repo create a file called `.secret` and paste your wallet seed phrase inside
5. Setup ethereum client node for the `ropsten network` running on `loclhost:8546`. To replicate the work of the authors setup a [Geth node](https://geth.ethereum.org/downloads/).
6. Deploy Contracts: `truffle migrate --network ropsten` make sure to note the deployed address of DeRail!
7. In the root of the repo create a file called `address.json` and paste the contract address into it as the following
```json
{
  "address": "YOUR_DEPLOYED_CONTRACT_ADDRESS"
}
```
8. Setup Chainlink node. Please refer to the [official chainlink documentation](https://docs.chain.link/docs/node-operator-overview)
The authors hosted their Chainlink node on Google cloud with the settings found in appendix **A** of the master thesis report.
9. Create a developer account at https://api.trafikinfo.trafikverket.se/ and generate an API-key.
10. Deploy the external adapter. Copy the code in the folder 'external adapter'. Deploy it locally or as a serverless function on some VPS. Either set the 'key'-variable to your API-key or include the API-key as an environment variable. 
11. Connect the Chainlink node to the external adapter with a so called 'bridge'. Follow the instructions here: https://docs.chain.link/docs/node-operators#config.


You need ETH in your `ropsten` wallet and your contract needs LINK!  
*  Get ETH at https://faucet.ropsten.be/
*  Get LINK at https://ropsten.chain.link/

# Testing
Once every prerequisite is setup and ready you may proceed to run passenger and chainlink tests
## Passenger tests
To run passenger tests specify desired parameters in `passengerTest.js` and run it with node. 
## Chainlink tests
Before running the chainlink test make sure that your chainlink node is online.  
In `chainlinkTest.js` you may specify desired parameters. Make sure that the trip information is up to date and that a trip with that data exists, since trafikverket flushes out old data quite regularly. To start the chainlink test run `chainlinkTest.js` with node

