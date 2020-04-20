const plotlib = require('nodeplotlib')
const OUTPUT_FILE_PATH = './rawData.json'
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
  trace1.y.push(rawData[key].minTimeSpent)
  trace2.x.push(key)
  trace2.y.push(rawData[key].avgTimeSpent)
  trace3.x.push(key)
  trace3.y.push(rawData[key].maxTimeSpent)
}

var data = [trace1, trace2, trace3]
const layout = {
  title: {
    text: 'Time Elapsed',
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

plotlib.plot(data, layout)
