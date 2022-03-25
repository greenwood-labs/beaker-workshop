# Beaker Workshop
<p align="center"> 
    <img 
        src="https://user-images.githubusercontent.com/8098163/160152339-2498075b-dbd7-41cd-837c-36fbb0be4bf4.png" 
        alt="beaker workshop"
        height="70%"
        width="100%">
</p>

# Installation
To install dependencies, `npm i`

## Environment Variables
To use this workshop, create an `.env` file with two variables:
- `MNEMONIC`: The mnemonic of the account address to create beakers
- `AVALANCHE_RPC`: The avalanche rpc url. If none is used, then `https://api.avax.network/ext/bc/C/rpc` is used by default

## Setup

Once dependencies are installed and the environment variables are set, you will need to generate the contract types from the supplied ABIs. To do this, run:

`npm run generate-types`

You should only have to do this one time, or once after you add new ABI files.

## Usage

The `createBeaker.ts` script is a template script meant for easily spinning up a beaker instance. The script is meant as a guide for arbitrary editing to deploy a desired beaker.

To run the script on an avalanche local fork for testing:

`npx hardhat run scripts/createBeaker.ts`

To run the script on the avalanche mainnet:

`npx hardhat --network avalanche run scripts/createBeaker.ts`
