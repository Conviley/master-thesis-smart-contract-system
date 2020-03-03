var request = require('request')
var utf8 = require('utf8')

exports.calculatePaybackRatio = (req, res) => {
  const url = req.body.data.url || ''
  const key = '4ac7c190db5942c8bf99fa49078c5376' // TODO: Possibly change this so that the key is stored and sent from the node operator
  const trainId = req.body.data.advertisedTrainIdent || ''
  const locationSig = req.body.data.locationSignature || ''
  const advertisedTimeAtLocation = req.body.data.advertisedTimeAtLocation || ''
  const shortTrip = req.body.data.shortTrip || ''

  var trainAnnouncementReq =
    '<REQUEST>' +
    '<LOGIN ' +
    'authenticationkey=' +
    '"' +
    key +
    '"' +
    ' />' +
    "<QUERY objecttype='TrainAnnouncement' schemaversion='1.3'>" +
    '<FILTER>' +
    "<EQ name='AdvertisedTrainIdent' value=" +
    '"' +
    trainId +
    '"' +
    '/>' +
    "<EQ name='LocationSignature' value=" +
    '"' +
    locationSig +
    '"' +
    '/>' +
    "<EQ name='AdvertisedTimeAtLocation' value=" +
    '"' +
    advertisedTimeAtLocation +
    '"' +
    '/>' +
    '</FILTER>' +
    '</QUERY>' +
    '</REQUEST>'

  request.post(
    {
      url: url,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
      },
      body: trainAnnouncementReq,
    },
    function(error, response, body) {
      if (error || response.statusCode >= 400) {
        let errorData = {
          jobRunID: req.body.id,
          status: 'errored',
          error: body,
        }
        res.status(response.statusCode).send(errorData)
      } else {
        var obj = JSON.parse(body)
        const timeAtLocation =
          obj.RESPONSE.RESULT[0].TrainAnnouncement[0].TimeAtLocation
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
        }

        var returnObj = { paybackRatio: paybackRatio }
        var returnobjJSON = JSON.stringify(returnObj)

        let returnData = {
          jobRunID: req.body.id,
          data: returnobjJSON,
        }
        console.log(returnData)
        res.status(response.statusCode).send(returnData)
      }
    }
  )
}
