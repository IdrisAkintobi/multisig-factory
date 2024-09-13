import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { IDrisToken, Multisig, MultisigFactory } from "../typechain-types";

describe("MultisigFactory Contract Test", function () {
  let multisigFactory: MultisigFactory;
  let firstClonedMultisig: Multisig;
  let secondClonedMultisig: Multisig;
  let token: IDrisToken;
  let signers: Signer[];
  let recipientOne: Signer;
  let recipientTwo: Signer;

  beforeEach(async function () {
    signers = (await ethers.getSigners()).slice(0, 5);
    recipientOne = signers[4]; // use 5th account
    recipientTwo = signers[1]; // use 2nd account

    // Deploy the IDrisToken contract
    const IDrisTokenFactory = await ethers.getContractFactory("IDrisToken");
    token = await IDrisTokenFactory.deploy();

    // Deploy the MultisigFactory contract with quorum and signers
    const MultisigFactoryFactory = await ethers.getContractFactory(
      "MultisigFactory"
    );
    multisigFactory = await MultisigFactoryFactory.deploy();

    // Deploy the first Multisig contract with quorum and signers from factory
    await multisigFactory.createMultisigWallet(2, [
      signers[0],
      signers[1],
      signers[2],
    ]);
    const firstClonedMultisigAddress =
      await multisigFactory.getMultisigContract(0);
    firstClonedMultisig = await ethers.getContractAt(
      "Multisig",
      firstClonedMultisigAddress
    );

    // Deploy the second Multisig contract with quorum and signers from factory
    await multisigFactory.createMultisigWallet(3, [
      signers[1],
      signers[2],
      signers[3],
      signers[4],
    ]);
    const secondClonedMultisigAddress =
      await multisigFactory.getMultisigContract(1);
    secondClonedMultisig = await ethers.getContractAt(
      "Multisig",
      secondClonedMultisigAddress
    );

    // Transfer 50 tokens to both multisig contracts
    await token.transfer(
      firstClonedMultisigAddress,
      ethers.parseUnits("500", 18)
    );
    await token.transfer(
      secondClonedMultisigAddress,
      ethers.parseUnits("500", 18)
    );
  });

  describe("Test first cloned contract", () => {
    it("should initialize with the correct quorum and valid signers", async function () {
      expect(await firstClonedMultisig.quorum()).to.equal(2);
      expect(await firstClonedMultisig.noOfValidSigners()).to.equal(3);
    });

    it("should allow setting a new quorum", async function () {
      await firstClonedMultisig.setNewQuorum(3);
      await firstClonedMultisig.connect(signers[1]).setNewQuorum(3);
      await firstClonedMultisig.connect(signers[2]).setNewQuorum(3);

      expect(await firstClonedMultisig.quorum()).to.equal(3);
    });

    it("should allow transferring tokens", async function () {
      // Transfer 100 tokens to the recipient
      await firstClonedMultisig.transfer(
        ethers.parseUnits("100", 18),
        recipientOne,
        token
      );

      // Check that the transaction count increased
      expect(await firstClonedMultisig.txCount()).to.equal(1);
    });

    it("should allow approving and completing a transaction", async function () {
      // Create a transaction
      await firstClonedMultisig.transfer(
        ethers.parseUnits("100", 18),
        recipientOne,
        token
      );

      // Approve transaction by second signer
      await firstClonedMultisig.connect(signers[1]).approveTx(1);

      // Check balances after approval
      expect(await token.balanceOf(recipientOne)).to.equal(
        ethers.parseUnits("100", 18)
      );
      expect(await token.balanceOf(firstClonedMultisig)).to.equal(
        ethers.parseUnits("400", 18)
      );
    });

    it("should not allow a signer to sign twice", async function () {
      // Create a transaction
      await firstClonedMultisig.transfer(
        ethers.parseUnits("100", 18),
        recipientOne,
        token
      );

      // Expect revert on double approval by the same signer
      await expect(firstClonedMultisig.approveTx(1)).to.be.revertedWith(
        "can't sign twice"
      );
    });

    it("should not allow setting quorum higher than the number of signers", async function () {
      await expect(firstClonedMultisig.setNewQuorum(5)).to.be.revertedWith(
        "Quorum cannot exceed signers"
      );
    });

    it("should not allow transferring more than contract balance", async function () {
      await expect(
        firstClonedMultisig.transfer(
          ethers.parseUnits("600", 18),
          recipientOne,
          token
        )
      ).to.be.revertedWith("insufficient funds");
    });

    it("should not allow proposing existing quorum", async function () {
      await expect(firstClonedMultisig.setNewQuorum(2)).to.be.revertedWith(
        "Cannot use existing quorum"
      );
    });

    it("should not allow proposing the same quorum twice", async function () {
      await firstClonedMultisig.setNewQuorum(3);

      await expect(firstClonedMultisig.setNewQuorum(3)).to.be.revertedWith(
        "You already proposed"
      );
    });
  });

  describe("Test second cloned contract", () => {
    it("should initialize with the correct quorum and valid signers", async function () {
      expect(await secondClonedMultisig.quorum()).to.equal(3);
      expect(await secondClonedMultisig.noOfValidSigners()).to.equal(4);
    });

    it("should allow setting a new quorum", async function () {
      await secondClonedMultisig.connect(signers[1]).setNewQuorum(2);
      await secondClonedMultisig.connect(signers[2]).setNewQuorum(2);
      await secondClonedMultisig.connect(signers[3]).setNewQuorum(2);
      await secondClonedMultisig.connect(signers[4]).setNewQuorum(2);

      expect(await secondClonedMultisig.quorum()).to.equal(2);
    });

    it("should allow transferring tokens", async function () {
      // Transfer 100 tokens to the recipient
      await secondClonedMultisig
        .connect(signers[1])
        .transfer(ethers.parseUnits("100", 18), recipientTwo, token);

      // Check that the transaction count increased
      expect(await secondClonedMultisig.txCount()).to.equal(1);
    });

    it("should allow approving and completing a transaction", async function () {
      // Create a transaction
      await secondClonedMultisig
        .connect(signers[1])
        .transfer(ethers.parseUnits("100", 18), recipientTwo, token);

      // Approve transaction by second signer
      await secondClonedMultisig.connect(signers[2]).approveTx(1);
      await secondClonedMultisig.connect(signers[3]).approveTx(1);

      // Check balances after approval
      expect(await token.balanceOf(recipientTwo)).to.equal(
        ethers.parseUnits("100", 18)
      );
      expect(await token.balanceOf(secondClonedMultisig)).to.equal(
        ethers.parseUnits("400", 18)
      );
    });

    it("should not allow a signer to sign twice", async function () {
      // Create a transaction
      await secondClonedMultisig
        .connect(signers[1])
        .transfer(ethers.parseUnits("100", 18), recipientTwo, token);

      // Expect revert on double approval by the same signer
      await expect(
        secondClonedMultisig.connect(signers[1]).approveTx(1)
      ).to.be.revertedWith("can't sign twice");
    });

    it("should not allow setting quorum higher than the number of signers", async function () {
      await expect(
        secondClonedMultisig.connect(signers[1]).setNewQuorum(5)
      ).to.be.revertedWith("Quorum cannot exceed signers");
    });

    it("should not allow transferring more than contract balance", async function () {
      await expect(
        secondClonedMultisig
          .connect(signers[1])
          .transfer(ethers.parseUnits("600", 18), recipientTwo, token)
      ).to.be.revertedWith("insufficient funds");
    });

    it("should not allow proposing existing quorum", async function () {
      await expect(
        secondClonedMultisig.connect(signers[1]).setNewQuorum(3)
      ).to.be.revertedWith("Cannot use existing quorum");
    });

    it("should not allow proposing the same quorum twice", async function () {
      await secondClonedMultisig.connect(signers[1]).setNewQuorum(2);

      await expect(
        secondClonedMultisig.connect(signers[1]).setNewQuorum(2)
      ).to.be.revertedWith("You already proposed");
    });
  });
});
