const plotlib = require('nodeplotlib')

function plotTimeElapsed(OUTPUT_FILE_PATH, titleText) {
  const rawData = require(OUTPUT_FILE_PATH)

  var trace1 = {
    x: [],
    y: [],
    name: 'Min Elapsed Time',
    type: 'bar',
  }

  var trace2 = {
    x: [],
    y: [],
    name: 'Avg Elapsed TIme',
    type: 'bar',
  }

  var trace3 = {
    x: [],
    y: [],
    name: 'Max Elapsed Time',
    type: 'bar',
  }

  for (var key in rawData) {
    trace1.x.push(key)
    trace1.y.push(rawData[key].minElapsedTime)
    trace2.x.push(key)
    trace2.y.push(rawData[key].avgElapsedTime)
    trace3.x.push(key)
    trace3.y.push(rawData[key].maxElapsedTime)
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
        text: 'Number of Transactions',
      },
    },
    yaxis: {
      title: {
        text: 'Seconds[s]',
      },
    },
  }
  console.log('plotting time elapsed...', OUTPUT_FILE_PATH)

  plotlib.plot(data, layout)
  /*plotlib.downloadImage('container', {
    format: 'png',
    width: 800,
    height: 600,
    filename: 'newplot',
  })*/
}

if (require.main === module) {
  plotTimeElapsed(process.argv[2], process.argv[3])
} else {
  module.exports = plotTimeElapsed
}
