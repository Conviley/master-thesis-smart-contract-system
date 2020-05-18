const web3 = require('./web3.js')

let confirmedBlockNumbers = []
async function awaitTransactionConfirmed(initTxReceipt, blocksToWait = 11) {
  if (confirmedBlockNumbers.includes(initTxReceipt.blockNumber)) {
    return initTxReceipt
  }
  let txHash = initTxReceipt.transactionHash
  let currentBlock
  let transactionReceipt
  do {
    currentBlock = await web3.eth.getBlockNumber()
    transactionReceipt = await web3.eth.getTransactionReceipt(txHash)
  } while (currentBlock - transactionReceipt.blockNumber < blocksToWait)

  confirmedBlockNumbers.push(transactionReceipt.blockNumber)
  return transactionReceipt
}

module.exports = awaitTransactionConfirmed
