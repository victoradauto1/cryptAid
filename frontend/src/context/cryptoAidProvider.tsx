"use client";

/**
 * CryptoAidProvider
 *
 * Handles wallet connection, network validation and
 * authenticated WRITE access to the CryptoAid smart contract.
 *
 * This context is scoped to WRITE operations and
 * account-aware semantic reads.
 *
 * Public read-only blockchain access MUST NOT depend
 * on this context.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { BrowserProvider, Contract, TransactionReceipt } from "ethers";
import ABI from "../abi/CryptoAid.json";

/* ================================================================
   ENV CONFIG
================================================================ */

const TARGET_CHAIN_ID = BigInt(
  process.env.NEXT_PUBLIC_CHAIN_ID || "0xaa36a7"
);

const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as string;

/* ================================================================
   TYPES
================================================================ */

interface CryptoAidActions {
  createCampaign: (
    title: string,
    description: string,
    videoUrl: string,
    imageUrl: string,
    goal: bigint,
    deadline: bigint
  ) => Promise<TransactionReceipt>;

  donate: (
    campaignId: bigint,
    value: bigint
  ) => Promise<TransactionReceipt>;

  withdrawCampaign: (
    campaignId: bigint
  ) => Promise<TransactionReceipt>;

  cancelCampaign: (
    campaignId: bigint
  ) => Promise<TransactionReceipt>;

  updatePlatformFee: (
    newFee: bigint
  ) => Promise<TransactionReceipt>;

  withdrawPlatformFees: () => Promise<TransactionReceipt>;

  transferOwnership: (
    newOwner: string
  ) => Promise<TransactionReceipt>;

  /* ---------- Semantic Reads ---------- */
  getCampaign: (campaignId: bigint) => Promise<any>;
  isActive: (campaignId: bigint) => Promise<boolean>;
  canWithdraw: (campaignId: bigint) => Promise<boolean>;
  getDonation: (campaignId: bigint) => Promise<bigint>;
  getDonorCount: (campaignId: bigint) => Promise<bigint>;
  getProgress: (campaignId: bigint) => Promise<bigint>;
  getCampaignDonors: (campaignId: bigint) => Promise<string[]>;
}

interface CryptoAidContextType {
  provider: BrowserProvider | null;
  signer: any | null;
  account: string | null;
  contract: Contract | null;
  isReady: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  actions: CryptoAidActions | null;
}

/* ================================================================
   CONTEXT
================================================================ */

const CryptoAidContext = createContext<CryptoAidContextType | undefined>(
  undefined
);

export function CryptoAidProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const isReady = useMemo(
    () => Boolean(provider && signer && contract && account),
    [provider, signer, contract, account]
  );

  /* ================================================================
     Wallet Connection
  ================================================================ */

  const connectWallet = useCallback(async () => {
    if (!window.ethereum || isConnecting) return;

    try {
      setIsConnecting(true);

      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (network.chainId !== TARGET_CHAIN_ID) {
        throw new Error("Wrong network");
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const contract = new Contract(
        CONTRACT_ADDRESS,
        ABI,
        signer
      );

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setContract(contract);

      sessionStorage.removeItem("walletDisconnected");
    } catch (err) {
      console.error("Wallet connection error:", err);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    sessionStorage.setItem("walletDisconnected", "true");
  }, []);

  /* ================================================================
     Safe TX Executor
  ================================================================ */

  const executeTx = useCallback(
    async (txFn: () => Promise<any>) => {
      try {
        const tx = await txFn();
        return await tx.wait();
      } catch (err: any) {
        if (err?.errorName) {
          throw new Error(err.errorName);
        }
        throw err;
      }
    },
    []
  );

  /* ================================================================
     ACTIONS
  ================================================================ */

  const actions: CryptoAidActions | null = useMemo(() => {
    if (!contract || !account) return null;

    return {
      createCampaign: (
        title,
        description,
        videoUrl,
        imageUrl,
        goal,
        deadline
      ) =>
        executeTx(() =>
          contract.createCampaign(
            title,
            description,
            videoUrl,
            imageUrl,
            goal,
            deadline
          )
        ),

      donate: (campaignId, value) =>
        executeTx(() =>
          contract.donate(campaignId, { value })
        ),

      withdrawCampaign: (campaignId) =>
        executeTx(() =>
          contract.withdrawCampaign(campaignId)
        ),

      cancelCampaign: (campaignId) =>
        executeTx(() =>
          contract.cancelCampaign(campaignId)
        ),

      updatePlatformFee: (newFee) =>
        executeTx(() =>
          contract.updatePlatformFee(newFee)
        ),

      withdrawPlatformFees: () =>
        executeTx(() =>
          contract.withdrawPlatformFees()
        ),

      transferOwnership: (newOwner) =>
        executeTx(() =>
          contract.transferOwnership(newOwner)
        ),

      /* ---------- Reads ---------- */

      getCampaign: (campaignId) =>
        contract.getCampaign(campaignId),

      isActive: (campaignId) =>
        contract.isActive(campaignId),

      canWithdraw: (campaignId) =>
        contract.canWithdraw(campaignId),

      getDonation: (campaignId) =>
        contract.getDonation(campaignId, account),

      getDonorCount: (campaignId) =>
        contract.getDonorCount(campaignId),

      getProgress: (campaignId) =>
        contract.getProgress(campaignId),

      getCampaignDonors: (campaignId) =>
        contract.getCampaignDonors(campaignId),
    };
  }, [contract, account, executeTx]);

  /* ================================================================
     Wallet Listeners
  ================================================================ */

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) disconnectWallet();
      else setAccount(accounts[0]);
    };

    const handleChainChanged = () => window.location.reload();

    // Cast to any to handle MetaMask's event emitter API
    const ethereum = window.ethereum as any;

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [disconnectWallet]);

  const value = useMemo<CryptoAidContextType>(
    () => ({
      provider,
      signer,
      account,
      contract,
      isReady,
      isConnecting,
      connectWallet,
      disconnectWallet,
      actions,
    }),
    [
      provider,
      signer,
      account,
      contract,
      isReady,
      isConnecting,
      connectWallet,
      disconnectWallet,
      actions,
    ]
  );

  return (
    <CryptoAidContext.Provider value={value}>
      {children}
    </CryptoAidContext.Provider>
  );
}

/* ================================================================
   Hook
================================================================ */

export function useCryptoAid(): CryptoAidContextType {
  const context = useContext(CryptoAidContext);
  if (!context) {
    throw new Error(
      "useCryptoAid must be used within CryptoAidProvider"
    );
  }
  return context;
}