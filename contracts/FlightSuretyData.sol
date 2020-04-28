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
        //address wallet;
        mapping (bytes32 => uint) insuranceValue;
        uint balance;
    }

    mapping(address => Passenger) private passengers;
    mapping(bytes32 => Flight) private flights;
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

    function activateAirline(address account, bool mode) returns (bool success){
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
    external
    {
        bytes32 _key = getFlightKey(airline, flight/*, timestamp*/);
        flights[_key].statusCode = statusCode;
        flights[_key].updatedTimestamp = timestamp;
        flights[_key].airline = airline;
    }

    //
    function fetchAirlineStatus(
        address airline
    ) requireIsOperational public view returns
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
    /*uint256 timestamp*/) public view returns(
        bool isRegistered,
        //address wallet,
        uint insuranceValue,
        uint balance
    )

    {
        bytes32 _key = getFlightKey(_airline, flight);

        isRegistered = passengers[_account].isRegistered;
        //wallet = passengers[_account].wallet;
        insuranceValue = passengers[_account].insuranceValue[_key];
        balance =  passengers[_account].balance;

        return
        (
            isRegistered,
            //wallet,
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

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
    (
    )
    external
    pure
    {
    }


    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
    (
    )
    external
    pure
    {
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund
    (
    )
    public
    payable
    {
    }

    function getFlightKey
    (
        address airline,
        string memory flight
        //uint256 timestamp
    )
    pure
    internal
    returns (bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight/*, timestamp*/));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
    external
    payable
    {
        fund();
    }


    modifier requireIsCallerAuthorized()
    {
        require(msg.sender == contractApp, "Caller is not authorized");
        _;
    }

    function authorizeCaller(address appAddress)
    external
    requireContractOwner
    {
        contractApp = appAddress;
    }



}

