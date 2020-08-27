const fs = require('fs-extra')

async function outputResults(
  txElapsedTime,
  totalGasUsed,
  sendBlockNumber,
  lastBlock,
  outputFilePath,
  transactions
) {
  let outputFile = {}
  try {
    const jsonKey = transactions.toString()
    const transactionReceipt = createTransactionReceipt(
      txElapsedTime,
      totalGasUsed,
      sendBlockNumber,
      lastBlock,
      transactions
    )

    if (fs.existsSync(outputFilePath)) {
      outputFile = await fs.readJson(outputFilePath)

      if (outputFile[jsonKey]) {
        outputFile[jsonKey]['transactions'].push(transactionReceipt)
        updateEntryValues(outputFile[jsonKey])
      } else {
        outputFile[jsonKey] = createNewEntry(transactionReceipt)
      }
    } else {
      console.log(outputFilePath, 'Did not exist, creating it')
      outputFile[jsonKey] = createNewEntry(transactionReceipt)
    }
    await fs.writeJson(outputFilePath, outputFile)
    console.log('Success! Result written to:', outputFilePath)
  } catch (err) {
    console.log('outputResults():', err)
  }
}

function createTransactionReceipt(
  txElapsedTime,
  totalGasUsed,
  sendBlockNumber,
  lastBlock,
  transactions
) {
  return {
    numberOfTransactions: transactions,
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

function updateEntryValues(entry) {
  let sumTimes = 0
  let sumBlockDelay = 0
  let newTransaction = entry['transactions'][entry['transactions'].length - 1]

  // POSSIBLE TODO: ADD MEDIAN CALCULATION AS WELL
  entry['transactions'].forEach((tx) => {
    if (tx.elapsedTime < entry.minElapsedTime) {
      entry.minElapsedTime = tx.elapsedTime
    } else if (tx.elapsedTime > entry.maxElapsedTime) {
      entry.maxElapsedTime = tx.elapsedTime
    }

    if (tx.blockDelay < entry.minBlockDelay) {
      entry.minBlockDelay = tx.blockDelay
    } else if (tx.blockDelay > entry.maxBlockDelay) {
      entry.maxBlockDelay = tx.blockDelay
    }

    sumTimes += tx.elapsedTime
    sumBlockDelay += tx.blockDelay
  })

  let submissions = entry['transactions'].length
  entry.avgElapsedTime = sumTimes / submissions
  entry.avgBlockDelay = sumBlockDelay / submissions
}

module.exports = {
  outputResults: outputResults,
  updateEntryValues: updateEntryValues,
}
