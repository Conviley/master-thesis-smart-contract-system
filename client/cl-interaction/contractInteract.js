const TRANSACTIONS = 2
const OUTPUT_FILE_PATH = './rawData.json'

const HDWalletProvider = require('../../node_modules/@truffle/hdwallet-provider')
const Web3 = require('web3')
const fs = require('fs-extra')

const DeRail = require('../../build/contracts/DeRail.json')
const address = require('../../address.json')
const infura = require('../../infura.json')

const mnemonic = fs
  .readFileSync('../../.secret')
  .toString()
  .trim()
const walletprovider = new HDWalletProvider(
  mnemonic,
  infura.endpoint,
  0,
  TRANSACTIONS
)

const web3 = new Web3(walletprovider)
const instance = new web3.eth.Contract(DeRail.abi, address.address, {
  gasPrice: '20000000000',
})

async function fundAccounts() {
  let accounts = await web3.eth.getAccounts()
  const amount = '0.001'
  const amountToSend = web3.utils.toWei(amount)
  const transactions = []
  for (var i = 0; i < TRANSACTIONS; i++) {
    transactions.push(
      web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[i],
        value: amountToSend,
      })
    )
  }

  Promise.all(transactions)
    .then((receipts) => {
      getBalances()
    })
    .catch((error) => {
      console.log(error)
    })
}

async function getBalances() {
  let accounts = await web3.eth.getAccounts()
  transactions = []
  accounts.forEach((acc) => {
    transactions.push(web3.eth.getBalance(acc))
  })

  Promise.all(transactions).then((balances) => {
    balances.forEach((balance) => {
      console.log(balance)
    })
    process.exit()
  })
}

async function multipleTx() {
  let accounts = await web3.eth.getAccounts()
  console.log('Issuing Transactions...')
  let totalGasUsed = 0
  const promisesArr = []
  const sendBlockNumber = await web3.eth.getBlockNumber()
  const sendTimeStamp = Date.now()

  for (let i = 0; i < TRANSACTIONS; i++) {
    promisesArr.push(
      instance.methods.addSubmission(139, 1).send({
        from: accounts[i],
        gasPrice: 10000000000,
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
        lastBlock
      )
    })
    .catch((error) => {
      console.log(error)
    })
}

async function outputResults(
  sendTimeStamp,
  totalGasUsed,
  sendBlockNumber,
  lastBlock
) {
  let outputFile = {}
  try {
    const jsonKey = TRANSACTIONS.toString()
    const transactionReceipt = createTransactionReceipt(
      sendTimeStamp,
      totalGasUsed,
      sendBlockNumber,
      lastBlock
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
    console.log(err)
  }
}

function createTransactionReceipt(
  sendTimeStamp,
  totalGasUsed,
  sendBlockNumber,
  lastBlock
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
//getBalances()
//fundAccounts()
async function test(n) {
  for (let i = 0; i < n; i++) {
    await multipleTx()
  }
}

test(5).then((_) => {
  console.log('Test Finished!')
  process.exit(0)
})
