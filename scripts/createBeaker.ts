
import hre from 'hardhat'
import { BigNumber } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../abi/Factory.json'
import { Factory } from '../typechain'
import { makeFactory } from '../src/index'

const main = async function () {

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

    // contract instance of the factory
    let factory: Factory 

    /**
     * DEFINE PARAMETERS
     * 
     * This section is for defining the parameters for creating a beaker. 
     * These are default placeholder values that are meant to be changed to custom values.
     */

    // contract address of the beaker factory
    // NOTE: leave empty if deploying factory for the first time
    let FACTORY_ADDRESS = ''

    // block that ends the funding phase of the beaker
    const END_BLOCK = 1000000000000

    // target AVAX goal to reach
    const GOAL = hre.ethers.utils.parseEther('0.1')

    // the lowest price the beaker contract can be bought out at
    const FLOOR = GOAL.div(2)

    // the initial buyout price 
    const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

    // the name of the beaker
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
     * This section is for contract execution. The factory is instantiated and a
     * beaker is created using the previously defined parameters. 
     * After the transaction is confirmed, the ID of the beaker and 
     * the contract address are displayed as output.
     */

    // create factory contract instance
    if (FACTORY_ADDRESS === '') {
        ({ factory } = await makeFactory(signer))
    } else {
        factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory
    }

    // create beaker
    const tx: TransactionResponse = await factory.connect(signer).createBeaker(
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

    // beaker id
    const beakerId = (await factory.beakerCount()).sub(1)

    // beaker address
    const beakerAddress = await factory.getBeaker(beakerId)

    console.log(`Beaker id: ${beakerId}`)
    console.log(`Beaker deployed to address: ${beakerAddress}`)
    console.log(`tx: ${receipt.transactionHash}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });