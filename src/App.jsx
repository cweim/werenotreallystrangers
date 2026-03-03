import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import WnrsGame from './games/wnrs/WnrsGame'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/games/wnrs" element={<WnrsGame />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
