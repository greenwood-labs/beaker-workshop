
import hre from "hardhat"
import { BigNumber } from "ethers"
import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers"

import FactoryABI from "../../abi/Factory.json"
import IPangolinRouterABI from "../../abi/IPangolinRouter.json"
import WavaxABI from '../../abi/Wavax.json'
import { Factory, IPangolinRouter, Wavax } from "../../typechain"
import { generateEncoding } from "../../src/index"


const main = async function () {

	/**
	 * DESCRIPTION
	 * 
	 * This exposure token will swap given amount of AVAX with each token from the list: 
	 * [WETH.e, WBTC.e, WAVAX] via Pangolin Router
	 */

	// get all signers stored in hardhat runtime
	const accounts = await hre.ethers.getSigners()

	// retrieve user account provided by mnemonic
	const signer = accounts[0]

	// contract address of the exposure token factory
	const FACTORY_ADDRESS = "0x071A0d274235C614992A745c98630F01035Afb9e"

	// create factory contract instance
	const factory: Factory = (await hre.ethers.getContractAt(FactoryABI, FACTORY_ADDRESS)) as Factory

	/**
	 * DEFINE PARAMETERS
	 * 
	 * This section is for defining the parameters for creating an exposure token. 
	 * These are default placeholder values that are meant to be changed to custom values.
	 */

	// contract address of the pangolin router
	const PANGOLIN_ROUTER_ADDRESS = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"

	// contract instance of the pangolin router
	const PANGOLIN_ROUTER_CONTRACT = (await hre.ethers.getContractAt(IPangolinRouterABI, PANGOLIN_ROUTER_ADDRESS)) as IPangolinRouter

	// define params of swapExactAVAXForTokens from pangolin's router

	const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"

    // contract instance of WAVAX
    const WAVAX_CONTRACT = (await hre.ethers.getContractAt(WavaxABI, WAVAX_ADDRESS)) as Wavax

	// contract address of desired tokens
	const TOKENS: any = {
		WETH: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
		WBTC: "0x50b7545627a5162F82A992c33b87aDc75187B218",
	}

	const PATHS = Object.values(TOKENS).map((token) => [WAVAX_ADDRESS, token])

	// determines the account's eToken id
	const accountTokenId = await factory.accountExposureTokens(signer.address)

	// determines the exposure token address
	const computedETokenAddress = await factory.computeExposureTokenAddress(signer.address, accountTokenId)

	const CURRENT_BLOCK = await hre.ethers.provider.getBlockNumber()
	const CURRENT_TIMESTAMP = (await hre.ethers.provider.getBlock(CURRENT_BLOCK)).timestamp

	const DEADLINE = CURRENT_TIMESTAMP + 86400

	// block that ends the funding phase of the exposure token
	const END_BLOCK = CURRENT_BLOCK + 86400

	// target AVAX goal to reach
	const GOAL = hre.ethers.utils.parseEther("10")

	// Amount of AVAX to dedicate to each swap
	const AMOUNT_IN = GOAL.div(3)

	// the lowest price the exposure token contract can be bought out at
	const FLOOR = GOAL.div(2)

	// the initial buyout price 
	const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

	// the name of the exposure token
	const TOKEN_NAME = hre.ethers.utils.formatBytes32String("Blue-Chip-Investor")

	// the contract address to call for each transaction
	const TARGETS: string[] = []

	// values of native token to send with each transaction
	const VALUES: BigNumber[] = []

	// the function signatures of each transaction
	//
	// for example, a signature for transferring tokens can be 
	// derived as follows: generateEncoding(erc20ContractInstance, "transfer", [accountAddress, transferAmount])
	const SIGNATURES: string[] = []

    // generate encoding for pangolin router swap
	for (let i = 0; i < PATHS.length; i++) {
		TARGETS.push(PANGOLIN_ROUTER_ADDRESS)
		SIGNATURES.push(generateEncoding(
			PANGOLIN_ROUTER_CONTRACT,
			"swapExactAVAXForTokens",
			[
				BigNumber.from("0"),
				PATHS[i],
				computedETokenAddress,
				DEADLINE
			]
		))
		VALUES.push(AMOUNT_IN)
	}

    // generate encodings for AVAX -> WAVAX wrapping
    TARGETS.push(WAVAX_ADDRESS)
    SIGNATURES.push(generateEncoding(
        WAVAX_CONTRACT,
        'deposit'
    ))
    VALUES.push(AMOUNT_IN)

	/**
	 * CONTRACT EXECUTION
	 * 
	 * This section is for contract execution. The factory is instantiated and an 
	 * exposure token is created using the previously defined parameters. 
	 * After the transaction is confirmed, the ID of the exposure token and 
	 * the contract address are displayed as output.
	 */

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
		console.error(error)
		process.exit(1)
	})
