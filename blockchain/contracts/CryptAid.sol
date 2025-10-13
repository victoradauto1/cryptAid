// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

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
    uint256 public constant fee = 100;
    uint256 public nextId = 0;

    mapping(uint256 => Campaign) public campaings;

    event Withdrawn(
        uint256 indexed id,
        uint256 amount,
        address indexed recipient
    );

    function addCampaign(
        string calldata title,
        string calldata description,
        string calldata videoUrl,
        string calldata imageUrl
    ) public {
        Campaign memory newCampaign = Campaign({
            author: msg.sender,
            title: title,
            description: description,
            videoUrl: videoUrl,
            imageUrl: imageUrl,
            balance: 0,
            active: true
        });

        nextId++;
        campaings[nextId] = newCampaign;
    }

    function donate(uint256 id) public payable {
        require(campaings[id].active, "Campaign is not active");
        require(msg.value > 0, "Amount must be greater than 0");

        campaings[id].balance += msg.value;
    }

    function withdraw(uint256 id) public {
        Campaign storage campaign = campaings[id];

        require(campaign.active, "This campaign is closed");
        require(
            campaign.author == msg.sender,
            "You do not have permission to withdraw"
        );
        require(
            campaign.balance > fee,
            "This campaign does not have enough balance"
        );

        uint256 amount = campaign.balance - fee;

        campaign.balance = 0;
        campaign.active = false;

        (bool success, ) = payable(campaign.author).call{value: amount}("");
        require(success, "Failed to send Ether");

        emit Withdrawn(id, amount, campaign.author);
    }
}