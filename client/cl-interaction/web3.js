const HDWalletProvider = require('../../node_modules/@truffle/hdwallet-provider')
const Web3 = require('web3')
const fs = require('fs-extra')

const mnemonic = fs
  .readFileSync('../../.secret')
  .toString()
  .trim()

const webSocketProvider = new Web3.providers.WebsocketProvider(
  'ws://localhost:8546' //'ws://172.17.0.2:8546'
)

const walletprovider = new HDWalletProvider(mnemonic, webSocketProvider, 0, 310)

const web3 = new Web3(walletprovider)

module.exports = web3
