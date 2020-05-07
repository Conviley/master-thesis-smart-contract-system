const web3Array = require('./web3.js')
const instances = require('./factory.js')
const outputResults = require('./outputResults.js').outputResults
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')

async function multipleTx(
  accounts,
  TRANSACTIONS,
  GAS_PRICE,
  BOOKINGS_OUTPUT_FILE_PATH,
  SUBMISSIONS_OUTPUT_FILE_PATH,
  AGGREGATIONS_OUTPUT_FILE_PATH
) {
  let tripKey = 0
  console.log('creating Mock Trip...')
  try {
    const receipt = await instances[0].methods.createMockTrip().send({
      from: accounts[0],
      gasPrice: GAS_PRICE,
    })
    console.log('waiting for 12 blocks...')
    const minedTxReceipt = await awaitTransactionConfirmed(
      web3Array[0],
      receipt
    )
    console.log(minedTxReceipt, '12 blocks confirmed')
    tripKey = (await instances[0].methods.getTripKey().call()) - 1
    console.log('created new trip setting trip key to', tripKey)
  } catch (err) {
    console.log('Failed to create new mock trip!', err)
    process.exit(1)
  }

  var sendBlockNumber = await web3Array[0].eth.getBlockNumber()
  let bookingPromiseArr = []
  let txStartTime = Date.now()
  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = ''
    promise = instances[i % 3].methods.bookTrip(tripKey).send({
      from: accounts[i],
      gasPrice: GAS_PRICE,
      value: 1,
    })

    bookingPromiseArr.push(promise)
  }
  console.log('issuing booking transactions...')
  var executionMetrics = ''
  executionMetrics = await executePromises(bookingPromiseArr, txStartTime)
  await outputResults(
    executionMetrics.txElapsedTime,
    executionMetrics.totalGasUsed,
    sendBlockNumber,
    executionMetrics.lastBlock,
    BOOKINGS_OUTPUT_FILE_PATH,
    TRANSACTIONS
  )

  console.log('issuing addSubmission transactions...')
  sendBlockNumber = await web3Array[0].eth.getBlockNumber()
  let submissionPromiseArr = []
  txStartTime = Date.now()
  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = instances[i % 3].methods
      .addSubmission(tripKey, Math.round(Date.now() / 1000))
      .send({
        from: accounts[i],
        gasPrice: GAS_PRICE,
      })

    submissionPromiseArr.push(promise)
  }
  executionMetrics = await executePromises(submissionPromiseArr, txStartTime)
  await outputResults(
    executionMetrics.txElapsedTime,
    executionMetrics.totalGasUsed,
    sendBlockNumber,
    executionMetrics.lastBlock,
    SUBMISSIONS_OUTPUT_FILE_PATH,
    TRANSACTIONS
  )

  console.log('Aggregating TAL...')
  sendBlockNumber = await web3Array[0].eth.getBlockNumber()
  txStartTime = Date.now()

  executionMetrics = await executePromises(
    [
      instance.methods.updateTALMedian(tripKey).send({
        from: accounts[0],
        gasPrice: GAS_PRICE,
      }),
    ],
    txStartTime
  )

  await outputResults(
    executionMetrics.txElapsedTime,
    executionMetrics.totalGasUsed,
    sendBlockNumber,
    executionMetrics.lastBlock,
    AGGREGATIONS_OUTPUT_FILE_PATH,
    TRANSACTIONS
  )
}

async function executePromises(promisesArr, txStartTime) {
  let totalGasUsed = 0
  let txElapsedTime = 0
  let lastBlock = 0
  let confirmedReceipts = []

  let res = await Promise.all(promisesArr)
    .then(async (receipts) => {
      for (var receipt of receipts) {
        console.log('Waiting for 12 confirmations on transaction(s)...')
        const confirmedReceipt = await awaitTransactionConfirmed(receipt)
        console.log(confirmedReceipt)
        confirmedReceipts.push(confirmedReceipt)
        console.log('12 confirmations received!')
      }

      txElapsedTime = Date.now() - txStartTime
      lastBlock = confirmedReceipts[confirmedReceipts.length - 1].blockNumber
      confirmedReceipts.forEach((receipt) => {
        totalGasUsed += receipt.gasUsed
        lastBlock =
          receipt.blockNumber > lastBlock ? receipt.blockNumber : lastBlock
      })
      return {
        txElapsedTime: txElapsedTime,
        totalGasUsed: totalGasUsed,
        lastBlock: lastBlock,
      }
    })
    .catch((error) => {
      console.log('executePromises():', error)
      process.exit(1)
    })
  return res
}

module.exports = multipleTx
