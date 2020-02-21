import Web3 from 'web3'
import address from './address.json'

import infura from './infura.json'

let web3

if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
  // We are in the browser and metamask is running.
  web3 = new Web3(window.web3.currentProvider)
} else {
  //We are on the server OR the user is not running metamask
  console.log(address.address)
  const provider = new Web3.providers.HttpProvider(infura.endpoint)
  web3 = new Web3(provider)
}

export default web3
