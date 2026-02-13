import Image from "next/image";

export default function CampaignCard() {
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
          alt="Campaign image"
          fill
          className="object-cover"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3
          className="text-lg font-semibold mb-2 line-clamp-2"
          title="Campaign title"
        >
          Help Communities With Transparent Crypto Donations
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          Support impactful initiatives using blockchain transparency and
          decentralized governance.
        </p>

        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Raised: <strong>12.4 ETH</strong>
          </span>

          <span className="font-semibold text-[#3f8f7b]">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}
