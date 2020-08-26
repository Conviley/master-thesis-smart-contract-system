const Web3 = require('web3')

const DeRail = require('../../build/contracts/DeRail.json')
const address = require('../../address.json')

/* const webSocketProvider = new Web3.providers.WebsocketProvider(
  'ws://localhost:8546' 'ws://172.17.0.2:8546'
) */

const wssWeb3 = new Web3(
  new Web3.providers.WebsocketProvider('ws://localhost:8546')
)
const instance = new wssWeb3.eth.Contract(DeRail.abi, address.address)

module.exports = instance
