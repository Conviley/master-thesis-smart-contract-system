const plotlib = require('nodeplotlib')

function plotGasUsage(OUTPUT_FILE_PATH, titleText) {
  const rawData = require(OUTPUT_FILE_PATH)

  var trace1 = {
    x: [],
    y: [],
    name: 'Gas Usage',
    type: 'line',
  }

  for (var key in rawData) {
    trace1.x.push(key)
    trace1.y.push(
      rawData[key].transactions[rawData[key].transactions.length - 1].gasUsed
    )
  }

  var data = [trace1]
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
        text: 'Gas',
      },
      /*       linecolor: 'black',
      linewidth: 2,
      mirror: true, */
    },
  }

  plotlib.plot(data, layout)
}

if (require.main === module) {
  plotGasUsage(process.argv[2], process.argv[3])
} else {
  module.exports = plotGasUsage
}
