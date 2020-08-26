const web3 = require('./web3.js')[0]
const getBalances = require('./getBalances.js')

async function fundAccounts(first, last, etherAmount) {
  let accounts = await web3.eth.getAccounts()
  const amountToSend = web3.utils.toWei(etherAmount)
  const transactions = []
  for (var i = first; i < last; i++) {
    transactions.push(
      web3.eth.sendTransaction({
        from: accounts[0],
        to: accounts[i],
        value: amountToSend,
      })
    )
  }
  console.log(
    'Funding accounts',
    first,
    'to',
    last,
    'with',
    etherAmount,
    'ether...'
  )
  await Promise.all(transactions)
    .then((receipts) => {
      console.log(
        'Success! Accounts',
        first,
        'to',
        last,
        'funded with',
        etherAmount,
        ' ether'
      )
      getBalances()
    })
    .catch((error) => {
      console.log(error)
      process.exit(1)
    })
}

/* fundAccounts(1, 10, '0.1')
fundAccounts(10, 20, '0.05')
fundAccounts(20, 40, '0.04')
fundAccounts(40, 100, '0.03')
fundAccounts(100, 305, '0.02') */

fundAccounts(305, 306, '2')
