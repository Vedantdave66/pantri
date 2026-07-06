import { useEffect, useState } from 'react'
import { api, getSession, setSession } from './api.js'
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

  // Re-sync role/name from the server so profile edits (e.g. display name)
  // show up without forcing a fresh login.
  useEffect(() => {
    if (!session) return
    api
      .me()
      .then((me) => {
        if (me && (me.full_name !== session.name || me.role !== session.role)) {
          setSession({ token: session.token, role: me.role, name: me.full_name || '' })
          setSessionState(getSession())
        }
      })
      .catch(() => {
        // 401s are already handled globally by the api client
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
