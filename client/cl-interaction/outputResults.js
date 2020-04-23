const fs = require('fs-extra')

async function outputResults(
  sendTimeStamp,
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
      sendTimeStamp,
      totalGasUsed,
      sendBlockNumber,
      lastBlock,
      TRANSACTIONS
    )

    if (fs.existsSync(OUTPUT_FILE_PATH)) {
      outputFile = await fs.readJson(OUTPUT_FILE_PATH)

      if (outputFile[jsonKey]) {
        outputFile[jsonKey]['transactions'].push(transactionReceipt)
        newValues = updateDataPointValues(jsonKey, outputFile[jsonKey])
        outputFile[jsonKey].minElapsedTime = newValues.minElapsedTime
        outputFile[jsonKey].avgElapsedTime = newValues.avgElapsedTime
        outputFile[jsonKey].maxElapsedTime = newValues.maxElapsedTime
        outputFile[jsonKey].minBlockDelay = newValues.minBlockDelay
        outputFile[jsonKey].avgBlockDelay = newValues.avgBlockDelay
        outputFile[jsonKey].maxBlockDelay = newValues.maxBlockDelay
      } else {
        outputFile[jsonKey] = createNewEntry(transactionReceipt)
      }
    } else {
      console.log(OUTPUT_FILE_PATH, 'Did not exist')
      outputFile[jsonKey] = createNewEntry(transactionReceipt)
    }
    await fs.writeJson(OUTPUT_FILE_PATH, outputFile)
    console.log('Success! Result written to:', OUTPUT_FILE_PATH)
  } catch (err) {
    console.log('outputResults():', err)
  }
}

function createTransactionReceipt(
  sendTimeStamp,
  totalGasUsed,
  sendBlockNumber,
  lastBlock,
  TRANSACTIONS
) {
  return {
    numberOfTransactions: TRANSACTIONS,
    elapsedTime: (Date.now() - sendTimeStamp) / 1000,
    gasUsed: totalGasUsed,
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

function updateDataPointValues(jsonKey, entry) {
  let minTime = entry.maxElapsedTime
  let minBlockDelay = entry.maxBlockDelay
  let maxTime = entry.minElapsedTime
  let maxBlockDelay = entry.minBlockDelay
  let sumTimes = 0
  let sumBlockDelay = 0
  entry['transactions'].forEach((tx) => {
    minTime = tx.elapsedTime < minTime ? tx.elapsedTime : minTime
    minBlockDelay =
      tx.blockDelay < minBlockDelay ? tx.blockDelay : minBlockDelay
    maxTime = tx.elapsedTime > maxTime ? tx.elapsedTime : maxTime
    maxBlockDelay =
      tx.blockDelay > maxBlockDelay ? tx.blockDelay : maxBlockDelay
    sumTimes += tx.elapsedTime
    sumBlockDelay += tx.blockDelay
  })

  let submissions = entry['transactions'].length
  let avgTime = sumTimes / submissions
  let avgBlockDelay = sumBlockDelay / submissions

  return {
    minElapsedTime: minTime,
    avgElapsedTime: avgTime,
    maxElapsedTime: maxTime,
    minBlockDelay: minBlockDelay,
    avgBlockDelay: avgBlockDelay,
    maxBlockDelay: maxBlockDelay,
  }
}

module.exports = outputResults
