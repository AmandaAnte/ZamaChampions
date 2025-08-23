import React, { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { useFootballBettingContract } from '../hooks/useContract'
import { decryptUserPoints, CONTRACT_ADDRESS } from '../utils/fhe'
import { ETH_TO_POINTS_RATE } from '../types/contract'

const Dashboard: React.FC = () => {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient()
  const { 
    useGetUserPoints,
    buyPoints,
    isWritePending 
  } = useFootballBettingContract()
  
  const { data: encryptedPoints, refetch: refetchPoints } = useGetUserPoints(address as `0x${string}`)
  
  const [ethAmount, setEthAmount] = useState('')
  const [decryptedPoints, setDecryptedPoints] = useState<number | null>(null)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleBuyPoints = async () => {
    if (!ethAmount || isNaN(Number(ethAmount)) || Number(ethAmount) <= 0) {
      setError('请输入有效的ETH数量')
      return
    }

    try {
      setError('')
      setSuccess('')
      
      const value = parseEther(ethAmount)
      await buyPoints(value)
      
      setSuccess(`成功购买 ${Number(ethAmount) * ETH_TO_POINTS_RATE} 积分`)
      setEthAmount('')
      
      // Refresh points after purchase
      setTimeout(() => {
        refetchPoints()
      }, 2000)
    } catch (err: any) {
      console.error('买点失败:', err)
      setError(err.message || '买点失败')
    }
  }

  const handleDecryptPoints = async () => {
    if (!encryptedPoints || !address || !walletClient) {
      setError('无法解密积分：缺少必要数据')
      return
    }

    try {
      setIsDecrypting(true)
      setError('')
      
      // 从encryptedPoints中提取handle（这需要根据实际的合约返回格式调整）
      const pointsHandle = encryptedPoints.toString()
      
      const decrypted = await decryptUserPoints(
        pointsHandle,
        CONTRACT_ADDRESS,
        address,
        walletClient
      )
      
      setDecryptedPoints(Number(decrypted))
    } catch (err: any) {
      console.error('解密积分失败:', err)
      setError('解密积分失败：' + (err.message || '未知错误'))
    } finally {
      setIsDecrypting(false)
    }
  }

  const pointsFromEth = ethAmount ? Number(ethAmount) * ETH_TO_POINTS_RATE : 0

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">用户面板</h1>
      
      <div className="grid grid-2">
        {/* 用户积分 */}
        <div className="card">
          <h2>我的积分</h2>
          <div className="text-center">
            {decryptedPoints !== null ? (
              <div className="text-4xl font-bold text-green mb-4">
                {decryptedPoints.toLocaleString()}
              </div>
            ) : (
              <div className="text-gray mb-4">
                <p>积分已加密，点击解密查看</p>
                <button 
                  className="button mt-2"
                  onClick={handleDecryptPoints}
                  disabled={isDecrypting || !encryptedPoints}
                >
                  {isDecrypting ? '解密中...' : '解密查看积分'}
                </button>
              </div>
            )}
            <p className="text-sm text-gray">
              1 注 = 100 积分 | 1 ETH = {ETH_TO_POINTS_RATE.toLocaleString()} 积分
            </p>
          </div>
        </div>

        {/* 购买积分 */}
        <div className="card">
          <h2>购买积分</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
          
          <div className="form-group">
            <label className="form-label">ETH 数量</label>
            <input
              type="number"
              step="0.001"
              min="0"
              className="input"
              placeholder="0.001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
            />
            {pointsFromEth > 0 && (
              <p className="text-sm text-green">
                将获得 {pointsFromEth.toLocaleString()} 积分
              </p>
            )}
          </div>
          
          <button
            className="button w-full"
            onClick={handleBuyPoints}
            disabled={isWritePending || !ethAmount}
          >
            {isWritePending ? '购买中...' : '购买积分'}
          </button>
        </div>
      </div>

      {/* 积分说明 */}
      <div className="card">
        <h3>积分说明</h3>
        <ul className="space-y-2 text-gray">
          <li>• 使用ETH购买积分，兑换比例为 1 ETH = {ETH_TO_POINTS_RATE.toLocaleString()} 积分</li>
          <li>• 每次押注消耗 100 积分</li>
          <li>• 积分采用Zama FHE加密存储，保护用户隐私</li>
          <li>• 押注获胜后，根据获胜比例分配总奖池</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard