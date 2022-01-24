import { Contract } from 'ethers'


// Generates an encoding of a contract call given the contract, function signature, and function args
export const generateEncoding = (contract: Contract, functionSignature: string, functionArgs?: any[]): string => {

    const args = functionArgs ? functionArgs : undefined

    return contract.interface.encodeFunctionData(functionSignature, args)
}