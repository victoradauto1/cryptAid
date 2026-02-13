"use client";

import React, { useEffect, useState } from "react";
import { getReadOnlyContract } from "@/utils/web3Provider";
import CampaignCard from "@/components/CampaignCard";

/**
 * Campaigns Page
 *
 * Displays all crowdfunding campaigns stored on-chain.
 * 
 * Responsibilities:
 * - Fetch total campaign count from smart contract
 * - Retrieve individual campaign data
 * - Reverse order to display most recent first
 * - Handle loading and empty states
 * 
 * This page follows the same architectural logic as the AllBets
 * component from previous projects, adapted to CryptoAid's
 * visual identity and crowdfunding domain.
 */

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllCampaigns = async () => {
    try {
      const contract = await getReadOnlyContract();
      const total = Number(await contract.campaignCount());

      if (total === 0) {
        setCampaigns([]);
        return;
      }

      const promises = [];

      for (let i = 0; i < total; i++) {
        promises.push(fetchSingleCampaign(contract, i));
      }

      const allCampaigns = await Promise.all(promises);

      // Most recent first
      setCampaigns(allCampaigns.filter(Boolean).reverse());
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleCampaign = async (contract: any, campaignId: number) => {
    try {
      const campaign = await contract.getCampaign(campaignId);

      const goal = Number(campaign.goal) / 1e18;
      const raised = Number(campaign.raisedAmount) / 1e18;
      const deadline = Number(campaign.deadline);

      const now = Math.floor(Date.now() / 1000);
      const isExpired = now >= deadline;

      return {
        id: campaignId,
        title: campaign.title,
        description: campaign.description,
        goal: goal.toFixed(2),
        raised: raised.toFixed(2),
        deadline,
        isActive: !isExpired,
        status: isExpired ? "ENDED" : "ACTIVE",
      };
    } catch (err) {
      console.error(`Error fetching campaign ${campaignId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    fetchAllCampaigns();
  }, []);

  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b] px-6 py-16">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            All <span className="text-[#3f8f7b]">Campaigns</span>
          </h1>
          <p className="text-[#6b6b6b] mt-3">
            Explore active and completed fundraising campaigns powered by smart contracts.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center mt-10">
            <div className="w-12 h-12 border-4 border-[#3f8f7b] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[#6b6b6b]">Loading campaigns...</p>
          </div>
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
