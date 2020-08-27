const web3 = require('./web3/web3.js')
const multipleTx = require('./passengerTestImpl.js')
const mergeJson = require('./plotting/mergeJson.js')
const plotBlockDelay = require('./plotting/plotBlockDelay.js')
const plotNetworkLatency = require('./plotting/plotNetworkLatency.js')
const plotGasUsage = require('./plotting/plotGasUsage.js')

const GAS_PRICE = 1000000000
const TX_COUNT = [2]
const BOOKINGS_OUTPUT_FILE_NAME = './results/p1Booking.json'
const SUBMISSIONS_OUTPUT_FILE_NAME = './results/p1Submissions.json'
const AGGREGATIONS_OUTPUT_FILE_NAME = './results/p1Aggregations.json'
const OUTPUT_MERGED_FILE_NAME = './results/p1Merged.json'

async function test() {
  const accounts = await web3.eth.getAccounts()
  for (var txCount of TX_COUNT) {
    try {
      await multipleTx(
        accounts,
        txCount,
        GAS_PRICE,
        BOOKINGS_OUTPUT_FILE_NAME,
        SUBMISSIONS_OUTPUT_FILE_NAME,
        AGGREGATIONS_OUTPUT_FILE_NAME
      )
    } catch (err) {
      console.log('passengerTest.js:', err)
    }
  }
}

test().then(async (_) => {
  await mergeJson(
    SUBMISSIONS_OUTPUT_FILE_NAME,
    AGGREGATIONS_OUTPUT_FILE_NAME,
    OUTPUT_MERGED_FILE_NAME
  )

  plotBlockDelay(SUBMISSIONS_OUTPUT_FILE_NAME, 'Block Delay - addSubmission()')
  plotNetworkLatency(
    SUBMISSIONS_OUTPUT_FILE_NAME,
    'Time Elapsed - addSubmission()'
  )
  plotGasUsage(SUBMISSIONS_OUTPUT_FILE_NAME, 'GAS Usage - addSubmission()')

  plotBlockDelay(
    AGGREGATIONS_OUTPUT_FILE_NAME,
    'Block Delay - updateTALMedian()'
  )
  plotNetworkLatency(
    AGGREGATIONS_OUTPUT_FILE_NAME,
    'Time Elapsed - updateTALMedian()'
  )
  plotGasUsage(AGGREGATIONS_OUTPUT_FILE_NAME, 'GAS Usage - updateTALMedian()')

  plotBlockDelay(OUTPUT_MERGED_FILE_NAME, 'Block Delay - Merged')
  plotNetworkLatency(OUTPUT_MERGED_FILE_NAME, 'Time Elapsed - Merged')
  plotGasUsage(OUTPUT_MERGED_FILE_NAME, 'GAS Usage - Merged')

  console.log('Test Finished!')
  //await new Promise((r) => setTimeout(r, 3000))
  //process.exit(0)
})
