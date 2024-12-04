// test/StakingRewards.test.ts
// Load dependencies

import { ethers } from "hardhat";
import { expect } from "chai";
import { MyToken, StakingRewards } from "../typechain-types";

function format(value: bigint) {
  return Number(ethers.formatEther(value.toString()));
}

describe("StakingRewards Contract", function () {
  //global vars
  let stakeToken: MyToken,
    rewardToken: MyToken,
    stakingRewards: StakingRewards,
    stakingAddr: string,
    rewardAmount: bigint = ethers.parseEther("10000"),
    duration: number = 24 * 60 * 60,
    owner: any,
    signer1: any,
    signer2: any;

  beforeEach(async function () {
    const StakeToken = await ethers.getContractFactory("MyToken");
    const RewardToken = await ethers.getContractFactory("MyToken");
    const StakingRewards = await ethers.getContractFactory("StakingRewards");
    [owner, signer1, signer2] = await ethers.getSigners();

    stakeToken = await StakeToken.deploy();
    await stakeToken.waitForDeployment();

    rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();

    const stakingTokenAddr = await stakeToken.getAddress();
    const rewardTokenAddr = await rewardToken.getAddress();

    stakingRewards = await StakingRewards.deploy(
      stakingTokenAddr,
      rewardTokenAddr,
      rewardAmount,
      duration
    );

    await stakingRewards.waitForDeployment();

    stakingAddr = await stakingRewards.getAddress();
  });

  it("Should mint token for signer1 and signer2", async function () {
    const mintAmount = ethers.parseEther("10000");

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.mint(signer2.address, mintAmount);

    const signer1Balances = await stakeToken.balanceOf(signer1.address);
    const signer2Balances = await stakeToken.balanceOf(signer2.address);

    console.log(
      "Signer1 Balance: " + ethers.formatEther(signer1Balances.toString())
    );
    console.log(
      "Signer2 Balance: " + ethers.formatEther(signer2Balances.toString())
    );

    expect(signer1Balances).equal(mintAmount);
    expect(signer2Balances).equal(mintAmount);
  });

  it("Reward Amount", async function () {
    await rewardToken.mint(owner.address, rewardAmount);
    await rewardToken.connect(owner).transfer(stakingAddr, rewardAmount);

    const amount = await rewardToken.balanceOf(stakingAddr);

    console.log(
      "Staking Reward AMount: " + ethers.formatEther(amount.toString())
    );
    expect(amount).equal(rewardAmount);
  });

  it("Approval Amount", async function () {
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("300");

    await rewardToken.mint(signer1.address, mintAmount);
    await rewardToken.connect(signer1).approve(stakingAddr, approveAmount);

    const signer1Balances = await rewardToken.balanceOf(signer1.address);
    const stakingAllowance = await rewardToken.allowance(
      signer1.address,
      stakingAddr
    );

    console.log("Signer1 Balance: " + ethers.formatEther(signer1Balances));
    console.log("Staking Allowance: " + ethers.formatEther(stakingAllowance));

    expect(signer1Balances).equal(mintAmount);
    expect(stakingAllowance).equal(approveAmount);
  });

  it("Should stake the right amount", async function () {
    const stakeAmount = ethers.parseEther("200");
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("300");

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.connect(signer1).approve(stakingAddr, approveAmount);

    console.log(
      "Stake allowance: ",
      ethers.formatEther(
        (await stakeToken.allowance(signer1.address, stakingAddr)).toString()
      )
    );

    await stakingRewards.connect(signer1).stake(stakeAmount);

    const signer1Balances = await stakingRewards.balanceOf(signer1.address);
    const contractBalances = await stakeToken.balanceOf(stakingAddr);
    const blockNumber = await ethers.provider.getBlockNumber();
    const signer1Block = await stakingRewards.blockOf(signer1.address);

    console.log(
      "Signer1 Balance: " + ethers.formatEther(contractBalances.toString())
    );
    console.log(
      "Contract Balance: " + ethers.formatEther(contractBalances.toString())
    );

    console.log("Block Number: " + blockNumber);
    console.log("Signer Block: " + signer1Block);

    expect(signer1Balances).equal(stakeAmount);
    expect(contractBalances).equal(stakeAmount);
    expect(signer1Block).to.equal(blockNumber);
  });

  it("Should get the right reward when claim reward if stake once", async function () {
    const stakeAmount = ethers.parseEther("200");
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("300");

    await rewardToken.mint(owner.address, rewardAmount);
    await rewardToken.connect(owner).transfer(stakingAddr, rewardAmount);

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.connect(signer1).approve(stakingAddr, approveAmount);

    await stakingRewards.connect(signer1).stake(stakeAmount);

    await stakingRewards.connect(signer1).claimReward();

    const signer1Reward = await rewardToken.balanceOf(signer1.address);
    const remainRewardAmount = await rewardToken.balanceOf(stakingAddr);

    console.log("Signer1 reward: " + ethers.formatEther(signer1Reward));
    console.log("Remain reward: " + ethers.formatEther(remainRewardAmount));

    expect(format(signer1Reward)).equal(format(stakeAmount) / 100);
    expect(format(remainRewardAmount)).equal(
      format(rewardAmount) - format(signer1Reward)
    );
  });

  it("Should unstake reduce the balance and automatically claim reward if unstake once", async function () {
    const stakeAmount = ethers.parseEther("200");
    const unStakeAmount = ethers.parseEther("100");
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("300");

    await rewardToken.mint(owner.address, rewardAmount);
    await rewardToken.connect(owner).transfer(stakingAddr, rewardAmount);

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.connect(signer1).approve(stakingAddr, approveAmount);
    await stakingRewards.connect(signer1).stake(stakeAmount);

    await stakingRewards.connect(signer1).unstake(unStakeAmount);

    const signer1Balance = await stakingRewards.balanceOf(signer1.address);
    const signer1Reward = await rewardToken.balanceOf(signer1.address);
    const remainRewardAmount = await rewardToken.balanceOf(stakingAddr);

    console.log("Signer1 Balance: " + ethers.formatEther(signer1Balance));
    console.log("Signer1 reward: " + ethers.formatEther(signer1Reward));
    console.log("Remain reward: " + ethers.formatEther(remainRewardAmount));

    expect(format(signer1Balance)).equal(format(stakeAmount - unStakeAmount));

    expect(format(signer1Reward)).equal(
      (format(stakeAmount) - format(unStakeAmount)) / 100
    );
    expect(format(remainRewardAmount)).equal(
      format(rewardAmount) - format(signer1Reward)
    );
  });

  it("Should get the right reward when claim reward if stake twice", async function () {
    const stakeAmountF = ethers.parseEther("1000");
    const stakeAmountS = ethers.parseEther("1000");
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("3000");

    await rewardToken.mint(owner.address, rewardAmount);
    await rewardToken.connect(owner).transfer(stakingAddr, rewardAmount);

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.connect(signer1).approve(stakingAddr, approveAmount);

    await stakingRewards.connect(signer1).stake(stakeAmountF);
    await stakingRewards.connect(signer1).stake(stakeAmountS);

    await stakingRewards.connect(signer1).claimReward();

    const signer1Reward = await rewardToken.balanceOf(signer1.address);
    const remainRewardAmount = await rewardToken.balanceOf(stakingAddr);

    console.log("Signer1 reward: " + ethers.formatEther(signer1Reward));
    console.log("Remain reward: " + ethers.formatEther(remainRewardAmount));

    expect(format(signer1Reward)).equal(
      (format(stakeAmountF) + format(stakeAmountF + stakeAmountS)) / 100
    );
    expect(format(remainRewardAmount)).equal(
      format(rewardAmount) - format(signer1Reward)
    );
  });

  it("Should unstake reduce the balance and automatically claim reward if unstake twice", async function () {
    const stakeAmount = ethers.parseEther("500");
    const unStakeAmount = ethers.parseEther("100");
    const mintAmount = ethers.parseEther("10000");
    const approveAmount = ethers.parseEther("500");

    await rewardToken.mint(owner.address, rewardAmount);
    await rewardToken.connect(owner).transfer(stakingAddr, rewardAmount);

    await stakeToken.mint(signer1.address, mintAmount);
    await stakeToken.connect(signer1).approve(stakingAddr, approveAmount);
    await stakingRewards.connect(signer1).stake(stakeAmount);

    await stakingRewards.connect(signer1).unstake(unStakeAmount);

    await stakingRewards.connect(signer1).unstake(unStakeAmount);

    const signer1Balance = await stakingRewards.balanceOf(signer1.address);
    const signer1Reward = await rewardToken.balanceOf(signer1.address);
    const remainRewardAmount = await rewardToken.balanceOf(stakingAddr);

    console.log("Signer1 Balance: " + ethers.formatEther(signer1Balance));
    console.log("Signer1 reward: " + ethers.formatEther(signer1Reward));
    console.log("Remain reward: " + ethers.formatEther(remainRewardAmount));

    expect(format(signer1Balance)).equal(
      format(stakeAmount) - format(unStakeAmount) * 2
    );

    expect(format(signer1Reward)).equal(
      format(stakeAmount - unStakeAmount) / 100 +
        (format(stakeAmount) - format(unStakeAmount) * 2) / 100
    );
    expect(format(remainRewardAmount)).equal(
      format(rewardAmount) - format(signer1Reward)
    );
  });
});
