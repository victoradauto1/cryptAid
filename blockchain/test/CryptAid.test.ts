import { expect } from "chai";
import { ethers } from "hardhat";
import { CryptAid } from "../typechain-types";

describe("CryptAid", function () {
  let cryptAid: CryptAid;
  let owner: any;
  let author: any;
  let donor1: any;
  let donor2: any;

  const ONE_ETH = ethers.parseEther("1");

  beforeEach(async () => {
    [owner, author, donor1, donor2] = await ethers.getSigners();

    const CryptAidFactory = await ethers.getContractFactory("CryptAid", owner);
    cryptAid = await CryptAidFactory.deploy();
    await cryptAid.waitForDeployment();
  });

  /*//////////////////////////////////////////////////////////////
                          CAMPAIGN CREATION
  //////////////////////////////////////////////////////////////*/

  describe("createCampaign", () => {
    it("creates a campaign successfully", async () => {
      const now = await time();

      const deadline = now + 1000;

      const tx = await cryptAid
        .connect(author)
        .createCampaign("Help", "Desc", "", "", ONE_ETH, deadline);

      await expect(tx)
        .to.emit(cryptAid, "CampaignCreated")
        .withArgs(0, author.address, "Help", ONE_ETH, deadline);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.author).to.equal(author.address);
      expect(campaign.status).to.equal(0); // ACTIVE
    });

    it("reverts with empty title", async () => {
      await expect(
        cryptAid.createCampaign("", "x", "", "", 0, 0),
      ).to.be.revertedWithCustomError(cryptAid, "EmptyTitle");
    });

    it("reverts with invalid deadline", async () => {
      await expect(
        cryptAid.createCampaign("x", "x", "", "", 0, (await time()) - 1),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidDeadline");
    });
  });

  /*//////////////////////////////////////////////////////////////
                              DONATIONS
  //////////////////////////////////////////////////////////////*/

  describe("donate", () => {
    beforeEach(async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
    });

    it("accepts donation and tracks donor", async () => {
      await expect(cryptAid.connect(donor1).donate(0, { value: ONE_ETH }))
        .to.emit(cryptAid, "DonationReceived")
        .withArgs(0, donor1.address, ONE_ETH);

      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
      expect(await cryptAid.getDonorCount(0)).to.equal(1);
    });

    it("reverts on zero donation", async () => {
      await expect(
        cryptAid.connect(donor1).donate(0, { value: 0 }),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidAmount");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        AUTO COMPLETE (GOAL)
  //////////////////////////////////////////////////////////////*/

  describe("auto-complete on goal reached", () => {
    it("completes campaign automatically when goal is reached", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );

      await expect(
        cryptAid.connect(donor1).donate(0, { value: ONE_ETH }),
      ).to.emit(cryptAid, "CampaignCompleted");

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(1); // COMPLETED

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const authorExpected = ONE_ETH - fee;

      const authorBalanceAfter = await ethers.provider.getBalance(
        author.address,
      );

      expect(authorBalanceAfter - authorBalanceBefore).to.equal(authorExpected);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          WITHDRAW
  //////////////////////////////////////////////////////////////*/

  describe("withdrawCampaign", () => {
    it("allows withdraw after deadline", async () => {
      const deadline = (await time()) + 10;

      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      await expect(cryptAid.connect(author).withdrawCampaign(0)).to.emit(
        cryptAid,
        "CampaignCompleted",
      );
    });

    it("reverts withdraw by non-author", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(donor1).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });
  });

  /*//////////////////////////////////////////////////////////////
                          CANCEL
  //////////////////////////////////////////////////////////////*/

  describe("cancelCampaign", () => {
    it("allows author to cancel if no donations", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await expect(cryptAid.connect(author).cancelCampaign(0)).to.emit(
        cryptAid,
        "CampaignCancelled",
      );

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(2); // CANCELLED
    });

    it("reverts cancel if donations exist", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        PLATFORM MANAGEMENT
  //////////////////////////////////////////////////////////////*/

  describe("platform fees", () => {
    it("allows owner to update fee", async () => {
      await expect(cryptAid.updatePlatformFee(500))
        .to.emit(cryptAid, "FeeUpdated")
        .withArgs(250, 500);
    });

    it("reverts fee above max", async () => {
      await expect(
        cryptAid.updatePlatformFee(2000),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidFee");
    });

    it("withdraws platform fees", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      await cryptAid.withdrawPlatformFees();

      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.be.gt(balanceBefore);
    });
  });
});

/*//////////////////////////////////////////////////////////////
                          HELPERS
//////////////////////////////////////////////////////////////*/

async function time() {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}

async function increaseTime(seconds: number) {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}
