
import hre from "hardhat"
import { BigNumber } from "ethers"
import { TransactionResponse, TransactionReceipt } from "@ethersproject/providers"

import FactoryABI from "../../abi/Factory.json"
import IPangolinRouterABI from "../../abi/IPangolinRouter.json"
import { Factory, IPangolinRouter } from "../../typechain"
import { generateEncoding } from "../../src/index"

const main = async function () {

	/**
	 * DESCRIPTION
	 * 
	 * This exposure token will add the AVAX funds to a simple yield optimizer on 
	 * Beefy Finance. In return the exposure token will receive mooAaveAVAX tokens
	 * which will be redeemable for constantly accruing AVAX.
	 */

	// get all signers stored in hardhat runtime
	const accounts = await hre.ethers.getSigners()

	// retrieve user account provided by mnemonic
	const signer = accounts[0]

	// contract address of the exposure token factory
	const FACTORY_ADDRESS = "0xa1416448a7b91c2F178a8b7541AaeccdE0806E7f"

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
	const PANGOLIN_ROUTER_CONTRACT = (await hre.ethers.getContractAt(IPangolinRouterABI.abi, PANGOLIN_ROUTER_ADDRESS)) as IPangolinRouter

	// define params of swapExactAVAXForTokens from pangolin's router

	const WAVAX_ADDRESS = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"

	// contract address of desired tokens
	const TOKENS = {
		QI: "0x8729438EB15e2C8B576fCc6AeCdA6A148776C0F5",
		PNG: "0x60781C2586D68229fde47564546784ab3fACA982",
		PEFI: "0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c",
		JOE: "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd",
		KLO: "0xb27c8941a7Df8958A1778c0259f76D1F8B711C35",
		BLZZ: "0x0f34919404a290e71fc6A510cB4a6aCb8D764b24",
		CRA: "0xA32608e873F9DdEF944B24798db69d80Bbb4d1ed",
		TUS: "0xf693248F96Fe03422FEa95aC0aFbBBc4a8FdD172",
		SPORE: "0x6e7f5C0b9f4432716bDd0a77a3601291b9D9e985",
		BAG: "0xa1144a6A1304bd9cbb16c800F7a867508726566E"
	}

	const PATHS = Object.values(TOKENS).map((token) => [WAVAX_ADDRESS, token])

	const AMOUNT_IN = hre.ethers.utils.parseEther("1")

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

	// the lowest price the exposure token contract can be bought out at
	const FLOOR = GOAL.div(2)

	// the initial buyout price 
	const INITIAL_BUYOUT_PRICE = GOAL.mul(2)

	// the name of the exposure token
	const TOKEN_NAME = hre.ethers.utils.formatBytes32String("Low-Cap-Investor")

	// the contract address to call for each transaction
	const TARGETS: string[] = []

	// values of native token to send with each transaction
	const VALUES: BigNumber[] = []

	// the function signatures of each transaction
	//
	// for example, a signature for transferring tokens can be 
	// derived as follows: generateEncoding(erc20ContractInstance, "transfer", [accountAddress, transferAmount])
	const SIGNATURES: string[] = [
		generateEncoding(PANGOLIN_ROUTER_CONTRACT, "swapExactAVAXForTokens", []),
	]

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
