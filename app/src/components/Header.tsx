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
          <div className="logo">⚽ 足球博彩 DApp</div>
          
          <nav className="flex gap-4">
            <button
              className={`button ${activeTab === 'dashboard' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('dashboard')}
            >
              用户面板
            </button>
            <button
              className={`button ${activeTab === 'matches' ? '' : 'button-secondary'}`}
              onClick={() => setActiveTab('matches')}
            >
              比赛列表
            </button>
            {isOwner && (
              <button
                className={`button ${activeTab === 'admin' ? '' : 'button-secondary'}`}
                onClick={() => setActiveTab('admin')}
              >
                管理面板
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