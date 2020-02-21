pragma solidity ^0.6.2;

import "chainlink/v0.6/contracts/ChainlinkClient.sol";

contract TripFactory {
    address[] public trips;
    mapping(address=>bool) public managers;

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
        trips.push(address(
            new Trip(
                msg.sender,
                10000,
                true,
                "545",
                "2020-02-18",
                "Nr",
                0xc99B3D447826532722E41bc36e644ba3479E4365)
            ));
    }

    function createTrip(uint price, bool isActive, string memory trainID, string memory advertisedTimeAtLocation, string memory locationSignature, address oracle) public restricted {
        trips.push(address(
            new Trip(
                msg.sender,
                price,
                isActive,
                trainID,
                advertisedTimeAtLocation,
                locationSignature,
                oracle)
            ));
    }

    function getTrips() public view returns (address[] memory){
        return trips;
    }
}

contract Trip is ChainlinkClient {
    uint public passengerCount;
    uint public paybackRatio;
    uint public price;
    string public trainID;
    string public locationSignature;
    string public advertisedTimeAtLocation;
    mapping(address=>uint) public passengers;
    mapping(address=>bool) public managers;
    bool public isRefundable;
    bool public isActive;

    bytes32 constant JOB_ID_GET_PATH = bytes32("76ca51361e4e444f8a9b18ae350a5725"); //same as using stringToBytes32("76ca51361e4e444f8a9b18ae350a5725")
    bytes32 constant JOB_ID_POST_PATH = bytes32("897479ba429445e4a89be90cfcd52a51");
    uint256 constant private ORACLE_PAYMENT = 1 * LINK;

    bytes32 public timeAtLocation;

    modifier restricted() {
        require(managers[msg.sender]);
        _;
    }

    event RequestTimeAtLocation(
        bytes32 indexed requestId,
        bytes32 indexed time
    );

    function addManager(address newManagerAddress) public restricted {
        managers[newManagerAddress] = true;
    }

    constructor(address manager, uint _price, bool _isActive, string memory _trainID, string memory _advertisedTimeAtLocation, string memory _locationSignature, address _oracle) public {
        managers[manager] = true;
        price = _price;
        isActive = _isActive;
        trainID = _trainID;
        advertisedTimeAtLocation = _advertisedTimeAtLocation;
        locationSignature = _locationSignature;
        passengerCount = 0;

        setPublicChainlinkToken();
    
        setChainlinkOracle(_oracle);
    }

    function bookTrip() public payable{
        require(msg.value == price);
        passengers[msg.sender] = price;
        passengerCount++;
    }

    function cancelTripBooking() public {
        uint amount = passengers[msg.sender];
        require(amount > 0);
        passengers[msg.sender] = 0;
        passengerCount--;
        msg.sender.transfer(amount);
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

    function changePrice(uint _price) public restricted {
        price = _price;
    }

    function changeTrainId(string memory _trainID) public restricted {
        trainID = _trainID;
    }

    function changeLocationSignature(string memory _locationSignature) public restricted {
        locationSignature = _locationSignature;
    }

    function changeAdvertisedTimeAtLoctaion(string memory _advertisedTimeAtLocation) public restricted {
        advertisedTimeAtLocation = _advertisedTimeAtLocation;
    }

    //function refund() public {}

    function requestTimeAtLocation() public restricted {
        Chainlink.Request memory req = buildChainlinkRequest(JOB_ID_GET_PATH, address(this), this.fulfillTimeAtLocation.selector);
        req.add("get", "https://pastebin.com/raw/MNvNvVQ3"); //This is a test-url. It should be exchanged with 'https://api.trafikinfo.trafikverket.se/v2/data.json'.
        req.add("path", "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation");
        sendChainlinkRequest(req, ORACLE_PAYMENT);
    }

    function fulfillTimeAtLocation(bytes32 _requestId, bytes32 _time) public recordChainlinkFulfillment(_requestId) {
        emit RequestTimeAtLocation(_requestId, _time);
        timeAtLocation = _time;
    }

    function getChainlinkToken() public view returns (address) {
        return chainlinkTokenAddress();
    }

    function withdrawLink() public restricted {
        LinkTokenInterface link = LinkTokenInterface(chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }
    
}