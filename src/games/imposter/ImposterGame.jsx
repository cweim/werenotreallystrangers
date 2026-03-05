import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import wordBank from './wordBank'
import './imposter.css'

const CATEGORY_KEYS = Object.keys(wordBank)
const DEFAULT_CATEGORY = CATEGORY_KEYS[0]

function getRandomIndex(length) {
  if (length <= 0) return 0
  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  return randomBuffer[0] % length
}

function shuffleArray(items) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = getRandomIndex(index + 1)
    ;[output[index], output[swapIndex]] = [output[swapIndex], output[index]]
  }
  return output
}

function clampImposterCount(playerCount, requestedCount) {
  const maximum = Math.max(1, Math.floor(playerCount / 2))
  return Math.min(Math.max(requestedCount, 1), maximum)
}

function createRound({ players, categoryKey, imposterCount }) {
  const category = wordBank[categoryKey] ?? wordBank[DEFAULT_CATEGORY]
  const word = category.words[getRandomIndex(category.words.length)]
  const shuffledPlayers = shuffleArray(players)
  const imposterNames = new Set(shuffledPlayers.slice(0, imposterCount))

  const assignments = players.map((name) => ({
    name,
    isImposter: imposterNames.has(name),
  }))

  return {
    players,
    categoryKey,
    categoryLabel: category.label,
    word,
    imposterCount,
    assignments,
  }
}

function ImposterGame() {
  const [players, setPlayers] = useState(['Player 1', 'Player 2', 'Player 3'])
  const [categoryKey, setCategoryKey] = useState(DEFAULT_CATEGORY)
  const [imposterCount, setImposterCount] = useState(1)
  const [stage, setStage] = useState('lobby')
  const [round, setRound] = useState(null)
  const [revealIndex, setRevealIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isHolding, setIsHolding] = useState(false)

  const categoryOptions = useMemo(
    () => CATEGORY_KEYS.map((key) => ({ key, label: wordBank[key].label })),
    [],
  )
  const maxImposters = clampImposterCount(players.length, Number.POSITIVE_INFINITY)

  const updatePlayerName = (index, value) => {
    setPlayers((previous) => previous.map((player, playerIndex) => (playerIndex === index ? value : player)))
  }

  const addPlayer = () => {
    setPlayers((previous) => [...previous, `Player ${previous.length + 1}`])
  }

  const removePlayer = (index) => {
    setPlayers((previous) => {
      const nextPlayers = previous.filter((_, playerIndex) => playerIndex !== index)
      setImposterCount((currentCount) => clampImposterCount(nextPlayers.length, currentCount))
      return nextPlayers
    })
  }

  const sanitizePlayers = () => {
    const names = players.map((name, index) => {
      const cleanName = name.trim()
      return cleanName.length > 0 ? cleanName : `Player ${index + 1}`
    })
    setPlayers(names)
    return names
  }

  const startRound = (nextSettings = null) => {
    const sourcePlayers = nextSettings?.players ?? sanitizePlayers()
    const sourceCategory = nextSettings?.categoryKey ?? categoryKey
    const safeImposterCount = clampImposterCount(
      sourcePlayers.length,
      nextSettings?.imposterCount ?? imposterCount,
    )

    setImposterCount(safeImposterCount)
    const nextRound = createRound({
      players: sourcePlayers,
      categoryKey: sourceCategory,
      imposterCount: safeImposterCount,
    })

    setRound(nextRound)
    setRevealIndex(0)
    setIsRevealed(false)
    setIsHolding(false)
    setStage('reveal')
  }

  const handleStartGame = () => {
    if (players.length < 3) return
    startRound()
  }

  const handleHoldStart = (event) => {
    event.preventDefault()
    setIsHolding(true)
    setIsRevealed(true)
  }

  const handleHoldEnd = () => {
    setIsHolding(false)
    setIsRevealed(false)
  }

  const revealNextPlayer = () => {
    if (!round) return

    if (revealIndex < round.assignments.length - 1) {
      setRevealIndex((previous) => previous + 1)
      setIsRevealed(false)
      setIsHolding(false)
      return
    }

    setStage('complete')
  }

  const resetPlayers = () => {
    setPlayers(['Player 1', 'Player 2', 'Player 3'])
    setImposterCount(1)
  }

  const restartRound = () => {
    if (!round) return
    startRound({
      players: round.players,
      categoryKey: round.categoryKey,
      imposterCount: round.imposterCount,
    })
  }

  const backToSettings = () => {
    setStage('lobby')
    setRevealIndex(0)
    setIsRevealed(false)
    setIsHolding(false)
  }

  const currentReveal = round?.assignments[revealIndex] ?? null

  return (
    <main className="imposter-app app-shell">
      <header className="page-header">
        <h1>Guess The Imposter</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      {stage === 'lobby' && (
        <>
          <section className="imposter-panel players-panel" aria-label="Player names">
            <div className="imposter-panel-head">
              <div className="panel-title-group">
                <h2>Players ({players.length})</h2>
                <p>Add names for everyone in this round. Minimum 3 players.</p>
              </div>
            </div>

            <div className="player-list">
              {players.map((player, index) => (
                <div key={index} className="player-row">
                  <span className="player-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="player-input-wrap">
                    <input
                      type="text"
                      value={player}
                      onChange={(event) => updatePlayerName(index, event.target.value)}
                      aria-label={`Player ${index + 1} name`}
                      maxLength={28}
                    />
                  </div>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removePlayer(index)}
                    disabled={players.length <= 3}
                    aria-label={`Remove ${player || `Player ${index + 1}`}`}
                    title="Remove player"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6m5 4v7m4-7v7"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="add-player-btn" onClick={addPlayer}>
              + Add Player
            </button>
          </section>

          <section className="imposter-panel settings-panel">
            <div className="panel-title-group">
              <h2>Round Settings</h2>
              <p>Category determines the secret word pool. Roles are randomized each round.</p>
            </div>
            <div className="setup-grid">
              <label className="field">
                <span>Category</span>
                <select value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)}>
                  {categoryOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Imposters</span>
                <select
                  value={imposterCount}
                  onChange={(event) => setImposterCount(Number(event.target.value))}
                >
                  {[...Array(maxImposters)].map((_, index) => {
                    const count = index + 1
                    return (
                      <option key={count} value={count}>
                        {count}
                      </option>
                    )
                  })}
                </select>
              </label>
            </div>
          </section>

          <section className="imposter-controls lobby-controls">
            <button
              type="button"
              className="primary-pill"
              onClick={handleStartGame}
              disabled={players.length < 3}
            >
              Start Game
            </button>
            <button type="button" className="text-action" onClick={resetPlayers}>
              Reset Players
            </button>
          </section>
        </>
      )}

      {stage === 'reveal' && currentReveal && round && (
        <>
          <section className="imposter-status" aria-live="polite">
            <span>
              Reveal {revealIndex + 1} of {round.assignments.length}
            </span>
            <span>
              Category: {round.categoryLabel} | Imposters: {round.imposterCount}
            </span>
            <button
              type="button"
              className="status-icon-btn"
              onClick={backToSettings}
              aria-label="Back to lobby"
              title="Back to lobby"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M14.5 5L8 11.5 14.5 18M9 11.5H20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </section>

          <section className="reveal-area">
            <article
              className={`reveal-card ${isRevealed ? 'flipped' : ''} ${!isRevealed ? 'holdable' : ''}`}
              onPointerDown={handleHoldStart}
              onPointerUp={handleHoldEnd}
              onPointerCancel={handleHoldEnd}
              onPointerLeave={handleHoldEnd}
            >
              <div className="reveal-inner">
                <div className="reveal-front">
                  <p className="eyebrow">Private Reveal</p>
                  <h2>{currentReveal.name}</h2>
                  <p>{isHolding ? 'Keep holding...' : 'Press and hold this card to reveal.'}</p>
                </div>
                <div className="reveal-back">
                  <p className="eyebrow">{currentReveal.isImposter ? 'Secret Role' : round.categoryLabel}</p>
                  <h2>{currentReveal.isImposter ? 'You are the Imposter' : round.word}</h2>
                  <p>
                    {currentReveal.isImposter
                      ? 'Blend in and guess the word.'
                      : 'Give clues without saying the word.'}
                  </p>
                </div>
              </div>
            </article>
          </section>

          {!isHolding && (
            <section className="imposter-controls">
              <button type="button" className="ready-btn" onClick={revealNextPlayer}>
                {revealIndex < round.assignments.length - 1 ? 'Next Player' : 'Finish Reveal'}
              </button>
            </section>
          )}
        </>
      )}

      {stage === 'complete' && round && (
        <>
          <section className="imposter-status">
            <span>Round ready</span>
            <span>
              Category: {round.categoryLabel} | Imposters: {round.imposterCount}
            </span>
            <button
              type="button"
              className="status-icon-btn"
              onClick={backToSettings}
              aria-label="Back to lobby"
              title="Back to lobby"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M14.5 5L8 11.5 14.5 18M9 11.5H20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </section>

          <section className="imposter-panel complete-panel">
            <p className="eyebrow">Ready To Play</p>
            <h2>All roles assigned.</h2>
            <p>Continue offline. Discuss, vote, and guess the imposter.</p>
            <p className="meta">
              Category: {round.categoryLabel} | Players: {round.players.length} | Imposters:{' '}
              {round.imposterCount}
            </p>
          </section>

          <section className="imposter-controls lobby-controls">
            <button type="button" className="primary-pill" onClick={restartRound}>
              Restart Round
            </button>
            <button type="button" className="text-action" onClick={backToSettings}>
              Back To Lobby
            </button>
          </section>
        </>
      )}
    </main>
  )
}

export default ImposterGame
