import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
  appName: 'Champion Betting',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
})

// Contract addresses - update these after deployment
export const CONTRACT_ADDRESS = '0x66CFeA6126102918B4533Aaad9bf64beea3460A1' as const

// Zama FHE configuration for Sepolia
export const FHEVM_CONFIG = {
  aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c',
  kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC',
  inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4',
  verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1',
  verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F',
  chainId: 11155111,
  gatewayChainId: 55815,
  network: 'https://eth-sepolia.public.blastapi.io',
  relayerUrl: 'https://relayer.testnet.zama.cloud',
}