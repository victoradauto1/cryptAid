/**
 * How It Works - Platform explanation page
 *
 * Static institutional page explaining how CryptoAid works
 */

export default function HowItWorks() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">
          How it works on{" "}
          <span className="text-[#3f8f7b]">CryptoAid</span>
        </h1>

        <p className="text-lg leading-relaxed mb-8 text-[#6b6b6b]">
          CryptoAid is a decentralized online crowdfunding platform built on
          blockchain technology. It allows anyone to create and support fundraising
          campaigns in a transparent, secure, and trustless environment powered by
          smart contracts.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          1. Create a campaign
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          Anyone can create a fundraising campaign by defining a title, description,
          and optional media such as images or videos. Campaign creators may also
          choose to set a funding goal, a deadline, or both.
          <br />
          <br />
          Once created, all campaign data is stored on the blockchain and cannot be
          changed, ensuring transparency and trust.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          2. Support campaigns with crypto
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          Supporters can donate cryptocurrency directly to active campaigns.
          All contributions are sent to a smart contract, not to an intermediary or
          centralized entity. Every donation is publicly verifiable on-chain.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          3. When does a campaign end?
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          A campaign is automatically completed when one of the following conditions
          is met:
        </p>

        <ul className="list-disc list-inside text-lg leading-relaxed space-y-2 mt-4 text-[#6b6b6b]">
          <li>The fundraising goal is reached</li>
          <li>The campaign deadline is reached</li>
        </ul>

        <p className="text-lg leading-relaxed mt-4 text-[#6b6b6b]">
          Until one of these conditions is fulfilled, the campaign remains active
          and open for donations.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          4. Automatic fund distribution
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          When a campaign is completed, the smart contract automatically handles
          fund distribution. A small platform fee is applied, and the remaining
          balance is sent directly to the campaign creator.
          <br />
          <br />
          This process cannot be blocked, delayed, or manipulated — it is fully
          enforced by code.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          5. Transparency and security
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          All campaigns, donations, and withdrawals are permanently recorded on the
          blockchain. Smart contracts guarantee that funds can only be accessed when
          campaign conditions are met.
          <br />
          <br />
          CryptoAid replaces trust in intermediaries with trust in transparent,
          verifiable code.
        </p>
      </div>
    </main>
  );
}
