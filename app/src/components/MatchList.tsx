import React, { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useFootballBettingContract } from '../hooks/useContract'
import { encryptBetData, CONTRACT_ADDRESS } from '../utils/fhe'
import { BetDirection, BET_UNIT } from '../types/contract'
import { formatDistanceToNow } from 'date-fns'

const MatchList: React.FC = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const {
    useMatchCounter,
    placeBet,
    settleBet,
    isWritePending
  } = useFootballBettingContract()

  const { data: matchCounter } = useMatchCounter()
  const [matches, setMatches] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<bigint | null>(null)
  const [showBettingModal, setShowBettingModal] = useState(false)
  const [currentMatchForBetting, setCurrentMatchForBetting] = useState<bigint | null>(null)
  const [betDirection, setBetDirection] = useState<BetDirection>(BetDirection.HomeWin)
  const [betCount, setBetCount] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Get all match data
  useEffect(() => {
    if (!matchCounter) return

    // Generate match ID list
    const matchIds = []
    for (let i = 1; i <= Number(matchCounter); i++) {
      matchIds.push(BigInt(i))
    }
    setMatches(matchIds.map(id => ({ id })))
  }, [matchCounter])

  // Monitor selectedMatch state changes
  useEffect(() => {
    console.log('=== selectedMatch state change ===', selectedMatch)
  }, [selectedMatch])

  const openBettingModal = (matchId: bigint) => {
    setCurrentMatchForBetting(matchId)
    setShowBettingModal(true)
  }

  const closeBettingModal = () => {
    setShowBettingModal(false)
    setCurrentMatchForBetting(null)
    setBetDirection(BetDirection.HomeWin)
    setBetCount('1')
  }
  const convertHex = (handle: any): string => {
    let formattedHandle: string;
    if (typeof handle === 'string') {
      formattedHandle = handle.startsWith('0x') ? handle : `0x${handle}`;
    } else if (handle instanceof Uint8Array) {
      formattedHandle = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    } else {
      formattedHandle = `0x${handle.toString()}`;
    }
    return formattedHandle
  };
  const handlePlaceBet = async (matchId: bigint) => {
    console.log('=== handlePlaceBet start ===')
    console.log('Parameters:', { matchId, betDirection, betCount })
    console.log('address:', address)
    console.log('walletClient:', !!walletClient)

    if (!address || !walletClient) {
      console.log('Wallet not connected')
      setError('Please connect your wallet')
      return
    }

    if (!betCount || isNaN(Number(betCount)) || Number(betCount) <= 0) {
      console.log('Invalid bet amount')
      setError('Please enter a valid bet amount')
      return
    }

    if (!betDirection) {
      console.log('Bet direction not selected')
      setError('Please select bet direction')
      return
    }

    try {
      setError('')
      setSuccess('')

      console.log('Validation passed, starting data encryption...')

      // Use FHE to encrypt bet data
      const encryptedData = await encryptBetData(
        CONTRACT_ADDRESS,
        address,
        betDirection,
        parseInt(betCount)
      )

      console.log('Data encryption complete, calling contract...')

      await placeBet(
        matchId,
        convertHex(encryptedData.handles[0]), // betDirection
        convertHex(encryptedData.handles[1]), // betCount
        convertHex(encryptedData.inputProof)
      )

      setSuccess(`Bet placed successfully! Consumed ${Number(betCount) * BET_UNIT} points`)
      closeBettingModal()
    } catch (err: any) {
      console.error('Bet placement failed:', err)
      setError(`Bet placement failed: ${err.message || 'Unknown error'}`)
    }
  }

  const handleSettleBet = async (matchId: bigint) => {
    try {
      setError('')
      setSuccess('')

      await settleBet(matchId)

      setSuccess('Settlement successful!')
    } catch (err: any) {
      console.error('Settlement failed:', err)
      setError(err.message || 'Settlement failed')
    }
  }

  if (!matchCounter || Number(matchCounter) === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Match List</h1>
        <div className="card text-center">
          <p className="text-gray">No matches available</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Match List</h1>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="grid grid-2">
        {matches.map((match) => (
          <MatchCard
            key={match.id.toString()}
            matchId={match.id}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            betDirection={betDirection}
            setBetDirection={setBetDirection}
            betCount={betCount}
            setBetCount={setBetCount}
            onPlaceBet={handlePlaceBet}
            openBettingModal={openBettingModal}
            onSettleBet={handleSettleBet}
            isWritePending={isWritePending}
          />
        ))}
      </div>

      {/* Betting Modal */}
      {showBettingModal && currentMatchForBetting && (
        <BettingModal
          matchId={currentMatchForBetting}
          betDirection={betDirection}
          setBetDirection={setBetDirection}
          betCount={betCount}
          setBetCount={setBetCount}
          onPlaceBet={handlePlaceBet}
          onClose={closeBettingModal}
          isWritePending={isWritePending}
        />
      )}
    </div>
  )
}

// Individual match card component
const MatchCard: React.FC<{
  matchId: bigint
  selectedMatch: bigint | null
  setSelectedMatch: (id: bigint | null) => void
  betDirection: BetDirection
  setBetDirection: (direction: BetDirection) => void
  betCount: string
  setBetCount: (count: string) => void
  onPlaceBet: (matchId: bigint) => void
  openBettingModal: (matchId: bigint) => void
  onSettleBet: (matchId: bigint) => void
  isWritePending: boolean
}> = ({
  matchId,
  selectedMatch,
  setSelectedMatch,
  betDirection,
  setBetDirection,
  betCount,
  setBetCount,
  onPlaceBet,
  openBettingModal,
  onSettleBet,
  isWritePending
}) => {
    const { address } = useAccount()
    const { useGetMatch, useGetMatchBets, useGetUserBet } = useFootballBettingContract()

    const { data: match } = useGetMatch(matchId)
    const { data: matchBets } = useGetMatchBets(matchId)
    const { data: userBet } = useGetUserBet(matchId, address as `0x${string}`)

    if (!match) return <div className="card">Loading...</div>

    // Helper functions
    const getMatchStatus = (match: any) => {
      const now = Math.floor(Date.now() / 1000)
      if (match.isFinished) return 'finished'
      if (now >= Number(match.bettingStartTime) && now <= Number(match.bettingEndTime)) return 'betting'
      if (now < Number(match.bettingStartTime)) return 'upcoming'
      return 'closed'
    }

    const getStatusText = (status: string) => {
      switch (status) {
        case 'betting': return 'Betting Open'
        case 'upcoming': return 'Upcoming'
        case 'closed': return 'Betting Closed'
        case 'finished': return 'Finished'
        default: return 'Unknown'
      }
    }

    const getStatusClass = (status: string) => {
      switch (status) {
        case 'betting': return 'status-betting'
        case 'upcoming': return 'status-active'
        case 'closed': return 'status-finished'
        case 'finished': return 'status-finished'
        default: return 'status-finished'
      }
    }

    const getResultText = (result: number) => {
      switch (result) {
        case 1: return 'Home Win'
        case 2: return 'Away Win'
        case 3: return 'Draw'
        default: return 'Pending'
      }
    }

    const formatTime = (timestamp: bigint) => {
      return formatDistanceToNow(new Date(Number(timestamp) * 1000), {
        addSuffix: true,
      })
    }

    const status = getMatchStatus(match)
    const hasBet = Boolean(userBet?.betDirection && userBet.betDirection !== '0x0000000000000000000000000000000000000000000000000000000000000000')
    const canBet = Boolean(status === 'betting' && address && !hasBet)
    const canSettle = Boolean(match.isFinished && hasBet && !userBet?.hasSettled && matchBets?.isTotalDecrypted)

    return (
      <div className="match-card card">
        <div className="flex justify-between items-start mb-4">
          <h3>{match.matchName}</h3>
          <span className={`status-badge ${getStatusClass(status)}`}>
            {getStatusText(status)}
          </span>
        </div>

        <div className="text-center mb-4">
          <div className="text-2xl font-bold mb-2">
            {match.homeTeam} vs {match.awayTeam}
          </div>
        </div>

        <div className="text-sm text-gray mb-4">
          <p>Betting Period: {formatTime(match.bettingStartTime)} to {formatTime(match.bettingEndTime)}</p>
          <p>Match Time: {formatTime(match.matchTime)}</p>
          {match.isFinished && (
            <p className="text-green font-bold mt-2">
              Match Result: {getResultText(match.result)}
            </p>
          )}
        </div>

        {/* Show betting statistics */}
        <div className="mb-4">
          <p className="text-sm font-bold mb-2">Betting Statistics:</p>
          {Boolean(matchBets?.isTotalDecrypted) ? (
            <div className="flex justify-between text-sm">
              <span>Home Win: <strong>{Number(matchBets?.decryptedHomeWinTotal || 0)} bets</strong></span>
              <span>Away Win: <strong>{Number(matchBets?.decryptedAwayWinTotal || 0)} bets</strong></span>
              <span>Draw: <strong>{Number(matchBets?.decryptedDrawTotal || 0)} bets</strong></span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span>Home Win: <strong>***</strong></span>
              <span>Away Win: <strong>***</strong></span>
              <span>Draw: <strong>***</strong></span>
            </div>
          )}
        </div>

        {/* User bet status */}
        {hasBet && (
          <div className="text-sm text-green mb-4">
            <p>✓ You have bet on this match</p>
            {userBet?.hasSettled && <p>✓ Settled</p>}
          </div>
        )}

        {/* Betting interface */}
        <div>
          <p className="text-xs text-gray mb-2">
            Debug: canBet={canBet.toString()}, status={status}, hasAddress={!!address}, hasBet={hasBet},
            selected={selectedMatch?.toString()}, matchId={matchId.toString()}
          </p>
          {canBet ? (
            <button
              className="button w-full"
              onClick={() => {
                console.log('=== Betting button clicked ===')
                console.log('Opening modal for matchId:', matchId)
                openBettingModal(matchId)
              }}
            >
              Place Bet
            </button>
          ) : (
            <p className="text-sm text-gray">Cannot bet: {
              !address ? 'Please connect wallet' :
                status !== 'betting' ? `Match status: ${status}` :
                  hasBet ? 'You already bet on this match' :
                    'Unknown reason'
            }</p>
          )}
        </div>

        {/* Settlement button */}
        {canSettle && (
          <button
            className="button button-secondary w-full"
            onClick={() => onSettleBet(matchId)}
            disabled={isWritePending}
          >
            {isWritePending ? 'Settling...' : 'Claim Rewards'}
          </button>
        )}

        {/* Status message */}
        {!canBet && !canSettle && status === 'betting' && hasBet && (
          <div className="text-center text-gray">
            You have already bet on this match, please wait for the match to end
          </div>
        )}
      </div>
    )
  }

// Betting modal component
const BettingModal: React.FC<{
  matchId: bigint
  betDirection: BetDirection
  setBetDirection: (direction: BetDirection) => void
  betCount: string
  setBetCount: (count: string) => void
  onPlaceBet: (matchId: bigint) => void
  onClose: () => void
  isWritePending: boolean
}> = ({
  matchId,
  betDirection,
  setBetDirection,
  betCount,
  setBetCount,
  onPlaceBet,
  onClose,
  isWritePending
}) => {
    const { useGetMatch } = useFootballBettingContract()
    const { data: match } = useGetMatch(matchId)

    if (!match) return null

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Place Bet - {match.matchName}</h3>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            <div className="text-center mb-4">
              <div className="text-lg font-bold">
                {match.homeTeam} vs {match.awayTeam}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Bet Direction</label>
              <div className="flex gap-3 mb-4">
                <div
                  className={`bet-option flex-1 ${betDirection === BetDirection.HomeWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.HomeWin)}
                >
                  <div className="font-bold">Home Win</div>
                  <div className="text-sm">{match.homeTeam}</div>
                </div>
                <div
                  className={`bet-option flex-1 ${betDirection === BetDirection.AwayWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.AwayWin)}
                >
                  <div className="font-bold">Away Win</div>
                  <div className="text-sm">{match.awayTeam}</div>
                </div>
                <div
                  className={`bet-option flex-1 ${betDirection === BetDirection.Draw ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.Draw)}
                >
                  <div className="font-bold">Draw</div>
                  <div className="text-sm">Draw</div>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bet Amount (bets)</label>
              <input
                type="number"
                min="1"
                className="input"
                placeholder="1"
                value={betCount}
                onChange={(e) => setBetCount(e.target.value)}
              />
              <p className="text-sm text-gray">
                Will consume {Number(betCount) * BET_UNIT} points
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <div className="flex gap-2">
              <button
                className="button flex-1"
                onClick={() => {
                  console.log('=== Modal confirm bet ===')
                  console.log('matchId:', matchId)
                  console.log('betDirection:', betDirection)
                  console.log('betCount:', betCount)
                  onPlaceBet(matchId)
                }}
                disabled={isWritePending}
              >
                {isWritePending ? 'Placing Bet...' : 'Confirm Bet'}
              </button>
              <button
                className="button button-secondary"
                onClick={onClose}
                disabled={isWritePending}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

export default MatchList