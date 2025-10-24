import Web3 from "web3";
import ABI from "./ABI.json";

const CONTRACT_ADDRESS = "0x72c8AE8f86cBf25e4828200eb3Dc6c4949a91574";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Sepolia ChainId in hexadecimal

// Ensure the user is connected to the Sepolia Test Network.
// If not, request the switch — or add the network if it's missing.
async function ensureSepoliaNetwork() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const currentChainId = await window.ethereum.request({
    method: "eth_chainId",
  });

  if (currentChainId !== SEPOLIA_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (switchError) {
      // If the Sepolia network is not available, add it manually
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: "Sepolia Test Network",
              rpcUrls: [
                "https://sepolia.infura.io/v3/f71ddab62f1541af98f2783a5b79fecf",
              ],
              nativeCurrency: {
                name: "SepoliaETH",
                symbol: "ETH",
                decimals: 18,
              },
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }
}

// Connect the user's wallet and ensure the correct network is active.
export async function doLogin() {
  if (!window.ethereum) throw new Error("MetaMask not found");

  await ensureSepoliaNetwork();

  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.requestAccounts();
  if (!accounts || !accounts.length)
    throw new Error("Wallet not found or not authorized.");

  localStorage.setItem("wallet", accounts[0]);
  return accounts[0];
}

// Instantiate the contract using ABI and the connected wallet address.
function getContract() {
  const web3 = new Web3(window.ethereum);
  const from = localStorage.getItem("wallet");
  if (!from) throw new Error("No wallet address found in local storage");

  return new web3.eth.Contract(ABI, CONTRACT_ADDRESS, { from });
}

// Add a new campaign to the blockchain.
export async function addCampaign(campaign) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  
  // Retrieve the current ID before creating the new campaign
  const currentId = await contract.methods.nextId().call();
  
  // Create the campaign
  await contract.methods
    .addCampaign(
      campaign.title,
      campaign.description,
      campaign.videoUrl,
      campaign.imageUrl
    )
    .send();
  
  // Return the ID of the created campaign
  return { campaignId: currentId.toString() };
}

// Get the ID of the last created campaign.
export async function getLastCampignId() {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.nextId().call();
}

// Retrieve campaign details by ID.
export async function getCampaign(id) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.campaings(id).call();
}

// Execute a donation transaction to a specific campaign.
export async function donate(id, donation) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.donate(id).send({
    value: Web3.utils.toWei(donation, "ether"),
  });
}
