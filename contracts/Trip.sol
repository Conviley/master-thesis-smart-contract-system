pragma solidity ^0.5.1;

import "./HitchensUnorderedKeySet.sol";

import "chainlink/v0.5/contracts/ChainlinkClient.sol"; // Comment out this line when testing in remix

//import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.5/ChainlinkClient.sol"; // Uncomment this line when testing in remix

contract DeRail is ChainlinkClient{
    using HitchensUnorderedKeySetLib for HitchensUnorderedKeySetLib.Set;
    HitchensUnorderedKeySetLib.Set tripSet;
    
    struct Trip {
        uint tripID;
        uint passengerCount;
        uint paybackRatio;
        uint price;
        string trainID;
        string locationSignature;
        string advertisedTimeAtLocation;
        bytes32 timeAtLocation;
        mapping(address => uint) passengers;
        bool isRefundable;
        bool isActive;

    }
    
    modifier restricted() {
        require(managers[msg.sender], "msg.sender is not a manager!");
        _;
    }
    
    modifier requireTrip(uint key) {
        require(tripSet.exists(key), "Can't get a widget that doesn't exist.");
        _;
    }

    mapping(address => bool) public managers;
    mapping(uint => Trip) public trips;
    
    address constant CHAINLINK_ORACLE_ROPSTEN = 0xc99B3D447826532722E41bc36e644ba3479E4365;
    
    bytes32 constant JOB_ID_GET_PATH = bytes32(
        "76ca51361e4e444f8a9b18ae350a5725"
    ); //same as using stringToBytes32("76ca51361e4e444f8a9b18ae350a5725")
    bytes32 constant JOB_ID_POST_PATH = bytes32(
        "897479ba429445e4a89be90cfcd52a51"
    );
    bytes32 constant JOB_ID_ALARM_CLOCK = bytes32(
        "2ebb1c1a4b1e4229adac24ee0b5f784f"
    );
    uint private constant ORACLE_PAYMENT = 1 * LINK;

    uint public activeTripKey;
    
    event LogNewTrip(
        address sender,
        uint key,
        uint tripID,
        uint passengerCount,
        uint paybackRatio,
        uint price,
        string trainID,
        string locationSignature,
        string advertisedTimeAtLocation,
        bytes32 timeAtLocation,
        bool isRefundable,
        bool isActive);
    event LogUpdateTripPrice(address sender, uint key, uint price);    
    event LogRemTrip(address sender, uint key);
    event LogNewTripPassenger(address passengerAddressr, uint key, uint price);
    
    event RequestAlarmClock(bytes32 indexed requestId);
    event RequestTimeAtLocation(
        bytes32 indexed requestId,
        bytes32 indexed time
    );
    
    constructor() public {
        managers[msg.sender] = true;
        setPublicChainlinkToken();
    }
    
    function addManager(address newManagerAddress) external restricted {
        managers[newManagerAddress] = true;
    }
    
    function createMockTripHitch() external restricted{
        uint key = getTripCount();
        Trip memory newTrip = Trip({
            tripID: key,
            passengerCount: 0,
            paybackRatio: 0,
            price: 1 ether,
            trainID: "545",
            locationSignature: "Nr",
            advertisedTimeAtLocation: "2020-02-18",
            timeAtLocation: 0x0,
            isRefundable: false,
            isActive: true
        });
        tripSet.insert(key);
        trips[key] = newTrip;
        
        setChainlinkOracle(CHAINLINK_ORACLE_ROPSTEN);
        emit LogNewTrip(msg.sender, key, key, 0, 0, 10000, "545", "Nr", "2020-02-18",0x0, false, true);
    }
    
    function remTrip(uint key) external restricted {
        tripSet.remove(key); // Note that this will fail automatically if the key doesn't exist
        delete trips[key];
        emit LogRemTrip(msg.sender, key);
    }
    
    function getTrip(uint key) external view returns(uint, uint, uint, uint, string memory, string memory, string memory, bytes32, bool, bool ) {
        require(tripSet.exists(key), "Can't get a widget that doesn't exist.");
        Trip storage trip = trips[key];
        return (trip.tripID, trip.passengerCount, trip.paybackRatio, trip.price, trip.trainID, trip.locationSignature, trip.advertisedTimeAtLocation,trip.timeAtLocation, trip.isRefundable, trip.isActive);
    }
    
    function getTripCount() public view returns(uint count) {
        return tripSet.count();
    }
    
    function updateTripPrice(uint key, uint price) external restricted requireTrip(key){
        Trip storage trip = trips[key];
        trip.price = price;
        emit LogUpdateTripPrice(msg.sender, key, price);
    }
    
    function bookTrip(uint key) external payable requireTrip(key){
        Trip storage trip = trips[key];
        require(msg.value == trip.price, "User did not pay the exact price of the trip");
        trip.passengers[msg.sender] = trip.price;
        trip.passengerCount++;
        emit LogNewTripPassenger(msg.sender, key, trip.price);
    }
    
    function cancelBooking(uint key) external {
        Trip storage trip = trips[key];
        require(trip.passengers[msg.sender] > 0, "User is not a passenger of this trip!");
        trip.passengers[msg.sender] = 0;
        trip.passengerCount--;
        msg.sender.call.value(trip.price)("");
    }
    
    // CHAINLINK FUNCTIONS
    
    // param _requestTime must be specified in the format of a UNIX timestamp
    function requestAlarmClock(uint256 _requestTime) public restricted {
        Chainlink.Request memory req = buildChainlinkRequest(
            JOB_ID_ALARM_CLOCK,
            address(this),
            this.fulfillAlarmClock.selector
        );
        req.addUint("until", _requestTime);
        sendChainlinkRequest(req, ORACLE_PAYMENT);
    }

    function fulfillAlarmClock(bytes32 _requestId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestAlarmClock(_requestId);
        requestTimeAtLocation();
    }

    function requestTimeAtLocation() public {
        Chainlink.Request memory req = buildChainlinkRequest(
            JOB_ID_GET_PATH,
            address(this),
            this.fulfillTimeAtLocation.selector
        );
        req.add("get", "https://pastebin.com/raw/MNvNvVQ3"); //This is a test-url. It should be exchanged with 'https://api.trafikinfo.trafikverket.se/v2/data.json'.
        req.add("path", "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation");
        sendChainlinkRequest(req, ORACLE_PAYMENT);
    }

    function fulfillTimeAtLocation(bytes32 _requestId, bytes32 _time)
        public
        recordChainlinkFulfillment(_requestId)
    {
        Trip storage trip = trips[activeTripKey];
        trip.timeAtLocation = _time;
        emit RequestTimeAtLocation(_requestId, _time);
        
    }

    function getChainlinkToken() public view returns (address) {
        return chainlinkTokenAddress();
    }

    function withdrawLink() public restricted {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(
            link.transfer(msg.sender, link.balanceOf(address(this))),
            "Unable to transfer"
        );
    }
    
    // TEMPORARY FUNCTIONS
    function setActiveKey(uint key) public {
        activeTripKey = key;
    }
}