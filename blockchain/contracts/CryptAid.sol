// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

struct Campaign {
    address author;
    string title;
    string description;
    string videoUrl;
    string imageUrl;
    uint256 balance;
    bool active;
}

contract CryptAid {
    uint256 public fee = 100;
    uint256 public nextId = 0;

    mapping(uint256 => Campaign) public campaings;

    function addCampaign(
        string calldata title,
        string calldata description,
        string calldata videoUrl,
        string calldata imageUrl
    ) public {
        Campaign memory newCampaign;
        newCampaign.title = title;
        newCampaign.description = description;
        newCampaign.videoUrl = videoUrl;
        newCampaign.imageUrl = imageUrl;
        newCampaign.active = true;
        newCampaign.author = msg.sender;

        nextId++;
        campaings[nextId] = newCampaign;
    }

    function donate(uint256 id) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(campaings[id].active, "Campaign is not active");

        campaings[id].balance += msg.value;
    }

    function withdraw(uint256 id) public {
        Campaign memory campaign = campaings[id];
        require(campaign.author == msg.sender, "You do not have permission to withdraw");
        require(campaign.active, "This campaign is closed");
        require(campaign.balance > fee, "This campaign does not have enough balance");

        campaings[id].active = false;

        address payable recipient = payable(campaign.author);

        (bool success,) = recipient.call{value: campaign.balance - fee}("");
        require(success, "Failed to send Ether");
    }
}