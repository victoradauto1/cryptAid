import PageTitle from "@/components/PageTitle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      
      {/* Hero */}
      <section
        className="
          max-w-7xl 
          mx-auto 
          px-6 
          min-h-[75vh]
          py-24
          grid 
          grid-cols-1 
          md:grid-cols-2 
          gap-12 
          items-center
        "
      >
        {/* Left */}
        <div>
          <PageTitle className="text-7xl md:text-8xl lg:text-9xl text-[#3b3b3b] leading-none">
            CryptoAid
          </PageTitle>

          <p className="text-center text-[#6b6b6b] mt-6">
            Decentralized online crowdfunding platform
          </p>
        </div>

        {/* Right */}
        <div className="flex justify-center items-center">
          <div className="overflow-hidden rounded-3xl shadow-lg max-w-md">
            <Image
              src="/selfhug.png"
              alt="Support and care"
              width={600}
              height={700}
              className="object-cover w-full h-full"
              priority
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Create Campaign */}
        <button
          className="
            bg-black 
            text-white 
            rounded-2xl 
            h-48 
            flex 
            flex-col 
            items-center 
            justify-center 
            text-lg 
            font-semibold
            hover:opacity-90 
            transition
          "
        >
          Create Campaign
        </button>

        {/* Search Campaign */}
        <button
          className="
            bg-black 
            text-white 
            rounded-2xl 
            h-48 
            flex 
            flex-col 
            items-center 
            justify-center 
            text-lg 
            font-semibold
            hover:opacity-90 
            transition
          "
        >
          Search Campaign
        </button>

        {/* Existing Campaigns */}
        <button
          className="
            bg-black 
            text-white 
            rounded-2xl 
            h-48 
            flex 
            flex-col 
            items-center 
            justify-center 
            text-lg 
            font-semibold
            hover:opacity-90 
            transition
          "
        >
          Existing Campaigns
        </button>

      </section>
    </main>
  );
}
