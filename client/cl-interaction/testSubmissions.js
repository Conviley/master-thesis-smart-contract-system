var TRANSACTIONS = 1
const OUTPUT_FILE_PATH = './rawData.json'

const web3 = require('./web3.js')
const instance = require('./factory.js')
const outputResults = require('./outputResults.js')

async function multipleTx() {
  let accounts = await web3.eth.getAccounts()
  console.log('Issuing Transactions...')
  let totalGasUsed = 0
  const promisesArr = []
  const sendBlockNumber = await web3.eth.getBlockNumber()
  const sendTimeStamp = Date.now()

  for (let i = 0; i < TRANSACTIONS; i++) {
    console.log('account', i, 'is', accounts[i])
    promisesArr.push(
      instance.methods.addSubmissionNoCheck(3, 1587473091).send({
        from: accounts[i],

        gasPrice: 2000000000,
      })
    )
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
