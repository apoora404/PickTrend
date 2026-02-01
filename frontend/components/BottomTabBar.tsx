'use client'

import { Home, TrendingUp, PlusSquare, Bell, User } from 'lucide-react'
import { useState } from 'react'

interface Tab {
  id: string
  label: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  { id: 'home', label: '홈', icon: <Home className="w-6 h-6" /> },
  { id: 'trend', label: '트렌드', icon: <TrendingUp className="w-6 h-6" /> },
  { id: 'post', label: '게시', icon: <PlusSquare className="w-6 h-6" /> },
  { id: 'alarm', label: '알림', icon: <Bell className="w-6 h-6" /> },
  { id: 'profile', label: '프로필', icon: <User className="w-6 h-6" /> },
]

export default function BottomTabBar() {
  const [activeTab, setActiveTab] = useState('home')

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border-light safe-bottom z-50">
      <div className="max-w-[480px] mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 px-4 py-1 transition-colors ${
              activeTab === tab.id ? 'tab-active' : 'tab-inactive'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
