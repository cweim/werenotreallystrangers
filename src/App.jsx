import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Deck52Game from './games/deck52/Deck52Game'
import ImposterGame from './games/imposter/ImposterGame'
import TruthDareGame from './games/truthdare/TruthDareGame'
import WnrsGame from './games/wnrs/WnrsGame'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/games/deck-52" element={<Deck52Game />} />
      <Route path="/games/imposter" element={<ImposterGame />} />
      <Route path="/games/truth-dare" element={<TruthDareGame />} />
      <Route path="/games/wnrs" element={<WnrsGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
