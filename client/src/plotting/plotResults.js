const plotBlockDelayBox = require('./plotblockDelay.js')
const plotNetworkLatency = require('./plotNetworkLatency.js')
const plotGasUsage = require('./plotGasUsage.js')

const SUBMISSIONS_OUTPUT_FILE_PATH = './p1Submissions.json'
const AGGREGATIONS_OUTPUT_FILE_PATH = './p1Aggregations.json'
const OUTPUT_MERGED_FILE_PATH = './p1Merged.json'
const TRAFIKVERKET_OUTPUT_FILE_PATH = './CToutput.json'

function plotStuff() {
  plotGasUsage(SUBMISSIONS_OUTPUT_FILE_PATH, 'Gas Usage for Submissions')
  plotBlockDelayBox(SUBMISSIONS_OUTPUT_FILE_PATH, 'Block Delay for Submissions')
  plotNetworkLatency(
    SUBMISSIONS_OUTPUT_FILE_PATH,
    'Network latency for Submissions'
  )

  plotGasUsage(AGGREGATIONS_OUTPUT_FILE_PATH, 'GAS Usage for Aggregations')
  plotBlockDelayBox(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Block Delay for Aggregations'
  )
  plotNetworkLatency(
    AGGREGATIONS_OUTPUT_FILE_PATH,
    'Network Latency for Aggregations'
  )

  plotGasUsage(OUTPUT_MERGED_FILE_PATH, 'GAS Usage - Total')
  plotBlockDelayBox(OUTPUT_MERGED_FILE_PATH, 'Block Delay - Total')
  plotNetworkLatency(OUTPUT_MERGED_FILE_PATH, 'Network Latency - Total')

  plotGasUsage(TRAFIKVERKET_OUTPUT_FILE_PATH, 'Chainlink GAS Usage - Total')
  plotBlockDelayBox(
    TRAFIKVERKET_OUTPUT_FILE_PATH,
    'Chainlink Block Delay - Total'
  )
  plotNetworkLatency(
    TRAFIKVERKET_OUTPUT_FILE_PATH,
    'Chainlink Network Latency - Total'
  )

  console.log('Plot finished!')
}

plotStuff()
