const TripFactory = artifacts.require('TripFactory')
const Trip = artifacts.require('Trip')

contract('TripFactory', async accounts => {
  let TripFactoryInstance

  beforeEach('setup contract for each test', async function() {
    TripFactoryInstance = await TripFactory.deployed()
  })

  it('Has valid manager', async () => {
    res = await TripFactoryInstance.managers.call(accounts[0])
    assert(res)
  })

  it('Manager can create a mock trip', async () => {
    await TripFactoryInstance.createMockTrip()
    let trips = await TripFactoryInstance.getTrips()
    assert.equal(trips.length, 1)
  })

  it('Non-manager cant create a mock trip', async () => {
    try {
      await TripFactoryInstance.createMockTrip({ from: accounts[1] })
      assert(false)
    } catch (err) {
      assert(err)
    }
  })

  it('Manager can create custom trip', async () => {
    await TripFactoryInstance.createTrip(10000, true, '545', '2020-02-20', 'Lp')
    let trips = await TripFactoryInstance.getTrips()
    assert.equal(trips.length, 2)
  })

  it('Add new manager', async () => {
    await TripFactoryInstance.addManager(accounts[1])
    res = await TripFactoryInstance.managers.call(accounts[1])
    assert(res)
  })
})

contract('Trip', async accounts => {
  let tripContract
  beforeEach('setup contract for each test', async function() {
    TripFactoryInstance = await TripFactory.deployed()
    await TripFactoryInstance.createMockTrip()
    let trips = await TripFactoryInstance.getTrips()
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
