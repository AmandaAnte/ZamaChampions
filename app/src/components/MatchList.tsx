import React, { useState, useEffect } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { useFootballBettingContract } from '../hooks/useContract'
import { encryptBetData, CONTRACT_ADDRESS } from '../utils/fhe'
import { BetDirection, BET_UNIT } from '../utils/config'
import { format } from 'date-fns'

const MatchList: React.FC = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const {
    useMatchCounter,
    placeBet,
    settleBet,
    isWritePending
  } = useFootballBettingContract()

  const { data: matchCounter, isLoading: matchCounterLoading, error: matchCounterError } = useMatchCounter()
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

      const txHash = await placeBet(
        matchId,
        convertHex(encryptedData.handles[0]), // betDirection
        convertHex(encryptedData.handles[1]), // betCount
        convertHex(encryptedData.inputProof)
      )

      setSuccess(`Bet placed! Consumed ${Number(betCount) * BET_UNIT} points — https://sepolia.etherscan.io/tx/${txHash}`)
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

      const txHash = await settleBet(matchId)

      setSuccess(`Settlement sent: https://sepolia.etherscan.io/tx/${txHash}`)
    } catch (err: any) {
      console.error('Settlement failed:', err)
      setError(err.message || 'Settlement failed')
    }
  }

  if (matchCounterLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Match List</h1>
        <div className="card text-center">
          <p className="text-gray">Loading matches...</p>
        </div>
      </div>
    )
  }

  if (matchCounterError) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Match List</h1>
        <div className="card text-center">
          <p className="text-red-600">Error loading matches: {matchCounterError.message}</p>
          <p className="text-sm text-gray">Contract Address: {CONTRACT_ADDRESS}</p>
        </div>
      </div>
    )
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
        {matches.map((match, index) => (
          <MatchCard
            key={match.id.toString()}
            matchId={match.id}
            matchIndex={index + 1}
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
          matchIndex={matches.findIndex(m => m.id === currentMatchForBetting) + 1}
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
  matchIndex: number
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
  matchIndex,
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

    const { data: match, isLoading: matchLoading, error: matchError } = useGetMatch(matchId)
    const { data: matchBets } = useGetMatchBets(matchId)
    const { data: userBet } = useGetUserBet(matchId, address as `0x${string}`)


    if (matchLoading) return <div className="card">Loading match {matchId.toString()}...</div>
    if (matchError) return <div className="card">Error loading match: {matchError.message}</div>
    if (!match) return <div className="card">No match data for ID {matchId.toString()}</div>

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
        case 'upcoming': return 'status-upcoming'
        case 'closed': return 'status-closed'
        case 'finished': return 'status-finished'
        default: return 'status-finished'
      }
    }

    const getResultText = (result: number) => {
      switch (result) {
        case 1: return '🏆 Home Win'
        case 2: return '🏆 Away Win'
        case 3: return '🤝 Draw'
        default: return 'Pending'
      }
    }

    const formatTime = (timestamp: bigint) => {
      return format(new Date(Number(timestamp) * 1000), 'yyyy-MM-dd HH:mm:ss')
    }

    const status = getMatchStatus(match)
    const hasBet = Boolean(userBet?.betDirection && userBet.betDirection !== '0x0000000000000000000000000000000000000000000000000000000000000000')
    const canBet = Boolean(status === 'betting' && address && !hasBet)
    const canSettle = Boolean(match.isFinished && hasBet && !userBet?.hasSettled && matchBets?.isTotalDecrypted)

    return (
      <div className="match-card card">
        {/* Header with title and status */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-xs text-gray" style={{ marginBottom: '0.25rem' }}>Match {matchIndex}</div>
            <h3 className="match-title">{match.matchName}</h3>
          </div>
          <span className={`status-badge ${getStatusClass(status)}`} style={{ height: '24px', display: 'flex', alignItems: 'center' }}>
            {getStatusText(status)}
          </span>
        </div>

        {/* Teams display */}
        <div className="match-teams text-center">
          <div className="team-name">
            {match.homeTeam}
            <span className="vs-divider">vs</span>
            {match.awayTeam}
          </div>
        </div>

        {/* Match result (if finished) */}
        {match.isFinished && (
          <div className="result-announcement">
            <div className="result-text">
              {getResultText(match.result)}
            </div>
          </div>
        )}

        {/* Betting Period */}
        <div className="info-section">
          <div className="info-title">⏰ Betting Period</div>
          <div className="time-item">
            <span className="time-label">Start:</span>
            <span className="time-value">{formatTime(match.bettingStartTime)}</span>
          </div>
          <div className="time-item">
            <span className="time-label">End:</span>
            <span className="time-value">{formatTime(match.bettingEndTime)}</span>
          </div>
        </div>

        {/* Match Time */}
        <div className="info-section">
          <div className="info-title">🏟️ Match Time</div>
          <div className="time-item">
            <span className="time-label">Scheduled:</span>
            <span className="time-value">{formatTime(match.matchTime)}</span>
          </div>
        </div>

        {/* Betting Statistics */}
        <div className="betting-stats">
          <div className="info-title">📊 Betting Statistics</div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Home Win</div>
              <div className="stat-value">
                {Boolean(matchBets?.isTotalDecrypted)
                  ? Number(matchBets?.decryptedHomeWinTotal || 0)
                  : '***'
                }
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Draw</div>
              <div className="stat-value">
                {Boolean(matchBets?.isTotalDecrypted)
                  ? Number(matchBets?.decryptedDrawTotal || 0)
                  : '***'
                }
              </div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Away Win</div>
              <div className="stat-value">
                {Boolean(matchBets?.isTotalDecrypted)
                  ? Number(matchBets?.decryptedAwayWinTotal || 0)
                  : '***'
                }
              </div>
            </div>
          </div>
        </div>

        {/* User bet status */}
        {hasBet && (
          <div className="user-bet-indicator">
            <div className="bet-success-text">You have bet on this match</div>
            {userBet?.hasSettled && <div className="settled-text">✓ Settled</div>}
          </div>
        )}

        {/* Betting interface */}
        <div>
          {/* <p className="text-xs text-gray mb-2">
            Debug: canBet={canBet.toString()}, status={status}, hasAddress={!!address}, hasBet={hasBet},
            selected={selectedMatch?.toString()}, matchId={matchId.toString()}
          </p> */}
          {canBet ? (
            <button
              className="button"
              style={{ width: '100%' }}
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
            className="button button-secondary"
            style={{ width: '100%' }}
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
  matchIndex: number
  betDirection: BetDirection
  setBetDirection: (direction: BetDirection) => void
  betCount: string
  setBetCount: (count: string) => void
  onPlaceBet: (matchId: bigint) => void
  onClose: () => void
  isWritePending: boolean
}> = ({
  matchId,
  matchIndex,
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
            <div>
              <div className="text-xs text-gray" style={{ marginBottom: '0.25rem' }}>Match {matchIndex}</div>
              <h3>Place Bet - {match.matchName}</h3>
            </div>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          <div className="modal-body">
            <div className="text-center mb-4">
              <div style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                {match.homeTeam} vs {match.awayTeam}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Select Bet Direction</label>
              <div className="flex gap-3 mb-4">
                <div
                  className={`bet-option ${betDirection === BetDirection.HomeWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.HomeWin)}
                >
                  <div style={{ fontWeight: 'bold' }}>Home Win</div>
                  <div className="text-sm">{match.homeTeam}</div>
                </div>
                <div
                  className={`bet-option ${betDirection === BetDirection.AwayWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.AwayWin)}
                >
                  <div style={{ fontWeight: 'bold' }}>Away Win</div>
                  <div className="text-sm">{match.awayTeam}</div>
                </div>
                <div
                  className={`bet-option ${betDirection === BetDirection.Draw ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.Draw)}
                >
                  <div style={{ fontWeight: 'bold' }}>Draw</div>
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
                className="button"
                style={{ flex: 1 }}
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
