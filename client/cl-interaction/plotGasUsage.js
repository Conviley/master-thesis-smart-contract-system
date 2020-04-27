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

    trace1.y.push(rawData[key].transactions[0].gasUsed)
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
        text: 'GAS',
      },
    },
  }

  plotlib.plot(data, layout)
}

if (require.main === module) {
  plotGasUsage(process.argv[2], process.argv[3])
} else {
  module.exports = plotGasUsage
}
