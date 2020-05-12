const web3 = require('./web3.js')
const DeRail = require('../../build/contracts/DeRail.json')
const address = require('../../address.json')
const instance = new web3.eth.Contract(DeRail.abi, address.address, {
  gasPrice: '10000000000',
})

module.exports = instance
