// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "../CryptAid.sol";

/**
 * @title CryptAidTestHarness
 * @notice Exposes internal functions and state setters for testing unreachable branches
 * @dev Used to achieve 100% code coverage by testing defensive programming paths
 */
contract CryptAidTestHarness is CryptAid {
    /**
     * @notice Exposes _completeCampaign for direct testing
     * @dev Tests early return when status != ACTIVE
     */
    function exposed_completeCampaign(uint256 campaignId) external {
        _completeCampaign(campaignId);
    }

    /**
     * @notice Allows forcing campaign status for testing
     * @dev Tests state-dependent logic without going through normal flow
     */
    function exposed_setCampaignStatus(uint256 campaignId, CampaignStatus status) external {
        campaigns[campaignId].status = status;
    }

    /**
     * @notice Allows forcing campaign balance for testing
     * @dev Tests goal-reached logic without actual donations
     */
    function exposed_setCampaignBalance(uint256 campaignId, uint256 balance) external {
        campaigns[campaignId].balance = balance;
    }
}

/**
 * @title MaliciousActor
 * @notice Contract that rejects all ETH transfers
 * @dev Used to test TransferFailed error in payment flows
 */
contract MaliciousActor {
    receive() external payable {
        revert("Payment rejected");
    }
}

/**
 * @title ReentrantActor
 * @notice Contract that attempts reentrancy attacks
 * @dev Used to verify nonReentrant modifier protection
 */
contract ReentrantActor {
    CryptAid public cryptAid;
    uint256 public campaignId;
    bool public shouldAttack;
    
    constructor(address _cryptAid) {
        cryptAid = CryptAid(_cryptAid);
    }
    
    /**
     * @notice Creates a campaign for attack setup
     */
    function setupCampaign(uint256 goal, uint256 deadline) external returns (uint256) {
        campaignId = cryptAid.createCampaign("Attack", "Desc", "", "", goal, deadline);
        return campaignId;
    }
    
    /**
     * @notice Attempts reentrancy on withdrawCampaign
     */
    function attackWithdraw() external {
        shouldAttack = true;
        cryptAid.withdrawCampaign(campaignId);
    }
    
    /**
     * @notice Attempts reentrancy on withdrawPlatformFees
     */
    function attackPlatformFees() external {
        shouldAttack = true;
        campaignId = type(uint256).max;
        cryptAid.withdrawPlatformFees();
    }
    
    /**
     * @notice Receives ETH and attempts reentry
     * @dev Uses campaignId as flag: max(uint256) = platform fees attack
     */
    receive() external payable {
        if (shouldAttack) {
            shouldAttack = false;
            if (campaignId == type(uint256).max) {
                cryptAid.withdrawPlatformFees();
            } else {
                cryptAid.withdrawCampaign(campaignId);
            }
        }
    }
}