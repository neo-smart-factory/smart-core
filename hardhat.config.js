require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    overrides: {
      // Legacy module with runtime-size pressure.
      "contracts/NeoSmartFactory.sol": {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
      // Contracts instantiated by NeoSmartFactory (their creation code is embedded).
      "contracts/tokens/NeoERC20.sol": {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
      "contracts/tokens/NeoERC721.sol": {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
      "contracts/vesting/NeoVesting.sol": {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
      "contracts/rewards/NeoRewards.sol": {
        version: "0.8.26",
        settings: {
          viaIR: true,
          optimizer: {
            enabled: true,
            runs: 1,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
    },
  },

  networks: {
    hardhat: {
      chainId: 1337,
    },
    polygon: {
      url: process.env.POLYGON_RPC || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
    },
    amoy: {
      url: process.env.AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
    },
    base: {
      url: process.env.BASE_RPC || "https://mainnet.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 8453,
    },
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey:
      process.env.ETHERSCAN_KEY ||
      process.env.BASESCAN_KEY ||
      process.env.POLYGONSCAN_KEY ||
      "",
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
