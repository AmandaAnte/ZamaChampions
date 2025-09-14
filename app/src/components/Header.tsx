import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'

interface HeaderProps {
  activeTab: 'matches' | 'admin' | 'dashboard'
  setActiveTab: (tab: 'matches' | 'admin' | 'dashboard') => void
  isOwner: boolean
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, isOwner }) => {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">⚽ Champion Betting</div>

          <nav className="flex gap-4">
            <button
              className={`button ${activeTab === 'dashboard' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`button ${activeTab === 'matches' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('matches')}
            >
              Matches
            </button>
            {isOwner && (
              <button
                className={`button ${activeTab === 'admin' ? '' : 'button-secondary'}`}
                onClick={() => setActiveTab('admin')}
              >
                Admin Panel
              </button>
            )}
          </nav>

          <ConnectButton />
        </div>
      </div>
    </header>
  )
}

export default Header