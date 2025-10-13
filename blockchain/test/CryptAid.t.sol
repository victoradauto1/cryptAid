// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/CryptAid.sol";

contract CryptAidTest is Test {
    CryptAid cryptAid;

    address user1 = address(0x123);
    address user2 = address(0x456);
    address owner;

    event Withdrawn(
        uint256 indexed id,
        uint256 amount,
        address indexed recipient
    );

    function setUp() public {
        cryptAid = new CryptAid();
        owner = address(this);
    }

    receive() external payable {}

    // Test 1: Create a campaign
    function test_AddCampaign() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");
        
        (address author, string memory title, string memory description, string memory videoUrl, string memory imageUrl, uint256 balance, bool active) = cryptAid.campaings(1);
        
        assertEq(author, owner);
        assertEq(title, "Title");
        assertEq(description, "Desc");
        assertEq(videoUrl, "video.com");
        assertEq(imageUrl, "image.com");
        assertEq(balance, 0);
        assertTrue(active);
    }

    // Test 2: Check initial nextId
    function test_InitialNextId() public view {
        assertEq(cryptAid.nextId(), 0);
    }

    // Test 3: Check fee constant
    function test_FeeConstant() public view {
        assertEq(cryptAid.fee(), 100);
    }

    // Test 4: Increment nextId after creating campaigns
    function test_IncrementNextId() public {
        cryptAid.addCampaign("Title1", "Desc1", "v1", "i1");
        assertEq(cryptAid.nextId(), 1);

        cryptAid.addCampaign("Title2", "Desc2", "v2", "i2");
        assertEq(cryptAid.nextId(), 2);
    }

    // Test 5: Donate to active campaign
    function test_Donate() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 0.5 ether}(1);

        (, , , , , uint256 balance, ) = cryptAid.campaings(1);
        assertEq(balance, 0.5 ether);
    }

    // Test 6: Donate with zero value should revert
    function test_DonateZeroValue() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(bytes("Amount must be greater than 0"));
        cryptAid.donate{value: 0}(1);
    }

    // Test 7: Try to donate to a closed campaign
    function test_DonateClosedCampaign() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user2, 1 ether);
        vm.prank(user2);
        cryptAid.donate{value: 0.5 ether}(1);

        vm.prank(owner);
        cryptAid.withdraw(1);

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(bytes("Campaign is not active"));
        cryptAid.donate{value: 0.1 ether}(1);
    }

    // Test 8: Donate to non-existent campaign
    function test_DonateNonExistentCampaign() public {
        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(bytes("Campaign is not active"));
        cryptAid.donate{value: 0.5 ether}(999);
    }

    // Test 9: Multiple donations accumulate correctly
    function test_MultipleDonations() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 0.3 ether}(1);

        vm.deal(user2, 1 ether);
        vm.prank(user2);
        cryptAid.donate{value: 0.2 ether}(1);

        (, , , , , uint256 balance, ) = cryptAid.campaings(1);
        assertEq(balance, 0.5 ether);
    }

    // Test 10: Withdraw funds successfully
    function test_Withdraw() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        uint256 balanceBefore = owner.balance;

        cryptAid.withdraw(1);

        (, , , , , uint256 campaignBalance, bool active) = cryptAid.campaings(1);
        assertEq(campaignBalance, 0);
        assertFalse(active);

        uint256 expected = 1 ether - cryptAid.fee();
        assertEq(address(this).balance - balanceBefore, expected);
    }

    // Test 11: Withdraw emits event
    function test_WithdrawEmitsEvent() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        uint256 expectedAmount = 1 ether - cryptAid.fee();

        vm.expectEmit(true, true, false, true);
        emit Withdrawn(1, expectedAmount, owner);
        
        cryptAid.withdraw(1);
    }

    // Test 12: Withdraw with insufficient balance
    function test_WithdrawInsufficientBalance() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.expectRevert(bytes("This campaign does not have enough balance"));
        cryptAid.withdraw(1);
    }

    // Test 13: Withdraw with balance equal to fee
    function test_WithdrawBalanceEqualsFee() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: cryptAid.fee()}(1);

        vm.expectRevert(bytes("This campaign does not have enough balance"));
        cryptAid.withdraw(1);
    }

    // Test 14: Withdraw with balance = fee + 1 wei
    function test_WithdrawMinimumBalance() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: cryptAid.fee() + 1}(1);

        cryptAid.withdraw(1);

        (, , , , , , bool active) = cryptAid.campaings(1);
        assertFalse(active);
    }

    // Test 15: Withdraw without being the author
    function test_WithdrawNotAuthor() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        vm.prank(user2);
        vm.expectRevert(bytes("You do not have permission to withdraw"));
        cryptAid.withdraw(1);
    }

    // Test 16: Withdraw from already closed campaign
    function test_WithdrawAlreadyClosed() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        cryptAid.withdraw(1);

        vm.expectRevert(bytes("This campaign is closed"));
        cryptAid.withdraw(1);
    }

    // Test 17: Campaign with empty strings
    function test_CampaignEmptyStrings() public {
        cryptAid.addCampaign("", "", "", "");

        (address author, string memory title, , , , , bool active) = cryptAid.campaings(1);
        
        assertEq(author, owner);
        assertEq(title, "");
        assertTrue(active);
    }

    // Test 18: Multiple campaigns independent
    function test_MultipleCampaignsIndependent() public {
        vm.prank(user1);
        cryptAid.addCampaign("C1", "D1", "v1", "i1");

        vm.prank(user2);
        cryptAid.addCampaign("C2", "D2", "v2", "i2");

        vm.deal(owner, 2 ether);
        cryptAid.donate{value: 0.5 ether}(1);
        cryptAid.donate{value: 1 ether}(2);

        (, , , , , uint256 balance1, ) = cryptAid.campaings(1);
        (, , , , , uint256 balance2, ) = cryptAid.campaings(2);

        assertEq(balance1, 0.5 ether);
        assertEq(balance2, 1 ether);
    }

    // Test 19: Campaign ID 0 returns default values
    function test_CampaignIdZero() public view {
        (address author, , , , , , bool active) = cryptAid.campaings(0);
        assertEq(author, address(0));
        assertFalse(active);
    }

    // Test 20: Author can donate to own campaign
    function test_AuthorDonateToOwnCampaign() public {
        cryptAid.addCampaign("Title", "Desc", "v", "i");

        cryptAid.donate{value: 0.5 ether}(1);

        (, , , , , uint256 balance, ) = cryptAid.campaings(1);
        assertEq(balance, 0.5 ether);
    }
}