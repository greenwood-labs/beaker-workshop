# Beaker Workshop
<p align="center"> 
    <img 
        src="https://user-images.githubusercontent.com/8098163/160152339-2498075b-dbd7-41cd-837c-36fbb0be4bf4.png" 
        alt="beaker workshop"
        height="70%"
        width="100%">
</p>

## Overview
[Beaker Finance](https://twitter.com/beakerfinance) is a decentralized financial protocol created by [Greenwood Labs](https://twitter.com/GreenwoodLabs). With Beakers, you can buy fractions of DeFi trades that were created by other people, giving you a faster and cheaper alternative to doing trades alone.

The Beaker Workshop is a repository of templates, examples, and tooling that is designed to help developers write, test, and deploy Beakers.

## Getting Started

### 1. Install Dependencies
```bash
# clone the repo
git clone https://github.com/greenwood-finance/beaker-workshop.git

# move into the project directory
cd beaker-workshop

# install the dependencies
npm i
```

### 2. Create Environment Variables
Create a `.env` file at the root of the beaker-workshop directory
```bash
# create .env file
touch .env
```

Add two envrionment variables to the `.env` file:
```bash
# add the mnemonic of the account address that will create beakers
echo "MNEMONIC=whatever the mnemonic for your avalanche wallet is" >> .env

# add the avalanche rpc url that you want to use, https://api.avax.network/ext/bc/C/rpc is used by default
echo "AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc" >> .env
```

The resulting `.env` file should look something like this:
```
MNEMONIC=whatever the mnemonic for your avalanche wallet is
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
```

### 3. Generate Types
Once dependencies are installed and the environment variables are set, you will need to generate the contract types from the supplied ABIs. To do this, run:

```bash
# generate types
npm run generate-types
```

**NOTE: you need to regenerate types when you add new ABI files.**

## Usage

The `createBeaker.ts` script is a template script meant for easily creating a custom Beaker. The script is meant as a guide for arbitrary editing to deploy a desired beaker.

To execute the script on an avalanche local fork for testing, run the following command:

```bash
# deploy createBeaker.ts on a local avalanche fork
npx hardhat run scripts/createBeaker.ts
```

To execute the script on the avalanche mainnet, run the following command:
```bash
# deploy createBeaker.ts on avalanche mainnet
npx hardhat --network avalanche run scripts/createBeaker.ts
```

If you're not ready to create your own Beaker from scratch, you can view Beakers that others have created in `/scripts/examples`. You can modify these examples and deploy them on an avalanche local fork for testing by running the following command:
```bash
# deploy an example beaker on on a local avalanche fork
npx hardhat run scripts/examples/someExampleBeaker.ts
```

You can deploy example Beakers on avalanche mainnet by running the following command:
```bash
# deploy an example beaker on avalanche mainnet
npx hardhat --network avalanche run scripts/examples/someExampleBeaker.ts
```

**NOTE: you are responsible for verifying that the `initialTransactions` specified in the example scripts can be executed. WRITE TESTS!**

## Disclaimer
This software is unaudited and is provided on an "as is" and "as available" basis. If you choose to interact with these smart contracts, please do so with the understanding that your assets are at risk of being lost. We do not give any warranties and will not be liable for any loss incurred through any use of this codebase.
