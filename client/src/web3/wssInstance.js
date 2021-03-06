const Web3 = require('web3')
const DeRail = require('../../../build/contracts/DeRail.json')
const address = require('../../../address.json')

const wssWeb3 = new Web3(
  new Web3.providers.WebsocketProvider('ws://localhost:8546')
)
const instance = new wssWeb3.eth.Contract(DeRail.abi, address.address)

module.exports = instance
