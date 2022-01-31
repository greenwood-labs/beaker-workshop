
import hre from 'hardhat'
import { BigNumber } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import { Factory } from '../../typechain'
import { generateEncoding } from '../../src/index'

const main = async function () {

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

    /**
     * DEFINE PARAMETERS
     * 
     * This section is for defining the parameters for creating an exposure token. 
     * These are default placeholder values that are meant to be changed to custom values.
     */

    // contract address of the exposure token factory
    const FACTORY_ADDRESS = '0xa1416448a7b91c2F178a8b7541AaeccdE0806E7f'

    // block that ends the funding phase of the exposure token
    const END_BLOCK = 1000000000000

    // target AVAX goal to reach
    const GOAL = hre.ethers.utils.parseEther('0.1')

    // the lowest price the exposure token contract can be bought out at
    const FLOOR = GOAL.div(2)

    // the initial buyout price 
    const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

    // the name of the exposure token
    const TOKEN_NAME = hre.ethers.utils.formatBytes32String('token-name')

    // the contract address to call for each transaction
    const TARGETS: string[] = [
        '0x0000000000000000000000000000000000000000',
        '0x0000000000000000000000000000000000000000',
    ]

    // the function signatures of each transaction
    //
    // for example, a signature for transferring tokens can be 
    // derived as follows: generateEncoding(erc20ContractInstance, 'transfer', [accountAddress, transferAmount])
    const SIGNATURES: string[] = [
        '0x0000000000000000000000000000000000000000', // use generateEncoding() here
        '0x0000000000000000000000000000000000000000'  // use generateEncoding() here
    ]

    // values of native token to send with each transaction
	  const VALUES: BigNumber[] = [
        BigNumber.from(0),
        BigNumber.from(0)
    ]

    /**
     * CONTRACT EXECUTION
     * 
     * This section is for contract execution. The factory is instantiated and an 
     * exposure token is created using the previously defined parameters. 
     * After the transaction is confirmed, the ID of the exposure token and 
     * the contract address are displayed as output.
     */

    // create factory contract instance
    const factory: Factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory

    // create exposure token
    const tx: TransactionResponse = await factory.connect(signer).createExposureToken(
        END_BLOCK,
        GOAL,
        FLOOR,
        INITIAL_BUYOUT_PRICE,
        TARGETS,
        SIGNATURES,
        VALUES,
        TOKEN_NAME
    )
    
    // wait for transaction to confirm
    const receipt: TransactionReceipt = await tx.wait()

    // exposure token id
    const exposureTokenId = (await factory.exposureTokenCount()).sub(1)

    // exposure token address
    const exposureTokenAddress = await factory.getExposureToken(exposureTokenId)

    console.log(`Exposure token id: ${exposureTokenId}`)
    console.log(`Exposure token deployed to address: ${exposureTokenAddress}`)
    console.log(`tx: ${receipt.transactionHash}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });