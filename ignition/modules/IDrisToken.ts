import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const IDrisTokenModule = buildModule("IDrisTokenModule", (m) => {
  const iDrisToken = m.contract("IDrisToken");

  return { iDrisToken };
});

module.exports = IDrisTokenModule;
