# Exposure Token Workshop

# Installation
To install dependencies, `npm i`

## Environment Variables
To use this workshop, create an `.env` file with two variables:
- `MNEMONIC`: The mnemonic of the account address to create exposure tokens
- `AVALANCHE_RPC`: The avalanche rpc url. If none is used, then `https://api.avax.network/ext/bc/C/rpc` is used by default

## Setup

Once dependencies are installed and the environment variables are set, you will need to generate the contract types from the supplied ABIs. To do this, run:

`npm run generate-types`

You should only have to do this one time.

## Usage

The `createExposureToken.ts` script is a template script meant for easily spinning up an exposure token instance. The script is meant as a guide for arbitrary editing to deploy a desired exposure token.

To run the script on an avalanche local fork for testing:

`npx hardhat run scripts/avalanche/createExposureToken.ts`

To run the script on the avalanche mainnet:

`npx hardhat --network avalanche run scripts/avalanche/createExposureToken.ts`