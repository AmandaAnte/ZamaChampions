import React, { useState } from 'react'
import { useFootballBettingContract } from '../hooks/useContract'

const AdminPanel: React.FC = () => {
  const { createMatch, finishMatch, isWritePending } = useFootballBettingContract()

  // Helper function to format datetime for input
  const getDefaultDateTime = (minutesFromNow: number) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + minutesFromNow)
    return date.toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
  }

  const [formData, setFormData] = useState({
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    matchName: 'El Clásico',
    bettingStartTime: getDefaultDateTime(5),   // 5 minutes from now
    bettingEndTime: getDefaultDateTime(30),   // 30 minutes from now  
    matchTime: getDefaultDateTime(60),        // 1 hour from now
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
      setError('Please fill in all fields')
      return
    }

    const bettingStart = Math.floor(new Date(bettingStartTime).getTime() / 1000)
    const bettingEnd = Math.floor(new Date(bettingEndTime).getTime() / 1000)
    const matchTimestamp = Math.floor(new Date(matchTime).getTime() / 1000)

    if (bettingStart >= bettingEnd) {
      setError('Betting end time must be later than start time')
      return
    }

    // Allow current time betting for testing
    // if (bettingStart <= Math.floor(Date.now() / 1000)) {
    //   setError('Betting start time must be in the future')
    //   return
    // }

    try {
      setError('')
      setSuccess('')

      const txHash = await createMatch(
        homeTeam,
        awayTeam,
        matchName,
        BigInt(bettingStart),
        BigInt(bettingEnd),
        BigInt(matchTimestamp)
      )

      setSuccess(`Match creation tx sent: https://sepolia.etherscan.io/tx/${txHash}`)
    } catch (err: any) {
      console.error('Failed to create match:', err)
      setError(err.message || 'Failed to create match')
    }
  }

  const handleFinishMatch = async (e: React.FormEvent) => {
    e.preventDefault()

    const { matchId, result } = finishMatchData

    if (!matchId || !result) {
      setError('Please fill in all fields')
      return
    }

    try {
      setError('')
      setSuccess('')

      const txHash = await finishMatch(BigInt(matchId), Number(result))

      setSuccess(`Match result tx: https://sepolia.etherscan.io/tx/${txHash}`)
      setFinishMatchData({ matchId: '', result: '1' })
    } catch (err: any) {
      console.error('Failed to finish match:', err)
      setError(err.message || 'Failed to finish match')
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


  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Create Match</h1>

      {/* Create Match */}
      <div className="card">
        <h2>Create New Match</h2>
        <form onSubmit={handleCreateMatch}>
          <div className="grid grid-3 gap-4">
            <div className="form-group">
              <label className="form-label">Home Team Name</label>
              <input
                type="text"
                name="homeTeam"
                className="input"
                placeholder="e.g.: Real Madrid"
                value={formData.homeTeam}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Away Team Name</label>
              <input
                type="text"
                name="awayTeam"
                className="input"
                placeholder="e.g.: Barcelona"
                value={formData.awayTeam}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Match Name</label>
              <input
                type="text"
                name="matchName"
                className="input"
                placeholder="e.g.: El Clásico"
                value={formData.matchName}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-3 gap-4">
            <div className="form-group">
              <label className="form-label">Betting Start Time</label>
              <input
                type="datetime-local"
                name="bettingStartTime"
                className="input"
                value={formData.bettingStartTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Betting End Time</label>
              <input
                type="datetime-local"
                name="bettingEndTime"
                className="input"
                value={formData.bettingEndTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Match Time</label>
              <input
                type="datetime-local"
                name="matchTime"
                className="input"
                value={formData.matchTime}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="button w-full"
            disabled={isWritePending}
          >
            {isWritePending ? 'Creating...' : 'Create Match'}
          </button>
        </form>
      </div>
      {/* Status Messages - placed at bottom */}
      {error && <div className="error mt-4">{error}</div>}
      {success && <div className="success mt-4">{success}</div>}
      {/* Finish Match */}
      <div className="card">
        <h2>Finish Match</h2>
        <form onSubmit={handleFinishMatch}>
          <div className="form-group">
            <label className="form-label">Match ID</label>
            <input
              type="number"
              name="matchId"
              className="input"
              placeholder="e.g.: 1"
              value={finishMatchData.matchId}
              onChange={handleFinishInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Match Result</label>
            <select
              name="result"
              className="input"
              value={finishMatchData.result}
              onChange={handleFinishInputChange}
              required
            >
              <option value="1">Home Win</option>
              <option value="2">Away Win</option>
              <option value="3">Draw</option>
            </select>
          </div>

          <button
            type="submit"
            className="button w-full"
            disabled={isWritePending}
          >
            {isWritePending ? 'Submitting...' : 'Finish Match'}
          </button>
        </form>

      </div>

      {/* Instructions */}
      <div className="card">
        <h3>Instructions</h3>
        <ul className="space-y-2 text-gray">
          <li>• When creating matches, betting start time must be in the future</li>
          <li>• Betting end time must be later than start time</li>
          <li>• After match ends, system will automatically decrypt total betting data</li>
          <li>• Users need to manually click settlement to claim rewards</li>
          <li>• Match creators can finish matches and set results</li>
        </ul>
      </div>



    </div>
  )
}

export default AdminPanel
