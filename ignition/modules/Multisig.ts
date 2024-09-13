import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigModule = buildModule("MultisigModule", (m) => {
  const quorum = 2;
  const validSigners = [
    "0x1234567890abcdef1234567890abcdef12345678", // Replace with actual addresses
    "0xabcdef1234567890abcdef1234567890abcdef12",
  ];

  const Multisig = m.contract("Multisig", [quorum, validSigners]);

  return { Multisig };
});

module.exports = MultisigModule;
