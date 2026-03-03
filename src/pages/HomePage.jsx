import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <main className="app-shell home-page">
      <header className="home-header">
        <p className="home-eyebrow">Party & Connection Games</p>
        <h1 className="home-title">Pick a Game</h1>
        <p className="home-subtitle">Choose a game below to start playing.</p>
      </header>

      <section className="game-grid" aria-label="Game selection">
        <Link to="/games/wnrs" className="game-card">
          <h2 className="game-card-title">We're Not Really Strangers</h2>
          <p className="game-card-desc">Card-based conversation game with levels and wild cards.</p>
        </Link>

      </section>
    </main>
  )
}

export default HomePage
