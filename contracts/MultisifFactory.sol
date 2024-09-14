// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Multisig.sol";

contract MultisigFactory {
    mapping(uint256 => address) multisigClones;
    uint256 public noOfContracts;

    event MultisigContractCreated(uint256 _index, address _deployedTo);

    function createMultisigWallet(
        uint8 _quorum,
        address[] calldata _validSigners
    ) public returns (uint256 _index, address _deployedTo) {
        Multisig newMulsig = new Multisig(_quorum, _validSigners);

        _deployedTo = address(newMulsig);
        _index = ++noOfContracts;

        multisigClones[_index] = _deployedTo;

        emit MultisigContractCreated(_index, _deployedTo);
    }

    function getMultisigContract(
        uint256 _index
    ) external view returns (address) {
        return multisigClones[_index];
    }
}
