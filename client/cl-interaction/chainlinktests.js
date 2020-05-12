const web3 = require('./web3.js')
const instance = require('./factory.js')
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')
const outputResults = require('./outputResults.js').outputResults

const GAS_PRICE = 1000000000
const TRIP_KEY = 182
const OUTPUT_FILE_PATH = './CToutput.json'

async function retrieveTAL() {
  const accounts = await web3.eth.getAccounts()
  let gasUsed = 0
  console.log('Requesting TAL...')
  let sendBlockNumber = await web3.eth.getBlockNumber()

  let startTime = Date.now()
  instance.methods
    .requestTimeAtLocation(TRIP_KEY)
    .send({
      from: accounts[0],
      gasPrice: GAS_PRICE,
      gas: 300000,
    })
    .then((receipt) => {
      gasUsed += receipt.gasUsed
      console.log(gasUsed)
      console.log('Request Transaction Received At Chainlink')
    })

  console.log('Subscribing to event...')
  instance.once('RequestTimeAtLocation', async function(error, event) {
    console.log('Event received. Waiting for confirmations...')
    const confirmedTransactionReceipt = await awaitTransactionConfirmed(event)
    let timeElapsed = Date.now() - startTime
    // let blockDelay = confrimedTransactionReceipt.blockNumber - sendBlockNumber
    gasUsed += confirmedTransactionReceipt.gasUsed

    await outputResults(
      timeElapsed,
      gasUsed,
      sendBlockNumber,
      confirmedTransactionReceipt.blockNumber,
      OUTPUT_FILE_PATH,
      1
    )

    process.exit()
  })
}
try {
  retrieveTAL()
} catch (err) {
  console.log(err)
}
