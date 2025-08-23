import React, { useState } from 'react'
import { useFootballBettingContract } from '../hooks/useContract'

const AdminPanel: React.FC = () => {
  const { createMatch, finishMatch, withdraw, isWritePending } = useFootballBettingContract()
  
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    matchName: '',
    bettingStartTime: '',
    bettingEndTime: '',
    matchTime: '',
  })
  
  const [finishMatchData, setFinishMatchData] = useState({
    matchId: '',
    result: '1',
  })
  
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { homeTeam, awayTeam, matchName, bettingStartTime, bettingEndTime, matchTime } = formData
    
    if (!homeTeam || !awayTeam || !matchName || !bettingStartTime || !bettingEndTime || !matchTime) {
      setError('请填写所有字段')
      return
    }

    const bettingStart = Math.floor(new Date(bettingStartTime).getTime() / 1000)
    const bettingEnd = Math.floor(new Date(bettingEndTime).getTime() / 1000)
    const matchTimestamp = Math.floor(new Date(matchTime).getTime() / 1000)
    
    if (bettingStart >= bettingEnd) {
      setError('押注结束时间必须晚于开始时间')
      return
    }
    
    if (bettingStart <= Math.floor(Date.now() / 1000)) {
      setError('押注开始时间必须在未来')
      return
    }

    try {
      setError('')
      setSuccess('')
      
      await createMatch(
        homeTeam,
        awayTeam,
        matchName,
        BigInt(bettingStart),
        BigInt(bettingEnd),
        BigInt(matchTimestamp)
      )
      
      setSuccess('比赛创建成功！')
      setFormData({
        homeTeam: '',
        awayTeam: '',
        matchName: '',
        bettingStartTime: '',
        bettingEndTime: '',
        matchTime: '',
      })
    } catch (err: any) {
      console.error('创建比赛失败:', err)
      setError(err.message || '创建比赛失败')
    }
  }

  const handleFinishMatch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { matchId, result } = finishMatchData
    
    if (!matchId || !result) {
      setError('请填写所有字段')
      return
    }

    try {
      setError('')
      setSuccess('')
      
      await finishMatch(BigInt(matchId), Number(result))
      
      setSuccess('比赛结果已提交！')
      setFinishMatchData({ matchId: '', result: '1' })
    } catch (err: any) {
      console.error('结束比赛失败:', err)
      setError(err.message || '结束比赛失败')
    }
  }

  const handleWithdraw = async () => {
    try {
      setError('')
      setSuccess('')
      
      await withdraw()
      
      setSuccess('提现成功！')
    } catch (err: any) {
      console.error('提现失败:', err)
      setError(err.message || '提现失败')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFinishInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFinishMatchData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // 获取当前时间，用于设置默认值
  const now = new Date()
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)
  const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 16)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">管理面板</h1>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <div className="grid grid-2">
        {/* 创建比赛 */}
        <div className="card">
          <h2>创建新比赛</h2>
          <form onSubmit={handleCreateMatch}>
            <div className="form-group">
              <label className="form-label">主队名称</label>
              <input
                type="text"
                name="homeTeam"
                className="input"
                placeholder="例如：皇家马德里"
                value={formData.homeTeam}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">客队名称</label>
              <input
                type="text"
                name="awayTeam"
                className="input"
                placeholder="例如：巴塞罗那"
                value={formData.awayTeam}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">比赛名称</label>
              <input
                type="text"
                name="matchName"
                className="input"
                placeholder="例如：国家德比"
                value={formData.matchName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">押注开始时间</label>
              <input
                type="datetime-local"
                name="bettingStartTime"
                className="input"
                value={formData.bettingStartTime || formatDateTime(oneHourLater)}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">押注结束时间</label>
              <input
                type="datetime-local"
                name="bettingEndTime"
                className="input"
                value={formData.bettingEndTime || formatDateTime(twoHoursLater)}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">比赛时间</label>
              <input
                type="datetime-local"
                name="matchTime"
                className="input"
                value={formData.matchTime || formatDateTime(threeDaysLater)}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button
              type="submit"
              className="button w-full"
              disabled={isWritePending}
            >
              {isWritePending ? '创建中...' : '创建比赛'}
            </button>
          </form>
        </div>

        {/* 结束比赛 */}
        <div className="card">
          <h2>结束比赛</h2>
          <form onSubmit={handleFinishMatch}>
            <div className="form-group">
              <label className="form-label">比赛ID</label>
              <input
                type="number"
                name="matchId"
                className="input"
                placeholder="例如：1"
                value={finishMatchData.matchId}
                onChange={handleFinishInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">比赛结果</label>
              <select
                name="result"
                className="input"
                value={finishMatchData.result}
                onChange={handleFinishInputChange}
                required
              >
                <option value="1">主队获胜</option>
                <option value="2">客队获胜</option>
                <option value="3">平局</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="button w-full"
              disabled={isWritePending}
            >
              {isWritePending ? '提交中...' : '结束比赛'}
            </button>
          </form>
          
          <div className="mt-4">
            <button
              className="button button-secondary w-full"
              onClick={handleWithdraw}
              disabled={isWritePending}
            >
              {isWritePending ? '提现中...' : '提取合约余额'}
            </button>
          </div>
        </div>
      </div>

      {/* 管理说明 */}
      <div className="card">
        <h3>管理说明</h3>
        <ul className="space-y-2 text-gray">
          <li>• 创建比赛时，押注开始时间必须在未来</li>
          <li>• 押注结束时间必须晚于开始时间</li>
          <li>• 比赛结束后，系统会自动解密总押注数据</li>
          <li>• 用户需要手动点击结算来获取奖励</li>
          <li>• 可以随时提取合约中的ETH余额</li>
        </ul>
      </div>
    </div>
  )
}

export default AdminPanel