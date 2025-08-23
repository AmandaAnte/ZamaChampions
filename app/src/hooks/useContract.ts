import { useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi'
import { FOOTBALL_BETTING_ABI } from '../utils/contract'
import { CONTRACT_ADDRESS } from '../utils/config'
import { Match, MatchBets, UserBet } from '../types/contract'

export function useFootballBettingContract() {
  const { writeContract, isPending: isWritePending } = useWriteContract()

  // Read functions
  const useOwner = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'owner',
  })

  const useMatchCounter = () => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'matchCounter',
  })

  const useGetMatch = (matchId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getMatch',
    args: [matchId],
    enabled: !!matchId,
  })

  const useGetMatchBets = (matchId: bigint) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getMatchBets',
    args: [matchId],
    enabled: !!matchId,
  })

  const useGetUserPoints = (userAddress: `0x${string}`) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getUserPoints',
    args: [userAddress],
    enabled: !!userAddress,
  })

  const useGetUserBet = (matchId: bigint, userAddress: `0x${string}`) => useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FOOTBALL_BETTING_ABI,
    functionName: 'getUserBet',
    args: [matchId, userAddress],
    enabled: !!(matchId && userAddress),
  })

  // Write functions
  const buyPoints = (value: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'buyPoints',
      value,
    })
  }

  const createMatch = (
    homeTeam: string,
    awayTeam: string,
    matchName: string,
    bettingStartTime: bigint,
    bettingEndTime: bigint,
    matchTime: bigint
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'createMatch',
      args: [homeTeam, awayTeam, matchName, bettingStartTime, bettingEndTime, matchTime],
    })
  }

  const placeBet = (
    matchId: bigint,
    encryptedBetDirection: bigint,
    encryptedBetCount: bigint,
    inputProof: `0x${string}`
  ) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'placeBet',
      args: [matchId, encryptedBetDirection, encryptedBetCount, inputProof],
    })
  }

  const finishMatch = (matchId: bigint, result: number) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'finishMatch',
      args: [matchId, result],
    })
  }

  const settleBet = (matchId: bigint) => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'settleBet',
      args: [matchId],
    })
  }

  const withdraw = () => {
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      functionName: 'withdraw',
    })
  }

  // Event watchers
  const useWatchMatchCreated = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'MatchCreated',
      onLogs,
    })
  }

  const useWatchBetPlaced = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'BetPlaced',
      onLogs,
    })
  }

  const useWatchMatchFinished = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: FOOTBALL_BETTING_ABI,
      eventName: 'MatchFinished',
      onLogs,
    })
  }

  const useWatchBetSettled = (onLogs: (logs: any[]) => void) => {
    return useWatchContractEvent({
      address: CONTRACT_ADDRESS,
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