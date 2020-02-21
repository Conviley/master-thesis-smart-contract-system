const TripFactory = artifacts.require('TripFactory')

module.exports = function(deployer) {
  deployer.deploy(TripFactory)
}
