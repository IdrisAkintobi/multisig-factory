// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract IDrisToken is ERC20("iDris Token", "DRZ") {
    address public immutable owner;

    constructor() {
        owner = msg.sender;
        _mint(msg.sender, 100_000e18);
    }

    function mint(uint _amount) external {
        require(msg.sender == owner, "UNAUTHORIZED");
        _mint(msg.sender, _amount * 1e18);
    }
}
