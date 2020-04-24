const multipleTx = require('./contractInteract.js')
/**
 * This profile tests booking.
 * Start at 10 transactions and increment by 10 until 100 transactions
 */
const BASE_TRANSACTIONS = 10
const BASE_GAS_PRICE = 2000000000
const BATCHES = 2

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
  console.log('Test Finished!')
  process.exit(0)
})
