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
 *
 * Connection Policy:
 * - Does NOT auto-connect on mount
 * - Requires explicit user authorization via connectWallet()
 * - Uses sessionStorage to persist connection state within session
 * - On new session (browser close/reopen), user must re-authorize
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
   SESSION STORAGE KEYS
================================================================ */

const SESSION_KEY_CONNECTED = "cryptoaid_wallet_connected";

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
     Auto-Reconnect Logic (Session-Based)
  ================================================================ */

  /**
   * On mount, check if user was connected in this session.
   * If yes, auto-reconnect silently.
   * If no, wait for explicit user action.
   */
  useEffect(() => {
    const wasConnected = sessionStorage.getItem(SESSION_KEY_CONNECTED);

    if (wasConnected === "true" && window.ethereum) {
      // Silent reconnection (no modal needed)
      connectWalletSilent();
    }
  }, []);

  /* ================================================================
     Wallet Connection (Silent)
  ================================================================ */

  /**
   * Silent reconnection used on page refresh within the same session
   */
  const connectWalletSilent = async () => {
    if (!window.ethereum || isConnecting) return;

    try {
      setIsConnecting(true);

      const provider = new BrowserProvider(window.ethereum);
      
      // Get accounts without prompting (eth_accounts, not eth_requestAccounts)
      const accounts = await provider.send("eth_accounts", []);
      
      if (!accounts.length) {
        // User disconnected wallet externally, clear session
        sessionStorage.removeItem(SESSION_KEY_CONNECTED);
        return;
      }

      const network = await provider.getNetwork();

      if (network.chainId !== TARGET_CHAIN_ID) {
        console.warn("Wrong network detected on silent reconnect");
        sessionStorage.removeItem(SESSION_KEY_CONNECTED);
        return;
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
    } catch (err) {
      console.error("Silent wallet reconnection failed:", err);
      sessionStorage.removeItem(SESSION_KEY_CONNECTED);
    } finally {
      setIsConnecting(false);
    }
  };

  /* ================================================================
     Wallet Connection (User-Initiated)
  ================================================================ */

  /**
   * Explicit connection triggered by user action (button click)
   * This will prompt MetaMask authorization
   */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum || isConnecting) return;

    try {
      setIsConnecting(true);

      const provider = new BrowserProvider(window.ethereum);
      
      // Request user authorization (prompts MetaMask)
      await provider.send("eth_requestAccounts", []);

      const network = await provider.getNetwork();

      if (network.chainId !== TARGET_CHAIN_ID) {
        throw new Error(
          `Wrong network. Please switch to chain ID ${TARGET_CHAIN_ID.toString()}`
        );
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

      // Mark as connected in this session
      sessionStorage.setItem(SESSION_KEY_CONNECTED, "true");
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      throw err; // Re-throw so UI can handle it
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  /* ================================================================
     Wallet Disconnection
  ================================================================ */

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setContract(null);
    sessionStorage.removeItem(SESSION_KEY_CONNECTED);
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
      if (!accounts.length) {
        // User disconnected wallet externally
        disconnectWallet();
      } else {
        // User switched accounts
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // On chain change, reload to ensure consistency
      window.location.reload();
    };

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

  /* ================================================================
     CONTEXT VALUE
  ================================================================ */

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