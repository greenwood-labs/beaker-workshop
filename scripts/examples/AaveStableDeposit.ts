
import hre from 'hardhat'
import { BigNumber, constants } from 'ethers'
import { TransactionResponse, TransactionReceipt } from '@ethersproject/providers'

import FactoryABI from '../../abi/Factory.json'
import BeakerABI from '../../abi/Beaker.json'
import ERC20ABI from '../../abi/ERC20.json'
import AavePeripheryABI from '../../abi/AavePeriphery.json'
import IPangolinRouterABI from '../../abi/IPangolinRouter.json'
import { Factory, Beaker, ERC20, IPangolinRouter, AavePeriphery } from '../../typechain'
import { generateEncoding } from "../../src/index"

const main = async function () {

    // get all signers stored in hardhat runtime
    const accounts = await hre.ethers.getSigners()

    // retrieve user account provided by mnemonic
    const signer = accounts[0]

    // contract address of the beaker factory
    let FACTORY_ADDRESS = '0x9c674a373ffbdd6f3c117fce615ea85363f1c61a'

    // create factory contract instance
    const factory: Factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory

    /**
     * DEFINE PARAMETERS
     * 
     * This section is for defining the parameters for creating a beaker. 
     * These are default placeholder values that are meant to be changed to custom values.
     */

    // contract address of the pangolin router
    const PANGOLIN_ROUTER_ADDRESS = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"

    // contract instance of the pangolin router
	const PANGOLIN_ROUTER_CONTRACT = (await hre.ethers.getContractAt(IPangolinRouterABI, PANGOLIN_ROUTER_ADDRESS)) as IPangolinRouter

    // contract address of the aave periphery
    const AAVE_PERIPHERY_ADDRESS = "0x198D327ab49AE92870A54908345E2A74E7869407"

    // contract instance of the aave periphery
    const AAVE_PERIPHERY_CONTRACT = (await hre.ethers.getContractAt(AavePeripheryABI, AAVE_PERIPHERY_ADDRESS)) as AavePeriphery

    // wavax address
    const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"

    // contract address of desired tokens
	const TOKENS = {
		DAI: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
		USDC: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
		USDT: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
        aDAI: "0x82E64f49Ed5EC1bC6e43DAD4FC8Af9bb3A2312EE",
		aUSDC: "0x625E7708f30cA75bfd92586e17077590C60eb4cD",
		aUSDT: "0x6ab707Aca953eDAeFBc4fD23bA73294241490620"
	}

    const DAI_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['DAI'])) as ERC20
    const USDC_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['USDC'])) as ERC20
    const USDT_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['USDT'])) as ERC20

    // determines the account's beaker id
	const accountTokenId = await factory.accountBeakers(signer.address)

	// determines the beaker address
	const computedBeakerAddress = await factory.computeBeakerAddress(signer.address, accountTokenId)

	const CURRENT_BLOCK = await hre.ethers.provider.getBlockNumber()
	const CURRENT_TIMESTAMP = (await hre.ethers.provider.getBlock(CURRENT_BLOCK)).timestamp

	const DEADLINE = CURRENT_TIMESTAMP + 86400

	// block that ends the funding phase of the beaker
	const END_BLOCK = CURRENT_BLOCK + 86400

    // target AVAX goal to reach
    const GOAL = hre.ethers.utils.parseEther('1000')

    // the lowest price the beaker contract can be bought out at
    const FLOOR = GOAL.div(2)

    // the initial buyout price 
    const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

    // the name of the beaker
    const TOKEN_NAME = hre.ethers.utils.formatBytes32String('Aave Stablecoin Supply')

    // the contract address to call for each transaction
    const TARGETS: string[] = [
        PANGOLIN_ROUTER_ADDRESS,
        PANGOLIN_ROUTER_ADDRESS,
        PANGOLIN_ROUTER_ADDRESS,
        TOKENS['DAI'],
        TOKENS['USDC'],
        TOKENS['USDT'],
        AAVE_PERIPHERY_ADDRESS,
        AAVE_PERIPHERY_ADDRESS,
        AAVE_PERIPHERY_ADDRESS
    ]

    // the function signatures of each transaction
    //
    // for example, a signature for transferring tokens can be 
    // derived as follows: generateEncoding(erc20ContractInstance, 'transfer', [accountAddress, transferAmount])
    const SIGNATURES: string[] = [
        // swap AVAX for DAI
        generateEncoding(PANGOLIN_ROUTER_CONTRACT, "swapExactAVAXForTokens", [
            BigNumber.from(0),
            [WAVAX_ADDRESS, TOKENS['DAI']],
            computedBeakerAddress,
            DEADLINE
        ]),
        // swap AVAX for USDC
        generateEncoding(PANGOLIN_ROUTER_CONTRACT, "swapExactAVAXForTokens", [
            BigNumber.from(0),
            [WAVAX_ADDRESS, TOKENS['USDC']],
            computedBeakerAddress,
            DEADLINE
        ]),
        // swap AVAX for DAI
        generateEncoding(PANGOLIN_ROUTER_CONTRACT, "swapExactAVAXForTokens", [
            BigNumber.from(0),
            [WAVAX_ADDRESS, TOKENS['USDT']],
            computedBeakerAddress,
            DEADLINE
        ]),
        // infinite approve aave periphery to spend DAI
        generateEncoding(DAI_CONTRACT, "approve", [AAVE_PERIPHERY_ADDRESS, constants.MaxUint256]),
        // infinite approve aave periphery to spend USDC
        generateEncoding(USDC_CONTRACT, "approve", [AAVE_PERIPHERY_ADDRESS, constants.MaxUint256]),
        // infinite approve aave periphery to spend USDT
        generateEncoding(USDT_CONTRACT, "approve", [AAVE_PERIPHERY_ADDRESS, constants.MaxUint256]),
        // call aave periphery to deposit DAI
        generateEncoding(AAVE_PERIPHERY_CONTRACT, "aaveSupplyERC20", [TOKENS['DAI']]),
        // call aave periphery to deposit USDC
        generateEncoding(AAVE_PERIPHERY_CONTRACT, "aaveSupplyERC20", [TOKENS['USDC']]),
        // call aave periphery to deposit USDT
        generateEncoding(AAVE_PERIPHERY_CONTRACT, "aaveSupplyERC20", [TOKENS['USDT']])
    ]

    // values of native token to send with each transaction
	  const VALUES: BigNumber[] = [
        GOAL.div(3),
        GOAL.div(3),
        GOAL.div(3),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
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

        // test that the transactions executed correctly here
        const aDAI_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['aDAI'])) as ERC20
        const aUSDC_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['aUSDC'])) as ERC20
        const aUSDT_CONTRACT = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['aUSDT'])) as ERC20

        console.log(await aDAI_CONTRACT.balanceOf(beaker.address))
        console.log(await aUSDC_CONTRACT.balanceOf(beaker.address))
        console.log(await aUSDT_CONTRACT.balanceOf(beaker.address))
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });