// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;
import {IERC20} from "../interface/IERC20.sol";

contract Multisig {
    uint8 public quorum;
    uint8 public noOfValidSigners;
    uint256 public txCount;
    uint8 public newQuorum;
    uint8 private newQuorumSignerCount;
    mapping(address => bool) proposedNewQuorum;
    address[] public proposedNewQuorumAddresses;
    address public owner;

    struct Transaction {
        uint256 id;
        uint256 amount;
        address sender;
        address recipient;
        bool isCompleted;
        uint256 timestamp;
        uint256 noOfApproval;
        address tokenAddress;
        address[] transactionSigners;
    }

    mapping(address => bool) isValidSigner;
    mapping(uint256 => Transaction) public transactions;
    mapping(address => mapping(uint256 => bool)) hasSigned;

    event ProposedNewQuorum(address indexed proposer, uint8 proposedQuorum);

    constructor(uint8 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers");
        require(_quorum > 1, "quorum is too small");

        for (uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed");
            require(!isValidSigner[_validSigners[i]], "signer already exist");

            isValidSigner[_validSigners[i]] = true;
        }

        noOfValidSigners = uint8(_validSigners.length);

        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        );
        quorum = _quorum;
        owner = msg.sender;
    }

    function setNewQuorum(uint8 proposedQuorum) public {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");
        require(proposedQuorum != quorum, "Cannot use existing quorum");
        require(proposedQuorum > 1, "Quorum must be more than 1");
        require(
            proposedQuorum <= noOfValidSigners,
            "Quorum cannot exceed signers"
        );
        require(!proposedNewQuorum[msg.sender], "You already proposed");

        if (proposedQuorum != newQuorum) {
            // Reset quorum proposals if a new proposal is made
            newQuorum = proposedQuorum;
            newQuorumSignerCount = 0;

            // Clear previous proposals
            for (uint8 i = 0; i < proposedNewQuorumAddresses.length; i++) {
                delete proposedNewQuorum[proposedNewQuorumAddresses[i]];
            }
            delete proposedNewQuorumAddresses;
            emit ProposedNewQuorum(msg.sender, proposedQuorum);
        }

        // Record the new proposal
        proposedNewQuorum[msg.sender] = true;
        newQuorumSignerCount++;
        proposedNewQuorumAddresses.push(msg.sender);

        // If all signers agree, update the quorum
        if (newQuorumSignerCount == noOfValidSigners) {
            quorum = proposedQuorum;
            newQuorumSignerCount = 0;
        }
    }

    function transfer(
        uint256 _amount,
        address _recipient,
        address _tokenAddress
    ) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "insufficient funds"
        );

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];

        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint256 _txId) external {
        require(_txId != 0, "invalid tx id");

        Transaction storage trx = transactions[_txId];

        require(
            IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount,
            "insufficient funds"
        );
        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }
}
