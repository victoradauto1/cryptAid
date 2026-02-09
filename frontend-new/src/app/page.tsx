import PageTitle from "@/components/PageTitle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      
      {/* Hero */}
      <section className="py-8">
        <div
          className="
            max-w-7xl 
            mx-auto 
            px-6 
            grid 
            grid-cols-1 
            md:grid-cols-2 
            gap-6 
            items-center
          "
        >
          {/* Left */}
          <div>
            <PageTitle className="text-6xl md:text-7xl lg:text-8xl text-[#3b3b3b] leading-none">
              CryptoAid
            </PageTitle>

            <p className="text-center text-[#6b6b6b] mt-3">
              Decentralized online crowdfunding platform
            </p>
          </div>

          {/* Right */}
          <div className="flex justify-center items-center">
            <div className="overflow-hidden rounded-3xl shadow-lg max-w-sm">
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
        </div>
      </section>

      {/* Actions */}
      <section className="py-6 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center max-w-2xl mx-auto">
            
            {/* Search Campaign */}
            <button
              className="
                bg-[#3f8f7b]
                text-white
                rounded-xl
                px-8
                py-6
                text-lg
                font-semibold
                hover:brightness-110
                transition
                w-full
                md:w-auto
                md:flex-1
              "
            >
              Existing Campaigns
            </button>

            {/* Create Campaign */}
            <button
              className="
                bg-[#b24a4a]
                text-white
                rounded-xl
                px-8
                py-6
                text-lg
                font-semibold
                hover:brightness-110
                transition
                w-full
                md:w-auto
                md:flex-1
              "
            >
              Create Campaign
            </button>

          </div>
        </div>
      </section>
    </main>
  );
}