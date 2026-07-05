import { useState } from 'react'
import { getToken } from './api.js'
import Login from './screens/Login.jsx'
import Inventory from './screens/Inventory.jsx'
import Count from './screens/Count.jsx'
import Reorder from './screens/Reorder.jsx'
import BottomNav from './components/BottomNav.jsx'

export default function App() {
  const [authed, setAuthed] = useState(Boolean(getToken()))
  const [tab, setTab] = useState('inventory')

  if (!authed) {
    return (
      <div className="app-shell">
        <Login onLoggedIn={() => setAuthed(true)} />
      </div>
    )
  }

  return (
    <div className="app-shell">
      {tab === 'inventory' && <Inventory />}
      {tab === 'count' && <Count />}
      {tab === 'reorder' && <Reorder />}
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}
