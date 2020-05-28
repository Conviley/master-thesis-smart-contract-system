const HDWalletProvider = require('../../node_modules/@truffle/hdwallet-provider')
const Web3 = require('web3')
const fs = require('fs-extra')

const infura = require('../../infura.json')
const webSocketProvider = new Web3.providers.WebsocketProvider(
  'ws://172.17.0.2:8546'
)

const mnemonic = fs
  .readFileSync('../../.secret')
  .toString()
  .trim()
const walletprovider1 = new HDWalletProvider(
  mnemonic,
  webSocketProvider,
  0,
  100
)
const walletprovider = new HDWalletProvider(mnemonic, infura.endpoint, 0, 100)

const web3 = new Web3(walletprovider)

module.exports = web3
