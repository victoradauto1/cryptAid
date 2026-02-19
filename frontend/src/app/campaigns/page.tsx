"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  goal: string;
  raised: string;
  deadline: number;
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
      console.error(`Error fetching campaign ${campaignId}:`, err);
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

      // Se não houver campanhas, isso NÃO é um erro
      if (total === 0) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const requests: Promise<CampaignView | null>[] = [];

      for (let i = 0; i < total; i++) {
        requests.push(fetchSingleCampaign(contract, i));
      }

      const results = await Promise.all(requests);

      setCampaigns(results.filter(Boolean).reverse() as CampaignView[]);
    } catch (err: any) {
      console.error("Error fetching campaigns:", err);
      setError(
        err?.message || "Failed to load campaigns. Please try again later."
      );
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
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header - Alinhado com About */}
        <h1 className="text-4xl font-bold mb-6">
          All <span className="text-[#3f8f7b]">Campaigns</span>
        </h1>

        <p className="text-lg leading-relaxed mb-8 text-[#6b6b6b]">
          Explore active and completed fundraising campaigns powered by smart
          contracts. Each campaign is transparently stored on the blockchain,
          ensuring full visibility of funds and progress.
        </p>

        {/* States */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#3f8f7b] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#6b6b6b]">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <p className="text-red-600 font-medium mb-2">Error Loading Campaigns</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchAllCampaigns}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-[#f0f0f0] border border-[#d0d0d0] rounded-lg p-8 mt-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-[#9b9b9b]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-[#3b3b3b]">
              No Campaigns Yet
            </h3>
            <p className="text-[#6b6b6b] mb-6">
              Be the first to create a campaign and start fundraising on the
              blockchain.
            </p>
            <a
              href="/create"
              className="inline-block px-6 py-3 bg-[#3f8f7b] text-white font-medium rounded-lg hover:bg-[#2d7561] transition-colors"
            >
              Create Campaign
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}