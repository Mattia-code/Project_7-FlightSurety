pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Airline.sol";

contract FlightSuretyData is Airline {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    address private contractApp;
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
        address [] insured;
    }

    struct Passenger {
        bool isRegistered;
        mapping (bytes32 => uint) insuranceValue;
        uint balance;
    }

    mapping(address => Passenger) private passengers;
    mapping(bytes32 => Flight) public flights;
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
    (
        address firstAirline
    )

    public
    {
        contractOwner = msg.sender;
        addAirline(firstAirline);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;
        // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsCallerAuthorized()
    {
        require(msg.sender == contractApp, "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
    public
    view
    returns (bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus
    (
        bool mode
    )
    external
    requireContractOwner
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/


    address[] multiCalls = new address[](0);
    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline
    (
        address newAirlines,
        address oldAirlines
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    returns (bool success, uint256 votes)
    {
        require(isAirline(oldAirlines), "Error 2 - Caller is not an Airline");
        require(isActive(oldAirlines), "Error 2 - Caller is not an active Airline");
        if (activeCount < 4) {
            addAirline(newAirlines, oldAirlines);
            return (true, 0);
        } else {
            bool isDuplicate = false;
            uint M = activeCount / 2;
            for (uint c = 0; c < multiCalls.length; c++) {
                if (multiCalls[c] == oldAirlines) {
                    isDuplicate = true;
                    break;
                }
            }
            require(!isDuplicate, "Airline has already called this function.");

            multiCalls.push(oldAirlines);
            if (multiCalls.length >= M) {
                addAirline(newAirlines, oldAirlines);
                votes = multiCalls.length;
                multiCalls = new address[](0);
                return (true, votes);
            }

        }

        return (false, 0);
    }

    function activateAirline(address account, bool mode)
    requireIsOperational
    requireIsCallerAuthorized
    returns (bool success){
        require(isAirline(account), "Error 3");
        setAirlaneStatus(account, mode);
        return (true);
    }

    function registerFlight
    (
        address _airline,
        string _flight,
        uint256 _timestamp
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    {
        require(isAirline(_airline), "Error");
        require(isActive(_airline), "Error");
        bytes32 _key = getFlightKey(_airline, _flight);
        flights[_key] = Flight(
            {
            isRegistered : true,
            statusCode : 0,
            updatedTimestamp : _timestamp,
            airline : _airline,
            insured : new address[](0)
            }
        );
    }

    /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
    (
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    )
    requireIsOperational
    requireIsCallerAuthorized
    external
    {
        bytes32 _key = getFlightKey(airline, flight/*, timestamp*/);
        flights[_key].statusCode = statusCode;
        flights[_key].updatedTimestamp = timestamp;
        flights[_key].airline = airline;
        address[] insured = flights[_key].insured;
        /**
        * Credits payouts to insurees
        */
        for (uint i=0; i<insured.length; i++) {
            passengers[insured[i]].balance = passengers[insured[i]].insuranceValue[_key].mul(3).div(2);
        }
    }

    //
    function fetchAirlineStatus(
        address airline
    )
    public view returns
    (
        bool isRegistered
    )
    {
        require(isAirline(airline), "Error");
        isRegistered = isActive(airline);

        return (
        isRegistered
        );
    }

    function fetchFlightBuffer(
        address _airline,
        string flight
        /*uint256 timestamp*/) public view returns
    (
        bool isRegistered,
        uint8 statusCode,
        uint256 updatedTimestamp,
        address airline
    )
    {
        bytes32 _key = getFlightKey(_airline, flight);
        isRegistered = flights[_key].isRegistered;
        statusCode = flights[_key].statusCode;
        updatedTimestamp = flights[_key].updatedTimestamp;
        airline = flights[_key].airline;

        return
        (
        isRegistered,
        statusCode,
        updatedTimestamp,
        airline
        );
    }

    function fetchFlightInsured(
        address _account,
        address _airline,
        string flight
    ) public view returns(
        bool isRegistered,
        uint insuranceValue,
        uint balance
    )

    {
        bytes32 _key = getFlightKey(_airline, flight);

        isRegistered = passengers[_account].isRegistered;
        insuranceValue = passengers[_account].insuranceValue[_key];
        balance =  passengers[_account].balance;

        return
        (
            isRegistered,
            insuranceValue,
            balance
        );
    }


    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy
    (
        address account,
        uint value,
        address airline,
        string flight
    )
    requireIsOperational
    requireIsCallerAuthorized
    external
    //payable
    {
        bytes32 _key = getFlightKey(airline, flight);
        require(flights[_key].isRegistered, "Ops!");
        //1st nd
        //passengers[account].wallet = account;
        passengers[account].insuranceValue[_key] = value;
        if(!passengers[account].isRegistered){
            passengers[account].balance = 0;
            passengers[account].isRegistered = true;
        }

        flights[_key].insured.push(account);
    }

    function getFlightKey
    (
        address airline,
        string memory flight
        //uint256 timestamp
    )
    view
    internal
    requireIsOperational
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight/*, timestamp*/));
    }

    function authorizeCaller(address appAddress)
    external
    requireContractOwner
    requireIsOperational
    {
        contractApp = appAddress;
    }

    function getBalance(
        address passenger
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    returns(uint){
        return passengers[passenger].balance;
    }

    function withdrawFunds(
        address passenger
    )
    external
    requireIsOperational
    requireIsCallerAuthorized
    returns (uint){
        uint balance = passengers[passenger].balance;
        passengers[passenger].balance = 0;
        return balance;
    }

}

