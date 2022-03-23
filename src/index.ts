import { Contract } from 'ethers'
import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'

import { Beaker, Escrow, Factory } from '../typechain'


// Generates an encoding of a contract call given the contract, function signature, and function args
export const generateEncoding = (contract: Contract, functionSignature: string, functionArgs?: any[]): string => {

    const args = functionArgs ? functionArgs : undefined

    return contract.interface.encodeFunctionData(functionSignature, args)
}

export const makeFactory = async (governance: SignerWithAddress) => {
	const FactoryDeployer = await ethers.getContractFactory("Factory", governance)
	const factory = (await FactoryDeployer.deploy(governance.address)) as Factory

	const EscrowDeployer = await ethers.getContractFactory("Escrow", governance)
	const escrow = (await EscrowDeployer.deploy(factory.address)) as Escrow

	const BeakerDeployer = await ethers.getContractFactory("Beaker")
	const implementation = (await BeakerDeployer.deploy()) as Beaker

	await factory.connect(governance).setEscrow(escrow.address)

	await factory.connect(governance).setImplementation(implementation.address)

	return { factory, escrow, implementation }
}