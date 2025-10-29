import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // --- Deploy MyStablecoin (MSC) ---
  const MyStablecoinFactory = await ethers.getContractFactory("MyStablecoin");
  console.log("Deploying MyStablecoin...");
  // Pass the deployer's address to the constructor
  const myStablecoin = await MyStablecoinFactory.deploy(deployer.address);

  // Reverting to the .deployed() method for waiting
  await myStablecoin.deployed();
  console.log("MyStablecoin deployment confirmed.");

  // Get address using the older .address property after deployment
  const myStablecoinAddress = myStablecoin.address;
  console.log(`MyStablecoin (MSC) deployed to: ${myStablecoinAddress}`);


  // --- Deploy PrivacyPool ---
  const PrivacyPoolFactory = await ethers.getContractFactory("PrivacyPool");
  console.log("Deploying PrivacyPool...");
  // PrivacyPool constructor takes no arguments
  const privacyPool = await PrivacyPoolFactory.deploy();

  // Reverting to the .deployed() method for waiting
  await privacyPool.deployed();
  console.log("PrivacyPool deployment confirmed.");

  // Get address using the older .address property after deployment
  const privacyPoolAddress = privacyPool.address;
  console.log(`PrivacyPool deployed to: ${privacyPoolAddress}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

