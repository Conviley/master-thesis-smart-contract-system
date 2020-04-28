const web3 = require('./web3.js')
const instance = require('./factory.js')
const outputResults = require('./outputResults.js').outputResults

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
    await instance.methods.createMockTrip().send({
      from: accounts[0],
      gasPrice: GAS_PRICE,
    })
    tripKey = (await instance.methods.getTripKey().call()) - 1
    console.log('created new trip setting trip key to', tripKey)
  } catch (err) {
    console.log('Failed to create new mock trip!', err)
    process.exit(1)
  }

  const submissionPromiseArray = []
  const bookingPromiseArr = []
  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = ''
    promise = instance.methods.bookTrip(tripKey).send({
      from: accounts[i],
      gasPrice: GAS_PRICE,
      value: 1,
    })

    bookingPromiseArr.push(promise)

    promise = instance.methods
      .addSubmission(tripKey, Math.round(Date.now() / 1000))
      .send({
        from: accounts[i],
        gasPrice: GAS_PRICE,
      })

    submissionPromiseArray.push(promise)
  }
  console.log('issuing booking transactions...')
  try {
    var sendBlockNumber = await web3.eth.getBlockNumber()
  } catch (err) {
    console.log("COULDN'T GET BLOCK NUMBER")
  }

  let txStartTime = Date.now()
  let executionMetrics = ''
  try {
    executionMetrics = await executePromises(bookingPromiseArr, txStartTime)
  } catch (err) {
    console.log('EXECUTIONG BOOKING ERROR', err)
  }
  try {
    await outputResults(
      executionMetrics.txElapsedTime,
      executionMetrics.totalGasUsed,
      sendBlockNumber,
      executionMetrics.lastBlock,
      BOOKINGS_OUTPUT_FILE_PATH,
      TRANSACTIONS
    )
  } catch (err) {
    console.log('OUTPUT RESULT', err)
  }

  console.log('issuing addSubmission transactions...')
  sendBlockNumber = await web3.eth.getBlockNumber()
  txStartTime = Date.now()
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
  executionMetrics = await executePromises(submissionPromiseArr, txStartTime)
  const aggregationReceipt = await instance.methods
    .updateTALMedian(tripKey)
    .send({
      from: accounts[0],
      gasPrice: GAS_PRICE,
    })

  let aggregateElapsedTime = Date.now() - aggregateStartTime
  console.log('Aggregation Finished!')
  await outputResults(
    aggregateElapsedTime,
    aggregationReceipt.gasUsed,
    sendBlockNumber,
    aggregationReceipt.blockNumber,
    AGGREGATIONS_OUTPUT_FILE_PATH,
    TRANSACTIONS
  )
}

async function executePromises(promisesArr, txStartTime) {
  console.log('Entering executiePromises')
  await Promise.all(promisesArr)
    .then((receipts) => {
      let totalGasUsed = 0
      let txElapsedTime = Date.now() - txStartTime
      let lastBlock = receipts[receipts.length - 1].blockNumber
      receipts.forEach((receipt) => {
        totalGasUsed += receipt.gasUsed
        lastBlock =
          receipt.blockNumber > lastBlock ? receipt.blockNumber : lastBlock
      })
      console.log('executiePromises before return')
      return {
        txElapsedTime: txElapsedTime,
        totalGasUsed: totalGasUsed,
        lastBlock: lastBlock,
      }
    })
    .catch((error) => {
      console.log('multipleTX():', error)
      process.exit(1)
    })
}

module.exports = multipleTx
