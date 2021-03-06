const web3 = require('../web3/web3.js')
const getBalances = require('./getBalances.js')

async function fundMainAccount(accountsAmount) {
  let accounts = await web3.eth.getAccounts()
  let amountToSend = 0
  let gasCosts = 1000000000 * 21000

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
        gasPrice: 1000000000,
        gas: 21000,
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

fundMainAccount(305)
