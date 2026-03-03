import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Deck52Game from './games/deck52/Deck52Game'
import WnrsGame from './games/wnrs/WnrsGame'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/games/deck-52" element={<Deck52Game />} />
      <Route path="/games/wnrs" element={<WnrsGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
