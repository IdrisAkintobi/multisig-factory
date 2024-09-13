// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Multisig.sol";

contract MultisigFactory {
    address[] multisigClones;
    uint32 public noOfContracts;

    event MultisigContractCreated(uint256 _index, address _deployedTo);

    function createMultisigWallet(
        uint8 _quorum,
        address[] calldata _validSigners
    ) public returns (uint256 _index, address _deployedTo) {
        Multisig newMulsig = new Multisig(_quorum, _validSigners);

        _deployedTo = address(newMulsig);

        multisigClones.push(_deployedTo);

        _index = noOfContracts;

        noOfContracts++;

        emit MultisigContractCreated(_index, _deployedTo);
    }

    function getMultisigContract(
        uint256 _index
    ) external view returns (address) {
        return multisigClones[_index];
    }

    function getMultiSigClones() external view returns (address[] memory) {
        return multisigClones;
    }
}
