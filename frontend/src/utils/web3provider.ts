import { ethers } from "ethers";
import CryptoAidABI from "../abi/CryptoAid.json";

/* ============================================================
   ENVIRONMENT CONFIGURATION
============================================================ */

/**
 * Public Sepolia RPC endpoint.
 * Used for read-only blockchain interactions.
 */
const SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

/**
 * Smart contract address (must be defined in .env)
 */
const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

/* ============================================================
   READ-ONLY PROVIDER
============================================================ */

/**
 * getReadOnlyProvider
 *
 * Creates a JsonRpcProvider connected to a public RPC endpoint.
 *
 * This provider:
 * - Does NOT require a wallet
 * - Is safe for public pages
 * - Should be used for data fetching only
 *
 * Intended usage:
 * - Campaign listing
 * - Public campaign details
 * - Platform statistics
 */
export async function getReadOnlyProvider() {
  console.log("[ReadOnlyProvider] RPC URL:", SEPOLIA_RPC);

  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC);

  try {
    const network = await provider.getNetwork();
    console.log(
      "[ReadOnlyProvider] Connected | chainId:",
      Number(network.chainId),
      "| name:",
      network.name
    );
  } catch (err) {
    console.error(
      "[ReadOnlyProvider] RPC connection failed:",
      err
    );
    throw err;
  }

  return provider;
}

/* ============================================================
   READ-ONLY CONTRACT
============================================================ */

/**
 * getReadOnlyContract
 *
 * Returns a contract instance connected to the
 * read-only RPC provider.
 *
 * Important:
 * This contract instance CANNOT execute write operations.
 * Any state-changing method will fail.
 *
 * Use this for:
 * - campaignCount()
 * - getCampaign()
 * - getProgress()
 * - public data reads
 */
export async function getReadOnlyContract() {
  if (!CONTRACT_ADDRESS) {
    throw new Error(
      "NEXT_PUBLIC_CONTRACT_ADDRESS is not configured in environment variables"
    );
  }

  console.log(
    "[ReadOnlyContract] Using contract:",
    CONTRACT_ADDRESS
  );

  const provider = await getReadOnlyProvider();

  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CryptoAidABI,
    provider
  );

  return contract;
}

/* ============================================================
   WALLET PROVIDER (MetaMask)
============================================================ */

/**
 * getWalletProvider
 *
 * Creates a BrowserProvider connected to the user's wallet.
 *
 * This provider:
 * - Requires MetaMask (or compatible wallet)
 * - Requests account access
 * - Is used ONLY for write operations
 *
 * Intended usage:
 * - createCampaign()
 * - donate()
 * - withdrawCampaign()
 * - cancelCampaign()
 */
export async function getWalletProvider() {
  if (typeof window === "undefined") {
    throw new Error("Window not available (SSR)");
  }

  if (!window.ethereum) {
    throw new Error(
      "No wallet found. Please install MetaMask."
    );
  }

  console.log("[WalletProvider] Wallet detected");

  const provider = new ethers.BrowserProvider(
    window.ethereum
  );

  try {
    // Request wallet connection
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();

    console.log(
      "[WalletProvider] Connected | chainId:",
      Number(network.chainId),
      "| name:",
      network.name
    );
  } catch (err) {
    console.error(
      "[WalletProvider] Wallet connection failed:",
      err
    );
    throw err;
  }

  return provider;
}
