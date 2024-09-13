import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

import { IDrisToken, Multisig } from "../typechain-types";

describe("Multisig Contract Test", function () {
  let multisig: Multisig;
  let token: IDrisToken;
  let signers: Signer[];
  let recipient: Signer;

  beforeEach(async function () {
    signers = (await ethers.getSigners()).slice(0, 5);
    recipient = signers[4]; // use 5th account as the recipient

    // Deploy the IDrisToken contract
    const IDrisTokenFactory = await ethers.getContractFactory("IDrisToken");
    token = await IDrisTokenFactory.deploy();

    // Deploy the Multisig contract with quorum and signers
    const MultisigFactory = await ethers.getContractFactory("Multisig");
    multisig = await MultisigFactory.deploy(2, [
      signers[0],
      signers[1],
      signers[2],
    ]);

    // Transfer 500 tokens to the multisig contract
    await token.transfer(multisig, ethers.parseUnits("500", 18));
  });

  it("should initialize with the correct quorum and valid signers", async function () {
    expect(await multisig.quorum()).to.equal(2);
    expect(await multisig.noOfValidSigners()).to.equal(3);
  });

  it("should allow setting a new quorum", async function () {
    await multisig.setNewQuorum(3);
    await multisig.connect(signers[1]).setNewQuorum(3);
    await multisig.connect(signers[2]).setNewQuorum(3);

    expect(await multisig.quorum()).to.equal(3);
  });

  it("should allow transferring tokens", async function () {
    // Transfer 100 tokens to the recipient
    await multisig.transfer(ethers.parseUnits("100", 18), recipient, token);

    // Check that the transaction count increased
    expect(await multisig.txCount()).to.equal(1);
  });

  it("should allow approving and completing a transaction", async function () {
    // Create a transaction
    await multisig.transfer(ethers.parseUnits("100", 18), recipient, token);

    // Approve transaction by second signer
    await multisig.connect(signers[1]).approveTx(1);

    // Check balances after approval
    expect(await token.balanceOf(recipient)).to.equal(
      ethers.parseUnits("100", 18)
    );
    expect(await token.balanceOf(multisig)).to.equal(
      ethers.parseUnits("400", 18)
    );
  });

  it("should not allow a signer to sign twice", async function () {
    // Create a transaction
    await multisig.transfer(ethers.parseUnits("100", 18), recipient, token);

    // Expect revert on double approval by the same signer
    await expect(multisig.approveTx(1)).to.be.revertedWith("can't sign twice");
  });

  it("should not allow setting quorum higher than the number of signers", async function () {
    await expect(multisig.setNewQuorum(5)).to.be.revertedWith(
      "Quorum cannot exceed signers"
    );
  });

  it("should not allow transferring more than contract balance", async function () {
    await expect(
      multisig.transfer(ethers.parseUnits("600", 18), recipient, token)
    ).to.be.revertedWith("insufficient funds");
  });

  it("should not allow proposing existing quorum", async function () {
    await expect(multisig.setNewQuorum(2)).to.be.revertedWith(
      "Cannot use existing quorum"
    );
  });

  it("should not allow proposing the same quorum twice", async function () {
    await multisig.setNewQuorum(3);

    await expect(multisig.setNewQuorum(3)).to.be.revertedWith(
      "You already proposed"
    );
  });
});
