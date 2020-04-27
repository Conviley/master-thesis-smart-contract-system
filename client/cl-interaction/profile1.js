const multipleTx = require('./contractInteract.js')
const plotBlockDelay = require('./plotBlockDelay.js')
const plotTimeElapsed = require('./plotTimeElapsed.js')
const plotGasUsage = require('./plotGasUsage.js')
/**
 * This profile tests submissions and aggregation.
 * Start at 10 transactions and increment by 10 until 100 transactions
 */
const BASE_TRANSACTIONS = 1
const BASE_GAS_PRICE = 2000000000
const BATCHES = 1

const TRIP_KEY = 1
const TEST_SUBMISSION = true
const OUTPUT_FILE_PATH = './p1.json'
const OUTPUT_AGGREGATION_FILE_PATH = 'p1Agg.json'

async function test(n) {
  let TRANSACTIONS
  let GAS_PRICE
  for (let i = 1; i < n + 1; i++) {
    TRANSACTIONS = BASE_TRANSACTIONS * i
    GAS_PRICE = BASE_GAS_PRICE
    await multipleTx(
      TRANSACTIONS,
      GAS_PRICE,
      TRIP_KEY,
      TEST_SUBMISSION,
      OUTPUT_FILE_PATH,
      OUTPUT_AGGREGATION_FILE_PATH
    )
  }
}

test(BATCHES).then(async (_) => {
  plotBlockDelay('./p1.json', 'Block Delay - addSubmission()')
  plotTimeElapsed('./p1.json', 'Time Elapsed - addSubmission()')
  plotGasUsage('./p1.json', 'GAS Usage - addSubmission()')

  plotBlockDelay('./p1agg.json', 'Block Delay - updateTALMedian()')
  plotTimeElapsed('./p1agg.json', 'Time Elapsed - updateTALMedian()')
  plotGasUsage('./p1agg.json', 'GAS Usage - updateTALMedian()')

  console.log('Test Finished!')
  //await new Promise((r) => setTimeout(r, 3000))
  //process.exit(0)
})
