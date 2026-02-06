import Header from "@/components/Header";
import PageTitle from "@/components/PageTitle";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      {/* Header */}
      <Header />

      {/* Hero */}
      <section className="
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
">

        {/* Left */}
        <div>
          <PageTitle className="text-7xl md:text-8xl lg:text-9xl text-[#3b3b3b] leading-none">
            CryptoAid
          </PageTitle>

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

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <h3 className="text-xl font-semibold mb-3">Transparent</h3>
          <p className="text-[#6b6b6b]">
            All donations and campaign rules are fully auditable on-chain.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Automated</h3>
          <p className="text-[#6b6b6b]">
            Smart contracts enforce deadlines, goals, and fund distribution.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Secure</h3>
          <p className="text-[#6b6b6b]">
            No intermediaries, no custody, no hidden logic.
          </p>
        </div>
      </section>
    </main>
  );
}
