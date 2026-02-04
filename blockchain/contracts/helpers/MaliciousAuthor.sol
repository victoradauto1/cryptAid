// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/**
 * @title MaliciousAuthor
 * @notice EOA-like contract que sempre rejeita pagamentos ETH
 * @dev Usado para testar TransferFailed em _completeCampaign
 */
contract MaliciousAuthor {
    // Sempre reverte ao receber ETH
    receive() external payable {
        revert("I don't want your money");
    }
    
    // Fallback também reverte
    fallback() external payable {
        revert("No fallback allowed");
    }
}