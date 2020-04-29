const fs = require('fs-extra')
const updateEntryValues = require('./outputResults.js').updateEntryValues

async function mergeJson(inputPath1, inputPath2, outputFilePath) {
  var j1 = await fs.readJson(inputPath1)
  var j2 = await fs.readJson(inputPath2)

  for (var txCount in j2) {
    j1[txCount]['minElapsedTime'] =
      j1[txCount]['transactions'][0]['elapsedTime'] +
      j2[txCount]['transactions'][0]['elapsedTime']
    j1[txCount]['maxElapsedTime'] =
      j1[txCount]['transactions'][0]['elapsedTime'] +
      j2[txCount]['transactions'][0]['elapsedTime']
    j1[txCount]['minBlockDelay'] =
      j1[txCount]['transactions'][0]['blockDelay'] +
      j2[txCount]['transactions'][0]['blockDelay']
    j1[txCount]['maxBlockDelay'] =
      j1[txCount]['transactions'][0]['blockDelay'] +
      j2[txCount]['transactions'][0]['blockDelay']

    for (var i = 0; i < j2[txCount]['transactions'].length; i++) {
      let j2tx = j2[txCount]['transactions'][i]
      let j1tx = j1[txCount]['transactions'][i]
      for (var key in j2tx) {
        switch (key) {
          case 'elapsedTime':
            j1tx[key] += j2tx[key]
            break
          case 'gasUsed':
            j1tx[key] += j2tx[key]
            break
          case 'blockDelay':
            j1tx[key] += j2tx[key]
            break
        }
      }
    }
    updateEntryValues(j1[txCount])
  }
  await fs.writeJson(outputFilePath, j1)
}

if (require.main === module) {
  mergeJson('./p1Submissions.json', 'p1Aggregations.json', 'testMerge.json')
} else {
  module.exports = mergeJson
}
