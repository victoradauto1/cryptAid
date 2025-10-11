// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../contracts/CryptAid.sol";

contract CryptAidTest is Test {
    CryptAid cryptAid;

    address user1 = address(0x123);
    address user2 = address(0x456);
    address owner;

    function setUp() public {
        cryptAid = new CryptAid();
        owner = address(this); // deploy account
    }

    // Test1 1: Create a campaign
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

    // Test 2: Donate to active campaign
    function test_Donate() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        // Give balance to user1
        vm.deal(user1, 1 ether);
        // Execute  donate as user1
        vm.prank(user1);
        cryptAid.donate{value: 0.5 ether}(1);

        (, , , , , uint256 balance, ) = cryptAid.campaings(1);
        assertEq(balance, 0.5 ether);
    }

    // Test 3: Try to donate in a closed campaign
    function test_DonateClosedCampaign() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        // Close campaign manually (simulating withdrawal)
        vm.prank(owner);
        cryptAid.withdraw(1);

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        vm.expectRevert(bytes("Campaign is not active"));
        cryptAid.donate{value: 0.1 ether}(1);
    }

    // Test 4: Withdraw funds successfully
    function test_Withdraw() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        uint256 balanceBefore = owner.balance;

        cryptAid.withdraw(1);

        (, , , , , uint256 balanceAfter, bool active) = cryptAid.campaings(1);
        assertEq(balanceAfter, 1 ether); // stored balance remains, but campaign remains inactive
        assertFalse(active);

        uint256 expected = 1 ether - cryptAid.fee();
        assertEq(address(this).balance - balanceBefore, expected);
    }

    // Test 5: Withdraw with insufficient balance
    function test_WithdrawInsufficientBalance() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.expectRevert(bytes("This campaign does not have enough balance"));
        cryptAid.withdraw(1);
    }

   // Test 6: Withdraw without being the author
    function test_WithdrawNotAuthor() public {
        cryptAid.addCampaign("Title", "Desc", "video.com", "image.com");

        vm.deal(user1, 1 ether);
        vm.prank(user1);
        cryptAid.donate{value: 1 ether}(1);

        vm.prank(user2);
        vm.expectRevert(bytes("You do not have permission to withdraw"));
        cryptAid.withdraw(1);
    }
}
