/**
 * About - Institutional page
 *
 * Static page containing project information
 * Portfolio-oriented Web3 project description
 */

export default function About() {
  return (
    <main className="min-h-screen bg-[#faf8f6] text-[#3b3b3b]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-6">
          About <span className="text-[#3f8f7b]">CryptoAid</span>
        </h1>

        <p className="text-lg leading-relaxed mb-8 text-[#6b6b6b]">
          CryptoAid is a Web3 crowdfunding platform built as a portfolio project
          to demonstrate the practical application of blockchain technology in
          real-world use cases. The platform showcases how smart contracts can
          replace intermediaries, automate trust, and create transparent digital
          funding environments.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Project Purpose
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          The main objective of CryptoAid is to explore decentralized architecture,
          on-chain logic, and smart contract integration within a modern frontend
          application. Rather than being a commercial fundraising platform, this
          project exists as a technical study and demonstration of Web3 development
          principles.
          <br />
          <br />
          It reflects an understanding of how blockchain systems can be used to
          enhance transparency, automate conditional logic, and remove reliance
          on centralized control.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Technologies Used
        </h2>
        <ul className="list-disc list-inside text-lg leading-relaxed space-y-2 text-[#6b6b6b]">
          <li>Next.js (App Router)</li>
          <li>TailwindCSS for UI design</li>
          <li>Solidity smart contracts</li>
          <li>Ethers.js for blockchain interaction</li>
          <li>Wallet connection via Web3 providers</li>
          <li>On-chain state handling and event listening</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Design Philosophy
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          CryptoAid was designed with clarity and minimalism in mind. The goal
          was to create a clean interface that makes decentralized interactions
          feel intuitive and accessible. The platform balances modern UI principles
          with blockchain functionality, ensuring that the technical layer does
          not overwhelm the user experience.
        </p>

        <h2 className="text-2xl font-semibold mt-10 mb-4">
          Portfolio Notice
        </h2>
        <p className="text-lg leading-relaxed text-[#6b6b6b]">
          CryptoAid is a portfolio project created for educational and
          demonstrative purposes. It does not represent a live financial product,
          and no real-world guarantees are implied. The project exists to
          illustrate Web3 architecture, smart contract integration, and frontend
          engineering in a decentralized environment.
        </p>
      </div>
    </main>
  );
}
