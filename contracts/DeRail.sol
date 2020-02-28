pragma solidity ^0.5.1;

import "./HitchensUnorderedKeySet.sol";
import "@chainlink/contracts/src/v0.5/ChainlinkClient.sol"; // Comment out this line when testing in remix
// import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.5/ChainlinkClient.sol"; // Uncomment this line when testing in remix

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
        require(tripSet.exists(key), "Can't get a trip that doesn't exist.");
        _;
    }

    // ROP = Ropsten network, CL = Chainlink node, DH = Daniel's node
    address private constant ROP_CL_ADDR_ORACLE = 0xc99B3D447826532722E41bc36e644ba3479E4365;
    address private constant ROP_DH_ADDR_ORACLE = 0x7b64ED98259D2A7C520aAAa92D55D3887A2A2d9c;

    bytes32 private constant ROP_CL_JOB_ID_ALARM_CLOCK = bytes32(
        "2ebb1c1a4b1e4229adac24ee0b5f784f"
    );
    bytes32 private constant ROP_CL_JOB_ID_GET_PATH = bytes32(
        "76ca51361e4e444f8a9b18ae350a5725"
    );
    bytes32 private constant ROP_DH_JOB_ID_GET_PATH = bytes32(
        "747ae93e99b84840889e53920c5cecdb"
    );
    bytes32 private constant ROP_DH_JOB_ID_GET_TAL = bytes32(
        "ac6bc509972b43f1ae85c738559384bd"
    );
    uint private constant ORACLE_PAYMENT = 1 * LINK;
    string constant JSON_PARSE_PATH = "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation";

    uint public activeTripKey;
    mapping(address => bool) public managers;
    mapping(uint => Trip) public trips;

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
        bool isActive
    );
    event LogUpdateTripPrice(address sender, uint key, uint price);
    event LogRemTrip(address sender, uint key);
    event LogNewTripPassenger(address passengerAddressr, uint key, uint price);

    event RequestAlarmClock(bytes32 indexed requestId);
    event RequestTimeAtLocation(
        bytes32 indexed requestId,
        bytes32 indexed time
    );

    constructor(address _link) public {
        managers[msg.sender] = true;
        if (_link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_link);
    }
    }

    function addManager(address newManagerAddress) external restricted {
        managers[newManagerAddress] = true;
    }

    function createMockTrip() external restricted{
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

        emit LogNewTrip(msg.sender, key, key, 0, 0, 10000, "545", "Nr", "2020-02-18", 0x0, false, true);
    }

    function createTrip(
        uint _passengerCount,
        uint _paybackRatio,
        uint _price,
        string memory _trainID,
        string memory _locationSignature,
        string memory _advertisedTimeAtLocation,
        bytes32 _timeAtLocation,
        bool _isRefundable,
        bool _isActive
    ) public {
        uint key = getTripCount();
        Trip memory newTrip = Trip({
            tripID: key,
            passengerCount: _passengerCount,
            paybackRatio: _paybackRatio,
            price: _price,
            trainID: _trainID,
            locationSignature: _locationSignature,
            advertisedTimeAtLocation: _advertisedTimeAtLocation,
            timeAtLocation: _timeAtLocation,
            isRefundable: _isRefundable,
            isActive: _isActive
        });
        tripSet.insert(key);
        trips[key] = newTrip;

        emit LogNewTrip(
            msg.sender,
            key,
            key,
            _passengerCount,
            _paybackRatio,
            _price,
            _trainID,
            _locationSignature,
            _advertisedTimeAtLocation,
            _timeAtLocation,
            _isRefundable,
            _isActive
        );
    }

    function remTrip(uint key) external restricted requireTrip(key){
        // TODO return money to passengers if trip is active
        tripSet.remove(key); // Note that this will fail automatically if the key doesn't exist
        delete trips[key];
        emit LogRemTrip(msg.sender, key);
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

    function cancelBooking(uint key) external requireTrip(key){
        Trip storage trip = trips[key];
        require(trip.passengers[msg.sender] > 0, "User is not a passenger of this trip!");
        trip.passengers[msg.sender] = 0;
        trip.passengerCount--;
        msg.sender.call.value(trip.price)("");
    }

    // CHAINLINK FUNCTIONS

    // param _requestTime must be specified in the format of a UNIX timestamp
    function requestAlarmClock(uint256 _requestTime) external restricted {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_CL_JOB_ID_ALARM_CLOCK,
            address(this),
            this.fulfillAlarmClock.selector
        );
        req.addUint("until", _requestTime);
        sendChainlinkRequestTo(ROP_CL_ADDR_ORACLE, req, ORACLE_PAYMENT);
    }

    function fulfillAlarmClock(bytes32 _requestId)
        external
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestAlarmClock(_requestId);
        requestTimeAtLocation();
    }

    function requestTimeAtLocation() public {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_DH_JOB_ID_GET_TAL,
            address(this),
            this.fulfillTimeAtLocation.selector
        );
        Trip storage trip = trips[activeTripKey];
        req.add("advertisedTrainIdent", trip.trainID);
        req.add("locationSignature", trip.locationSignature);
        req.add("advertisedTimeAtLocation", trip.advertisedTimeAtLocation);
        req.add("path", JSON_PARSE_PATH);
        sendChainlinkRequestTo(ROP_DH_ADDR_ORACLE, req, ORACLE_PAYMENT);
    }

    function fulfillTimeAtLocation(bytes32 _requestId, bytes32 _time)
        external
        recordChainlinkFulfillment(_requestId)
    {
        Trip storage trip = trips[activeTripKey];
        trip.timeAtLocation = _time;
        emit RequestTimeAtLocation(_requestId, _time);
    }

    function getChainlinkToken() external view returns (address) {
        return chainlinkTokenAddress();
    }

    function withdrawLink() external restricted {
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