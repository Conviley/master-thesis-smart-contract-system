const DEFAULT_INTERVAL = 10
const DEFAULT_BLOCKS_TO_WAIT = 0

let confirmedBlockNumbers = []
let current = 0
let execTime = 0
let startTime = 0

function awaitTx(web3, txnHash, options) {
  interval = options && options.interval ? options.interval : DEFAULT_INTERVAL
  blocksToWait =
    options && options.blocksToWait
      ? options.blocksToWait
      : options && options.ensureNotUncle
      ? 1
      : DEFAULT_BLOCKS_TO_WAIT
  var transactionReceiptAsync = async function(txnHash, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHash)
      if (!receipt) {
        console.log('WE GOOFED')
        setTimeout(function() {
          transactionReceiptAsync(txnHash, resolve, reject)
        }, interval)
      } else {
        if (blocksToWait > 0) {
          startTime = Date.now()
          var resolvedReceipt = await receipt
          execTime += Date.now() - startTime
          if (confirmedBlockNumbers.includes(resolvedReceipt.blockNumber)) {
            resolvedReceipt['execTime'] = execTime
            execTime = 0
            resolve(resolvedReceipt)
          }
          if (!resolvedReceipt || !resolvedReceipt.blockNumber)
            setTimeout(function() {
              transactionReceiptAsync(txnHash, resolve, reject)
            }, interval)
          else {
            try {
              if (current - resolvedReceipt.blockNumber >= blocksToWait) {
                confirmedBlockNumbers.push(resolvedReceipt.blockNumber)
                resolvedReceipt['execTime'] = execTime
                execTime = 0
                resolve(resolvedReceipt)
              } else {
                startTime = Date.now()
                current = await web3.eth.getBlockNumber()
                execTime += Date.now() - startTime
                setTimeout(function() {
                  transactionReceiptAsync(txnHash, resolve, reject)
                }, interval)
              }
            } catch (e) {
              setTimeout(function() {
                transactionReceiptAsync(txnHash, resolve, reject)
              }, interval)
            }
          }
        } else resolve(receipt)
      }
    } catch (e) {
      reject(e)
    }
  }

  if (Array.isArray(txnHash)) {
    var promises = []
    txnHash.forEach(function(oneTxHash) {
      promises.push(awaitTx(web3, oneTxHash, options))
    })
    return Promise.all(promises)
  } else {
    return new Promise(function(resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject)
    })
  }
}

module.exports = {
  awaitTx: awaitTx,
}
