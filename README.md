# Exposure Token Workshop

# Installation
To install dependencies, `npm i`

## Environment Variables
To use this workshop, create an `.env` file with two variables:
- `MNEMONIC`: The mnemonic of the account address to create exposure tokens
- `AVALANCHE_RPC`: The avalanche rpc url. If none is used, then `https://api.avax.network/ext/bc/C/rpc` is used by default

## Usage

The `createExposureToken.ts` script is a template script meant for easily spinning up an exposure token instance. The script is meant as a guide for arbitrary editing to deploy a desired exposure token.

The script in the `/avalanche` folder should be run with:

`npx hardhat --network avalanche run scripts/avalanche/createExposureToken.ts`

This will run the script on the Avalanche network.

---

To run a test script first, use the script in the `/fork` folder. This script should be run with: 

`npx hardhat --network hardhat run scripts/fork/createExposureToken.ts`

This runs the script in a local avalanche network fork and should be used for testing before running the mainnet script.