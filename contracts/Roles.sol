pragma solidity >=0.4.25;

/**
 * @title Roles
 * @dev Library for managing addresses assigned to a Role.
 */
library Roles {
    struct Role {
        mapping (address => Privileges) user;
    }

    struct Privileges{
        bool bearer;
        bool status;
    }

    /**
     * @dev give an account access to this role
     */
    function add(Role storage role, address account) internal {
        require(account != address(0), "Nope!");
        require(!has(role, account), "It's already present");

        role.user[account].bearer = true;
        role.user[account].status = false;
    }

    function setStatus(Role storage role, address account, bool mode) internal
    {
        require(account != address(0));
        role.user[account].status = mode;
    }

    /**
     * @dev remove an account's access to this role
     */
    function remove(Role storage role, address account) internal {
        require(account != address(0));
        require(has(role, account));

        role.user[account].bearer = false;
        role.user[account].status = false;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function has(Role storage role, address account)
    internal
    view
    returns (bool)
    {
        require(account != address(0));
        return role.user[account].bearer;
    }

    /**
     * @dev check if an account has this role
     * @return bool
     */
    function active(Role storage role, address account)
    internal
    view
    returns (bool)
    {
        require(account != address(0));
        return role.user[account].status;
    }

}