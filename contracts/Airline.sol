pragma solidity >=0.4.25;

// Import the library 'Roles'
import "./Roles.sol";

// Define a contract 'AirlineRole' to manage this role - add, remove, check
contract Airline {
    using Roles for Roles.Role;

    // Define 2 events, one for Adding, and other for Removing
    event AirlineAdded(address indexed account);
    event AirlineRemoved(address indexed account);
    event AirlineStatusChanged(address indexed account);

    // Define a struct 'airlines' by inheriting from 'Roles' library, struct Role
    Roles.Role private airlines;
    uint activeCount;
    // In the constructor make the address that deploys this contract the 1st airline
    constructor() public {
        _addAirline(msg.sender);
    }

    // Define a modifier that checks to see if msg.sender has the appropriate role
    modifier onlyAirline() {
        require(isAirline(msg.sender), "Only Airlines");
        _;
    }

    modifier onlyActiveAirline(){
        require(isActive(msg.sender), "Only Active Airlines");
        _;
    }

    // Define a function 'isAirline' to check this role
    function isAirline(address account) public view returns (bool) {
        return airlines.has(account);
    }

    function isActive(address account) public view returns (bool) {
        return airlines.active(account);
    }

    // Define a function 'addAirline' that adds this role
    function addAirline(address account) public onlyAirline {
        _addAirline(account);
    }

    // Define a function 'addAirline' that adds this role
    function addAirline(address account, address origin) public {
        require(isAirline(origin), "Only Airlines");
        _addAirline(account);
    }

    // Define a function 'renounceAirline' to renounce this role
    function renounceAirline() public {
        _removeAirline(msg.sender);
    }

    //
    function setAirlaneStatus(address account, bool mode) public{
        _setAirlaneStatus(account, mode);
    }

    // Define an internal function '_addAirline' to add this role, called by 'addAirline'
    function _addAirline(address account) internal {
        airlines.add(account);
        emit AirlineAdded(account);
    }

    // Define an internal function '_removeAirline' to remove this role, called by 'removeAirline'
    function _removeAirline(address account) internal {
        airlines.remove(account);
        activeCount -= 1;
        emit AirlineRemoved(account);
    }

    //
    function _setAirlaneStatus(address account, bool mode) internal{
        airlines.setStatus(account, mode);
        if(mode) activeCount += 1;
        else activeCount -= 1;
        emit AirlineStatusChanged(account);
    }


}