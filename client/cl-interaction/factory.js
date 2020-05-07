const web3 = require('./web3.js')
const DeRail = require('../../build/contracts/DeRail.json')
const address = require('../../address.json')
const instance1 = new web3[0].eth.Contract(DeRail.abi, address.address, {
  gasPrice: '20000000000',
})

const instance2 = new web3[1].eth.Contract(DeRail.abi, address.address, {
  gasPrice: '20000000000',
})

const instance3 = new web3[2].eth.Contract(DeRail.abi, address.address, {
  gasPrice: '20000000000',
})

instances = [instance1, instance2, instance3]
module.exports = instances
