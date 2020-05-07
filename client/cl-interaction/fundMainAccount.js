const web3 = require('./web3.js')[0]
const getBalances = require('./getBalances.js')

async function fundMainAccount(accountsAmount) {
  let accounts = await web3.eth.getAccounts()
  let amountToSend = 0
  let gasCosts = (await web3.eth.getGasPrice()) * 22000

  const transactions = []
  for (var i = 1; i < accountsAmount + 1; i++) {
    amountToSend = await web3.eth.getBalance(accounts[i])
    amountToSend -= gasCosts

    if (amountToSend < 0) {
      console.log('account:', i, 'skipped')
      continue
    }
    console.log('Taking', amountToSend, 'WEI from account:', i)
    transactions.push(
      web3.eth.sendTransaction({
        from: accounts[i],
        to: accounts[0],
        value: amountToSend,
      })
    )
  }

  await Promise.all(transactions)
    .then((receipts) => {
      console.log('Success!')
      getBalances()
    })
    .catch((error) => {
      console.log(error)
      process.exit(1)
    })
}

fundMainAccount(99)
