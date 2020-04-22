const plotlib = require('nodeplotlib')
const OUTPUT_FILE_PATH = process.argv[2]
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
  trace1.x.push(key)
  trace1.y.push(rawData[key].minBlockDelay)
  trace2.x.push(key)
  trace2.y.push(rawData[key].avgBlockDelay)
  trace3.x.push(key)
  trace3.y.push(rawData[key].maxBlockDelay)
}

var data = [trace1, trace2, trace3]
const layout = {
  title: {
    text: 'Block Delay',
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
      text: 'Blocks',
    },
  },
}

plotlib.plot(data, layout)