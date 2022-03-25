import hre from 'hardhat'
import { BigNumber, constants } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import BeefyVaultABI from '../../abi/BeefyVault.json'
import JoeLpABI from '../../abi/JoeLP.json'
import ZapABI from '../../abi/Zap.json'
import BeakerABI from '../../abi/Beaker.json'
import ERC20ABI from '../../abi/ERC20.json'
import { Factory, BeefyVault, Zap, JoeLP, Beaker, ERC20 } from '../../typechain'
import { generateEncoding } from '../../src/index'


const main = async function () {

    /**
     * DESCRIPTION
     * 
     * This exposure token will zap the AVAX funds into a 
     * USDC-USDC.e liquidity pool on Trader Joe. Then it will take those LP tokens 
     * and deposit them into a Beefy Finance yield optimizer. 
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

    // contract address of the mooJoeUSDC-USDC.e vault
    const BEEFY_VAULT_ADDRESS = '0x42ab5A790E99dF1b5d46f1C5C3e61d0Cd63D1f6E'

    // contract address of the Trader Joe Zap contract
    const ZAP_ADDRESS = '0x2C7B8e971c704371772eDaf16e0dB381A8D02027'

    // contract address of the USDC-USDC.e liquidity pool
    const USDC_USDCe_LP_ADDRESS = '0x2A8A315e82F85D1f0658C5D66A452Bbdd9356783'

    // contract instance of the zap address
    const ZAP_CONTRACT: Zap = (await hre.ethers.getContractAt(ZapABI, ZAP_ADDRESS)) as Zap

    // contract instance of the mooJoeUSDC-USDC.e vault
    const BEEFY_VAULT_CONTRACT: BeefyVault = (await hre.ethers.getContractAt(BeefyVaultABI, BEEFY_VAULT_ADDRESS)) as BeefyVault

    // contract instance of the USDC-USDC.e LP token
    const USDC_USDCe_LP_CONTRACT: JoeLP = (await hre.ethers.getContractAt(JoeLpABI, USDC_USDCe_LP_ADDRESS)) as JoeLP

    // block that ends the funding phase of the beaker
    const END_BLOCK = 1000000000000

    // target AVAX goal to reach
    const GOAL = hre.ethers.utils.parseEther('1')

    // the lowest price the beaker can be bought out at
    const FLOOR = GOAL.div(2)

    // the initial buyout price 
    const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

    // the name of the beaker
    const TOKEN_NAME = hre.ethers.utils.formatBytes32String('USDC/USDC.e LP Beefy')

    // the contract address to call for each transaction
    const TARGETS: string[] = [
        ZAP_ADDRESS,
        USDC_USDCe_LP_ADDRESS,
        BEEFY_VAULT_ADDRESS
    ]

    // the function signatures of each transaction
    //
    // for example, a signature for transferring tokens can be 
    // derived as follows: generateEncoding(erc20ContractInstance, 'transfer', [accountAddress, transferAmount])
    const SIGNATURES: string[] = [
        generateEncoding(ZAP_CONTRACT, 'zapIn', [USDC_USDCe_LP_ADDRESS]),
        generateEncoding(USDC_USDCe_LP_CONTRACT, 'approve', [BEEFY_VAULT_ADDRESS, constants.MaxUint256]),
        generateEncoding(BEEFY_VAULT_CONTRACT, 'depositAll'),
    ]

    // values of native token to send with each transaction
	const VALUES: BigNumber[] = [
        GOAL,
        constants.Zero,
        constants.Zero
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

    console.log(`Beaker id: ${beakerId}`)
    console.log(`Beaker deployed to address: ${beakerAddress}`)
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
        const token: ERC20 = (await hre.ethers.getContractAt(ERC20ABI, BEEFY_VAULT_ADDRESS)) as ERC20
        console.log(await token.balanceOf(beakerAddress))
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });