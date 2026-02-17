export interface CampaignView {
  id: number;
  title: string;
  description: string;
  goal: string;
  raised: string;
  deadline: number;
  isActive: boolean;
  status: "ACTIVE" | "ENDED";
}
