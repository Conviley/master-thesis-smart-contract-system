pragma solidity ^0.5.1;

import "./HitchensUnorderedKeySet.sol";
import "@chainlink/contracts/src/v0.5/ChainlinkClient.sol"; // Comment out this line when testing in remix
//import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.5/ChainlinkClient.sol"; // Uncomment this line when testing in remix

contract DeRail is ChainlinkClient{
    using HitchensUnorderedKeySetLib for HitchensUnorderedKeySetLib.Set;
    HitchensUnorderedKeySetLib.Set tripSet;

    struct Trip {
        uint passengerCount;
        uint paybackRatio; // NOTE: This is really (paybackRatio*100) due to solidity's inability to handle floats.
        uint price;
        uint trainID;
        string fromLocationSignature;
        string toLocationSignature;
        string advertisedTimeAtLocation;
        bytes32 timeAtLocation;
        mapping(address => uint) passengers;
        bool isActive;
        uint shortTrip;
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
    bytes32 private constant ROP_DH_JOB_ID_CALC_PBR = bytes32(
        "99884369de4745bfa3025d863932c698"
    );
    uint private constant ORACLE_PAYMENT = 1 * LINK;
    string constant JSON_PARSE_PATH = "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation";

    string private constant URL_TRAFIKVERKET = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
    string private constant URL_PASTEBIN_SJ_DELAY_TEST = 'https://pastebin.com/raw/bmcgBYCc';

    uint private tripKey = 1;
    uint public activeTripKey;
    mapping(address => bool) public managers;
    mapping(uint => Trip) public trips;

    event LogNewTrip(
        address sender,
        uint key,
        uint passengerCount,
        uint paybackRatio,
        uint price,
        uint trainID,
        string fromLocationSignature,
        string toLocationSignature,
        string advertisedTimeAtLocation,
        bytes32 timeAtLocation,
        bool isActive,
        uint shortTrip
    );
    event LogUpdateTripPrice(address sender, uint key, uint price);
    event LogRemTrip(address sender, uint key);
    event LogNewTripPassenger(address passengerAddressr, uint key, uint price);

    event RequestAlarmClock(bytes32 indexed requestId);
    event RequestTimeAtLocation(
        bytes32 indexed requestId,
        bytes32 indexed time
    );
    event RequestPaybackRatio(bytes32 indexed _requestId, uint _paybackRatio);

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
        uint key = tripKey;
        Trip memory newTrip = Trip({
            passengerCount: 0,
            paybackRatio: 0,
            price: 1 ether,
            trainID: 545,
            fromLocationSignature: "cst",
            toLocationSignature: "Nr",
            advertisedTimeAtLocation: "2020-02-18",
            timeAtLocation: 0x0,
            isActive: true,
            shortTrip: 1
        });
        tripSet.insert(key);
        trips[key] = newTrip;
        tripKey++;
        emit LogNewTrip(msg.sender, key, newTrip.passengerCount, newTrip.paybackRatio,
            newTrip.price, newTrip.trainID, newTrip.fromLocationSignature, newTrip.toLocationSignature,
            newTrip.advertisedTimeAtLocation, newTrip.timeAtLocation, newTrip.isActive, newTrip.shortTrip);
    }

    function createTrip(
        uint _trainID,
        string memory _fromLocationSignature,
        string memory _toLocationSignature,
        string memory _advertisedTimeAtLocation,
        uint _price,
        uint _shortTrip
    ) public {
        uint key = tripKey;
        Trip memory newTrip = Trip({
            passengerCount: 0,
            paybackRatio: 0,
            price: _price,
            trainID: _trainID,
            fromLocationSignature: _fromLocationSignature,
            toLocationSignature: _toLocationSignature,
            advertisedTimeAtLocation: _advertisedTimeAtLocation,
            timeAtLocation: 0x0,
            isActive: true,
            shortTrip: _shortTrip
        });
        tripSet.insert(key);
        trips[key] = newTrip;
        tripKey++;
        emit LogNewTrip(msg.sender, key, newTrip.passengerCount, newTrip.paybackRatio,
            newTrip.price, newTrip.trainID, newTrip.fromLocationSignature, newTrip.toLocationSignature,
            newTrip.advertisedTimeAtLocation, newTrip.timeAtLocation, newTrip.isActive, newTrip.shortTrip);
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

    function getTripKey() external view returns(uint) {
        return tripKey;
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
        req.add("url", URL_PASTEBIN_SJ_DELAY_TEST);
        req.addUint("advertisedTrainIdent", trip.trainID);
        req.add("locationSignature", trip.toLocationSignature);
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
        requestPaybackRatio();
    }
    
    function requestPaybackRatio() public {
        // TODO: Both requestTimeAtLocation and this function retrieves the same data from the same data source. Fix this redundancy.
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_DH_JOB_ID_CALC_PBR,
            address(this),
            this.fulfillPaybackRatio.selector
        );
        Trip storage trip = trips[activeTripKey];
        bytes memory tal = toBytes(trip.timeAtLocation);
        req.add("url", URL_PASTEBIN_SJ_DELAY_TEST);
        req.add("advertisedTimeAtLocation", trip.advertisedTimeAtLocation);
        req.addBytes("timeAtLocation", tal);
        req.addUint("shortTrip", trip.shortTrip);
        req.add("path", "paybackRatio");
        sendChainlinkRequestTo(ROP_DH_ADDR_ORACLE, req, ORACLE_PAYMENT);
    }
    
    function toBytes(bytes32 _data) public pure returns (bytes memory) {
        // This function does not work as expected...
        return abi.encodePacked(_data);
    }

    function fulfillPaybackRatio(bytes32 _requestId, uint _paybackRatio)
        external
        recordChainlinkFulfillment(_requestId)
    {
        Trip storage trip = trips[activeTripKey];
        trip.paybackRatio = _paybackRatio;
        emit RequestPaybackRatio(_requestId, _paybackRatio);
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