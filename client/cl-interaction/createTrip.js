const web3 = require('./web3.js')
const instance = require('./factory.js')

async function createTrip() {
  let accounts = await web3.eth.getAccounts()
  console.log('Creating Mock Trip...')
  try {
    await instance.methods.createMockTrip().send({
      from: accounts[0],
      gasPrice: 2000000000,
    })
    console.log('Sucess!')
  } catch (err) {
    console.log(err)
  }
  process.exit(0)
}

createTrip()
