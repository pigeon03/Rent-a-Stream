// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // 1) Grab your contract
  const Factory = await ethers.getContractFactory("SubscriptionNFT");
  // 2) Deploy with NO arguments (constructor takes none)
  const subscription = await Factory.deploy();
  // 3) Wait for it
  await subscription.waitForDeployment();

  // 4) Log the address
  console.log("SubscriptionNFT deployed to:", subscription.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
