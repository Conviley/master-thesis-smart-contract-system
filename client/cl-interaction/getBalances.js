const web3 = require('./web3.js')[0]

const getBalances = async function getBalances() {
  console.log('Fetching balances...')
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

if (require.main === module) {
  getBalances()
} else {
  module.exports = getBalances
}
