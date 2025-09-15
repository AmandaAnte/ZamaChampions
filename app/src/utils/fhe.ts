import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle'
export { CONTRACT_ADDRESS } from './config'

let fhevmInstance: any = null

export async function initFHEVM() {
  if (fhevmInstance) return fhevmInstance

  try {
    await initSDK()

    const config = {
      ...SepoliaConfig,
      network: (window as any).ethereum
    }

    fhevmInstance = await createInstance(config)
    return fhevmInstance
  } catch (error) {
    console.error('Failed to initialize FHEVM:', error)
    throw error
  }
}

export function getFHEVMInstance() {
  if (!fhevmInstance) {
    throw new Error('FHEVM not initialized. Call initFHEVM() first.')
  }
  return fhevmInstance
}

export async function encryptBetData(contractAddress: string, userAddress: string, betDirection: number, betCount: number) {
  const instance = getFHEVMInstance()

  const buffer = instance.createEncryptedInput(contractAddress, userAddress)
  buffer.add8((betDirection))
  buffer.add32((betCount))

  return await buffer.encrypt()
}

export async function decryptUserPoints(ciphertextHandle: string, contractAddress: string, userAddress: string, walletClient: any) {
  // Check if handle is all zeros (empty/uninitialized value)
  const zeroHandle = '0x0000000000000000000000000000000000000000000000000000000000000000'
  if (ciphertextHandle === zeroHandle || ciphertextHandle === '0x0' || !ciphertextHandle || ciphertextHandle === '0') {
    return 0
  }

  const instance = getFHEVMInstance()

  const keypair = instance.generateKeypair()
  const handleContractPairs = [
    {
      handle: ciphertextHandle,
      contractAddress: contractAddress,
    },
  ]

  const startTimeStamp = Math.floor(Date.now() / 1000).toString()
  const durationDays = "10"
  const contractAddresses = [contractAddress]

  const eip712 = instance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays)
  const signature = await walletClient.signTypedData({
    account: walletClient.account,
    domain: eip712.domain,
    types: {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    primaryType: 'UserDecryptRequestVerification',
    message: eip712.message
  });

  const result = await instance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace("0x", ""),
    contractAddresses,
    userAddress,
    startTimeStamp,
    durationDays,
  )

  return result[ciphertextHandle]
}