const fs = require('fs-extra')

async function outputResults(
  txElapsedTime,
  totalGasUsed,
  sendBlockNumber,
  lastBlock,
  OUTPUT_FILE_PATH,
  TRANSACTIONS
) {
  let outputFile = {}
  try {
    const jsonKey = TRANSACTIONS.toString()
    const transactionReceipt = createTransactionReceipt(
      txElapsedTime,
      totalGasUsed,
      sendBlockNumber,
      lastBlock,
      TRANSACTIONS
    )

    if (fs.existsSync(OUTPUT_FILE_PATH)) {
      outputFile = await fs.readJson(OUTPUT_FILE_PATH)

      if (outputFile[jsonKey]) {
        outputFile[jsonKey]['transactions'].push(transactionReceipt)
        updateDataPointValues(outputFile[jsonKey])
      } else {
        outputFile[jsonKey] = createNewEntry(transactionReceipt)
      }
    } else {
      console.log(OUTPUT_FILE_PATH, 'Did not exist, creating it')
      outputFile[jsonKey] = createNewEntry(transactionReceipt)
    }
    await fs.writeJson(OUTPUT_FILE_PATH, outputFile)
    console.log('Success! Result written to:', OUTPUT_FILE_PATH)
  } catch (err) {
    console.log('outputResults():', err)
  }
}

function createTransactionReceipt(
  txElapsedTime,
  totalGasUsed,
  sendBlockNumber,
  lastBlock,
  TRANSACTIONS
) {
  return {
    numberOfTransactions: TRANSACTIONS,
    elapsedTime: txElapsedTime / 1000,
    gasUsed: totalGasUsed,
    lastBlock: lastBlock,
    blockDelay: lastBlock - sendBlockNumber,
  }
}

function createNewEntry(transactionReceipt) {
  return {
    transactions: [transactionReceipt],
    minElapsedTime: transactionReceipt.elapsedTime,
    avgElapsedTime: transactionReceipt.elapsedTime,
    maxElapsedTime: transactionReceipt.elapsedTime,
    minBlockDelay: transactionReceipt.blockDelay,
    avgBlockDelay: transactionReceipt.blockDelay,
    maxBlockDelay: transactionReceipt.blockDelay,
  }
}

function updateDataPointValues(entry) {
  let sumTimes = 0
  let sumBlockDelay = 0
  let newTransaction = entry['transactions'][entry['transactions'].length - 1]

  if (newTransaction.elapsedTime < entry.minElapsedTime) {
    entry.minElapsedTime = newTransaction.elapsedTime
  } else if (newTransaction.elapsedTime > entry.maxElapsedTime) {
    entry.maxElapsedTime = newTransaction.elapsedTime
  }

  entry['transactions'].forEach((tx) => {
    sumTimes += tx.elapsedTime
    sumBlockDelay += tx.blockDelay
  })

  let submissions = entry['transactions'].length
  entry.avgElapsedTime = sumTimes / submissions
  entry.avgBlockDelay = sumBlockDelay / submissions
}

module.exports = outputResults
