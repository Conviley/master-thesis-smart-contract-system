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
const walletprovider2 = new HDWalletProvider(mnemonic, infura.endpoint2, 0, 100)
const walletprovider3 = new HDWalletProvider(mnemonic, infura.endpoint3, 0, 100)

const web31 = new Web3(walletprovider1)
const web32 = new Web3(walletprovider2)
const web33 = new Web3(walletprovider3)

const web3Array = [web31, web32, web33]

module.exports = web3Array
