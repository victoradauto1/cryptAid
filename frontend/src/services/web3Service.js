import Web3 from "web3";
import ABI from "./ABI.json";

const CONTRACT_ADDRESS = "0x72c8AE8f86cBf25e4828200eb3Dc6c4949a91574";
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // Sepolia ChainId in hexadecimal

async function ensureSepoliaNetwork() {
  if (!window.ethereum) throw new Error("MetaMask não encontrada");

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

export async function doLogin() {
  if (!window.ethereum) throw new Error("No Metamask found");

  await ensureSepoliaNetwork();

  const web3 = new Web3(window.ethereum);
  const accounts = await web3.eth.requestAccounts();
  if (!accounts || !accounts.length)
    throw new Error("Wallets not found/allowed.");

  localStorage.setItem("wallet", accounts[0]);
  return accounts[0];
}

function getContract() {
  const web3 = new Web3(window.ethereum);
  const from = localStorage.getItem("wallet");
  if (!from) throw new Error("No wallet address found in local storage");

  return new web3.eth.Contract(ABI, CONTRACT_ADDRESS, { from });
}

export async function addCampaign(campaign) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  
  // Pega o ID atual antes de criar a campanha
  const currentId = await contract.methods.nextId().call();
  
  // Cria a campanha
  await contract.methods
    .addCampaign(
      campaign.title,
      campaign.description,
      campaign.videoUrl,
      campaign.imageUrl
    )
    .send();
  
  // Retorna o ID da campanha criada
  return { campaignId: currentId.toString() };
}

export async function getLastCampignId() {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.nextId().call();
}

export async function getCampaign(id) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.campaings(id).call();
}

export async function donate(id, donation) {
  await ensureSepoliaNetwork();
  const contract = getContract();
  return contract.methods.donate(id).send({
    value: Web3.utils.toWei(donation, "ether"),
  });
}