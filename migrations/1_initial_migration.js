const DeRail = artifacts.require('DeRail')
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
const { Oracle } = require('@chainlink/contracts/truffle/v0.5/Oracle')

module.exports = (deployer, network, [defaultAccount]) => {
  // Local (development) networks need their own deployment of the LINK
  // token and the Oracle contract
  if (!network.startsWith('live')) {
    LinkToken.setProvider(deployer.provider)
    Oracle.setProvider(deployer.provider)

    deployer.deploy(LinkToken, { from: defaultAccount }).then((link) => {
      return deployer
        .deploy(Oracle, link.address, { from: defaultAccount })
        .then(() => {
          return deployer.deploy(DeRail, link.address)
        })
    })
  } else {
    // For live networks, use the 0 address to allow the ChainlinkRegistry
    // contract automatically retrieve the correct address for you
    deployer.deploy(DeRail, '0x0000000000000000000000000000000000000000')
  }
}
