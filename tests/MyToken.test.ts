// test/MyToken.test.ts
// Load dependencies

import { ethers } from "hardhat";
import { expect } from "chai";
import { MyToken, StakingRewards } from "../typechain-types";

// Start test block
describe("MyToken Contract", function () {
  //global vars
  let stakeToken: MyToken,
    rewardToken: MyToken,
    owner: any,
    signer1: any,
    signer2: any;

  beforeEach(async function () {
    const StakeToken = await ethers.getContractFactory("MyToken");
    const RewardToken = await ethers.getContractFactory("MyToken");
    [owner, signer1, signer2] = await ethers.getSigners();

    stakeToken = await StakeToken.deploy();
    await stakeToken.waitForDeployment();

    rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();
  });

  // Test case
  it("Should set the right owner for Stake Token", async function () {
    expect(await stakeToken.owner()).to.equal(owner.address);
  });

  it("Should set the right owner for Reward Token", async function () {
    expect(await rewardToken.owner()).to.equal(owner.address);
  });

  it("Should mint the right amount for Stake Token", async function () {
    await stakeToken.mint(signer1.address, 25);
    expect(await stakeToken.balanceOf(signer1.address)).to.equal(25);
  });

  it("Should mint the right amount for Reward Token", async function () {
    await rewardToken.mint(signer1.address, 25);
    expect(await rewardToken.balanceOf(signer1.address)).to.equal(25);
  });

  it("Should transfer the right amount for Stake Token", async function () {
    await stakeToken.mint(signer1.address, 25);
    await stakeToken.connect(signer1).transfer(signer2.address, 10);

    expect(await stakeToken.balanceOf(signer1.address)).to.equal(15);
    expect(await stakeToken.balanceOf(signer2.address)).to.equal(10);
  });

  it("Should transfer the right amount for Reward Token", async function () {
    const signer1Amount = 25;
    const transferAmount = 10;

    await rewardToken.mint(signer1.address, signer1Amount);
    await rewardToken
      .connect(signer1)
      .transfer(signer2.address, transferAmount);

    expect(await rewardToken.balanceOf(signer1.address)).to.equal(
      signer1Amount - transferAmount
    );

    expect(await rewardToken.balanceOf(signer2.address)).to.equal(
      transferAmount
    );
  });

  it("Should approve the right amount for Stake Token", async function () {
    const approveAmount = 25;

    await stakeToken.mint(signer1.address, approveAmount);
    await stakeToken.connect(signer1).approve(signer2.address, approveAmount);

    expect(
      await stakeToken.allowance(signer1.address, signer2.address)
    ).to.equal(approveAmount);
  });

  it("Should transfer from signer1 to signer2", async function () {
    const approveAmount = 25;
    const transferAmount = 10;

    await stakeToken.mint(signer1.address, approveAmount);
    await stakeToken.connect(signer1).approve(signer2.address, approveAmount);

    await stakeToken
      .connect(signer2)
      .transferFrom(signer1.address, signer2.address, transferAmount);

    expect(await stakeToken.balanceOf(signer1.address)).to.equal(
      approveAmount - transferAmount
    );
    expect(await stakeToken.balanceOf(signer2.address)).to.equal(
      transferAmount
    );
  });
});
