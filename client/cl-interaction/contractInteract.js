const web3 = require('./web3.js')
const instance = require('./factory.js')
const outputResults = require('./outputResults.js').outputResults
const awaitTransactionConfirmed = require('./awaitTransactionConfirmed.js')

async function multipleTx(
  TRANSACTIONS,
  GAS_PRICE,
  BOOKINGS_OUTPUT_FILE_PATH,
  SUBMISSIONS_OUTPUT_FILE_PATH,
  AGGREGATIONS_OUTPUT_FILE_PATH
) {
  let accounts = await web3.eth.getAccounts()
  let tripKey = 0
  console.log('creating Mock Trip...')
  try {
    const receipt = await instance.methods.createMockTrip().send({
      from: accounts[0],
      gasPrice: GAS_PRICE,
      gas: 300000,
    })
    console.log('waiting for 4 blocks...')
    const minedTxReceipt = await awaitTransactionConfirmed(receipt, 4)
    console.log(minedTxReceipt.transactionHash, '4 blocks confirmed')
    tripKey =
      (await instance.methods.getTripKey().call({
        from: accounts[0],
        gasPrice: GAS_PRICE,
        gas: 30000,
      })) - 1
    console.log('created new trip setting trip key to', tripKey)
  } catch (err) {
    console.log('Failed to create new mock trip!', err)
    process.exit(1)
  }

  var sendBlockNumber = await web3.eth.getBlockNumber()
  let bookingPromiseArr = []
  let txStartTime = Date.now()
  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = ''
    promise = instance.methods.bookTrip(tripKey).send({
      from: accounts[i],
      gasPrice: GAS_PRICE,
      gas: 150000,
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
  sendBlockNumber = await web3.eth.getBlockNumber()
  let submissionPromiseArr = []
  txStartTime = Date.now()
  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = instance.methods
      .addSubmission(tripKey, Math.round(Date.now() / 1000))
      .send({
        from: accounts[i],
        gasPrice: GAS_PRICE,
        gas: 150000,
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
  sendBlockNumber = await web3.eth.getBlockNumber()
  txStartTime = Date.now()

  executionMetrics = await executePromises(
    [
      instance.methods.updateTALMedian(tripKey).send({
        from: accounts[0],
        gasPrice: GAS_PRICE,
        gas: 1000000,
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
      console.log('Waiting for 12 confirmations on transaction(s)...')
      for (var receipt of receipts) {
        const confirmedReceipt = await awaitTransactionConfirmed(receipt)
        confirmedReceipts.push(confirmedReceipt)
      }
      console.log('12 confirmations received!')
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
