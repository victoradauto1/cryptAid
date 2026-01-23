// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract CryptAid is ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    enum CampaignStatus {
        ACTIVE,
        COMPLETED,
        CANCELLED
    }

    struct Campaign {
        address author;
        string title;
        string description;
        string videoUrl;
        string imageUrl;
        uint256 balance;
        uint256 goal;
        uint256 deadline;
        uint256 createdAt;
        CampaignStatus status;
    }

    /*//////////////////////////////////////////////////////////////
                               STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Platform fee in basis points (100 = 1%)
    uint256 public platformFee = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 10% max
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Total campaigns created
    uint256 public campaignCount;

    /// @notice Contract owner for fee management
    address public owner;

    /// @notice Accumulated platform fees
    uint256 public platformBalance;

    /// @notice Campaign ID => Campaign data
    mapping(uint256 => Campaign) public campaigns;

    /// @notice Campaign ID => Donor => Amount donated
    mapping(uint256 => mapping(address => uint256)) public donations;

    /// @notice Campaign ID => Array of donor addresses
    mapping(uint256 => address[]) public campaignDonors;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed author,
        string title,
        uint256 goal,
        uint256 deadline
    );

    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        uint256 amount
    );

    event CampaignCompleted(
        uint256 indexed campaignId,
        uint256 totalRaised,
        uint256 authorReceived,
        uint256 platformFee
    );

    event CampaignCancelled(uint256 indexed campaignId);

    event FeeUpdated(uint256 oldFee, uint256 newFee);

    event PlatformFeesWithdrawn(address indexed owner, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error CampaignDoesNotExist();
    error CampaignNotActive();
    error InvalidGoal();
    error InvalidDeadline();
    error InvalidAmount();
    error Unauthorized();
    error NothingToWithdraw();
    error InvalidFee();
    error TransferFailed();
    error EmptyTitle();
    error DeadlineNotReached();
    error GoalAlreadyReached();

    /*//////////////////////////////////////////////////////////////
                               MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier campaignExists(uint256 campaignId) {
        if (campaignId >= campaignCount) revert CampaignDoesNotExist();
        _;
    }

    modifier onlyAuthor(uint256 campaignId) {
        if (campaigns[campaignId].author != msg.sender) revert Unauthorized();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                        CAMPAIGN MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Creates a new fundraising campaign
    /// @param title Campaign title
    /// @param description Campaign description
    /// @param videoUrl Optional video URL
    /// @param imageUrl Optional image URL
    /// @param goal Fundraising goal in wei (0 = no goal)
    /// @param deadline Unix timestamp for deadline (0 = no deadline)
    /// @return campaignId The ID of the created campaign
    function createCampaign(
        string calldata title,
        string calldata description,
        string calldata videoUrl,
        string calldata imageUrl,
        uint256 goal,
        uint256 deadline
    ) external returns (uint256) {
        if (bytes(title).length == 0) revert EmptyTitle();
        if (deadline != 0 && deadline <= block.timestamp)
            revert InvalidDeadline();

        uint256 campaignId = campaignCount;

        Campaign storage campaign = campaigns[campaignId];
        campaign.author = msg.sender;
        campaign.title = title;
        campaign.description = description;
        campaign.videoUrl = videoUrl;
        campaign.imageUrl = imageUrl;
        campaign.goal = goal;
        campaign.deadline = deadline;
        campaign.createdAt = block.timestamp;
        campaign.status = CampaignStatus.ACTIVE;

        emit CampaignCreated(campaignId, msg.sender, title, goal, deadline);

        campaignCount++;

        return campaignId;
    }

    /*//////////////////////////////////////////////////////////////
                            DONATIONS
    //////////////////////////////////////////////////////////////*/

    /// @notice Donate to a campaign
    /// @param campaignId The campaign to donate to
    function donate(
        uint256 campaignId
    ) external payable campaignExists(campaignId) {
        if (msg.value == 0) revert InvalidAmount();

        Campaign storage campaign = campaigns[campaignId];

        // Check campaign is active
        if (campaign.status != CampaignStatus.ACTIVE)
            revert CampaignNotActive();

        // Check deadline hasn't passed
        if (campaign.deadline != 0 && block.timestamp >= campaign.deadline) {
            revert CampaignNotActive();
        }

        // Track first-time donors
        if (donations[campaignId][msg.sender] == 0) {
            campaignDonors[campaignId].push(msg.sender);
        }

        // Update balances
        donations[campaignId][msg.sender] += msg.value;
        campaign.balance += msg.value;

        emit DonationReceived(campaignId, msg.sender, msg.value);

        // Auto-complete if goal reached
        if (campaign.goal != 0 && campaign.balance >= campaign.goal) {
            _completeCampaign(campaignId);
        }
    }

    /*//////////////////////////////////////////////////////////////
                            WITHDRAWALS
    //////////////////////////////////////////////////////////////*/

    /// @notice Withdraw funds from a campaign (author only)
    /// @param campaignId The campaign to withdraw from
    function withdrawCampaign(
        uint256 campaignId
    ) external nonReentrant campaignExists(campaignId) onlyAuthor(campaignId) {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.status != CampaignStatus.ACTIVE)
            revert CampaignNotActive();
        if (campaign.balance == 0) revert NothingToWithdraw();

        // Can only withdraw if:
        // 1. Goal is reached, OR
        // 2. Deadline has passed
        bool goalReached = campaign.goal != 0 &&
            campaign.balance >= campaign.goal;
        bool deadlinePassed = campaign.deadline != 0 &&
            block.timestamp >= campaign.deadline;

        if (!goalReached && !deadlinePassed) {
            revert Unauthorized();
        }

        _completeCampaign(campaignId);
    }

    /// @notice Internal function to complete campaign and transfer funds
    function _completeCampaign(uint256 campaignId) internal {
        Campaign storage campaign = campaigns[campaignId];

        // Prevent double execution
        if (campaign.status != CampaignStatus.ACTIVE) return;

        uint256 totalRaised = campaign.balance;
        uint256 feeAmount = (totalRaised * platformFee) / BASIS_POINTS;
        uint256 authorAmount = totalRaised - feeAmount;

        // Update state before external calls
        campaign.balance = 0;
        campaign.status = CampaignStatus.COMPLETED;
        platformBalance += feeAmount;

        // Transfer to author
        (bool success, ) = payable(campaign.author).call{value: authorAmount}(
            ""
        );
        if (!success) revert TransferFailed();

        emit CampaignCompleted(
            campaignId,
            totalRaised,
            authorAmount,
            feeAmount
        );
    }

    /// @notice Cancel campaign and refund donors (author only, only if no donations)
    /// @param campaignId The campaign to cancel
    function cancelCampaign(
        uint256 campaignId
    ) external campaignExists(campaignId) onlyAuthor(campaignId) {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.status != CampaignStatus.ACTIVE)
            revert CampaignNotActive();
        if (campaign.balance > 0) revert Unauthorized(); // Can't cancel with donations

        campaign.status = CampaignStatus.CANCELLED;

        emit CampaignCancelled(campaignId);
    }

    /*//////////////////////////////////////////////////////////////
                        PLATFORM MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /// @notice Update platform fee (owner only)
    /// @param newFee New fee in basis points
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        if (newFee > MAX_FEE) revert InvalidFee();

        uint256 oldFee = platformFee;
        platformFee = newFee;

        emit FeeUpdated(oldFee, newFee);
    }

    /// @notice Withdraw accumulated platform fees (owner only)
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformBalance;
        if (amount == 0) revert NothingToWithdraw();

        platformBalance = 0;

        (bool success, ) = payable(owner).call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PlatformFeesWithdrawn(owner, amount);
    }

    /// @notice Transfer ownership (owner only)
    /// @param newOwner New owner address
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert Unauthorized();
        owner = newOwner;
    }

    /*//////////////////////////////////////////////////////////////
                                VIEWS
    //////////////////////////////////////////////////////////////*/

    /// @notice Get campaign details
    function getCampaign(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (Campaign memory) {
        return campaigns[campaignId];
    }

    /// @notice Check if campaign is active
    function isActive(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (bool) {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.status != CampaignStatus.ACTIVE) return false;
        if (campaign.deadline != 0 && block.timestamp >= campaign.deadline)
            return false;
        if (campaign.goal != 0 && campaign.balance >= campaign.goal)
            return false;

        return true;
    }

    /// @notice Get donation amount for a specific donor
    function getDonation(
        uint256 campaignId,
        address donor
    ) external view campaignExists(campaignId) returns (uint256) {
        return donations[campaignId][donor];
    }

    /// @notice Get all donors for a campaign
    function getCampaignDonors(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (address[] memory) {
        return campaignDonors[campaignId];
    }

    /// @notice Get number of unique donors for a campaign
    function getDonorCount(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (uint256) {
        return campaignDonors[campaignId].length;
    }

    /// @notice Calculate progress percentage (basis points)
    function getProgress(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.goal == 0) return 0;

        return (campaign.balance * BASIS_POINTS) / campaign.goal;
    }

    /// @notice Check if campaign can be withdrawn
    function canWithdraw(
        uint256 campaignId
    ) external view campaignExists(campaignId) returns (bool) {
        Campaign storage campaign = campaigns[campaignId];

        if (campaign.status != CampaignStatus.ACTIVE) return false;
        if (campaign.balance == 0) return false;

        bool goalReached = campaign.goal != 0 &&
            campaign.balance >= campaign.goal;
        bool deadlinePassed = campaign.deadline != 0 &&
            block.timestamp >= campaign.deadline;

        return goalReached || deadlinePassed;
    }
}
