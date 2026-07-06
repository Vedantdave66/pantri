import { useState } from 'react'
import { getSession } from './api.js'
import Login from './screens/Login.jsx'
import PinLogin from './screens/PinLogin.jsx'
import Dashboard from './screens/Dashboard.jsx'
import Inventory from './screens/Inventory.jsx'
import Count from './screens/Count.jsx'
import Reorder from './screens/Reorder.jsx'
import Staff from './screens/Staff.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  const [session, setSessionState] = useState(getSession())
  const [authMode, setAuthMode] = useState('manager')
  const [tab, setTab] = useState('home')
  const [showReorder, setShowReorder] = useState(false)
  const [addSignal, setAddSignal] = useState(0)

  const refreshSession = () => {
    const s = getSession()
    setSessionState(s)
    setTab(s?.role === 'employee' ? 'count' : 'home')
    setShowReorder(false)
  }

  if (!session) {
    return (
      <div className="app-shell">
        {authMode === 'staff' ? (
          <PinLogin
            onLoggedIn={refreshSession}
            onManagerLogin={() => setAuthMode('manager')}
          />
        ) : (
          <Login
            onLoggedIn={refreshSession}
            onStaffLogin={() => setAuthMode('staff')}
          />
        )}
      </div>
    )
  }

  if (session.role === 'employee') {
    return (
      <div className="app-shell">
        <Count role="employee" userName={session.name} />
        <BottomNav role="employee" active="count" onChange={() => {}} />
      </div>
    )
  }

  if (showReorder) {
    return (
      <div className="app-shell">
        <Reorder onBack={() => setShowReorder(false)} />
        <BottomNav role="owner" active="home" onChange={(t) => { setShowReorder(false); setTab(t) }} />
      </div>
    )
  }

  const openAddItem = () => {
    setTab('inventory')
    setAddSignal((n) => n + 1)
  }

  return (
    <div className="app-shell">
      {tab === 'home' && (
        <Dashboard
          ownerName={session.name}
          onOpenReorder={() => setShowReorder(true)}
          onOpenCount={() => setTab('count')}
          onAddItem={openAddItem}
        />
      )}
      {tab === 'inventory' && <Inventory addSignal={addSignal} />}
      {tab === 'count' && <Count role="owner" userName={session.name} />}
      {tab === 'staff' && <Staff />}
      <BottomNav role="owner" active={tab} onChange={setTab} />
    </div>
  )
}
