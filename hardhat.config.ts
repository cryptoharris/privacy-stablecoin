import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config"; // Import dotenv

// Read environment variables
const ARBITRUM_SEPOLIA_URL = process.env.ARBITRUM_SEPOLIA_URL || "";
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // --- ADDED THIS NEW NETWORK ---
    arbitrumSepolia: {
      url: ARBITRUM_SEPOLIA_URL,
      accounts: [DEPLOYER_PRIVATE_KEY],
    },
  },
};

export default config;
