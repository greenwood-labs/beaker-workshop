
import hre from 'hardhat'
import { BigNumber } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import BeefyVaultABI from '../../abi/BeefyVault.json'
import BeakerABI from '../../abi/Beaker.json'
import { Factory, Beaker, BeefyVault } from '../../typechain'
import { generateEncoding } from '../../src/index'

const main = async function () {

    /**
     * DESCRIPTION
     * 
     * This beaker will add the AVAX funds to a simple yield optimizer on 
     * Beefy Finance. In return the beaker will receive mooAaveAVAX tokens
     * which will be redeemable for constantly accruing AVAX.
     */

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

    // contract address of the beaker factory
    const FACTORY_ADDRESS = '0x9c674a373ffbdd6f3c117fce615ea85363f1c61a'

    // create factory contract instance
    const factory: Factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory

    /**
     * DEFINE PARAMETERS
     * 
     * This section is for defining the parameters for creating a beaker. 
     * These are default placeholder values that are meant to be changed to custom values.
     */

    // contract address of the mooAaveAVAX vault
    const BEEFY_VAULT_ADDRESS = '0x1B156C5c75E9dF4CAAb2a5cc5999aC58ff4F9090'

    // contract instance of the mooAaveAVAX vault
    const BEEFY_VAULT_CONTRACT = (await hre.ethers.getContractAt(BeefyVaultABI, BEEFY_VAULT_ADDRESS)) as BeefyVault

    // block that ends the funding phase of the beaker
    const END_BLOCK = 1000000000000

    // target AVAX goal to reach
    const GOAL = hre.ethers.utils.parseEther('0.1')

    // the lowest price the beaker contract can be bought out at
    const FLOOR = GOAL.div(2)

    // the initial buyout price 
    const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

    // the name of the beaker
    const TOKEN_NAME = hre.ethers.utils.formatBytes32String('AVAX Beefy Optimizer')

    // the contract address to call for each transaction
    const TARGETS: string[] = [
        BEEFY_VAULT_ADDRESS
    ]

    // the function signatures of each transaction
    //
    // for example, a signature for transferring tokens can be 
    // derived as follows: generateEncoding(erc20ContractInstance, 'transfer', [accountAddress, transferAmount])
    const SIGNATURES: string[] = [
        generateEncoding(BEEFY_VAULT_CONTRACT, 'depositBNB'),
    ]

    // values of native token to send with each transaction
	const VALUES: BigNumber[] = [
        GOAL
    ]

    /**
     * CONTRACT EXECUTION
     * 
     * This section is for contract execution. The factory is instantiated and a 
     * beaker is created using the previously defined parameters. 
     * After the transaction is confirmed, the ID of the beaker and 
     * the contract address are displayed as output.
     */

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

    console.log(`beaker id: ${beakerId}`)
    console.log(`beaker deployed to address: ${beakerAddress}`)
    console.log(`tx: ${receipt.transactionHash}`)

    // get the current network name
    const network = await hre.network.name

    // only run this code if testing deployment on a forked hardhat network
    if (network === 'hardhat') {
        // simulate contribute
        const beaker: Beaker = (await hre.ethers.getContractAt(BeakerABI, beakerAddress)) as Beaker
        await beaker.connect(signer).contribute(signer.address, {value: GOAL})

        // simulate finalize
        await beaker.connect(signer).finalize()

        // test that the transactions executed correctly
        console.log(await BEEFY_VAULT_CONTRACT.balanceOf(beakerAddress))
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });