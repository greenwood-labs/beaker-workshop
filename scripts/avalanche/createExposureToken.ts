
import hre from 'hardhat'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import { Factory } from '../../typechain'

const main = async function () {

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

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

    // create factory contract instance
    const factory: Factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory

    // determine targets, signatures, and values for the exposure token
    const targets: string[] = ['']
    const signatures: string[] = ['']
	const values: string[] = ['']

    // create exposure token
    const tx: TransactionResponse = await factory.connect(signer).createExposureToken(
        END_BLOCK,
        GOAL,
        FLOOR,
        INITIAL_BUYOUT_PRICE,
        targets,
        signatures,
        values,
        TOKEN_NAME
    )
    
    // wait for transaction to confirm
    const receipt: TransactionReceipt = await tx.wait()

    // exposure token id
    const exposureTokenId = await factory.exposureTokenCount()

    // exposure token address
    const exposureTokenAddress = await factory.getExposureToken(exposureTokenId.sub(1))

    console.log(`Exposure token deployed to address: ${exposureTokenAddress}`)
    console.log(`tx: ${receipt.transactionHash}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });