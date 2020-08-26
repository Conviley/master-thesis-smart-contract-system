const web3 = require('./web3.js')[0]
const instance = require('./factory.js')[0]
const subscribableInstance = require('./wssInstance.js')
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')
const outputResults = require('./outputResults.js').outputResults

const GAS_PRICE = 1000000000
const OUTPUT_FILE_PATH = './CToutput.json'

async function retrieveTAL() {
  const accounts = await web3.eth.getAccounts()
  let tripKey = 0
  console.log('creating Trip...')
  try {
    const receipt = await instance.methods
      .createTrip('Lp', 'Tip', '2020-05-14T20:24:00.000+02:00', 286, 1, 1)
      .send({
        from: accounts[305],
        gasPrice: GAS_PRICE,
        gas: 300000,
      })
    console.log('waiting for 2 block confirmations...')
    const minedTxReceipt = await awaitTransactionConfirmed(receipt, 1)
    console.log(minedTxReceipt.transactionHash, '2 blocks confirmed')
    tripKey =
      (await instance.methods.getTripKey().call({
        from: accounts[305],
        gasPrice: GAS_PRICE,
        gas: 30000,
      })) - 1
    console.log('created new trip setting trip key to', tripKey)
  } catch (err) {
    console.log('Failed to create new mock trip!', err)
    process.exit(1)
  }
  let gasUsed = 0
  console.log('Requesting TAL...')
  let sendBlockNumber = await web3.eth.getBlockNumber()

  let startTime = Date.now()
  try {
    const receipt = await instance.methods.requestTimeAtLocation(tripKey).send({
      from: accounts[305],
      gasPrice: GAS_PRICE,
      gas: 200000,
    })
    gasUsed += receipt.gasUsed
    console.log('request gas:', gasUsed)
  } catch (err) {
    console.log('Failed to initiate transaction', err)
    process.exit(1)
  }

  gasUsed += receipt.gasUsed
  console.log('Subscribing to event...')

  await subscribableInstance.once('RequestTimeAtLocation', async function(
    error,
    event
  ) {
    console.log('Event received. Waiting for confirmations...')
    const confirmedTransactionReceipt = await awaitTransactionConfirmed(event)
    let timeElapsed = Date.now() - startTime
    gasUsed += confirmedTransactionReceipt.gasUsed
    console.log('about to finish the job!')
    await outputResults(
      timeElapsed,
      gasUsed,
      sendBlockNumber,
      confirmedTransactionReceipt.blockNumber,
      OUTPUT_FILE_PATH,
      1
    )
  })
}

async function test() {
  const elements = [0, 1]
  for (element of elements) {
    try {
      console.log('Test: ', element, 'begin')
      await retrieveTAL()
      console.log('Test: ', element, 'end')
    } catch (err) {
      console.log('Error stuff:', err)
    }
  }
  process.exit(0)
}

//test()
/* for (let index = 0; index < 2; index++) {
  console.log('Test: ', index, 'begin')
  retrieveTAL()
  console.log('Test: ', index, 'end')
} */
retrieveTAL()
