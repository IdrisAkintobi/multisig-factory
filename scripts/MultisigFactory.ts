import { ethers } from "hardhat";

// Define the quorum and valid signers
const quorum = 3;

async function main() {
  const validSigners = (await ethers.getSigners()).slice(0, 4);

  // Deploy the MultisigFactory contract
  const IDrisTokenFactory = await ethers.getContractFactory("IDrisToken");
  const iDrisToken = await IDrisTokenFactory.deploy();

  // Deploy the MultisigFactory contract
  const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
  const multisigFactory = await MultisigFactory.deploy();

  // Create a new Multisig wallet: await until mined and confirmed
  await Promise.all([
    (await multisigFactory.createMultisigWallet(quorum, validSigners)).wait(),
    (await multisigFactory.createMultisigWallet(quorum, validSigners)).wait(),
  ]);

  const [clonedContractOneAddress, clonedContractTwoAddress] =
    await Promise.all([
      multisigFactory.getMultisigContract(1),
      multisigFactory.getMultisigContract(2),
    ]);

  const [clonedContractOne, clonedContractTwo] = await Promise.all([
    ethers.getContractAt("Multisig", clonedContractOneAddress),
    ethers.getContractAt("Multisig", clonedContractTwoAddress),
  ]);

  // Transfer 50 tokens each to the multisig cloned multisig contracts
  await iDrisToken.transfer(clonedContractOne, ethers.parseUnits("50", 18));
  await iDrisToken.transfer(clonedContractTwo, ethers.parseUnits("50", 18));

  // Create transfer with signer1 account to signer4 on both contracts
  await clonedContractOne.transfer(BigInt(1e9), validSigners[3], iDrisToken);
  await clonedContractTwo.transfer(BigInt(1e9), validSigners[3], iDrisToken);

  /**
   * Transaction One
   */
  const txOneBeforeApproval = await clonedContractOne.transactions(1);
  console.log(
    "clonedContractOne:: Transaction status before approval >>>",
    txOneBeforeApproval[4]
  );

  // Approve the transfer with signer3 and signer4
  await clonedContractOne.connect(validSigners[2]).approveTx(1);
  await clonedContractOne.connect(validSigners[3]).approveTx(1);

  const txOneAfterApproval = await clonedContractOne.transactions(1);
  console.log(
    "clonedContractOne:: Transaction status after approval >>>",
    txOneAfterApproval[4]
  );

  /**
   * Transaction Two
   */
  const txTwoBeforeApproval = await clonedContractTwo.transactions(1);
  console.log(
    "clonedContractTwo:: Transaction status before approval >>>",
    txTwoBeforeApproval[4]
  );

  // Approve the transfer with signer2 and signer3
  await clonedContractTwo.connect(validSigners[1]).approveTx(1);
  await clonedContractTwo.connect(validSigners[2]).approveTx(1);

  const txTwoAfterApproval = await clonedContractTwo.transactions(1);
  console.log(
    "clonedContractTwo:: Transaction status after approval >>>",
    txTwoAfterApproval[4]
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
