const { oracle } = require('@chainlink/test-helpers')
const { expectRevert, time } = require('openzeppelin-test-helpers')

contract('DeRail', async accounts => {
  const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
  const { Oracle } = require('@chainlink/contracts/truffle/v0.5/Oracle')
  const DeRail = artifacts.require('DeRail')

  const defaultAccount = accounts[0]
  const oracleNode = accounts[1]
  const stranger = accounts[2]
  const consumer = accounts[3]

  let DeRailInstance
  let link, oc, cc
  beforeEach('setup contract for each test', async function() {
    link = await LinkToken.new({ from: defaultAccount })
    oc = await Oracle.new(link.address, { from: defaultAccount })
    DeRailInstance = await DeRail.new(link.address, { from: defaultAccount })
    await oc.setFulfillmentPermission(oracleNode, true, {
      from: defaultAccount,
    })
  })

  describe('#Non Chainlink Related tests', () => {
    it('Has valid manager', async () => {
      res = await DeRailInstance.managers.call(defaultAccount)
      assert(res)
    })

    it('Manager can create a mock trip', async () => {
      await DeRailInstance.createMockTrip({ from: defaultAccount })
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
        'cst',
        'Nr',
        '2020-02-20',
        545,
        0,
        10000,
        1,
        {
          from: defaultAccount,
        }
      )
      let tripCount = await DeRailInstance.getTripCount()
      assert.equal(tripCount, 1)
    })

    it('Add new manager', async () => {
      await DeRailInstance.addManager(accounts[1])
      res = await DeRailInstance.managers.call(accounts[1])
      assert(res)
    })

    it('User can book trip', async () => {
      await DeRailInstance.createMockTrip()
      await DeRailInstance.bookTrip(1, {
        from: accounts[0],
        value: web3.utils.toWei('1'),
      })
      let trip = await DeRailInstance.trips.call(1)
      assert.equal(trip.passengerCount, 1)
    })

    it('Remove a trip', async () => {
      await DeRailInstance.createMockTrip()
      await DeRailInstance.remTrip(1)
      let trip = await DeRailInstance.trips.call(0)
      let tripCount = DeRailInstance.getTripCount()
      assert(tripCount, 0)
    })

    it('Update trip price', async () => {
      await DeRailInstance.createMockTrip()
      await DeRailInstance.updateTripPrice(1, web3.utils.toWei('2'))
      let trip = await DeRailInstance.trips.call(1)
      assert.equal(trip.price, web3.utils.toWei('2'))
    })

    it('Cancel booking', async () => {
      await DeRailInstance.createMockTrip()
      let balancePrior = await web3.eth.getBalance(accounts[1])
      await DeRailInstance.bookTrip(1, {
        from: accounts[1],
        value: web3.utils.toWei('1'),
      })
      await DeRailInstance.cancelBooking(1, { from: accounts[1] })
      let balanceAfter = await web3.eth.getBalance(accounts[1])
      assert(balancePrior - balanceAfter < web3.utils.toWei('1'))
    })

    it('Agregate TAL', async () => {
      await DeRailInstance.createTrip(
        'cst',
        'Nr',
        '2020-02-20',
        545,
        0,
        10000,
        1,
        {
          from: defaultAccount,
        }
      )
      for (var i = 0; i < 3; i++) {
        await DeRailInstance.addSubmission(i, 1, { from: defaultAccount })
      }
      await DeRailInstance.updateTAL(1, { from: defaultAccount })
      let trip = await DeRailInstance.trips.call(1)
      assert(trip.timeAtLocation == 1)
    })
  })

  describe('#Chainlink tests', () => {
    context('Contract not funded with link', () => {
      it('reverts when requesting alarm clock', async () => {
        await expectRevert.unspecified(
          DeRailInstance.requestAlarmClock(1583150400, 1)
        )
      })
    })
  })
})
