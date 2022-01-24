import hre from 'hardhat'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import { ExposureToken, Factory } from '../../typechain'

const main = async function () {

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

    ///////////////////////////////////
    // START: LOCAL FORK DEPLOYMENTS //
    ///////////////////////////////////

    // create factory deployer instance
    const FactoryDeployer = await hre.ethers.getContractFactory("Factory", signer)

    // create factory contract instance
    const factory: Factory = (await FactoryDeployer.deploy(signer.address)) as Factory

    // deploy exposure token implementation instance
    const ExposureTokenDeployer = await hre.ethers.getContractFactory("ExposureToken")

    // the exposure token implementation contract
    const implementation: ExposureToken = (await ExposureTokenDeployer.deploy()) as ExposureToken

    // set the implementation to the factory
    factory.connect(signer).setImplementation(implementation.address)

    /////////////////////////////////
    // END: LOCAL FORK DEPLOYMENTS //
    /////////////////////////////////

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