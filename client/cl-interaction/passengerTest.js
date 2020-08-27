const web3 = require('./web3.js')
const multipleTx = require('./passengerTestImpl.js')
const mergeJson = require('./mergeJson.js')
const plotBlockDelay = require('./plotBlockDelay.js')
const plotNetworkLatency = require('./plotNetworkLatency.js')
const plotGasUsage = require('./plotGasUsage.js')

const GAS_PRICE = 1000000000
const TX_COUNT = [1, 5, 10]
const BOOKINGS_OUTPUT_FILE_PATH = './p1Booking.json'
const SUBMISSIONS_OUTPUT_FILE_PATH = './p1Submissions.json'
const AGGREGATIONS_OUTPUT_FILE_PATH = './p1Aggregations.json'
const OUTPUT_MERGED_FILE_PATH = './p1Merged.json'

async function test() {
  const accounts = await web3.eth.getAccounts()
  for (var txCount of TX_COUNT) {
    try {
      await multipleTx(
        accounts,
        txCount,
        GAS_PRICE,
        BOOKINGS_OUTPUT_FILE_PATH,
        SUBMISSIONS_OUTPUT_FILE_PATH,
        AGGREGATIONS_OUTPUT_FILE_PATH
      )
    } catch (err) {
      console.log('profile1.js:', err)
    }
  }
}

test().then(async (_) => {
  await mergeJson(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    AGGREGATIONS_OUTPUT_FILE_PATH,
    OUTPUT_MERGED_FILE_PATH
  )

  plotBlockDelay(SUBMISSIONS_OUTPUT_FILE_PATH, 'Block Delay - addSubmission()')
  plotNetworkLatency(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    'Time Elapsed - addSubmission()'
  )
  plotGasUsage(SUBMISSIONS_OUTPUT_FILE_PATH, 'GAS Usage - addSubmission()')

  plotBlockDelay(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Block Delay - updateTALMedian()'
  )
  plotNetworkLatency(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Time Elapsed - updateTALMedian()'
  )
  plotGasUsage(AGGREGATIONS_OUTPUT_FILE_PATH, 'GAS Usage - updateTALMedian()')

  plotBlockDelay(OUTPUT_MERGED_FILE_PATH, 'Block Delay - Merged')
  plotNetworkLatency(OUTPUT_MERGED_FILE_PATH, 'Time Elapsed - Merged')
  plotGasUsage(OUTPUT_MERGED_FILE_PATH, 'GAS Usage - Merged')

  console.log('Test Finished!')
  //await new Promise((r) => setTimeout(r, 3000))
  //process.exit(0)
})
