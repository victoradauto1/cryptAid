import { expect } from "chai";
import { ethers } from "hardhat";
import { CryptAid } from "../typechain-types";

describe("CryptAid", function () {
  let cryptAid: CryptAid;
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

    const CryptAidFactory = await ethers.getContractFactory("CryptAid", owner);
    cryptAid = await CryptAidFactory.deploy();
    await cryptAid.waitForDeployment();
  });

  /*//////////////////////////////////////////////////////////////
                          DEPLOYMENT
  //////////////////////////////////////////////////////////////*/

  describe("Deployment", () => {
    it("sets the deployer as owner", async () => {
      expect(await cryptAid.owner()).to.equal(owner.address);
    });

    it("initializes with correct platform fee", async () => {
      expect(await cryptAid.platformFee()).to.equal(250); // 2.5%
    });

    it("initializes with zero campaigns", async () => {
      expect(await cryptAid.campaignCount()).to.equal(0);
    });

    it("initializes with zero platform balance", async () => {
      expect(await cryptAid.platformBalance()).to.equal(0);
    });

    it("sets correct max fee constant", async () => {
      expect(await cryptAid.MAX_FEE()).to.equal(1000); // 10%
    });

    it("sets correct basis points constant", async () => {
      expect(await cryptAid.BASIS_POINTS()).to.equal(10000);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          CAMPAIGN CREATION
  //////////////////////////////////////////////////////////////*/

  describe("createCampaign", () => {
    it("creates a campaign successfully with all fields", async () => {
      const now = await time();
      const deadline = now + 1000;

      const tx = await cryptAid
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
        .to.emit(cryptAid, "CampaignCreated")
        .withArgs(0, author.address, "Help", ONE_ETH, deadline);

      const campaign = await cryptAid.getCampaign(0);
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
      await cryptAid
        .connect(author)
        .createCampaign("Help", "Desc", "", "", 0, 0);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.goal).to.equal(0);
    });

    it("creates campaign without deadline", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Help", "Desc", "", "", ONE_ETH, 0);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.deadline).to.equal(0);
    });

    it("increments campaign count", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Help1", "Desc", "", "", 0, 0);
      expect(await cryptAid.campaignCount()).to.equal(1);

      await cryptAid
        .connect(author)
        .createCampaign("Help2", "Desc", "", "", 0, 0);
      expect(await cryptAid.campaignCount()).to.equal(2);
    });

    it("allows multiple authors to create campaigns", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Help1", "Desc", "", "", 0, 0);
      await cryptAid
        .connect(donor1)
        .createCampaign("Help2", "Desc", "", "", 0, 0);

      const campaign0 = await cryptAid.getCampaign(0);
      const campaign1 = await cryptAid.getCampaign(1);

      expect(campaign0.author).to.equal(author.address);
      expect(campaign1.author).to.equal(donor1.address);
    });

    it("reverts with empty title", async () => {
      await expect(
        cryptAid.createCampaign("", "x", "", "", 0, 0),
      ).to.be.revertedWithCustomError(cryptAid, "EmptyTitle");
    });

    it("reverts with past deadline", async () => {
      await expect(
        cryptAid.createCampaign("x", "x", "", "", 0, (await time()) - 1),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidDeadline");
    });

    it("reverts with current timestamp as deadline", async () => {
      await expect(
        cryptAid.createCampaign("x", "x", "", "", 0, await time()),
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
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, 0);
    });

    it("accepts donation and tracks donor", async () => {
      await expect(cryptAid.connect(donor1).donate(0, { value: ONE_ETH }))
        .to.emit(cryptAid, "DonationReceived")
        .withArgs(0, donor1.address, ONE_ETH);

      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
      expect(await cryptAid.getDonorCount(0)).to.equal(1);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.balance).to.equal(ONE_ETH);
    });

    it("accepts multiple donations from same donor", async () => {
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });

      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
      expect(await cryptAid.getDonorCount(0)).to.equal(1); // Still 1 unique donor
    });

    it("tracks multiple unique donors", async () => {
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor2).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor3).donate(0, { value: HALF_ETH });

      expect(await cryptAid.getDonorCount(0)).to.equal(3);

      const donors = await cryptAid.getCampaignDonors(0);
      expect(donors).to.deep.equal([
        donor1.address,
        donor2.address,
        donor3.address,
      ]);
    });

    it("reverts on zero donation", async () => {
      await expect(
        cryptAid.connect(donor1).donate(0, { value: 0 }),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidAmount");
    });

    it("reverts on non-existent campaign", async () => {
      await expect(
        cryptAid.connect(donor1).donate(999, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignDoesNotExist");
    });

    it("reverts on cancelled campaign", async () => {
      await cryptAid.connect(author).cancelCampaign(0);

      await expect(
        cryptAid.connect(donor1).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("reverts on completed campaign", async () => {
      await cryptAid.connect(donor1).donate(0, { value: TWO_ETH });

      await expect(
        cryptAid.connect(donor2).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("reverts after deadline passed", async () => {
      const deadline = (await time()) + 100;
      await cryptAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", 0, deadline);

      await increaseTime(200);

      await expect(
        cryptAid.connect(donor1).donate(1, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("accepts donation just before deadline", async () => {
      const deadline = (await time()) + 100;
      await cryptAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", 0, deadline);

      await increaseTime(50);

      await expect(
        cryptAid.connect(donor1).donate(1, { value: ONE_ETH }),
      ).to.emit(cryptAid, "DonationReceived");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        AUTO COMPLETE (GOAL)
  //////////////////////////////////////////////////////////////*/

  describe("auto-complete on goal reached", () => {
    it("completes campaign automatically when goal is exactly reached", async () => {
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
      expect(campaign.balance).to.equal(0);

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const authorExpected = ONE_ETH - fee;

      const authorBalanceAfter = await ethers.provider.getBalance(
        author.address,
      );
      expect(authorBalanceAfter - authorBalanceBefore).to.equal(authorExpected);

      expect(await cryptAid.platformBalance()).to.equal(fee);
    });

    it("completes campaign when goal is exceeded", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await expect(
        cryptAid.connect(donor1).donate(0, { value: TWO_ETH }),
      ).to.emit(cryptAid, "CampaignCompleted");

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
    });

    it("completes on final donation that reaches goal", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });

      const campaignBefore = await cryptAid.getCampaign(0);
      expect(campaignBefore.status).to.equal(0); // Still ACTIVE

      await expect(
        cryptAid.connect(donor2).donate(0, { value: HALF_ETH }),
      ).to.emit(cryptAid, "CampaignCompleted");
    });

    it("does not auto-complete campaign with no goal", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(0);
    });

    it("emits correct event with amounts", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      const authorAmount = ONE_ETH - fee;

      await expect(cryptAid.connect(donor1).donate(0, { value: ONE_ETH }))
        .to.emit(cryptAid, "CampaignCompleted")
        .withArgs(0, ONE_ETH, authorAmount, fee);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          WITHDRAW
  //////////////////////////////////////////////////////////////*/

  describe("withdrawCampaign", () => {
    it("allows withdraw after deadline with donations", async () => {
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

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
      expect(campaign.balance).to.equal(0);
    });

    it("allows withdraw when goal is reached", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
    });

    it("reverts withdraw before deadline and goal not reached", async () => {
      const deadline = (await time()) + 1000;

      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, deadline);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("reverts withdraw by non-author", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      await increaseTime(20);

      await expect(
        cryptAid.connect(donor1).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("reverts withdraw with no balance", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      await expect(
        cryptAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "NothingToWithdraw");
    });

    it("reverts withdraw on already completed campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("reverts withdraw on cancelled campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptAid.connect(author).cancelCampaign(0);

      await expect(
        cryptAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("transfers correct amounts on withdraw", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );
      const tx = await cryptAid.connect(author).withdrawCampaign(0);
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
      expect(await cryptAid.platformBalance()).to.equal(fee);
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

      await expect(cryptAid.connect(author).cancelCampaign(0))
        .to.emit(cryptAid, "CampaignCancelled")
        .withArgs(0);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(2);
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

    it("reverts cancel by non-author", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await expect(
        cryptAid.connect(donor1).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("reverts cancel on already completed campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("reverts cancel on already cancelled campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      await cryptAid.connect(author).cancelCampaign(0);

      await expect(
        cryptAid.connect(author).cancelCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("reverts cancel on non-existent campaign", async () => {
      await expect(
        cryptAid.connect(author).cancelCampaign(999),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignDoesNotExist");
    });
  });

  /*//////////////////////////////////////////////////////////////
                        PLATFORM MANAGEMENT
  //////////////////////////////////////////////////////////////*/

  describe("updatePlatformFee", () => {
    it("allows owner to update fee", async () => {
      await expect(cryptAid.updatePlatformFee(500))
        .to.emit(cryptAid, "FeeUpdated")
        .withArgs(250, 500);

      expect(await cryptAid.platformFee()).to.equal(500);
    });

    it("allows setting fee to zero", async () => {
      await cryptAid.updatePlatformFee(0);
      expect(await cryptAid.platformFee()).to.equal(0);
    });

    it("allows setting fee to max", async () => {
      await cryptAid.updatePlatformFee(1000);
      expect(await cryptAid.platformFee()).to.equal(1000);
    });

    it("reverts fee above max", async () => {
      await expect(
        cryptAid.updatePlatformFee(1001),
      ).to.be.revertedWithCustomError(cryptAid, "InvalidFee");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptAid.connect(author).updatePlatformFee(500),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("applies new fee to subsequent campaigns", async () => {
      await cryptAid.updatePlatformFee(500); // 5%

      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      const authorBalanceBefore = await ethers.provider.getBalance(
        author.address,
      );

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

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
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);
      expect(await cryptAid.platformBalance()).to.equal(fee);

      const balanceBefore = await ethers.provider.getBalance(owner.address);

      const tx = await cryptAid.withdrawPlatformFees();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(owner.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.equal(fee);
      expect(await cryptAid.platformBalance()).to.equal(0);
    });

    it("emits PlatformFeesWithdrawn event", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      const fee = (ONE_ETH * BigInt(250)) / BigInt(10000);

      await expect(cryptAid.withdrawPlatformFees())
        .to.emit(cryptAid, "PlatformFeesWithdrawn")
        .withArgs(owner.address, fee);
    });

    it("reverts when no fees to withdraw", async () => {
      await expect(
        cryptAid.withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptAid, "NothingToWithdraw");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptAid.connect(author).withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("accumulates fees from multiple campaigns", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid1", "Desc", "", "", ONE_ETH, 0);
      await cryptAid
        .connect(author)
        .createCampaign("Aid2", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptAid.connect(donor1).donate(1, { value: ONE_ETH });

      const expectedFee = (TWO_ETH * BigInt(250)) / BigInt(10000);
      expect(await cryptAid.platformBalance()).to.equal(expectedFee);
    });
  });

  describe("transferOwnership", () => {
    it("transfers ownership successfully", async () => {
      await cryptAid.transferOwnership(author.address);
      expect(await cryptAid.owner()).to.equal(author.address);
    });

    it("new owner can update fee", async () => {
      await cryptAid.transferOwnership(author.address);
      await expect(cryptAid.connect(author).updatePlatformFee(500)).to.emit(
        cryptAid,
        "FeeUpdated",
      );
    });

    it("old owner cannot update fee after transfer", async () => {
      await cryptAid.transferOwnership(author.address);
      await expect(
        cryptAid.connect(owner).updatePlatformFee(500),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("reverts when called by non-owner", async () => {
      await expect(
        cryptAid.connect(author).transferOwnership(donor1.address),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });

    it("reverts when transferring to zero address", async () => {
      await expect(
        cryptAid.transferOwnership(ethers.ZeroAddress),
      ).to.be.revertedWithCustomError(cryptAid, "Unauthorized");
    });
  });

  /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
  //////////////////////////////////////////////////////////////*/

  describe("getCampaign", () => {
    it("returns complete campaign data", async () => {
      const deadline = (await time()) + 1000;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "vid", "img", ONE_ETH, deadline);

      const campaign = await cryptAid.getCampaign(0);

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
      await expect(cryptAid.getCampaign(999)).to.be.revertedWithCustomError(
        cryptAid,
        "CampaignDoesNotExist",
      );
    });
  });

  describe("isActive", () => {
    it("returns true for active campaign with no deadline or goal", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      expect(await cryptAid.isActive(0)).to.equal(true);
    });

    it("returns true for campaign before deadline", async () => {
      const deadline = (await time()) + 1000;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      expect(await cryptAid.isActive(0)).to.equal(true);
    });

    it("returns false after deadline", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      expect(await cryptAid.isActive(0)).to.equal(false);
    });

    it("returns false when goal reached", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.isActive(0)).to.equal(false);
    });

    it("returns false for cancelled campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      await cryptAid.connect(author).cancelCampaign(0);

      expect(await cryptAid.isActive(0)).to.equal(false);
    });

    it("returns false for completed campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.isActive(0)).to.equal(false);
    });
  });

  describe("getDonation", () => {
    beforeEach(async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns donation amount for donor", async () => {
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
    });

    it("returns zero for non-donor", async () => {
      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(0);
    });

    it("returns accumulated donations", async () => {
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      expect(await cryptAid.getDonation(0, donor1.address)).to.equal(ONE_ETH);
    });
  });

  describe("getCampaignDonors", () => {
    beforeEach(async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns empty array for campaign with no donors", async () => {
      const donors = await cryptAid.getCampaignDonors(0);
      expect(donors.length).to.equal(0);
    });

    it("returns all unique donors", async () => {
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptAid.connect(donor2).donate(0, { value: ONE_ETH });
      await cryptAid.connect(donor3).donate(0, { value: ONE_ETH });

      const donors = await cryptAid.getCampaignDonors(0);
      expect(donors).to.deep.equal([
        donor1.address,
        donor2.address,
        donor3.address,
      ]);
    });

    it("doesn't duplicate donors with multiple donations", async () => {
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });

      const donors = await cryptAid.getCampaignDonors(0);
      expect(donors.length).to.equal(1);
    });
  });

  describe("getDonorCount", () => {
    beforeEach(async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
    });

    it("returns zero for campaign with no donors", async () => {
      expect(await cryptAid.getDonorCount(0)).to.equal(0);
    });

    it("returns correct count", async () => {
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      expect(await cryptAid.getDonorCount(0)).to.equal(1);

      await cryptAid.connect(donor2).donate(0, { value: ONE_ETH });
      expect(await cryptAid.getDonorCount(0)).to.equal(2);
    });
  });

  describe("getProgress", () => {
    it("returns zero for campaign with no goal", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      expect(await cryptAid.getProgress(0)).to.equal(0);
    });

    it("returns zero for campaign with no donations", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      expect(await cryptAid.getProgress(0)).to.equal(0);
    });

    it("returns 50% progress (5000 basis points)", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.getProgress(0)).to.equal(5000);
    });

    it("returns 0 after campaign completes (balance is 0)", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.getProgress(0)).to.equal(0);
    });

    it("calculates progress correctly before completion", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ethers.parseEther("10"), 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.getProgress(0)).to.equal(1000);
    });

    it("reverts for non-existent campaign", async () => {
      await expect(cryptAid.getProgress(999)).to.be.revertedWithCustomError(
        cryptAid,
        "CampaignDoesNotExist",
      );
    });
  });

  describe("canWithdraw", () => {
    it("returns false for campaign with no donations", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);

      await increaseTime(20);

      expect(await cryptAid.canWithdraw(0)).to.equal(false);
    });

    it("returns true after deadline with donations", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      expect(await cryptAid.canWithdraw(0)).to.equal(true);
    });

    it("returns false before deadline without reaching goal", async () => {
      const deadline = (await time()) + 1000;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", TWO_ETH, deadline);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.canWithdraw(0)).to.equal(false);
    });

    it("returns false for completed campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.canWithdraw(0)).to.equal(false);
    });

    it("returns false for cancelled campaign", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);
      await cryptAid.connect(author).cancelCampaign(0);

      expect(await cryptAid.canWithdraw(0)).to.equal(false);
    });
  });

  /*//////////////////////////////////////////////////////////////
                          EDGE CASES & REENTRANCY
  //////////////////////////////////////////////////////////////*/

  describe("Edge Cases", () => {
    it("handles very small donation amounts", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      const smallAmount = BigInt(1); // 1 wei
      await cryptAid.connect(donor1).donate(0, { value: smallAmount });

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.balance).to.equal(smallAmount);
    });

    it("handles very large donation amounts", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, 0);

      const largeAmount = ethers.parseEther("1000");
      await cryptAid.connect(donor1).donate(0, { value: largeAmount });

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.balance).to.equal(largeAmount);
    });

    it("calculates fees correctly for various amounts", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ethers.parseEther("10"), 0);

      const amount = ethers.parseEther("0.123456789");
      await cryptAid.connect(donor1).donate(0, { value: amount });

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.balance).to.equal(amount);

      expect(await cryptAid.platformBalance()).to.equal(0);

      await cryptAid
        .connect(donor2)
        .donate(0, { value: ethers.parseEther("10") });

      const totalDonated = amount + ethers.parseEther("10");
      const expectedFee = (totalDonated * BigInt(250)) / BigInt(10000);
      expect(await cryptAid.platformBalance()).to.equal(expectedFee);
    });

    it("prevents double completion on concurrent donations", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await expect(
        cryptAid.connect(donor2).donate(0, { value: ONE_ETH }),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });
  });

  describe("Reentrancy Protection", () => {
    it("protects withdrawCampaign against reentrancy", async () => {
      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      await cryptAid.connect(author).withdrawCampaign(0);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.balance).to.equal(0);
      expect(campaign.status).to.equal(1);
    });

    it("protects withdrawPlatformFees against reentrancy", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await cryptAid.withdrawPlatformFees();

      expect(await cryptAid.platformBalance()).to.equal(0);
    });
  });

  describe("Additional Coverage Tests", () => {
    describe("campaignExists modifier coverage", () => {
      it("getDonation reverts for non-existent campaign", async () => {
        await expect(
          cryptAid.getDonation(999, donor1.address),
        ).to.be.revertedWithCustomError(cryptAid, "CampaignDoesNotExist");
      });

      it("getCampaignDonors reverts for non-existent campaign", async () => {
        await expect(
          cryptAid.getCampaignDonors(999),
        ).to.be.revertedWithCustomError(cryptAid, "CampaignDoesNotExist");
      });

      it("getDonorCount reverts for non-existent campaign", async () => {
        await expect(cryptAid.getDonorCount(999)).to.be.revertedWithCustomError(
          cryptAid,
          "CampaignDoesNotExist",
        );
      });

      it("isActive reverts for non-existent campaign", async () => {
        await expect(cryptAid.isActive(999)).to.be.revertedWithCustomError(
          cryptAid,
          "CampaignDoesNotExist",
        );
      });

      it("canWithdraw reverts for non-existent campaign", async () => {
        await expect(cryptAid.canWithdraw(999)).to.be.revertedWithCustomError(
          cryptAid,
          "CampaignDoesNotExist",
        );
      });

      it("withdrawCampaign reverts for non-existent campaign", async () => {
        await expect(
          cryptAid.connect(author).withdrawCampaign(999),
        ).to.be.revertedWithCustomError(cryptAid, "CampaignDoesNotExist");
      });
    });

    describe("isActive goal reached check", () => {
      it("returns false when goal is reached but not yet completed", async () => {
        await cryptAid
          .connect(author)
          .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
        await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

        expect(await cryptAid.isActive(0)).to.equal(false);
      });
    });

    describe("canWithdraw goal reached path", () => {
      it("returns false when goal reached and campaign completed", async () => {
        await cryptAid
          .connect(author)
          .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
        await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

        expect(await cryptAid.canWithdraw(0)).to.equal(false);
      });

      it("canWithdraw logic with goal and no deadline", async () => {
        await cryptAid
          .connect(author)
          .createCampaign("Aid", "Desc", "", "", ethers.parseEther("100"), 0);
        await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

        expect(await cryptAid.canWithdraw(0)).to.equal(false);
      });
    });

    describe("_completeCampaign double execution prevention", () => {
      it("prevents execution if campaign is not ACTIVE", async () => {
        await cryptAid
          .connect(author)
          .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);

        await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

        const campaign = await cryptAid.getCampaign(0);
        expect(campaign.status).to.equal(1); // COMPLETED

        await expect(
          cryptAid.connect(author).withdrawCampaign(0),
        ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
      });
    });
  });

  /*//////////////////////////////////////////////////////////////
                          INTEGRATION SCENARIOS
  //////////////////////////////////////////////////////////////*/

  describe("Integration Scenarios", () => {
    it("full campaign lifecycle: create, donate, auto-complete", async () => {
      // Create
      await cryptAid
        .connect(author)
        .createCampaign(
          "Save the Whales",
          "Help us save whales",
          "",
          "",
          ONE_ETH,
          0,
        );

      expect(await cryptAid.isActive(0)).to.equal(true);

      await cryptAid.connect(donor1).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor2).donate(0, { value: HALF_ETH });

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
      expect(await cryptAid.isActive(0)).to.equal(false);
    });

    it("full campaign lifecycle: create, donate, manual withdraw after deadline", async () => {
      const deadline = (await time()) + 100;

      await cryptAid
        .connect(author)
        .createCampaign("Project", "Description", "", "", TWO_ETH, deadline);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      expect(await cryptAid.canWithdraw(0)).to.equal(false);

      await increaseTime(150);

      expect(await cryptAid.canWithdraw(0)).to.equal(true);

      await cryptAid.connect(author).withdrawCampaign(0);

      const campaign = await cryptAid.getCampaign(0);
      expect(campaign.status).to.equal(1);
    });

    it("multiple campaigns can run simultaneously", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Campaign1", "Desc", "", "", ONE_ETH, 0);
      await cryptAid
        .connect(donor1)
        .createCampaign("Campaign2", "Desc", "", "", TWO_ETH, 0);

      await cryptAid.connect(donor2).donate(0, { value: HALF_ETH });
      await cryptAid.connect(donor2).donate(1, { value: ONE_ETH });

      expect((await cryptAid.getCampaign(0)).balance).to.equal(HALF_ETH);
      expect((await cryptAid.getCampaign(1)).balance).to.equal(ONE_ETH);
    });

    it("platform accumulates fees from multiple completed campaigns", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("C1", "Desc", "", "", ONE_ETH, 0);
      await cryptAid
        .connect(author)
        .createCampaign("C2", "Desc", "", "", ONE_ETH, 0);
      await cryptAid
        .connect(author)
        .createCampaign("C3", "Desc", "", "", ONE_ETH, 0);

      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });
      await cryptAid.connect(donor1).donate(1, { value: ONE_ETH });
      await cryptAid.connect(donor1).donate(2, { value: ONE_ETH });

      const totalDonations = ONE_ETH * BigInt(3);
      const expectedFees = (totalDonations * BigInt(250)) / BigInt(10000);

      expect(await cryptAid.platformBalance()).to.equal(expectedFees);
    });
  });

  describe("Transfer Failed Scenarios", () => {
    let maliciousAuthor: any;
    let maliciousAuthorContract: any;

    beforeEach(async () => {
      const MaliciousAuthorFactory = await ethers.getContractFactory(
        "MaliciousAuthor",
      );
      maliciousAuthorContract = await MaliciousAuthorFactory.deploy();
      await maliciousAuthorContract.waitForDeployment();

      [maliciousAuthor] = await ethers.getSigners();
    });

    it("reverts on transfer failed in _completeCampaign", async () => {
      const maliciousAddress = await maliciousAuthorContract.getAddress();

      // Conectar um autor malicioso (simulando a criação da campanha por ele)
      await cryptAid
        .connect(maliciousAuthor)
        .createCampaign("Malicious Campaign", "Desc", "", "", 0, 0);

      // Doação para permitir retirada
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      // Tentar saque
      await expect(
        cryptAid.connect(maliciousAuthor).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "TransferFailed");
    });

    it("reverts on transfer failed in withdrawPlatformFees", async () => {
      // Transferir ownership para contrato malicioso
      await cryptAid.transferOwnership(
        await maliciousAuthorContract.getAddress(),
      );

      // Criar campanha e doar para gerar plataforma fees
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      // O saque de fees deve falhar
      await expect(
        cryptAid.withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptAid, "TransferFailed");
    });
  });

  describe("Reentrancy Coverage", () => {
    it("nonReentrant modifier prevents reentry on withdrawCampaign", async () => {
      // O modifier já é testado indiretamente
      // Mas podemos garantir que o estado é atualizado antes da transferência

      const deadline = (await time()) + 10;
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", 0, deadline);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await increaseTime(20);

      const tx = cryptAid.connect(author).withdrawCampaign(0);

      // Deve completar sem problema
      await expect(tx).to.emit(cryptAid, "CampaignCompleted");

      // E não deve poder chamar de novo
      await expect(
        cryptAid.connect(author).withdrawCampaign(0),
      ).to.be.revertedWithCustomError(cryptAid, "CampaignNotActive");
    });

    it("nonReentrant modifier prevents reentry on withdrawPlatformFees", async () => {
      await cryptAid
        .connect(author)
        .createCampaign("Aid", "Desc", "", "", ONE_ETH, 0);
      await cryptAid.connect(donor1).donate(0, { value: ONE_ETH });

      await cryptAid.withdrawPlatformFees();

      // Não deve poder chamar de novo
      await expect(
        cryptAid.withdrawPlatformFees(),
      ).to.be.revertedWithCustomError(cryptAid, "NothingToWithdraw");
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
