const multipleTx = require('./contractInteract.js')
const mergeJson = require('./mergeJson.js')
const plotBlockDelay = require('./plotBlockDelay.js')
const plotTimeElapsed = require('./plotTimeElapsed.js')
const plotGasUsage = require('./plotGasUsage.js')
/**
 * This profile tests submissions and aggregation.
 * Start at 10 transactions and increment by 10 until 100 transactions
 */
const BASE_TRANSACTIONS = 1
const BASE_GAS_PRICE = 2000000000
const BATCHES = 5

const TRIP_KEY = 1

const BOOKINGS_OUTPUT_FILE_PATH = './p1Booking.json'
const SUBMISSIONS_OUTPUT_FILE_PATH = './p1Submissions.json'
const AGGREGATIONS_OUTPUT_FILE_PATH = './p1Aggregations.json'
const OUTPUT_MERGED_FILE_PATH = './p1Merged.json'

async function test(n) {
  let TRANSACTIONS
  let GAS_PRICE
  for (let i = 1; i < n + 1; i++) {
    TRANSACTIONS = BASE_TRANSACTIONS
    GAS_PRICE = BASE_GAS_PRICE
    await multipleTx(
      TRANSACTIONS,
      GAS_PRICE,
      BOOKINGS_OUTPUT_FILE_PATH,
      SUBMISSIONS_OUTPUT_FILE_PATH,
      AGGREGATIONS_OUTPUT_FILE_PATH
    )
  }
}

test(BATCHES).then(async (_) => {
  await mergeJson(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    AGGREGATIONS_OUTPUT_FILE_PATH,
    OUTPUT_MERGED_FILE_PATH
  )

  plotBlockDelay(SUBMISSIONS_OUTPUT_FILE_PATH, 'Block Delay - addSubmission()')
  plotTimeElapsed(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    'Time Elapsed - addSubmission()'
  )
  plotGasUsage(SUBMISSIONS_OUTPUT_FILE_PATH, 'GAS Usage - addSubmission()')

  plotBlockDelay(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Block Delay - updateTALMedian()'
  )
  plotTimeElapsed(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Time Elapsed - updateTALMedian()'
  )
  plotGasUsage(AGGREGATIONS_OUTPUT_FILE_PATH, 'GAS Usage - updateTALMedian()')

  plotBlockDelay(OUTPUT_MERGED_FILE_PATH, 'Block Delay - Merged')
  plotTimeElapsed(OUTPUT_MERGED_FILE_PATH, 'Time Elapsed - Merged')
  plotGasUsage(OUTPUT_MERGED_FILE_PATH, 'GAS Usage - Merged')

  console.log('Test Finished!')
  //await new Promise((r) => setTimeout(r, 3000))
  //process.exit(0)
})
