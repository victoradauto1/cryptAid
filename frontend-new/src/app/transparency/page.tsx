/**
 * Transparency - Web3 architecture and on-chain logic explanation
 *
 * Institutional page explaining how blockchain logic is applied
 * Details about smart contracts, transparency, and decentralization principles
 */

export default function Transparency() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">
          Transparency & <span className="text-[#3f8f7b]">On-Chain Logic</span>
        </h1>

        <p className="text-lg leading-relaxed mb-8 text-[#6b6b6b]">
          Transparency is one of the fundamental principles of blockchain
          technology. CryptoAid is built around this concept, ensuring that
          all critical operations are executed through smart contracts and
          publicly verifiable on-chain.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Smart Contract Execution
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          All campaign logic — including funding conditions, contribution
          tracking, and state transitions — is handled directly by Solidity
          smart contracts deployed on the blockchain.
          <br />
          <br />
          This means that once deployed, the rules governing campaign behavior
          cannot be altered arbitrarily. The contract enforces predefined logic,
          eliminating the need for centralized control or manual intervention.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Publicly Verifiable Data
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          Every transaction, contribution, and campaign state change is recorded
          on-chain. Users can independently verify these interactions using
          blockchain explorers.
          <br />
          <br />
          The frontend interface serves as a visualization layer, but the source
          of truth remains the blockchain itself.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Decentralized Trust Model
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          Traditional crowdfunding platforms rely on centralized entities to
          manage funds and enforce rules. CryptoAid replaces this model with
          deterministic contract execution.
          <br />
          <br />
          Trust is not placed in a company or intermediary, but in transparent
          code that executes identically for every participant.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Frontend as Interface Layer
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          The application interface is built using modern web technologies to
          provide clarity and usability. However, it does not custody funds,
          modify contract logic, or control outcomes.
          <br />
          <br />
          Its role is to interact with the deployed contracts through a Web3
          provider, translating blockchain data into an accessible user experience.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Portfolio Context
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          As a portfolio project, CryptoAid demonstrates an understanding of
          decentralized application architecture, smart contract constraints,
          and the practical implications of blockchain transparency.
          <br />
          <br />
          The system is intended for educational and demonstrative purposes,
          highlighting how Web3 principles can be integrated into modern frontend
          environments.
        </p>
      </div>
    </main>
  );
}
