import { expect } from "chai";
import { ethers } from "hardhat";
import { CryptoAid } from "../typechain-types";

describe("CryptoAid", function () {
  let cryptoAid: CryptoAid;
  let owner: any;
  let author: any;
  let donor1: any;
  let donor2: any;
  let donor3: any;

  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");
  const TWO_ETH = ethers.parseEther("2");

  beforeEach(async () => {
    [owner, author, donor1, donor2, donor3] = await ethers.getSigners();

    const CryptoAidFactory = await ethers.getContractFactory("CryptoAid", owner);
    cryptoAid = await CryptoAidFactory.deploy();
    await cryptoAid.waitForDeployment();
  });

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT
  //////////////////////////////////////////////////////////////*/

  describe("Deployment", () => {
    it("sets the deployer as owner", async () => {
      expect(await cryptoAid.owner()).to.equal(owner.address);
    });

    it("initializes with correct platform fee", async () => {
      expect(await cryptoAid.platformFee()).to.equal(250); // 2.5%
    });

    it("initializes with zero campaigns", async () => {
      expect(await cryptoAid.campaignCount()).to.equal(0);
    });

    it("initializes with zero platform balance", async () => {
      expect(await cryptoAid.platformBalance()).to.equal(0);
    });

    it("sets correct max fee constant", async () => {
      expect(await cryptoAid.MAX_FEE()).to.equal(1000); // 10%
    });

    it("sets correct basis points constant", async () => {
      expect(await cryptoAid.BASIS_POINTS()).to.equal(10000);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          CAMPAIGN CREATION
  //////////////////////////////////////////////////////////////*/

  describe("createCampaign", () => {
    it("creates a campaign successfully with all fields", async () => {
      const now = await time();
      const deadline = now + 1000;

      const tx = await cryptoAid
        .connect(author)
        .createCampaign(
          "Help",
          "Desc",
          "video.mp4",
          "image.jpg",
          ONE_ETH,
          deadline,
        );

      await expect(tx)
        .to.emit(cryptoAid, "CampaignCreated")
        .withArgs(0, author.address, "Help", ONE_ETH, deadline);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.author).to.equal(author.address);
      expect(campaign.title).to.equal("Help");
      expect(campaign.description).to.equal("Desc");
      expect(campaign.videoUrl).to.equal("video.mp4");
      expect(campaign.imageUrl).to.equal("image.jpg");
      expect(campaign.goal).to.equal(ONE_ETH);
      expect(campaign.deadline).to.equal(deadline);
      expect(campaign.balance).to.equal(0);
      expect(campaign.status).to.equal(0); // ACTIVE
      expect(campaign.createdAt).to.be.closeTo(now, 5);
    });

    it("creates campaign without goal (open-ended)", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Help", "Desc", "", "", 0, 0);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.goal).to.equal(0);
    });

    it("creates campaign without deadline", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Help", "Desc", "", "", ONE_ETH, 0);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.deadline).to.equal(0);
    });

    it("increments campaign count", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Help1", "Desc", "", "", 0, 0);
      expect(await cryptoAid.campaignCount()).to.equal(1);

      await cryptoAid
        .connect(author)
        .createCampaign("Help2", "Desc", "", "", 0, 0);
      expect(await cryptoAid.campaignCount()).to.equal(2);
    });

    it("allows multiple authors to create campaigns", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Help1", "Desc", "", "", 0, 0);
      await cryptoAid
        .connect(donor1)
        .createCampaign("Help2", "Desc", "", "", 0, 0);

      const campaign0 = await cryptoAid.getCampaign(0);
      const campaign1 = await cryptoAid.getCampaign(1);

      expect(campaign0.author).to.equal(author.address);
      expect(campaign1.author).to.equal(donor1.address);
    });

    it("reverts with empty title", async () => {
      await expect(
        cryptoAid.createCampaign("", "x", "", "", 0, 0),
      ).to.be.revertedWithCustomError(cryptoAid, "EmptyTitle");
    });

    it("reverts with past deadline", async () => {
      await expect(
        cryptoAid.createCampaign("x", "x", "", "", 0, (await time()) - 1),
      ).to.be.revertedWithCustomError(cryptoAid, "InvalidDeadline");
    });

    it("reverts with current timestamp as deadline", async () => {
      await expect(
        cryptoAid.createCampaign("x", "x", "", "", 0, await time()),
      ).to.be.revertedWithCustomError(cryptoAid, "InvalidDeadline");
    });
  });

  /*//////////////////////////////////////////////////////////////
                              DONATIONS
  //////////////////////////////////////////////////////////////*/

  describe("donate", () => {
    beforeEach(async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, 0);
    });

    it("accepts donation and tracks donor", async () => {
      await expect(cryptoAid.connect(donor1).donate(0, { value: ONE_ETH }))
        .to.emit(cryptoAid, "DonationReceived")
        .withArgs(0, donor1.address, ONE_ETH);

      expect(await cryptoAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
      expect(await cryptoAid.getDonorCount(0)).to.equal(1);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.balance).to.equal(ONE_ETH);
    });

    it("accepts multiple donations from same donor", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });

      expect(await cryptoAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
      expect(await cryptoAid.getDonorCount(0)).to.equal(1);
    });

    it("tracks multiple unique donors", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor2).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor3).donate(0, { value: HALF_ETH });

      expect(await cryptoAid.getDonorCount(0)).to.equal(3);

      const donors = await cryptoAid.getCampaignDonors(0);
      expect(donors).to.deep.equal([
        donor1.address,
        donor2.address,
        donor3.address,
      ]);
    });

    it("reverts on zero donation", async () => {
      await expect(
        cryptoAid.connect(donor1).donate(0, { value: 0 }),
      ).to.be.revertedWithCustomError(cryptoAid, "InvalidAmount");
    });

    it("reverts on non-existent campaign", async () => {
      await expect(
        cryptoAid.connect(donor1).donate(999, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignDoesNotExist");
    });

    it("reverts on cancelled campaign", async () => {
      await cryptoAid.connect(author).cancelCampaign(0);

      await expect(
        cryptoAid.connect(donor1).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("reverts on completed campaign", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: TWO_ETH });

      await expect(
        cryptoAid.connect(donor2).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("reverts after deadline passed", async () => {
      const deadline = (await time()) + 100;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", 0, deadline);

      await increaseTime(200);

      await expect(
        cryptoAid.connect(donor1).donate(1, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("accepts donation just before deadline", async () => {
      const deadline = (await time()) + 100;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", 0, deadline);

      await increaseTime(50);

      await expect(
        cryptoAid.connect(donor1).donate(1, { value: ONE_ETH }),
      ).to.emit(cryptoAid, "DonationReceived");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        AUTO COMPLETE (GOAL)
  //////////////////////////////////////////////////////////////*/

  describe("auto-complete on goal reached", () => {
    it("completes campaign automatically when goal is exactly reached", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );

      await expect(
        cryptoAid.connect(donor1).donate(0, { value: ONE_ETH }),
      ).to.emit(cryptoAid, "CampaignCompleted");

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(1); // COMPLETED
      expect(campaign.balance).to.equal(0);

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const authorExpected = ONE_ETH - fee;

      const authorBalanceAfter = await ethers.provider.getBalance(
        author.address,
      );
      expect(authorBalanceAfter - authorBalanceBefore).to.equal(authorExpected);

      expect(await cryptoAid.platformBalance()).to.equal(fee);
    });

    it("completes campaign when goal is exceeded", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await expect(
        cryptoAid.connect(donor1).donate(0, { value: TWO_ETH }),
      ).to.emit(cryptoAid, "CampaignCompleted");

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
    });

    it("completes on final donation that reaches goal", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });

      const campaignBefore = await cryptoAid.getCampaign(0);
      expect(campaignBefore.status).to.equal(0); // Still ACTIVE

      await expect(
        cryptoAid.connect(donor2).donate(0, { value: HALF_ETH }),
      ).to.emit(cryptoAid, "CampaignCompleted");
    });

    it("does not auto-complete campaign with no goal", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(0);
    });

    it("emits correct event with amounts", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const authorAmount = ONE_ETH - fee;

      await expect(cryptoAid.connect(donor1).donate(0, { value: ONE_ETH }))
        .to.emit(cryptoAid, "CampaignCompleted")
        .withArgs(0, ONE_ETH, authorAmount, fee);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          WITHDRAW
  //////////////////////////////////////////////////////////////*/

  describe("withdrawCampaign", () => {
    it("allows withdraw after deadline with donations", async () => {
      const deadline = (await time()) + 10;

      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      await expect(cryptoAid.connect(author).withdrawCampaign(0)).to.emit(
        cryptoAid,
        "CampaignCompleted",
      );

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
      expect(campaign.balance).to.equal(0);
    });

    it("allows withdraw when goal is reached", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
    });

    it("reverts withdraw before deadline and goal not reached", async () => {
      const deadline = (await time()) + 1000;

      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, deadline);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptoAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts withdraw by non-author", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      await increaseTime(20);

      await expect(
        cryptoAid.connect(donor1).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts withdraw with no balance", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      await expect(
        cryptoAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "NothingToWithdraw");
    });

    it("reverts withdraw on already completed campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptoAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("reverts withdraw on cancelled campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptoAid.connect(author).cancelCampaign(0);

      await expect(
        cryptoAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("transfers correct amounts on withdraw", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );
      const tx = await cryptoAid.connect(author).withdrawCampaign(0);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const authorBalanceAfter = await ethers.provider.getBalance(
        author.address,
      );

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const expectedAuthorAmount = ONE_ETH - fee;

      expect(authorBalanceAfter - authorBalanceBefore + gasUsed).to.equal(
        expectedAuthorAmount,
      );
      expect(await cryptoAid.platformBalance()).to.equal(fee);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          CANCEL
  //////////////////////////////////////////////////////////////*/

  describe("cancelCampaign", () => {
    it("allows author to cancel if no donations", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await expect(cryptoAid.connect(author).cancelCampaign(0))
        .to.emit(cryptoAid, "CampaignCancelled")
        .withArgs(0);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(2);
    });

    it("reverts cancel if donations exist", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptoAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts cancel by non-author", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await expect(
        cryptoAid.connect(donor1).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts cancel on already completed campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptoAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("reverts cancel on already cancelled campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptoAid.connect(author).cancelCampaign(0);

      await expect(
        cryptoAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });

    it("reverts cancel on non-existent campaign", async () => {
      await expect(
        cryptoAid.connect(author).cancelCampaign(999),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignDoesNotExist");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        PLATFORM MANAGEMENT
  //////////////////////////////////////////////////////////////*/

  describe("updatePlatformFee", () => {
    it("allows owner to update fee", async () => {
      await expect(cryptoAid.updatePlatformFee(500))
        .to.emit(cryptoAid, "FeeUpdated")
        .withArgs(250, 500);

      expect(await cryptoAid.platformFee()).to.equal(500);
    });

    it("allows setting fee to zero", async () => {
      await cryptoAid.updatePlatformFee(0);
      expect(await cryptoAid.platformFee()).to.equal(0);
    });

    it("allows setting fee to max", async () => {
      await cryptoAid.updatePlatformFee(1000);
      expect(await cryptoAid.platformFee()).to.equal(1000);
    });

    it("reverts fee above max", async () => {
      await expect(
        cryptoAid.updatePlatformFee(1001),
      ).to.be.revertedWithCustomError(cryptoAid, "InvalidFee");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptoAid.connect(author).updatePlatformFee(500),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("applies new fee to subsequent campaigns", async () => {
      await cryptoAid.updatePlatformFee(500); // 5%

      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      const fee = (ONE_ETH * BigInt(500)) / BigInt(10000);
      const expectedAuthorAmount = ONE_ETH - fee;

      const authorBalanceAfter = await ethers.provider.getBalance(
        author.address,
      );
      expect(authorBalanceAfter - authorBalanceBefore).to.equal(
        expectedAuthorAmount,
      );
    });
  });

  describe("withdrawPlatformFees", () => {
    it("withdraws platform fees successfully", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      expect(await cryptoAid.platformBalance()).to.equal(fee);

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await cryptoAid.withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.equal(fee);
      expect(await cryptoAid.platformBalance()).to.equal(0);
    });

    it("emits PlatformFeesWithdrawn event", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);

      await expect(cryptoAid.withdrawPlatformFees())
        .to.emit(cryptoAid, "PlatformFeesWithdrawn")
        .withArgs(owner.address, fee);
    });

    it("reverts when no fees to withdraw", async () => {
      await expect(
        cryptoAid.withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptoAid, "NothingToWithdraw");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptoAid.connect(author).withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("accumulates fees from multiple campaigns", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid1", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptoAid.connect(donor1).donate(1, { value: ONE_ETH });

      const expectedFee = (TWO_ETH * BigInt(250)) / BigInt(10000);
      expect(await cryptoAid.platformBalance()).to.equal(expectedFee);
    });
  });

  describe("transferOwnership", () => {
    it("transfers ownership successfully", async () => {
      await cryptoAid.transferOwnership(author.address);
      expect(await cryptoAid.owner()).to.equal(author.address);
    });

    it("new owner can update fee", async () => {
      await cryptoAid.transferOwnership(author.address);
      await expect(cryptoAid.connect(author).updatePlatformFee(500)).to.emit(
        cryptoAid,
        "FeeUpdated",
      );
    });

    it("old owner cannot update fee after transfer", async () => {
      await cryptoAid.transferOwnership(author.address);
      await expect(
        cryptoAid.connect(owner).updatePlatformFee(500),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptoAid.connect(author).transferOwnership(donor1.address),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });

    it("reverts when transferring to zero address", async () => {
      await expect(
        cryptoAid.transferOwnership(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(cryptoAid, "Unauthorized");
    });
  });

  /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
  //////////////////////////////////////////////////////////////*/

  describe("getCampaign", () => {
    it("returns complete campaign data", async () => {
      const deadline = (await time()) + 1000;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "vid", "img", ONE_ETH, deadline);

      const campaign = await cryptoAid.getCampaign(0);

      expect(campaign.author).to.equal(author.address);
      expect(campaign.title).to.equal("Aid");
      expect(campaign.description).to.equal("Desc");
      expect(campaign.videoUrl).to.equal("vid");
      expect(campaign.imageUrl).to.equal("img");
      expect(campaign.balance).to.equal(0);
      expect(campaign.goal).to.equal(ONE_ETH);
      expect(campaign.deadline).to.equal(deadline);
      expect(campaign.status).to.equal(0);
    });

    it("reverts for non-existent campaign", async () => {
      await expect(cryptoAid.getCampaign(999)).to.be.revertedWithCustomError(
        cryptoAid,
        "CampaignDoesNotExist",
      );
    });
  });

  describe("isActive", () => {
    it("returns true for active campaign with no deadline or goal", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      expect(await cryptoAid.isActive(0)).to.equal(true);
    });

    it("returns true for campaign before deadline", async () => {
      const deadline = (await time()) + 1000;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      expect(await cryptoAid.isActive(0)).to.equal(true);
    });

    it("returns false after deadline", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      expect(await cryptoAid.isActive(0)).to.equal(false);
    });

    it("returns false when goal reached", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.isActive(0)).to.equal(false);
    });

    it("returns false for cancelled campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      await cryptoAid.connect(author).cancelCampaign(0);

      expect(await cryptoAid.isActive(0)).to.equal(false);
    });

    it("returns false for completed campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.isActive(0)).to.equal(false);
    });
  });

  describe("getDonation", () => {
    beforeEach(async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns donation amount for donor", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      expect(await cryptoAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
    });

    it("returns zero for non-donor", async () => {
      expect(await cryptoAid.getDonation(0, donor1.address)).to.equal(0);
    });

    it("returns accumulated donations", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      expect(await cryptoAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
    });
  });

  describe("getCampaignDonors", () => {
    beforeEach(async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns empty array for campaign with no donors", async () => {
      const donors = await cryptoAid.getCampaignDonors(0);
      expect(donors.length).to.equal(0);
    });

    it("returns all unique donors", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptoAid.connect(donor2).donate(0, { value: ONE_ETH });
      await cryptoAid.connect(donor3).donate(0, { value: ONE_ETH });

      const donors = await cryptoAid.getCampaignDonors(0);
      expect(donors).to.deep.equal([
        donor1.address,
        donor2.address,
        donor3.address,
      ]);
    });

    it("doesn't duplicate donors with multiple donations", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });

      const donors = await cryptoAid.getCampaignDonors(0);
      expect(donors.length).to.equal(1);
    });
  });

  describe("getDonorCount", () => {
    beforeEach(async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns zero for campaign with no donors", async () => {
      expect(await cryptoAid.getDonorCount(0)).to.equal(0);
    });

    it("returns correct count", async () => {
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      expect(await cryptoAid.getDonorCount(0)).to.equal(1);

      await cryptoAid.connect(donor2).donate(0, { value: ONE_ETH });
      expect(await cryptoAid.getDonorCount(0)).to.equal(2);
    });
  });

  describe("getProgress", () => {
    it("returns zero for campaign with no goal", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      expect(await cryptoAid.getProgress(0)).to.equal(0);
    });

    it("returns zero for campaign with no donations", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      expect(await cryptoAid.getProgress(0)).to.equal(0);
    });

    it("returns 50% progress (5000 basis points)", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.getProgress(0)).to.equal(5000);
    });

    it("returns 0 after campaign completes (balance is 0)", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.getProgress(0)).to.equal(0);
    });

    it("calculates progress correctly before completion", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ethers.parseEther("10"), 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.getProgress(0)).to.equal(1000);
    });

    it("reverts for non-existent campaign", async () => {
      await expect(cryptoAid.getProgress(999)).to.be.revertedWithCustomError(
        cryptoAid,
        "CampaignDoesNotExist",
      );
    });
  });

  describe("canWithdraw", () => {
    it("returns false for campaign with no donations", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      expect(await cryptoAid.canWithdraw(0)).to.equal(false);
    });

    it("returns true after deadline with donations", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      expect(await cryptoAid.canWithdraw(0)).to.equal(true);
    });

    it("returns false before deadline without reaching goal", async () => {
      const deadline = (await time()) + 1000;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, deadline);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.canWithdraw(0)).to.equal(false);
    });

    it("returns false for completed campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.canWithdraw(0)).to.equal(false);
    });

    it("returns false for cancelled campaign", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      await cryptoAid.connect(author).cancelCampaign(0);

      expect(await cryptoAid.canWithdraw(0)).to.equal(false);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          EDGE CASES & REENTRANCY
  //////////////////////////////////////////////////////////////*/

  describe("Edge Cases", () => {
    it("handles very small donation amounts", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      const smallAmount = BigInt(1);
      await cryptoAid.connect(donor1).donate(0, { value: smallAmount });

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.balance).to.equal(smallAmount);
    });

    it("handles very large donation amounts", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      const largeAmount = ethers.parseEther("1000");
      await cryptoAid.connect(donor1).donate(0, { value: largeAmount });

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.balance).to.equal(largeAmount);
    });

    it("calculates fees correctly for various amounts", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ethers.parseEther("10"), 0);

      const amount = ethers.parseEther("0.123456789");
      await cryptoAid.connect(donor1).donate(0, { value: amount });

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.balance).to.equal(amount);

      expect(await cryptoAid.platformBalance()).to.equal(0);

      await cryptoAid
        .connect(donor2)
        .donate(0, { value: ethers.parseEther("10") });

      const totalDonated = amount + ethers.parseEther("10");
      const expectedFee = (totalDonated * BigInt(250)) / BigInt(10000);
      expect(await cryptoAid.platformBalance()).to.equal(expectedFee);
    });

    it("prevents double completion on concurrent donations", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptoAid.connect(donor2).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
    });
  });

  describe("Reentrancy Protection", () => {
    it("protects withdrawCampaign against reentrancy", async () => {
      const deadline = (await time()) + 10;
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      await cryptoAid.connect(author).withdrawCampaign(0);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.balance).to.equal(0);
      expect(campaign.status).to.equal(1);
    });

    it("protects withdrawPlatformFees against reentrancy", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      await cryptoAid.withdrawPlatformFees();

      expect(await cryptoAid.platformBalance()).to.equal(0);
    });
  });

  describe("Additional Coverage Tests", () => {
    describe("campaignExists modifier coverage", () => {
      it("getDonation reverts for non-existent campaign", async () => {
        await expect(
          cryptoAid.getDonation(999, donor1.address),
        ).to.be.revertedWithCustomError(cryptoAid, "CampaignDoesNotExist");
      });

      it("getCampaignDonors reverts for non-existent campaign", async () => {
        await expect(
          cryptoAid.getCampaignDonors(999),
        ).to.be.revertedWithCustomError(cryptoAid, "CampaignDoesNotExist");
      });

      it("getDonorCount reverts for non-existent campaign", async () => {
        await expect(cryptoAid.getDonorCount(999)).to.be.revertedWithCustomError(
          cryptoAid,
          "CampaignDoesNotExist",
        );
      });

      it("isActive reverts for non-existent campaign", async () => {
        await expect(cryptoAid.isActive(999)).to.be.revertedWithCustomError(
          cryptoAid,
          "CampaignDoesNotExist",
        );
      });

      it("canWithdraw reverts for non-existent campaign", async () => {
        await expect(cryptoAid.canWithdraw(999)).to.be.revertedWithCustomError(
          cryptoAid,
          "CampaignDoesNotExist",
        );
      });

      it("withdrawCampaign reverts for non-existent campaign", async () => {
        await expect(
          cryptoAid.connect(author).withdrawCampaign(999),
        ).to.be.revertedWithCustomError(cryptoAid, "CampaignDoesNotExist");
      });
    });

    describe("_completeCampaign double execution prevention", () => {
      it("prevents execution if campaign is not ACTIVE", async () => {
        await cryptoAid
          .connect(author)
          .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

        await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

        const campaign = await cryptoAid.getCampaign(0);
        expect(campaign.status).to.equal(1);

        await expect(
          cryptoAid.connect(author).withdrawCampaign(0),
        ).to.be.revertedWithCustomError(cryptoAid, "CampaignNotActive");
      });
    });
  });

  /*//////////////////////////////////////////////////////////////
                          INTEGRATION SCENARIOS
  //////////////////////////////////////////////////////////////*/

  describe("Integration Scenarios", () => {
    it("full campaign lifecycle: create, donate, auto-complete", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign(
          "Save the Whales",
          "Help us save whales",
          "",
          "",
          ONE_ETH,
          0,
        );

      expect(await cryptoAid.isActive(0)).to.equal(true);

      await cryptoAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor2).donate(0, { value: HALF_ETH });

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
      expect(await cryptoAid.isActive(0)).to.equal(false);
    });

    it("full campaign lifecycle: create, donate, manual withdraw after deadline", async () => {
      const deadline = (await time()) + 100;

      await cryptoAid
        .connect(author)
        .createCampaign("Project", "Description", "", "", TWO_ETH, deadline);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptoAid.canWithdraw(0)).to.equal(false);

      await increaseTime(150);

      expect(await cryptoAid.canWithdraw(0)).to.equal(true);

      await cryptoAid.connect(author).withdrawCampaign(0);

      const campaign = await cryptoAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
    });

    it("multiple campaigns can run simultaneously", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("Campaign1", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid
        .connect(donor1)
        .createCampaign("Campaign2", "Desc", "", "", TWO_ETH, 0);

      await cryptoAid.connect(donor2).donate(0, { value: HALF_ETH });
      await cryptoAid.connect(donor2).donate(1, { value: ONE_ETH });

      expect((await cryptoAid.getCampaign(0)).balance).to.equal(HALF_ETH);
      expect((await cryptoAid.getCampaign(1)).balance).to.equal(ONE_ETH);
    });

    it("platform accumulates fees from multiple completed campaigns", async () => {
      await cryptoAid
        .connect(author)
        .createCampaign("C1", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid
        .connect(author)
        .createCampaign("C2", "Desc", "", "", ONE_ETH, 0);
      await cryptoAid
        .connect(author)
        .createCampaign("C3", "Desc", "", "", ONE_ETH, 0);

      await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptoAid.connect(donor1).donate(1, { value: ONE_ETH });
      await cryptoAid.connect(donor1).donate(2, { value: ONE_ETH });

      const totalDonations = ONE_ETH * BigInt(3);
      const expectedFees = (totalDonations * BigInt(250)) / BigInt(10000);

      expect(await cryptoAid.platformBalance()).to.equal(expectedFees);
    });
  });

  /*//////////////////////////////////////////////////////////////
                      TRANSFER FAILED & REENTRANCY
  //////////////////////////////////////////////////////////////*/

  describe("TransferFailed & Reentrancy - Complete Coverage", () => {
    describe("TransferFailed Scenarios", () => {
      it("reverts when author rejects payment (auto-complete)", async () => {
        const MaliciousActorFactory = await ethers.getContractFactory("MaliciousActor");
        const malicious = await MaliciousActorFactory.deploy();
        const maliciousAddr = await malicious.getAddress();

        await ethers.provider.send("hardhat_setBalance", [maliciousAddr, ethers.toBeHex(ethers.parseEther("10"))]);
        await ethers.provider.send("hardhat_impersonateAccount", [maliciousAddr]);
        
        const signer = await ethers.getSigner(maliciousAddr);
        await cryptoAid.connect(signer).createCampaign("Evil", "Desc", "", "", ONE_ETH, 0);
        
        await ethers.provider.send("hardhat_stopImpersonatingAccount", [maliciousAddr]);

        await expect(
          cryptoAid.connect(donor1).donate(0, { value: ONE_ETH })
        ).to.be.revertedWithCustomError(cryptoAid, "TransferFailed");
      });

      it("reverts when author rejects payment (manual withdraw)", async () => {
        const MaliciousActorFactory = await ethers.getContractFactory("MaliciousActor");
        const malicious = await MaliciousActorFactory.deploy();
        const maliciousAddr = await malicious.getAddress();

        await ethers.provider.send("hardhat_setBalance", [maliciousAddr, ethers.toBeHex(ethers.parseEther("10"))]);
        await ethers.provider.send("hardhat_impersonateAccount", [maliciousAddr]);
        
        const signer = await ethers.getSigner(maliciousAddr);
        const deadline = (await time()) + 100;
        await cryptoAid.connect(signer).createCampaign("Evil", "Desc", "", "", ethers.parseEther("100"), deadline);
        
        await ethers.provider.send("hardhat_stopImpersonatingAccount", [maliciousAddr]);

        await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
        await increaseTime(150);

        await ethers.provider.send("hardhat_impersonateAccount", [maliciousAddr]);
        const signer2 = await ethers.getSigner(maliciousAddr);

        await expect(
          cryptoAid.connect(signer2).withdrawCampaign(0)
        ).to.be.revertedWithCustomError(cryptoAid, "TransferFailed");

        await ethers.provider.send("hardhat_stopImpersonatingAccount", [maliciousAddr]);
      });

      it("reverts when owner rejects platform fees", async () => {
        await cryptoAid.connect(author).createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
        await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

        const MaliciousActorFactory = await ethers.getContractFactory("MaliciousActor");
        const malicious = await MaliciousActorFactory.deploy();
        const maliciousAddr = await malicious.getAddress();

        await cryptoAid.transferOwnership(maliciousAddr);

        await ethers.provider.send("hardhat_setBalance", [maliciousAddr, ethers.toBeHex(ethers.parseEther("10"))]);
        await ethers.provider.send("hardhat_impersonateAccount", [maliciousAddr]);
        
        const signer = await ethers.getSigner(maliciousAddr);

        await expect(
          cryptoAid.connect(signer).withdrawPlatformFees()
        ).to.be.revertedWithCustomError(cryptoAid, "TransferFailed");

        await ethers.provider.send("hardhat_stopImpersonatingAccount", [maliciousAddr]);
      });
    });

    describe("Reentrancy Protection", () => {
      it("blocks reentrancy on withdrawCampaign", async () => {
        const ReentrantActorFactory = await ethers.getContractFactory("ReentrantActor");
        const attacker = await ReentrantActorFactory.deploy(await cryptoAid.getAddress());
        const attackerAddr = await attacker.getAddress();

        await ethers.provider.send("hardhat_setBalance", [attackerAddr, ethers.toBeHex(ethers.parseEther("10"))]);
        await ethers.provider.send("hardhat_impersonateAccount", [attackerAddr]);
        
        const signer = await ethers.getSigner(attackerAddr);
        const deadline = (await time()) + 100;
        await attacker.connect(signer).setupCampaign(0, deadline);
        
        await ethers.provider.send("hardhat_stopImpersonatingAccount", [attackerAddr]);

        await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });
        await increaseTime(150);

        await ethers.provider.send("hardhat_impersonateAccount", [attackerAddr]);
        const signer2 = await ethers.getSigner(attackerAddr);

        await expect(
          attacker.connect(signer2).attackWithdraw()
        ).to.be.reverted;

        await ethers.provider.send("hardhat_stopImpersonatingAccount", [attackerAddr]);
      });

      it("blocks reentrancy on withdrawPlatformFees", async () => {
        await cryptoAid.connect(author).createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
        await cryptoAid.connect(donor1).donate(0, { value: ONE_ETH });

        const platformBalanceBefore = await cryptoAid.platformBalance();
        expect(platformBalanceBefore).to.be.gt(0);

        const ReentrantActorFactory = await ethers.getContractFactory("ReentrantActor");
        const attacker = await ReentrantActorFactory.deploy(await cryptoAid.getAddress());
        const attackerAddr = await attacker.getAddress();

        await cryptoAid.transferOwnership(attackerAddr);

        await ethers.provider.send("hardhat_setBalance", [attackerAddr, ethers.toBeHex(ethers.parseEther("10"))]);
        await ethers.provider.send("hardhat_impersonateAccount", [attackerAddr]);
        
        const signer = await ethers.getSigner(attackerAddr);

        await expect(
          attacker.connect(signer).attackPlatformFees()
        ).to.be.reverted;

        await ethers.provider.send("hardhat_stopImpersonatingAccount", [attackerAddr]);

        expect(await cryptoAid.platformBalance()).to.equal(platformBalanceBefore);
      });
    });
  });

  /*//////////////////////////////////////////////////////////////
                      TEST HARNESS - UNREACHABLE BRANCHES
  //////////////////////////////////////////////////////////////*/

  describe("Test Harness - Unreachable Branches", () => {
    let harness: any;

    beforeEach(async () => {
      const Factory = await ethers.getContractFactory("CryptoAidTestHarness");
      harness = await Factory.deploy();
    });

    it("_completeCampaign early return on COMPLETED status", async () => {
      await harness.connect(author).createCampaign("Aid", "Desc", "", "", 0, 0);
      await harness.connect(donor1).donate(0, { value: ONE_ETH });
      
      await harness.exposed_setCampaignStatus(0, 1);
      await harness.exposed_completeCampaign(0);
      
      const campaign = await harness.getCampaign(0);
      expect(campaign.balance).to.equal(ONE_ETH);
    });

    it("isActive returns false when goal reached (forced)", async () => {
      await harness.connect(author).createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await harness.connect(donor1).donate(0, { value: ethers.parseEther("0.5") });
      
      await harness.exposed_setCampaignBalance(0, ONE_ETH);
      
      expect(await harness.isActive(0)).to.equal(false);
    });

    it("canWithdraw returns true via goalReached path (forced)", async () => {
      await harness.connect(author).createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await harness.connect(donor1).donate(0, { value: ethers.parseEther("0.5") });
      
      await harness.exposed_setCampaignBalance(0, ONE_ETH);
      
      expect(await harness.canWithdraw(0)).to.equal(true);
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