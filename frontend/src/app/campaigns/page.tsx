"use client";

import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import { formatEther } from "ethers";
import { getReadOnlyContract } from "../../utils/web3provider";
import CampaignCard from "@/components/CampaignCard";

/**
 * Campaigns Page
 *
 * Displays all crowdfunding campaigns stored on-chain.
 *
 * Responsibilities:
 * - Fetch total campaign count from smart contract (read-only)
 * - Retrieve individual campaign data
 * - Normalize on-chain BigInt values to UI-friendly strings
 * - Reverse order to display most recent campaigns first
 * - Handle loading, error and empty states
 *
 * Architectural Decision:
 * This page is intentionally READ-ONLY and must NOT depend
 * on CryptoAidProvider (wallet context).
 *
 * Public blockchain reads should remain decoupled from
 * authenticated wallet state to ensure:
 * - Public accessibility
 * - Better UX (no wallet required)
 * - Clear separation of concerns
 */

/* ============================================================
   TYPES
============================================================ */

/**
 * CampaignView
 *
 * Represents a normalized UI-friendly campaign model.
 * Converts on-chain BigInt values into formatted strings.
 */
interface CampaignView {
  id: number;
  title: string;
  description: string;
  goal: string;        // formatted ETH value
  raised: string;      // formatted ETH value
  deadline: number;    // unix timestamp
  isActive: boolean;
  status: "ACTIVE" | "ENDED";
}

/* ============================================================
   COMPONENT
============================================================ */

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ============================================================
     Fetch Single Campaign
  ============================================================ */

  /**
   * fetchSingleCampaign
   *
   * Retrieves a single campaign from the contract and
   * transforms raw blockchain data into a UI model.
   *
   * - Converts wei to ETH using formatEther
   * - Computes expiration status locally
   */
  const fetchSingleCampaign = async (
    contract: any,
    campaignId: number
  ): Promise<CampaignView | null> => {
    try {
      const campaign = await contract.getCampaign(campaignId);

      const goal = formatEther(campaign.goal);
      const raised = formatEther(campaign.raisedAmount);
      const deadline = Number(campaign.deadline);

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now >= deadline;

      return {
        id: campaignId,
        title: campaign.title,
        description: campaign.description,
        goal,
        raised,
        deadline,
        isActive: !isExpired,
        status: isExpired ? "ENDED" : "ACTIVE",
      };
    } catch (err) {
      console.error(
        `Error fetching campaign ${campaignId}:`,
        err
      );
      return null;
    }
  };

  /* ============================================================
     Fetch All Campaigns
  ============================================================ */

  /**
   * fetchAllCampaigns
   *
   * - Retrieves total campaign count
   * - Executes parallel RPC calls for each campaign
   * - Filters failed fetches
   * - Reverses order to show newest first
   */
  const fetchAllCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const contract = await getReadOnlyContract();
      const total = Number(await contract.campaignCount());

      if (!total) {
        setCampaigns([]);
        return;
      }

      const requests: Promise<CampaignView | null>[] = [];

      for (let i = 0; i < total; i++) {
        requests.push(
          fetchSingleCampaign(contract, i)
        );
      }

      const results = await Promise.all(requests);

      setCampaigns(
        results
          .filter(Boolean)
          .reverse() as CampaignView[]
      );
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setError("Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ============================================================
     Lifecycle
  ============================================================ */

  /**
   * On mount:
   * Fetch campaigns once.
   */
  useEffect(() => {
    fetchAllCampaigns();
  }, [fetchAllCampaigns]);

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b] px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            All{" "}
            <span className="text-[#3f8f7b]">
              Campaigns
            </span>
          </h1>
          <p className="text-[#6b6b6b] mt-3">
            Explore active and completed fundraising campaigns powered by smart contracts.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center mt-10">
            <div className="w-12 h-12 border-4 border-[#3f8f7b] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#6b6b6b]">
              Loading campaigns...
            </p>
          </div>
        ) : error ? (
          <p className="text-red-500 mt-10">
            {error}
          </p>
        ) : campaigns.length === 0 ? (
          <p className="text-[#6b6b6b] mt-10">
            No campaigns found.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
