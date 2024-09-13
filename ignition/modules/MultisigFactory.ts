import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigFactoryModule = buildModule("MultisigFactoryModule", (m) => {
  const MultisigFactory = m.contract("MultisigFactory");

  return { MultisigFactory };
});

module.exports = MultisigFactoryModule;
