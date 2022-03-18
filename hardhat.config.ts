import * as dotenv from 'dotenv'

import { HardhatUserConfig } from 'hardhat/config'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

dotenv.config()

const accounts = {
	  mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk"
}

const config: HardhatUserConfig = {
    solidity: '0.8.4',
    networks: {
        hardhat: {
            chainId: 43114,
            forking: {
                url: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
            },
            accounts
        },
        avalanche: {
            url: process.env.AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
            chainId: 43114,
            accounts,
        },
    }
}

export default config
