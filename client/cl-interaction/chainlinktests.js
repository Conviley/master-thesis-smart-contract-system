const web3 = require('./web3.js')[0]
const instance = require('./factory.js')[0]
const subscribableInstance = require('./wssInstance.js')
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')
const outputResults = require('./outputResults.js').outputResults

const GAS_PRICE = 2000000000
const TRIP_KEY = 142
const OUTPUT_FILE_PATH = './CToutput.json'

async function retreiveTAL() {
  const accounts = await web3.eth.getAccounts()
  let gasUsed = 0
  console.log('Requesting TAL...')
  let sendBlockNumber = await web3.eth.getBlockNumber()

  let startTime = Date.now()
  instance.methods
    .requestTimeAtLocation(TRIP_KEY)
    .send({
      from: accounts[0],
    })
    .then((receipt) => {
      gasUsed += receipt.gasUsed
      console.log(gasUsed)
      console.log('Request Transaction Received At Chainlink')
    })

  console.log('Subscribing to event...')
  subscribableInstance.once('RequestTimeAtLocation', async function(
    error,
    event
  ) {
    console.log('Event Received Waiting for confrimations...')
    const confrimedTransactionReceipt = await awaitTransactionConfirmed(event)
    let timeElapsed = Date.now() - startTime
    let blockDelay = confrimedTransactionReceipt.blockNumber - sendBlockNumber
    gasUsed += confrimedTransactionReceipt.gasUsed

    await outputResults(
      timeElapsed,
      gasUsed,
      sendBlockNumber,
      confrimedTransactionReceipt.blockNumber,
      OUTPUT_FILE_PATH,
      1
    )

    process.exit()
  })
}
try {
  retreiveTAL()
} catch (err) {
  console.log(err)
}
