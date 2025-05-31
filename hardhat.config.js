require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.19" },   // our SubscriptionNFT
      { version: "0.8.28" }    // any OZ imports at ^0.8.28
    ]
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  }
};
