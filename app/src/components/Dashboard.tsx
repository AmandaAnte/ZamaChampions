import React, { useState } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { parseEther } from 'viem'
import { useFootballBettingContract } from '../hooks/useContract'
import { decryptUserPoints, CONTRACT_ADDRESS } from '../utils/fhe'

const ETH_TO_POINTS_RATE = 100000
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
      setError('Please enter a valid ETH amount')
      return
    }

    try {
      setError('')
      setSuccess('')

      const value = parseEther(ethAmount)
      const txHash = await buyPoints(value)

      setSuccess(`Purchased ${Number(ethAmount) * ETH_TO_POINTS_RATE} FootPoints — https://sepolia.etherscan.io/tx/${txHash}`)
      setEthAmount('')

      // Refresh points after purchase
      setTimeout(() => {
        refetchPoints()
      }, 2000)
    } catch (err: any) {
      console.error('Buy points failed:', err)
      setError(err.message || 'Failed to buy points')
    }
  }

  const handleDecryptPoints = async () => {
    if (!encryptedPoints || !address || !walletClient) {
      setError('Cannot decrypt points: missing required data')
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
      console.error('Decrypt points failed:', err)
      setError('Failed to decrypt points: ' + (err.message || 'unknown error'))
    } finally {
      setIsDecrypting(false)
    }
  }

  const pointsFromEth = ethAmount ? Number(ethAmount) * ETH_TO_POINTS_RATE : 0

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">User Dashboard</h1>

      <div className="grid grid-2">
        {/* User Points */}
        <div className="card">
          <h2>My Points</h2>
          <div className="text-center">
            {decryptedPoints !== null ? (
              <div className="text-4xl font-bold text-green mb-4">
                {decryptedPoints.toLocaleString()}
              </div>
            ) : (
              <div className="text-gray mb-4">
                <p>Points are encrypted, click to decrypt and view</p>
                <button
                  className="button mt-2"
                  onClick={handleDecryptPoints}
                  disabled={isDecrypting || !encryptedPoints}
                >
                  {isDecrypting ? 'Decrypting...' : 'Decrypt to View Points'}
                </button>
              </div>
            )}
            <p className="text-sm text-gray">
              1 bet = 100 points | 1 ETH = {ETH_TO_POINTS_RATE.toLocaleString()} points
            </p>
          </div>
        </div>

        {/* Buy Points */}
        <div className="card">
          <h2>Buy Points</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <div className="form-group">
            <label className="form-label">ETH Amount</label>
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
                You will receive {pointsFromEth.toLocaleString()} points
              </p>
            )}
          </div>

          <button
            className="button w-full"
            onClick={handleBuyPoints}
            disabled={isWritePending || !ethAmount}
          >
            {isWritePending ? 'Purchasing...' : 'Buy Points'}
          </button>
        </div>
      </div>

      {/* Points Information */}
      <div className="card">
        <h3>Points Information</h3>
        <ul className="space-y-2 text-gray">
          <li>• Use ETH to buy points, exchange rate: 1 ETH = {ETH_TO_POINTS_RATE.toLocaleString()} points</li>
          <li>• Each bet consumes 100 points</li>
          <li>• Points are encrypted with Zama FHE to protect user privacy</li>
          <li>• After winning bets, the total prize pool is distributed proportionally</li>
        </ul>
      </div>
    </div>
  )
}

export default Dashboard
