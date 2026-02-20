import Image from "next/image";
import Link from "next/link";
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
 * - Navigate to campaign details on click
 *
 * Pure presentational component.
 */
export default function CampaignCard({ campaign }: CampaignCardProps) {
  const { id, title, description, goal, raised, status, isActive } = campaign;

  const progress =
    Number(goal) > 0 ? (Number(raised) / Number(goal)) * 100 : 0;

  return (
    <Link
      href={`/campaigns/${id}`}
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
        cursor-pointer
        group
      "
    >
      {/* Image */}
      <div className="h-44 relative bg-gray-100">
        <Image
          src="/selfhug.png"
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          className="text-lg font-semibold mb-2 line-clamp-2 text-[#3b3b3b] group-hover:text-[#3f8f7b] transition-colors"
          title={title}
        >
          {title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {description}
        </p>

        {/* Progress Bar */}
        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#3b3b3b] font-semibold">
              {raised} ETH
            </span>
            <span className="text-gray-500">
              of {goal} ETH
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#3f8f7b] h-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            {progress.toFixed(1)}% funded
          </p>
        </div>
      </div>
    </Link>
  );
}