pragma solidity ^0.5.1;

import "./HitchensUnorderedKeySet.sol";

//import "@chainlink/contracts/src/v0.5/ChainlinkClient.sol"; // Comment out this line when testing in remix
import "https://github.com/smartcontractkit/chainlink/evm-contracts/src/v0.5/ChainlinkClient.sol"; // Uncomment this line when testing in remix

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
        uint256 timeAtLocation;
        mapping(address => uint) passengers;
        mapping(address => bool) hasSubmitted;
        bool isActive;
        uint shortTrip; // Note: Should be a bool. It is however not clear if it's possible to add a boolean to a chainlink-request. Use 1 and 0.
        uint256 submissionsID;
    }

    modifier restricted() {
        require(managers[msg.sender], "msg.sender is not a manager!");
        _;
    }

    modifier requireTrip(uint key) {
        require(tripSet.exists(key), "Trip doesn't exist.");
        _;
    }
    
    modifier nonSubmittedPassengerOnly(uint key) {
        require(trips[key].passengers[msg.sender] > 0, "sender is not a passenger on this trip");
        require(!trips[key].hasSubmitted[msg.sender], "Passenger already submitted");
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
        "11b8eac6ccd64710bf5bcd175ef6dab2"
    );
    uint private constant ORACLE_PAYMENT = 1 * LINK;
    string constant JSON_PARSE_PATH = "RESPONSE.RESULT.0.TrainAnnouncement.0.TimeAtLocation";

    string private constant URL_TRAFIKVERKET = 'https://api.trafikinfo.trafikverket.se/v2/data.json';
    string private constant URL_PASTEBIN_SJ_DELAY_TEST = 'https://pastebin.com/raw/bmcgBYCc';

    uint private tripKey = 1;
    mapping(address => bool) public managers;
    mapping(uint => Trip) public trips;
    mapping(bytes32 => uint256) private tripContexts;
    mapping(uint256 => uint256[]) public submissions;
    
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
        uint256 timeAtLocation,
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
    event TALUpdated(uint256 tripID, uint256 TAL);

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
        createTrip("cst", "nr", "2020-02-18", 545, 0x0, 1 ether, 1);
    }

    function createTrip(
        string memory _fromLocationSignature,
        string memory _toLocationSignature,
        string memory _advertisedTimeAtLocation,
        uint _trainID,
        uint timeAtLocation,
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
            timeAtLocation: 0,
            isActive: true,
            shortTrip: _shortTrip,
            submissionsID: tripKey
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
        (bool success, ) = msg.sender.call.value(trip.price)("");
        require(success);
    }
    
    function withdrawRefund(uint key) external requireTrip(key){
        Trip storage trip = trips[key];
        require(trip.passengers[msg.sender] > 0, "User is not a passenger of this trip or has already been refunded!");
        uint refund = trip.passengers[msg.sender] * trip.paybackRatio / 100; // TODO: Investigate what happens if refund results in float.
        trip.passengers[msg.sender] = 0;
        (bool success, ) = msg.sender.call.value(refund)("");
        require(success);
    }
    
    /**
     * TODO: 
     * Each address should only be able to vote once.
     * Require that msg.sender is in the trip.
     * 
     */
    function addSubmission(uint256 tripId, uint256 timeAtLocation) external {
        submissions[tripId].push(timeAtLocation);
    }
    
    /**
    * @dev Performs aggregation and sets timeAtLocation of a Trip.
    * Aggregation technique: Average
    * @param tripID The trip ID for which to aggregate
    */
    function updateTALAverage(uint256 tripID) public {
        Trip storage trip = trips[tripID];
        uint256 TALSum;
        uint256[] memory submits = submissions[tripID];
        for (uint i = 0; i < submits.length; i++) {
            TALSum += submits[i];
        }
        uint256 averageTAL = TALSum.div(submits.length);
        trip.timeAtLocation = averageTAL;
        
        emit TALUpdated(tripID, trip.timeAtLocation);
    }
    
    /**
    * @dev Performs aggregation and sets timeAtLocation of a Trip.
    * Aggregation technique: Median
    * @param tripID The trip ID for which to aggregate
    */
    function updateTALMedian(uint256 tripID) public {
        Trip storage trip = trips[tripID];
        uint256 responseLength = submissions[tripID].length;
        uint256 middleIndex = responseLength.div(2);
        if (responseLength % 2 == 0) {
          uint256 median1 = quickselect(submissions[tripID], middleIndex);
          uint256 median2 = quickselect(submissions[tripID], middleIndex.add(1)); // quickselect is 1 indexed
          // solium-disable-next-line zeppelin/no-arithmetic-operations
          trip.timeAtLocation = median1.add(median2) / 2; // signed integers are not supported by SafeMath
        } else {
          trip.timeAtLocation = quickselect(submissions[tripID], middleIndex.add(1)); // quickselect is 1 indexed
        }
        
        emit TALUpdated(tripID, trip.timeAtLocation);
    }
    

    /**
    * @dev Returns the kth value of the ordered array
    * See: http://www.cs.yale.edu/homes/aspnes/pinewiki/QuickSelect.html
    * @param _a The list of elements to pull from
    * @param _k The index, 1 based, of the elements you want to pull from when ordered
    */
    function quickselect(uint256[] memory _a, uint256 _k)
    private
    pure
    returns (uint256) {
        uint256[] memory a = _a;
        uint256 k = _k;
        uint256 aLen = a.length;
        uint256[] memory a1 = new uint256[](aLen);
        uint256[] memory a2 = new uint256[](aLen);
        uint256 a1Len;
        uint256 a2Len;
        uint256 pivot;
        uint256 i;
        
        while (true) {
          pivot = a[aLen.div(2)];
          a1Len = 0;
          a2Len = 0;
          for (i = 0; i < aLen; i++) {
            if (a[i] < pivot) {
              a1[a1Len] = a[i];
              a1Len++;
            } else if (a[i] > pivot) {
              a2[a2Len] = a[i];
              a2Len++;
            }
          }
          if (k <= a1Len) {
            aLen = a1Len;
            (a, a1) = swap(a, a1);
          } else if (k > (aLen.sub(a2Len))) {
            k = k.sub(aLen.sub(a2Len));
            aLen = a2Len;
            (a, a2) = swap(a, a2);
          } else {
            return pivot;
          }
        }
    }
    
    /**
    * @dev Swaps the pointers to two uint256 arrays in memory
    * @param _a The pointer to the first in memory array
    * @param _b The pointer to the second in memory array
    */
    function swap(uint256[] memory _a, uint256[] memory _b)
    private
    pure
    returns(uint256[] memory, uint256[] memory)
    {
        return (_b, _a);
    }


    function getTripKey() external view returns(uint) {
        return tripKey;
    }
    // CHAINLINK FUNCTIONS

    // param _requestTime must be specified in the format of a UNIX timestamp
    function requestAlarmClock(uint256 _requestTime, uint256 key) external restricted {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_CL_JOB_ID_ALARM_CLOCK,
            address(this),
            this.fulfillAlarmClock.selector
        );
        req.addUint("until", _requestTime);
        tripContexts[sendChainlinkRequestTo(ROP_CL_ADDR_ORACLE, req, ORACLE_PAYMENT)] = key;
    }

    function fulfillAlarmClock(bytes32 _requestId)
        external
        recordChainlinkFulfillment(_requestId)
    {
        emit RequestAlarmClock(_requestId);
        uint256 ctxTripKey = tripContexts[_requestId];
        requestTimeAtLocation(ctxTripKey);
    }

    function requestTimeAtLocation(uint256 key) public {
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_DH_JOB_ID_GET_TAL,
            address(this),
            this.fulfillTimeAtLocation.selector
        );
        Trip memory trip = trips[key];
        req.add("url", URL_PASTEBIN_SJ_DELAY_TEST);
        req.addUint("advertisedTrainIdent", trip.trainID);
        req.add("locationSignature", trip.toLocationSignature);
        req.add("advertisedTimeAtLocation", trip.advertisedTimeAtLocation);
        req.add("path", JSON_PARSE_PATH);
        //uint256 memory ctxTripKey = tripContexts[requestId];
        //delete tripContexts[requestId];
        tripContexts[sendChainlinkRequestTo(ROP_DH_ADDR_ORACLE, req, ORACLE_PAYMENT)] = key;
    }

    function fulfillTimeAtLocation(bytes32 _requestId, bytes32 _time)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 ctxTripKey = tripContexts[_requestId];
        delete tripContexts[_requestId];
        Trip storage trip = trips[ctxTripKey];
        trip.timeAtLocation = uint256(_time);
        emit RequestTimeAtLocation(_requestId, _time);
    }

    function requestPaybackRatio(uint256 key) public {
        // TODO: Both requestTimeAtLocation and this function retrieves the same data from the same data source. Fix this redundancy.
        Chainlink.Request memory req = buildChainlinkRequest(
            ROP_DH_JOB_ID_CALC_PBR,
            address(this),
            this.fulfillPaybackRatio.selector
        );
        Trip memory trip = trips[key];
        req.add("url", URL_PASTEBIN_SJ_DELAY_TEST);
        req.addUint("advertisedTrainIdent", trip.trainID);
        req.add("locationSignature", trip.toLocationSignature);
        req.add("advertisedTimeAtLocation", trip.advertisedTimeAtLocation);
        req.addUint("shortTrip", trip.shortTrip);
        req.add("path", "paybackRatio");
        tripContexts[sendChainlinkRequestTo(ROP_DH_ADDR_ORACLE, req, ORACLE_PAYMENT)] = key;
    }

    function fulfillPaybackRatio(bytes32 _requestId, uint _paybackRatio)
        external
        recordChainlinkFulfillment(_requestId)
    {
        uint256 key = tripContexts[_requestId];
        delete tripContexts[_requestId];
        Trip storage trip = trips[key];
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
}
