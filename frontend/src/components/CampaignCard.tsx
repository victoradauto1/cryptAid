import Image from "next/image";
import { CampaignView } from "../types/campaign";

/* ============================================================
   TYPES
============================================================ */

interface CampaignCardProps {
  campaign: CampaignView;
}

/* ============================================================
   COMPONENT
============================================================ */

/**
 * CampaignCard
 *
 * Displays a single crowdfunding campaign preview.
 *
 * Responsibilities:
 * - Render campaign metadata
 * - Show funding progress summary
 * - Display campaign status
 *
 * Pure presentational component.
 */
export default function CampaignCard({
  campaign,
}: CampaignCardProps) {
  const {
    title,
    description,
    goal,
    raised,
    status,
    isActive,
  } = campaign;

  return (
    <div
      className="
        bg-white
        border border-gray-200
        rounded-2xl
        shadow-sm
        hover:shadow-md
        hover:-translate-y-1
        transition-all
        flex flex-col
        overflow-hidden
      "
    >
      {/* Image */}
      <div className="h-44 relative">
        <Image
          src="/selfhug.png"
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-lg font-semibold mb-2 line-clamp-2"
          title={title}
        >
          {title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {description}
        </p>

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Raised: <strong>{raised} ETH</strong> / {goal} ETH
          </span>

          <span
            className={`font-semibold ${
              isActive
                ? "text-[#3f8f7b]"
                : "text-gray-400"
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
