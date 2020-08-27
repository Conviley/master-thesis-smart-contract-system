const multipleTx = require('./contractInteract.js')
const mergeJson = require('./mergeJson.js')
const plotBlockDelay = require('./plotBlockDelay.js')
const plotBlockDelayBox = require('./plotblockDelayBox.js')
const plotTimeElapsed = require('./plotTimeElapsed.js')
const plotGasUsage = require('./plotGasUsage.js')

const BOOKINGS_OUTPUT_FILE_PATH = './p1Booking.json'
const SUBMISSIONS_OUTPUT_FILE_PATH = './p1Submissions.json'
const AGGREGATIONS_OUTPUT_FILE_PATH = './p1Aggregations.json'
const OUTPUT_MERGED_FILE_PATH = './p1Merged.json'
const TRAFIKVERKET_OUTPUT_FILE_PATH = './CToutput.json'

function plotStuff() {
  plotGasUsage(SUBMISSIONS_OUTPUT_FILE_PATH, 'Gas Usage for Submissions')
  plotBlockDelayBox(SUBMISSIONS_OUTPUT_FILE_PATH, 'Block Delay for Submissions')
  plotTimeElapsed(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    'Network latency for Submissions'
  )

  plotGasUsage(AGGREGATIONS_OUTPUT_FILE_PATH, 'GAS Usage for Aggregations')
  plotBlockDelayBox(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Block Delay for Aggregations'
  )
  plotTimeElapsed(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Network Latency for Aggregations'
  )

  plotGasUsage(OUTPUT_MERGED_FILE_PATH, 'GAS Usage - Total')
  plotBlockDelayBox(OUTPUT_MERGED_FILE_PATH, 'Block Delay - Total')
  plotTimeElapsed(OUTPUT_MERGED_FILE_PATH, 'Network Latency - Total')

  /*   plotGasUsage(TRAFIKVERKET_OUTPUT_FILE_PATH, 'GAS Usage - Total')
  plotBlockDelayBox(TRAFIKVERKET_OUTPUT_FILE_PATH, 'Block Delay - Total')
  plotTimeElapsed(TRAFIKVERKET_OUTPUT_FILE_PATH, 'Network Latency - Total') */

  console.log('Plot finished!')
  //await new Promise((r) => setTimeout(r, 3000))
  //process.exit(0)
}

plotStuff()
