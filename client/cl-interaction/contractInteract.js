const TRANSACTIONS = 2
const OUTPUT_FILE_PATH = './rawData.json'

const Web3 = require('web3')
const fs = require('fs-extra')

const HDWalletProvider = require('../../node_modules/@truffle/hdwallet-provider')

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
      receipts.forEach((receipt) => {
        totalGasUsed += receipt.gasUsed
      })
      console.log('SENDTIMESTAMP', sendTimeStamp, 'TOTALGASUSED', totalGasUsed)
      await outputResults(sendTimeStamp, totalGasUsed)
    })
    .catch((error) => {
      console.log(error)
    })
}

async function outputResults(sendTimeStamp, totalGasUsed) {
  let outputFile = {}
  try {
    const jsonKey = TRANSACTIONS.toString()
    const transactionReceipt = createTransactionReceipt(
      sendTimeStamp,
      totalGasUsed
    )

    if (fs.existsSync(OUTPUT_FILE_PATH)) {
      console.log(OUTPUT_FILE_PATH, 'Exists')
      outputFile = await fs.readJson(OUTPUT_FILE_PATH)
      console.log('OUTBPOUTFILE', outputFile)
      if (outputFile[jsonKey]) {
        outputFile[jsonKey]['transactions'].push(transactionReceipt)
        newValues = updateDataPointValues(jsonKey, outputFile[jsonKey])
        outputFile[jsonKey].minTimeSpent = newValues.minTimeSpent
        outputFile[jsonKey].avgTimeSpent = newValues.avgTimeSpent
        outputFile[jsonKey].maxTimeSpent = newValues.maxTimeSpent
      } else {
        outputFile[jsonKey] = createNewEntry(transactionReceipt)
      }
    } else {
      console.log(OUTPUT_FILE_PATH, 'Did not exist')
      outputFile[jsonKey] = createNewEntry(transactionReceipt)
    }
    console.log('outputfile=', outputFile)
    await fs.writeJson(OUTPUT_FILE_PATH, outputFile)
    console.log('Success! Result written to:', OUTPUT_FILE_PATH)
  } catch (err) {
    console.log(err)
  }
}

function createTransactionReceipt(sendTimeStamp, totalGasUsed) {
  return {
    numberOfTransactions: TRANSACTIONS,
    elapsedTime: (Date.now() - sendTimeStamp) / 1000,
    gasUsed: totalGasUsed,
  }
}

function createNewEntry(transactionReceipt) {
  return {
    transactions: [transactionReceipt],
    minTimeSpent: transactionReceipt.elapsedTime,
    avgTimeSpent: transactionReceipt.elapsedTime,
    maxTimeSpent: transactionReceipt.elapsedTime,
  }
}

function updateDataPointValues(jsonKey, entry) {
  let minTime = entry.maxTimeSpent
  let maxTime = entry.minTimeSpent
  let sumTimes = 0
  entry['transactions'].forEach((tx) => {
    minTime = tx.elapsedTime < minTime ? tx.elapsedTime : minTime
    maxTime = tx.elapsedTime > maxTime ? tx.elapsedTime : maxTime
    sumTimes += tx.elapsedTime
  })

  let avgTime = sumTimes / entry['transactions'].length

  return {
    minTimeSpent: minTime,
    avgTimeSpent: avgTime,
    maxTimeSpent: maxTime,
  }
}
//getBalances()
//fundAccounts()
async function test(n) {
  for (let i = 0; i < n; i++) {
    await multipleTx()
  }
}

test(1).then((_) => {
  console.log('Test Finished!')
  process.exit(0)
})
