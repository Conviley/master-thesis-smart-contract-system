const multipleTx = require('./contractInteract.js')
const plotBlockDelay = require('./plotBlockDelay.js')
const plotTimeElapsed = require('./plotTimeElapsed.js')
const plotGasUsage = require('./plotGasUsage.js')
/**
 * This profile tests booking.
 * Start at 10 transactions and increment by 10 until 100 transactions
 */
const BASE_TRANSACTIONS = 1
const BASE_GAS_PRICE = 2000000000
const BATCHES = 1

const TRIP_KEY = 'NOT_USED'
const TEST_SUBMISSION = false
const OUTPUT_FILE_PATH = './p2.json'
const OUTPUT_AGGREGATION_FILE_PATH = 'NOT_USED'

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

test(BATCHES).then((_) => {
  plotBlockDelay('./p2.json', 'Block Delay - bookTrip()')
  plotTimeElapsed('./p2.json', 'Time Elapsed - bookTrip()')
  plotGasUsage('./p2.json', 'GAS Usage - bookTrip()')
  console.log('Test Finished!')
  //process.exit(0)
})
