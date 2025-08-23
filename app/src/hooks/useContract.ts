import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi'
import { FOOTBALL_BETTING_ABI } from '../utils/contract'
import { CONTRACT_ADDRESS } from '../utils/config'

export function useFootballBettingContract() {
  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  // Read functions
  const useOwner = () => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'owner',
  })

  const useMatchCounter = () => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'matchCounter',
  })

  const useGetMatch = (matchId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getMatch',
    args: [matchId],
    query: {
      enabled: !!matchId,
    },
  })

  const useGetMatchBets = (matchId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getMatchBets',
    args: [matchId],
    query: {
      enabled: !!matchId,
    },
  })

  const useGetUserPoints = (userAddress: `0x${string}`) => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getUserPoints',
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  })

  const useGetUserBet = (matchId: bigint, userAddress: `0x${string}`) => useReadContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getUserBet',
    args: [matchId, userAddress],
    query: {
      enabled: !!(matchId && userAddress),
    },
  })

  // Write functions
  const buyPoints = async (value: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'buyPoints',
      value,
    })
  }

  const createMatch = async (
    homeTeam: string,
    awayTeam: string,
    matchName: string,
    bettingStartTime: bigint,
    bettingEndTime: bigint,
    matchTime: bigint
  ) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'createMatch',
      args: [homeTeam, awayTeam, matchName, bettingStartTime, bettingEndTime, matchTime],
    })
  }

  const placeBet = async (
    matchId: bigint,
    encryptedBetDirection: any,
    encryptedBetCount: any,
    inputProof: any
  ) => {
    console.log("placeBet:", encryptedBetCount, encryptedBetDirection, inputProof);

    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'placeBet',
      args: [matchId, encryptedBetDirection, encryptedBetCount, inputProof],
    })
  }

  const finishMatch = async (matchId: bigint, result: number) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'finishMatch',
      args: [matchId, result],
    })
  }

  const settleBet = async (matchId: bigint) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'settleBet',
      args: [matchId],
    })
  }

  const withdraw = async () => {
    return writeContractAsync({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'withdraw',
    })
  }

  // Event watchers
  const useWatchMatchCreated = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'MatchCreated',
      onLogs,
    })
  }

  const useWatchBetPlaced = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'BetPlaced',
      onLogs,
    })
  }

  const useWatchMatchFinished = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'MatchFinished',
      onLogs,
    })
  }

  const useWatchBetSettled = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'BetSettled',
      onLogs,
    })
  }

  return {
    // Read hooks
    useOwner,
    useMatchCounter,
    useGetMatch,
    useGetMatchBets,
    useGetUserPoints,
    useGetUserBet,

    // Write functions
    buyPoints,
    createMatch,
    placeBet,
    finishMatch,
    settleBet,
    withdraw,

    // Event watchers
    useWatchMatchCreated,
    useWatchBetPlaced,
    useWatchMatchFinished,
    useWatchBetSettled,

    // Loading states
    isWritePending,
  }
}