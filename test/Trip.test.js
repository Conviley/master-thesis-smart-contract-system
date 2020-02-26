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
    let trips = await DeRailInstance.getTrips()
    assert.equal(trips.length, 1)
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
    await DeRailInstance.createTrip(10000, true, '545', '2020-02-20', 'Lp')
    let trips = await DeRailInstance.getTrips()
    assert.equal(trips.length, 2)
  })

  it('Add new manager', async () => {
    await DeRailInstance.addManager(accounts[1])
    res = await DeRailInstance.managers.call(accounts[1])
    assert(res)
  })
})

contract('Trip', async accounts => {
  let tripContract
  beforeEach('setup contract for each test', async function() {
    DeRailInstance = await DeRail.deployed()
    await DeRailInstance.createMockTrip()
    let trips = await DeRailInstance.getTrips()
    tripContract = await Trip.at(trips[0])
  })

  it('User can book trip', async () => {
    await tripContract.bookTrip({ from: accounts[0], value: 10000 })
    let balance = await tripContract.getBalance()
    assert.equal(balance.words[0], 10000)
  })

  it('Trip contract has a manager', async () => {
    res = await tripContract.managers.call(accounts[0])
    assert(res)
  })
})
