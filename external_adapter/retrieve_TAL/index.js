var request = require('request')
var utf8 = require('utf8')

exports.retrieveTALData = (req, res) => {
  const url = req.body.data.url || ''
  const key = '4ac7c190db5942c8bf99fa49078c5376' // TODO: Possibly change this so that the key is stored and sent from the node operator
  const trainId = req.body.data.advertisedTrainIdent || ''
  const locationSig = req.body.data.locationSignature || ''
  const advertisedTimeAtLocation = req.body.data.advertisedTimeAtLocation || ''

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
        let returnData = {
          jobRunID: req.body.id,
          data: body,
        }
        console.log(returnData)
        res.status(response.statusCode).send(returnData)
      }
    }
  )
}
