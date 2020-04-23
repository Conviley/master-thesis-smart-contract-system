const web3 = require('./web3.js')
const getBalances = require('./getBalances.js')

async function fundAccounts(accountsAmount, etherAmount) {
  let accounts = await web3.eth.getAccounts()
  const amountToSend = web3.utils.toWei(etherAmount)
  const transactions = []
  for (var i = 0; i < accountsAmount; i++) {
    transactions.push(
      web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[i],
        value: amountToSend,
      })
    )
  }
  console.log(
    'Funding the first',
    accountsAmount,
    'accounts with',
    etherAmount,
    'ether...'
  )
  await Promise.all(transactions)
    .then((receipts) => {
      console.log(
        'Success!',
        accountsAmount,
        'accounts funded with',
        etherAmount,
        'ether'
      )
      getBalances()
    })
    .catch((error) => {
      console.log(error)
      process.exit(1)
    })
}

fundAccounts(2, '0.001')
