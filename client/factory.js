import web3 from '../web3'
import TripFactory from '../build/contracts/TripFactory.json'
import address from '../address.json'

const instance = new web3.eth.Contract(TripFactory.abi, address.address)

export default instance
