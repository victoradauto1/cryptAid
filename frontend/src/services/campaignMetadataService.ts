/**
 * Campaign Metadata Service
 *
 * Client-side service for interacting with the campaign metadata API.
 * Handles saving and retrieving off-chain campaign data.
 */

/* ============================================================
   TYPES
============================================================ */

export interface CampaignMetadata {
  campaignId: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  goal: string;
  deadline: number | null;
  createdAt: number;
}

export interface SaveMetadataResponse {
  uri: string;
  metadata: CampaignMetadata;
}

/* ============================================================
   API CLIENT
============================================================ */

const API_BASE = "/api/campaign-metadata";

/**
 * Save campaign metadata to the backend
 */
export async function saveCampaignMetadata(
  data: Omit<CampaignMetadata, "createdAt">
): Promise<SaveMetadataResponse> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to save metadata");
  }

  return response.json();
}

/**
 * Retrieve campaign metadata by ID
 */
export async function getCampaignMetadata(
  campaignId: string
): Promise<CampaignMetadata> {
  const response = await fetch(
    `${API_BASE}?campaignId=${campaignId}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch metadata");
  }

  return response.json();
}

/**
 * Delete campaign metadata
 */
export async function deleteCampaignMetadata(
  campaignId: string
): Promise<{ success: boolean }> {
  const response = await fetch(
    `${API_BASE}?campaignId=${campaignId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete metadata");
  }

  return response.json();
}

/**
 * Batch fetch metadata for multiple campaigns
 * (Useful for campaign listing page)
 */
export async function getCampaignMetadataBatch(
  campaignIds: string[]
): Promise<Map<string, CampaignMetadata>> {
  const results = new Map<string, CampaignMetadata>();

  await Promise.allSettled(
    campaignIds.map(async (id) => {
      try {
        const metadata = await getCampaignMetadata(id);
        results.set(id, metadata);
      } catch (err) {
        console.warn(
          `Failed to fetch metadata for campaign ${id}:`,
          err
        );
      }
    })
  );

  return results;
}