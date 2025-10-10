import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CryptAidModule", (m) => {
  const cryptAid = m.contract("CryptAid");

  return { cryptAid };
});
