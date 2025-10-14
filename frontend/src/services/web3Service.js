import Web3 from 'web3';
import ABI from './ABI.json';

const CONTRACT_ADDRESS = "0x17f58c8aacDD6789CE8Aa539eC9Bd5427651EA9d";

export async function doLogin() {
    if (!window.ethereum) throw new Error("No Metamask found");

    const web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.requestAccounts();
    if (!accounts || !accounts.length) throw new Error("Wallets not found/allowed.");

    localStorage.setItem("wallet", accounts[0]);

    return accounts[0];
}

function getContract() {
    const web3 = new Web3(window.ethereum);
    const from = localStorage.getItem("wallet");

    if (!from) throw new Error("No wallet address found in local storage");

    return new web3.eth.Contract(ABI, CONTRACT_ADDRESS, { from });
}

export function addCampaign(campaign) {
    const contract = getContract();
    return contract.methods.addCampaign(campaign.title, campaign.description, campaign.videoUrl, campaign.imageUrl).send()
}

export function getLastCampignId(){
    const contract = getContract();
    return contract.methods.nextId().call();
}

export function getCampaign(id){
    const contract = getContract();
    return contract.methods.campaigns(id).call();
}

export function donate(id, donation){
    const contract = getContract();
    return contract.methods.donate(id).send({value: Web3.utils.toWei(donation, "ether")})
}