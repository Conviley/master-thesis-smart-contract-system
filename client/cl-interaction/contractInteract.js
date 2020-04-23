const web3 = require('./web3.js')
const instance = require('./factory.js')
const outputResults = require('./outputResults.js')

const GAS_PRICE = 2000000000

var TRANSACTIONS = 1
var OUTPUT_FILE_PATH = './testSubmissionData.json'
var testSubmission = true
var tripKey = 1

async function multipleTx() {
  let argvLength = process.argv.length
  if (argvLength > 2) {
    tripKey = parseInt(process.argv[2])
    if (argvLength > 3) {
      OUTPUT_FILE_PATH = process.argv[3]
    }
    if (argvLength > 4) {
      testSubmission = process.argv[4] == 'true'
    }
  }
  console.log(tripKey, OUTPUT_FILE_PATH, testSubmission)

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
  const sendTimeStamp = Date.now()

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
      let lastBlock = receipts[0].blockNumber
      receipts.forEach((receipt) => {
        totalGasUsed += receipt.gasUsed
        lastBlock =
          receipt.blockNumber > lastBlock ? receipt.blockNumber : lastBlock
      })
      await outputResults(
        sendTimeStamp,
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
}

async function test(n) {
  let transactionMultiplier = TRANSACTIONS
  for (let i = 1; i < n + 1; i++) {
    TRANSACTIONS = transactionMultiplier * i
    await multipleTx()
  }
}

test(1).then((_) => {
  console.log('Test Finished!')
  process.exit(0)
})
