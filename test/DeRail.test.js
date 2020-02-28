const DeRail = artifacts.require('DeRail')

contract('DeRail', async accounts => {
  let DeRailInstance

  beforeEach('setup contract for each test', async function() {
    DeRailInstance = await DeRail.deployed()
  })

  it('Has valid manager', async () => {
    res = await DeRailInstance.managers.call(accounts[0])
    assert(res)
  })

  it('Manager can create a mock trip', async () => {
    await DeRailInstance.createMockTrip()
    let tripCount = await DeRailInstance.getTripCount()
    assert.equal(tripCount, 1)
  })

  it('Non-manager cant create a mock trip', async () => {
    try {
      await DeRailInstance.createMockTrip({ from: accounts[1] })
      assert(false)
    } catch (err) {
      assert(err)
    }
  })

  it('Manager can create custom trip', async () => {
    await DeRailInstance.createTrip(
      0,
      0,
      10000,
      '545',
      'Nr',
      '2020-02-20',
      web3.utils.fromAscii(0),
      false,
      true
    )
    let tripCount = await DeRailInstance.getTripCount()
    assert.equal(tripCount, 2)
  })

  it('Add new manager', async () => {
    await DeRailInstance.addManager(accounts[1])
    res = await DeRailInstance.managers.call(accounts[1])
    assert(res)
  })

  it('User can book trip', async () => {
    await DeRailInstance.createMockTrip()
    await DeRailInstance.bookTrip(0, {
      from: accounts[0],
      value: web3.utils.toWei('1'),
    })
    let trip = await DeRailInstance.trips.call(0)
    assert.equal(trip.passengerCount, 1)
  })

  it('Remove a trip', async () => {
    await DeRailInstance.remTrip(0)
    let trip = await DeRailInstance.trips.call(1)
    let tripCount = DeRailInstance.getTripCount()
    assert(tripCount, 1)
  })

  it('Update trip price', async () => {
    await DeRailInstance.updateTripPrice(1, web3.utils.toWei('2'))
    let trip = await DeRailInstance.trips.call(1)
    assert.equal(trip.price, web3.utils.toWei('2'))
  })

  it('Cancel booking', async () => {
    let balancePrior = await web3.eth.getBalance(accounts[1])
    await DeRailInstance.bookTrip(1, {
      from: accounts[1],
      value: web3.utils.toWei('2'),
    })
    await DeRailInstance.cancelBooking(1, { from: accounts[1] })
    let balanceAfter = await web3.eth.getBalance(accounts[1])
    assert(balancePrior - balanceAfter < web3.utils.toWei('2'))
  })
})
