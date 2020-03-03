var utf8 = require('utf8')

exports.calculatePaybackRatio = (req, res) => {
  const advertisedTimeAtLocation = req.body.data.advertisedTimeAtLocation || ''
  var timeAtLocationBytes = req.body.data.timeAtLocation || '' //bytes
  const shortTrip = req.body.data.shortTrip || ''

  console.log(timeAtLocationBytes)

  var hex = timeAtLocationBytes.toString()
  var timeAtLocation = ''
  for (var n = 0; n < hex.length; n += 2) {
    timeAtLocation += String.fromCharCode(parseInt(hex.substr(n, 2), 16))
  }

  console.log(timeAtLocation)

  var unixAdvertisedTimeAtLocation =
    new Date(advertisedTimeAtLocation).getTime() / 1000
  var unixTimeAtLocation = new Date(timeAtLocation).getTime() / 1000
  console.log(unixAdvertisedTimeAtLocation)
  console.log(unixTimeAtLocation)
  const delayInSec = unixTimeAtLocation - unixAdvertisedTimeAtLocation
  console.log(delayInSec)
  let paybackRatio = 0
  if ((shortTrip && delayInSec >= 1200) || delayInSec >= 3600) {
    if (shortTrip) {
      console.log('short trip')
      if (delayInSec >= 3600) {
        paybackRatio = 1
      } else if (delayInSec >= 2400) {
        paybackRatio = 0.75
      } else if (delayInSec >= 1200) {
        paybackRatio = 0.5
      }
    } else {
      console.log('long trip')
      if (delayInSec >= 7200) {
        paybackRatio = 0.5
      } else if (delayInSec >= 3600) {
        paybackRatio = 0.25
      }
    }

    var returnObj = { paybackRatio: paybackRatio }
    var returnobjJSON = JSON.stringify(returnObj)

    let returnData = {
      jobRunID: req.body.id,
      data: returnobjJSON,
    }
    console.log(returnData)
    res.send(returnData)
  }
}
//"545","nr","cst","2020-03-01T15:50:00.000+01:00","1000000000","1"
// 0x0000000000000000000000000000000000000000
