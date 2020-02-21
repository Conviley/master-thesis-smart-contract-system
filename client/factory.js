import web3 from '../web3'
import TripFactory from '../build/contracts/TripFactory.json'

const instance = new web3.eth.Contract(
  TripFactory.abi,
  '0xdc67FD3f416151B9723d1Dc6f54b2465Be2E2158'
)

export default instance
