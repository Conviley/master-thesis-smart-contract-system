const HDWalletProvider = require('../../node_modules/@truffle/hdwallet-provider')
const Web3 = require('web3')
const fs = require('fs-extra')

const infura = require('../../infura.json')

const mnemonic = fs
  .readFileSync('../../.secret')
  .toString()
  .trim()
const walletprovider = new HDWalletProvider(mnemonic, infura.endpoint, 0, 100)

const web3 = new Web3(walletprovider)

module.exports = web3
