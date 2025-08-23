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
  const [betDirection, setBetDirection] = useState<BetDirection>(BetDirection.HomeWin)
  const [betCount, setBetCount] = useState('1')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 获取所有比赛数据
  useEffect(() => {
    if (!matchCounter) return

    // 生成比赛ID列表
    const matchIds = []
    for (let i = 1; i <= Number(matchCounter); i++) {
      matchIds.push(BigInt(i))
    }
    setMatches(matchIds.map(id => ({ id })))
  }, [matchCounter])

  const handlePlaceBet = async (matchId: bigint) => {
    if (!address || !walletClient) {
      setError('请连接钱包')
      return
    }

    if (!betCount || isNaN(Number(betCount)) || Number(betCount) <= 0) {
      setError('请输入有效的押注数量')
      return
    }

    try {
      setError('')
      setSuccess('')

      // 使用FHE加密押注数据
      const encryptedData = await encryptBetData(
        CONTRACT_ADDRESS,
        address,
        betDirection,
        Number(betCount)
      )

      placeBet(
        matchId,
        encryptedData.handles[0], // betDirection
        encryptedData.handles[1], // betCount
        encryptedData.inputProof as `0x${string}`
      )

      setSuccess(`成功押注！消耗 ${Number(betCount) * BET_UNIT} 积分`)
      setBetCount('1')
      setSelectedMatch(null)
    } catch (err: any) {
      console.error('押注失败:', err)
      setError(err.message || '押注失败')
    }
  }

  const handleSettleBet = async (matchId: bigint) => {
    try {
      setError('')
      setSuccess('')

      settleBet(matchId)

      setSuccess('结算请求已提交，请等待解密完成')
    } catch (err: any) {
      console.error('结算失败:', err)
      setError(err.message || '结算失败')
    }
  }

  if (!matchCounter || Number(matchCounter) === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">比赛列表</h1>
        <div className="card text-center">
          <p className="text-gray">暂无比赛</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">比赛列表</h1>

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
            onSettleBet={handleSettleBet}
            isWritePending={isWritePending}
          />
        ))}
      </div>
    </div>
  )
}

// 单个比赛卡片组件
const MatchCard: React.FC<{
  matchId: bigint
  selectedMatch: bigint | null
  setSelectedMatch: (id: bigint | null) => void
  betDirection: BetDirection
  setBetDirection: (direction: BetDirection) => void
  betCount: string
  setBetCount: (count: string) => void
  onPlaceBet: (matchId: bigint) => void
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
  onSettleBet,
  isWritePending
}) => {
  const { address } = useAccount()
  const { useGetMatch, useGetMatchBets, useGetUserBet } = useFootballBettingContract()

  const { data: match } = useGetMatch(matchId)
  const { data: matchBets } = useGetMatchBets(matchId)
  const { data: userBet } = useGetUserBet(matchId, address as `0x${string}`)

  if (!match) return <div className="card">加载中...</div>

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
      case 'betting': return '押注中'
      case 'upcoming': return '即将开始'
      case 'closed': return '押注结束'
      case 'finished': return '已结束'
      default: return '未知'
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
      case 1: return '主队获胜'
      case 2: return '客队获胜'
      case 3: return '平局'
      default: return '待定'
    }
  }

  const formatTime = (timestamp: bigint) => {
    return formatDistanceToNow(new Date(Number(timestamp) * 1000), {
      addSuffix: true,
    })
  }

  const status = getMatchStatus(match)
  const hasBet = Boolean(userBet?.betDirection && userBet.betDirection !== 0n)
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
        {match.isFinished && (
          <div className="text-lg text-green">
            结果: {getResultText(match.result)}
          </div>
        )}
      </div>

      <div className="text-sm text-gray mb-4">
        <p>押注时间: {formatTime(match.bettingStartTime)} 至 {formatTime(match.bettingEndTime)}</p>
        <p>比赛时间: {formatTime(match.matchTime)}</p>
      </div>

      {/* 显示押注统计（如果已解密） */}
      {Boolean(matchBets?.isTotalDecrypted) && (
        <div className="grid grid-3 gap-2 mb-4 text-sm">
          <div className="text-center">
            <div className="font-bold">主队获胜</div>
            <div>{Number(matchBets?.decryptedHomeWinTotal || 0)} 注</div>
          </div>
          <div className="text-center">
            <div className="font-bold">客队获胜</div>
            <div>{Number(matchBets?.decryptedAwayWinTotal || 0)} 注</div>
          </div>
          <div className="text-center">
            <div className="font-bold">平局</div>
            <div>{Number(matchBets?.decryptedDrawTotal || 0)} 注</div>
          </div>
        </div>
      )}

      {/* 用户押注状态 */}
      {hasBet && (
        <div className="text-sm text-green mb-4">
          <p>✓ 您已押注此比赛</p>
          {userBet?.hasSettled && <p>✓ 已结算</p>}
        </div>
      )}

      {/* 押注界面 */}
      {canBet && (
        <div>
          {selectedMatch === matchId ? (
            <div>
              <div className="grid grid-3 gap-2 mb-4">
                <div
                  className={`bet-option ${betDirection === BetDirection.HomeWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.HomeWin)}
                >
                  <div className="font-bold">主队获胜</div>
                  <div className="text-sm">{match.homeTeam}</div>
                </div>
                <div
                  className={`bet-option ${betDirection === BetDirection.AwayWin ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.AwayWin)}
                >
                  <div className="font-bold">客队获胜</div>
                  <div className="text-sm">{match.awayTeam}</div>
                </div>
                <div
                  className={`bet-option ${betDirection === BetDirection.Draw ? 'selected' : ''}`}
                  onClick={() => setBetDirection(BetDirection.Draw)}
                >
                  <div className="font-bold">平局</div>
                  <div className="text-sm">平局</div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">押注数量（注）</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="1"
                  value={betCount}
                  onChange={(e) => setBetCount(e.target.value)}
                />
                <p className="text-sm text-gray">
                  将消耗 {Number(betCount) * BET_UNIT} 积分
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  className="button flex-1"
                  onClick={() => onPlaceBet(matchId)}
                  disabled={isWritePending}
                >
                  {isWritePending ? '押注中...' : '确认押注'}
                </button>
                <button
                  className="button button-secondary"
                  onClick={() => setSelectedMatch(null)}
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <button
              className="button w-full"
              onClick={() => setSelectedMatch(matchId)}
            >
              押注
            </button>
          )}
        </div>
      )}

      {/* 结算按钮 */}
      {canSettle && (
        <button
          className="button button-secondary w-full"
          onClick={() => onSettleBet(matchId)}
          disabled={isWritePending}
        >
          {isWritePending ? '结算中...' : '结算奖励'}
        </button>
      )}

      {/* 状态提示 */}
      {!canBet && !canSettle && status === 'betting' && hasBet && (
        <div className="text-center text-gray">
          您已押注此比赛，请等待比赛结束
        </div>
      )}
    </div>
  )
}

export default MatchList