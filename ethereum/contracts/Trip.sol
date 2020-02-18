pragma solidity ^0.6.2;

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
                "Nr")
            ));
    }

    function createTrip(uint price, bool active, string memory trainID, string memory advertisedTimeAtLocation, string memory locationSignature) public restricted {
        trips.push(address(
            new Trip(
                msg.sender,
                price,
                active,
                trainID,
                advertisedTimeAtLocation,
                locationSignature)
            ));
    }

    function getTrips() public view returns (address[] memory){
        return trips;
    }
}

contract Trip {
    uint public passengerCount;
    uint public paybackRatio;
    uint public price;
    string public trainID;
    string public locationSignature;
    string public advertisedTimeAtLocation;
    mapping(address=>uint) public passengers;
    mapping(address=>bool) public managers;
    bool public reimbursable;
    bool public active;

    modifier restricted() {
        require(managers[msg.sender]);
        _;
    }

    function addManager(address newManagerAddress) public restricted {
        managers[newManagerAddress] = true;
    }

    constructor(address manager, uint _price, bool _active, string memory _trainID, string memory _advertisedTimeAtLocation, string memory _locationSignature) public {
        managers[manager] = true;
        price = _price;
        active = _active;
        trainID = _trainID;
        advertisedTimeAtLocation = _advertisedTimeAtLocation;
        locationSignature = _locationSignature;
        passengerCount = 0;
    }

    function bookTrip() public payable{
        require(msg.value == price);
        passengers[msg.sender] = price;
        passengerCount++;
    }

    //function cancelTripBooking() public {}

    //function refund() public {}

    //function changePrice(uint price) public restricted {}

    //function requestTimeAtLocation() public {}

    //function fulfillTimeAtLocation() public {}

}