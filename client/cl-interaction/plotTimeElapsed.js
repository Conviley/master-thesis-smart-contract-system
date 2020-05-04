const plotlib = require('nodeplotlib')

function plotTimeElapsed(OUTPUT_FILE_PATH, titleText) {
  const rawData = require(OUTPUT_FILE_PATH)

  var trace1 = {
    x: [],
    y: [],
    name: 'Time Used',
    type: 'box',
    marker: {
      color: 'rgb(8,81,156)',
      outliercolor: 'rgba(219, 64, 82, 0.6)',
      line: {
        outliercolor: 'rgba(219, 64, 82, 1.0)',
        outlierwidth: 2,
      },
    },
    boxpoints: 'suspectedoutliers',

    boxmean: true,
  }

  for (var key in rawData) {
    rawData[key]['transactions'].forEach((tx) => {
      trace1.x.push(key)
      trace1.y.push(tx.elapsedTime)
    })
  }
  var data = [trace1]
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
      zeroline: false,
    },
    boxmode: 'group',
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
