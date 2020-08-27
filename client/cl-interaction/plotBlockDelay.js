const plotlib = require('nodeplotlib')

function plotBlockDelay(OUTPUT_FILE_PATH, titleText) {
  const rawData = require(OUTPUT_FILE_PATH)

  var trace1 = {
    x: [],
    y: [],
    name: 'Min Block Delay',
    type: 'bar',
  }

  var trace2 = {
    x: [],
    y: [],
    name: 'Avg Block Delay',
    type: 'bar',
  }

  var trace3 = {
    x: [],
    y: [],
    name: 'Max Block Delay',
    type: 'bar',
  }

  for (var key in rawData) {
    trace1.x.push(key.toString() + ' ‎')
    trace1.y.push(rawData[key].minBlockDelay)
    trace2.x.push(key.toString() + ' ‎')
    trace2.y.push(rawData[key].avgBlockDelay)
    trace3.x.push(key.toString() + ' ‎')
    trace3.y.push(rawData[key].maxBlockDelay)
  }

  var data = [trace1, trace2, trace3]
  const layout = {
    title: {
      text: titleText,
      xref: 'paper',
      x: 0.05,
    },
    xaxis: {
      title: {
        text: 'Number of Submissions',
      },
    },
    yaxis: {
      title: {
        text: 'Blocks',
      },
    },
  }
  console.log('plotting block delay...')

  plotlib.plot(data, layout)
}

if (require.main === module) {
  plotBlockDelay(process.argv[2], process.argv[3])
} else {
  module.exports = plotBlockDelay
}
