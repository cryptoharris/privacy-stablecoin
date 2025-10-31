import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- Deploy TSSToken (formerly MyStablecoin) ---
  console.log("Deploying TSSToken...");
  const tssTokenFactory = await ethers.getContractFactory("TSSToken");
  const tssToken = await tssTokenFactory.deploy(deployer.address);

  // Wait for deployment confirmation using .deployed()
  await tssToken.deployed();
  console.log("TSSToken deployment confirmed.");
  console.log(`TSS Token (TSS) deployed to: ${tssToken.address}`);


  // --- Deploy PrivacyPool ---
  console.log("Deploying PrivacyPool...");
  const privacyPoolFactory = await ethers.getContractFactory("PrivacyPool");
  const privacyPool = await privacyPoolFactory.deploy();

  // Wait for deployment confirmation using .deployed()
  await privacyPool.deployed();
  console.log("PrivacyPool deployment confirmed.");
  console.log(`PrivacyPool deployed to: ${privacyPool.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

