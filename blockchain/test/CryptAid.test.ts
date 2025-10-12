import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.connect();
import { CryptAid } from "../types/ethers-contracts/CryptAid.js";
import { Signer } from "ethers";

describe("CryptAid Tests", function () {
  let cryptAid: CryptAid;
  let owner: Signer;
  let user1: Signer;
  let user2: Signer;
  let user3: Signer;

  beforeEach(async function () {
    // Get the signer accounts
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Contract Deploy
    const CryptAidFactory = await ethers.getContractFactory("CryptAid");
    cryptAid = await CryptAidFactory.deploy();
    await cryptAid.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with fee = 100", async function () {
      expect(await cryptAid.fee()).to.equal(100);
    });

    it("Should initialize with nextId = 0", async function () {
      expect(await cryptAid.nextId()).to.equal(0);
    });
  });

  describe("addCampaign", function () {
    it("Should create a campaign successfully", async function () {
      await cryptAid.connect(owner).addCampaign(
        "Test Title",
        "Test Description",
        "https://video.com",
        "https://image.com"
      );

      const campaign = await cryptAid.campaings(1);
      
      // Fix: await getAddress() instead of comparing Promise
      expect(campaign.author).to.equal(await owner.getAddress());
      expect(campaign.title).to.equal("Test Title");
      expect(campaign.description).to.equal("Test Description");
      expect(campaign.videoUrl).to.equal("https://video.com");
      expect(campaign.imageUrl).to.equal("https://image.com");
      expect(campaign.balance).to.equal(0);
      expect(campaign.active).to.equal(true);
    });

    it("Should increment nextId after creating campaign", async function () {
      await cryptAid.connect(user1).addCampaign("Title1", "Desc1", "vid1", "img1");
      expect(await cryptAid.nextId()).to.equal(1);

      await cryptAid.connect(user2).addCampaign("Title2", "Desc2", "vid2", "img2");
      expect(await cryptAid.nextId()).to.equal(2);
    });

    it("Should allow multiple users to create campaigns", async function () {
      await cryptAid.connect(user1).addCampaign("Campaign 1", "Desc1", "v1", "i1");
      await cryptAid.connect(user2).addCampaign("Campaign 2", "Desc2", "v2", "i2");
      await cryptAid.connect(user3).addCampaign("Campaign 3", "Desc3", "v3", "i3");

      const campaign1 = await cryptAid.campaings(1);
      const campaign2 = await cryptAid.campaings(2);
      const campaign3 = await cryptAid.campaings(3);

      // Fix: await getAddress() instead of comparing Promise
      expect(campaign1.author).to.equal(await user1.getAddress());
      expect(campaign2.author).to.equal(await user2.getAddress());
      expect(campaign3.author).to.equal(await user3.getAddress());
    });

    it("Should create campaign with empty strings", async function () {
      await cryptAid.connect(owner).addCampaign("", "", "", "");
      
      const campaign = await cryptAid.campaings(1);
      expect(campaign.title).to.equal("");
      expect(campaign.active).to.equal(true);
    });
  });

  describe("donate", function () {
    beforeEach(async function () {
      await cryptAid.connect(owner).addCampaign("Test", "Desc", "video", "image");
    });

    it("Should allow donation to active campaign", async function () {
      const donationAmount = ethers.parseEther("1.0");

      await cryptAid.connect(user1).donate(1, { value: donationAmount });

      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(donationAmount);
    });

    it("Should fail when donating 0 value", async function () {
      await expect(
        cryptAid.connect(user1).donate(1, { value: 0 })
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail when donating to inactive campaign", async function () {
      // First, add sufficient balance
      await cryptAid.connect(user1).donate(1, { value: ethers.parseEther("1.0") });
      
      // Close the campaign
      await cryptAid.connect(owner).withdraw(1);

      // Try to donate to closed campaign
      await expect(
        cryptAid.connect(user2).donate(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Campaign is not active");
    });

    it("Should accumulate multiple donations", async function () {
      await cryptAid.connect(user1).donate(1, { value: ethers.parseEther("0.5") });
      await cryptAid.connect(user2).donate(1, { value: ethers.parseEther("0.3") });
      await cryptAid.connect(user3).donate(1, { value: ethers.parseEther("0.2") });

      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(ethers.parseEther("1.0"));
    });

    it("Should allow author to donate to own campaign", async function () {
      const donationAmount = ethers.parseEther("0.5");
      
      await cryptAid.connect(owner).donate(1, { value: donationAmount });

      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(donationAmount);
    });

    it("Should fail when donating to non-existent campaign", async function () {
      await expect(
        cryptAid.connect(user1).donate(999, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Campaign is not active");
    });
  });

  describe("withdraw", function () {
    beforeEach(async function () {
      await cryptAid.connect(owner).addCampaign("Test", "Desc", "video", "image");
    });

    it("Should allow withdrawal by author with sufficient balance", async function () {
      const donationAmount = ethers.parseEther("1.0");
      const fee = await cryptAid.fee();
      
      await cryptAid.connect(user1).donate(1, { value: donationAmount });

      const balanceBefore = await ethers.provider.getBalance(await owner.getAddress());
      
      const tx = await cryptAid.connect(owner).withdraw(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(await owner.getAddress());
      const expectedBalance = balanceBefore + donationAmount - fee - gasUsed;

      expect(balanceAfter).to.equal(expectedBalance);
    });

    it("Should deactivate campaign after withdrawal", async function () {
      await cryptAid.connect(user1).donate(1, { value: ethers.parseEther("1.0") });
      
      await cryptAid.connect(owner).withdraw(1);

      const campaign = await cryptAid.campaings(1);
      expect(campaign.active).to.equal(false);
    });

    it("Should fail if not the author", async function () {
      await cryptAid.connect(user1).donate(1, { value: ethers.parseEther("1.0") });

      await expect(
        cryptAid.connect(user2).withdraw(1)
      ).to.be.revertedWith("You do not have permission to withdraw");
    });

    it("Should fail if campaign is already closed", async function () {
      await cryptAid.connect(user1).donate(1, { value: ethers.parseEther("1.0") });
      
      await cryptAid.connect(owner).withdraw(1);

      await expect(
        cryptAid.connect(owner).withdraw(1)
      ).to.be.revertedWith("This campaign is closed");
    });

    it("Should fail if balance is insufficient (less than or equal to fee)", async function () {
      await expect(
        cryptAid.connect(owner).withdraw(1)
      ).to.be.revertedWith("This campaign does not have enough balance");
    });

    it("Should fail if balance equals fee exactly", async function () {
      const fee = await cryptAid.fee();
      await cryptAid.connect(user1).donate(1, { value: fee });

      await expect(
        cryptAid.connect(owner).withdraw(1)
      ).to.be.revertedWith("This campaign does not have enough balance");
    });

    it("Should work with balance = fee + 1 wei", async function () {
      const fee = await cryptAid.fee();
      await cryptAid.connect(user1).donate(1, { value: fee + 1n });

      // Fix: remove the expect wrapper and just execute the transaction
      await cryptAid.connect(owner).withdraw(1);
      
      // Verify campaign is closed
      const campaign = await cryptAid.campaings(1);
      expect(campaign.active).to.equal(false);
    });

    it("Should deduct fee correctly", async function () {
      const donationAmount = ethers.parseEther("1.0");
      const fee = await cryptAid.fee();
      
      await cryptAid.connect(user1).donate(1, { value: donationAmount });

      const balanceBefore = await ethers.provider.getBalance(await owner.getAddress());
      
      const tx = await cryptAid.connect(owner).withdraw(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balanceAfter = await ethers.provider.getBalance(await owner.getAddress());
      const received = balanceAfter - balanceBefore + gasUsed;

      expect(received).to.equal(donationAmount - fee);
    });
  });

  describe("Complex Scenarios", function () {
    it("Should manage multiple campaigns independently", async function () {
      // Create 3 campaigns
      await cryptAid.connect(user1).addCampaign("Campaign 1", "D1", "v1", "i1");
      await cryptAid.connect(user2).addCampaign("Campaign 2", "D2", "v2", "i2");
      await cryptAid.connect(user3).addCampaign("Campaign 3", "D3", "v3", "i3");

      // Donations to different campaigns
      await cryptAid.connect(owner).donate(1, { value: ethers.parseEther("1.0") });
      await cryptAid.connect(owner).donate(2, { value: ethers.parseEther("2.0") });
      await cryptAid.connect(owner).donate(3, { value: ethers.parseEther("3.0") });

      // Verify balances
      expect((await cryptAid.campaings(1)).balance).to.equal(ethers.parseEther("1.0"));
      expect((await cryptAid.campaings(2)).balance).to.equal(ethers.parseEther("2.0"));
      expect((await cryptAid.campaings(3)).balance).to.equal(ethers.parseEther("3.0"));

      // Withdraw from campaign 2
      await cryptAid.connect(user2).withdraw(2);

      // Verify states
      expect((await cryptAid.campaings(1)).active).to.equal(true);
      expect((await cryptAid.campaings(2)).active).to.equal(false);
      expect((await cryptAid.campaings(3)).active).to.equal(true);
    });

    it("Should handle complete campaign lifecycle", async function () {
      // 1. Create
      await cryptAid.connect(user1).addCampaign("Full Cycle", "Test", "v", "i");
      let campaign = await cryptAid.campaings(1);
      expect(campaign.active).to.equal(true);
      expect(campaign.balance).to.equal(0);

      // 2. Receive donations
      await cryptAid.connect(user2).donate(1, { value: ethers.parseEther("0.5") });
      await cryptAid.connect(user3).donate(1, { value: ethers.parseEther("0.5") });
      campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(ethers.parseEther("1.0"));

      // 3. Withdraw
      await cryptAid.connect(user1).withdraw(1);
      campaign = await cryptAid.campaings(1);
      expect(campaign.active).to.equal(false);

      // 4. Try to donate again (should fail)
      await expect(
        cryptAid.connect(user2).donate(1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Campaign is not active");
    });

    it("Should maintain correct balance after multiple transactions", async function () {
      await cryptAid.connect(owner).addCampaign("Multi TX", "Test", "v", "i");

      const donations = [
        ethers.parseEther("0.1"),
        ethers.parseEther("0.2"),
        ethers.parseEther("0.3"),
        ethers.parseEther("0.4"),
      ];

      let expectedTotal = 0n;
      for (const amount of donations) {
        await cryptAid.connect(user1).donate(1, { value: amount });
        expectedTotal += amount;
      }

      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(expectedTotal);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very small values", async function () {
      await cryptAid.connect(owner).addCampaign("Tiny", "Test", "v", "i");
      
      await cryptAid.connect(user1).donate(1, { value: 1 }); // 1 wei
      
      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(1);
    });

    it("Should handle very large values", async function () {
      await cryptAid.connect(owner).addCampaign("Huge", "Test", "v", "i");
      
      // Fix: use a reasonable amount that user1 can afford
      const hugeAmount = ethers.parseEther("1000");
      await cryptAid.connect(user1).donate(1, { value: hugeAmount });
      
      const campaign = await cryptAid.campaings(1);
      expect(campaign.balance).to.equal(hugeAmount);
    });

    it("Should fail when accessing campaign with ID 0", async function () {
      const campaign = await cryptAid.campaings(0);
      expect(campaign.author).to.equal(ethers.ZeroAddress);
      expect(campaign.active).to.equal(false);
    });
  });
});