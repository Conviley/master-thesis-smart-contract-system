const plotlib = require('nodeplotlib')

function plotTimeElapsed(OUTPUT_FILE_PATH, titleText) {
  const rawData = require(OUTPUT_FILE_PATH)

  var data = []
  var i = 0
  for (var key in rawData) {
    if (key < 310) {
      var trace = {
        y: [],
        name: key + ' ‎',
        type: 'box',
        marker: {
          color: 'rgb(8,81,156)',
          outliercolor: 'rgba(219, 64, 82, 0.6)',
          line: {
            outliercolor: 'rgba(219, 64, 82, 1.0)',
            outlierwidth: 2,
          },
        },
        boxpoints: 'all',
        jitter: 1,
        width: 0.5,
        boxgap: 0,
        boxgroupgap: 0,
      }
      rawData[key]['transactions'].forEach((tx) => {
        if (tx.elapsedTime < 1200) {
          trace.y.push(tx.elapsedTime)
        }
      })
      data.push(trace)
    }
  }

  //var data = [trace1]
  const layout = {
    /*     title: {
      text: titleText,
      xref: 'paper',
      x: 0.05,
    }, */
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 20,
      pad: 4,
    },
    showlegend: false,
    height: 900,
    xaxis: {
      title: {
        text: 'Submissions',
      },
      /*       linecolor: 'black',
      linewidth: 2,
      mirror: true, */
    },
    yaxis: {
      title: {
        text: 'Seconds[s]',
      },
      zeroline: false,
    },
    boxmode: 'group',
    /*     linecolor: 'black',
    linewidth: 2,
    mirror: true, */
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
