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
})
