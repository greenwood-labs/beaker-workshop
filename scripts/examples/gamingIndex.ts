
import hre from "hardhat"
import { BigNumber } from "ethers"
import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers"

import FactoryABI from "../../abi/Factory.json"
import IPangolinRouterABI from "../../abi/IPangolinRouter.json"
import BeakerABI from '../../abi/Beaker.json'
import ERC20ABI from '../../abi/ERC20.json'
import { Factory, Beaker, ERC20, IPangolinRouter } from "../../typechain"
import { generateEncoding } from "../../src/index"


const main = async function () {

	/**
	 * DESCRIPTION
	 * 
	 * This beaker will swap given amount of AVAX with each token from the list: 
	 * [CRA, TUS, CRAFT] via Pangolin Router
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

	// contract address of the pangolin router
	const PANGOLIN_ROUTER_ADDRESS = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"

	// contract instance of the pangolin router
	const PANGOLIN_ROUTER_CONTRACT = (await hre.ethers.getContractAt(IPangolinRouterABI, PANGOLIN_ROUTER_ADDRESS)) as IPangolinRouter

	// define params of swapExactAVAXForTokens from pangolin's router

	const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"

	// contract address of desired tokens
	const TOKENS = {
		CRA: "0xa32608e873f9ddef944b24798db69d80bbb4d1ed",
		TUS: "0xf693248F96Fe03422FEa95aC0aFbBBc4a8FdD172",
		CRAFT: "0x8aE8be25C23833e0A01Aa200403e826F611f9CD2",
	}

	const PATHS = Object.values(TOKENS).map((token) => [WAVAX_ADDRESS, token])

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
	const GOAL = hre.ethers.utils.parseEther("10")

	// Amount of AVAX to dedicate to each swap
	const AMOUNT_IN = GOAL.div(Object.keys(TOKENS).length)

	// the lowest price the beaker contract can be bought out at
	const FLOOR = GOAL.div(2)

	// the initial buyout price 
	const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

	// the name of the beaker
	const TOKEN_NAME = hre.ethers.utils.formatBytes32String("Gaming Token Index")

	// the contract address to call for each transaction
	const TARGETS: string[] = []

	// values of native token to send with each transaction
	const VALUES: BigNumber[] = []

	// the function signatures of each transaction
	//
	// for example, a signature for transferring tokens can be 
	// derived as follows: generateEncoding(erc20ContractInstance, "transfer", [accountAddress, transferAmount])
	const SIGNATURES: string[] = []

	for (let i = 0; i < PATHS.length; i++) {
		TARGETS.push(PANGOLIN_ROUTER_ADDRESS)
		SIGNATURES.push(generateEncoding(
			PANGOLIN_ROUTER_CONTRACT,
			"swapExactAVAXForTokens",
			[
				BigNumber.from("0"),
				PATHS[i],
				computedBeakerAddress,
				DEADLINE
			]
		))
		VALUES.push(AMOUNT_IN)
	}

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
        const cra: ERC20 = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['CRA'])) as ERC20
		const tus: ERC20 = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['TUS'])) as ERC20
		const craft: ERC20 = (await hre.ethers.getContractAt(ERC20ABI, TOKENS['CRAFT'])) as ERC20

        console.log(await cra.balanceOf(beakerAddress))
		console.log(await tus.balanceOf(beakerAddress))
		console.log(await craft.balanceOf(beakerAddress))
    }
}


main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
