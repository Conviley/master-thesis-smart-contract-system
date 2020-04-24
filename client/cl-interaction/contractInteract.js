const web3 = require('./web3.js')
const instance = require('./factory.js')
const outputResults = require('./outputResults.js')

async function multipleTx(
  TRANSACTIONS,
  GAS_PRICE,
  tripKey,
  testSubmission,
  OUTPUT_FILE_PATH,
  OUTPUT_AGGEGAGATION_FILE_PATH
) {
  let accounts = await web3.eth.getAccounts()
  if (!testSubmission) {
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
  }
  if (testSubmission) {
    console.log('Issuing addSubmission Transactions...')
  } else {
    console.log('Issuing bookTrip Transactions...')
  }

  let totalGasUsed = 0
  const promisesArr = []
  const sendBlockNumber = await web3.eth.getBlockNumber()
  const txStartTime = Date.now()

  for (let i = 0; i < TRANSACTIONS; i++) {
    let promise = ''
    if (testSubmission) {
      promise = instance.methods
        .addSubmissionNoCheck(tripKey, 1587473091)
        .send({
          from: accounts[i],
          gasPrice: GAS_PRICE,
        })
    } else {
      promise = instance.methods.bookTrip(tripKey).send({
        from: accounts[i],
        gasPrice: GAS_PRICE,
        value: 1,
      })
    }
    promisesArr.push(promise)
  }

  await Promise.all(promisesArr)
    .then(async (receipts) => {
      let txElapsedTime = Date.now() - txStartTime
      let lastBlock = receipts[0].blockNumber
      receipts.forEach((receipt) => {
        totalGasUsed += receipt.gasUsed
        lastBlock =
          receipt.blockNumber > lastBlock ? receipt.blockNumber : lastBlock
      })
      await outputResults(
        txElapsedTime,
        totalGasUsed,
        sendBlockNumber,
        lastBlock,
        OUTPUT_FILE_PATH,
        TRANSACTIONS
      )
    })
    .catch((error) => {
      console.log('multipleTX():', error)
      process.exit(1)
    })

  if (testSubmission) {
    console.log('Aggregating TAL...')
    const aggStartBlockNumber = await web3.eth.getBlockNumber()
    let aggregateStartTime = Date.now()

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
      aggStartBlockNumber,
      aggregationReceipt.blockNumber,
      OUTPUT_AGGEGAGATION_FILE_PATH,
      TRANSACTIONS
    )
  }
}

module.exports = multipleTx
