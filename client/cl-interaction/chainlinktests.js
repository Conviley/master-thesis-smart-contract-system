const web3 = require('./web3.js')
const instance = require('./factory.js')
const subscribableInstance = require('./wssInstance.js')
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')
const outputResults = require('./outputResults.js').outputResults

const GAS_PRICE = 1000000000
const OUTPUT_FILE_PATH = './CToutput.json'
const FROM_LOC = 'Lp'
const TO_LOC = 'Nr'
const ADVERTISED_TAL = '2020-08-26T17:51:00.000+02:00'
const TRAIN_ID = 286
const TICKET_PRICE = 1
const SHORT_TRIP = 1

async function retrieveTAL() {
  const accounts = await web3.eth.getAccounts()
  const BASE_ACCOUNT = accounts[0]
  let tripKey = 0
  console.log('creating Trip...')
  try {
    const receipt = await instance.methods
      .createTrip(
        FROM_LOC,
        TO_LOC,
        ADVERTISED_TAL,
        TRAIN_ID,
        TICKET_PRICE,
        SHORT_TRIP
      )
      .send({
        from: BASE_ACCOUNT,
        gasPrice: GAS_PRICE,
        gas: 300000,
      })
    console.log('waiting for 2 block confirmations...')
    const minedTxReceipt = await awaitTransactionConfirmed(receipt, 1)
    console.log(minedTxReceipt.transactionHash, '2 blocks confirmed')
    tripKey =
      (await instance.methods.getTripKey().call({
        from: BASE_ACCOUNT,
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
      from: BASE_ACCOUNT,
      gasPrice: GAS_PRICE,
      gas: 200000,
    })
    gasUsed += receipt.gasUsed
    console.log('request gas:', gasUsed)
  } catch (err) {
    console.log('Failed to initiate transaction', err)
    process.exit(1)
  }

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

retrieveTAL()
