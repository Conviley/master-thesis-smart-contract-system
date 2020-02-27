pragma solidity ^0.5.1;

import "../node_modules/chainlink/v0.5/contracts/ChainlinkClient.sol"; // Comment out this line when testing in remix

// import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.5/ChainlinkClient.sol"; // Uncomment this line when testing in remix

contract TripFactory {
    address[] public trips;
    mapping(address => bool) public managers;

    modifier restricted() {
        require(managers[msg.sender]);
        _;
    }

    constructor() public {
        managers[msg.sender] = true;
    }

    function addManager(address newManagerAddress) public restricted {
        managers[newManagerAddress] = true;
    }

    function createMockTrip() public restricted {
        trips.push(
            address(
                new Trip(
                    msg.sender,
                    10000,
                    true,
                    "535",
                    "2020-02-25T16:25:00.000+01:00",
                    "av"
                )
            )
        );
    }

    function createTrip(
        uint256 price,
        bool isActive,
        string memory trainID,
        string memory advertisedTimeAtLocation,
        string memory locationSignature
    ) public restricted {
        trips.push(
            address(
                new Trip(
                    msg.sender,
                    price,
                    isActive,
                    trainID,
                    advertisedTimeAtLocation,
                    locationSignature
                )
            )
        );
    }

    function getTrips() public view returns (address[] memory) {
        return trips;
    }
}

contract Trip is ChainlinkClient {
    uint256 public passengerCount;
    uint256 public paybackRatio;
    uint256 public price;
    string public trainID;
    string public locationSignature;
    string public advertisedTimeAtLocation;
    mapping(address => uint256) public passengers;
    mapping(address => bool) public managers;
    bool public isRefundable;
    bool public isActive;

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

    uint256 private constant ORACLE_PAYMENT = 1 * LINK;
    string constant JSON_PARSE_PATH = "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation";

    bytes32 public timeAtLocation;

    modifier restricted() {
        require(managers[msg.sender]);
        _;
    }

    event RequestAlarmClock(bytes32 indexed requestId);

    event RequestTimeAtLocation(
        bytes32 indexed requestId,
        bytes32 indexed time
    );

    function addManager(address newManagerAddress) public restricted {
        managers[newManagerAddress] = true;
    }

    constructor(
        address manager,
        uint256 _price,
        bool _isActive,
        string memory _trainID,
        string memory _advertisedTimeAtLocation,
        string memory _locationSignature
    ) public {
        managers[manager] = true;
        price = _price;
        isActive = _isActive;
        trainID = _trainID;
        advertisedTimeAtLocation = _advertisedTimeAtLocation;
        locationSignature = _locationSignature;
        passengerCount = 0;

        setPublicChainlinkToken();

    }

    function bookTrip() public payable {
        require(msg.value == price);
        passengers[msg.sender] = price;
        passengerCount++;
    }

    function cancelTripBooking() public {
        uint256 amount = passengers[msg.sender];
        require(amount > 0);
        passengers[msg.sender] = 0;
        passengerCount--;
        msg.sender.transfer(amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function changePrice(uint256 _price) public restricted {
        price = _price;
    }

    function changeTrainId(string memory _trainID) public restricted {
        trainID = _trainID;
    }

    function changeLocationSignature(string memory _locationSignature)
        public
        restricted
    {
        locationSignature = _locationSignature;
    }

    function changeAdvertisedTimeAtLocation(
        string memory _advertisedTimeAtLocation
    ) public restricted {
        advertisedTimeAtLocation = _advertisedTimeAtLocation;
    }

    //function refund() public {}

    // param _requestTime must be specified in the format of a UNIX timestamp
    function requestAlarmClock(uint256 _requestTime) public restricted {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_CL_JOB_ID_ALARM_CLOCK,
            address(this),
            this.fulfillAlarmClock.selector
        );
        req.addUint("until", _requestTime);
        sendChainlinkRequestTo(ROP_CL_ADDR_ORACLE, req, ORACLE_PAYMENT);
    }

    function fulfillAlarmClock(bytes32 _requestId)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestAlarmClock(_requestId);
        requestTimeAtLocation();
    }

    function requestTimeAtLocation() private {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_DH_JOB_ID_GET_TAL,
            address(this),
            this.fulfillTimeAtLocation.selector
        );
        req.add("advertisedTrainIdent", trainID);
        req.add("locationSignature", locationSignature);
        req.add("advertisedTimeAtLocation", advertisedTimeAtLocation);
        req.add("path", JSON_PARSE_PATH);
        sendChainlinkRequestTo(ROP_DH_ADDR_ORACLE, req, ORACLE_PAYMENT);
    }

    function fulfillTimeAtLocation(bytes32 _requestId, bytes32 _time)
        public
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestTimeAtLocation(_requestId, _time);
        timeAtLocation = _time;
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

}
