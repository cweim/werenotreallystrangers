import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import promptBank from './promptBank'
import './truthdare.css'

const META = {
  truths: { type: 'Truth', color: 'var(--truth)' },
  dares: { type: 'Dare', color: 'var(--dare)' },
}

const TRUTH_KEYS = ['truths']
const DARE_KEYS = ['dares']
const DECK_KEYS = [...TRUTH_KEYS, ...DARE_KEYS]

function shuffleArray(items) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomBuffer = new Uint32Array(1)
    crypto.getRandomValues(randomBuffer)
    const swapIndex = randomBuffer[0] % (index + 1)
    ;[output[index], output[swapIndex]] = [output[swapIndex], output[index]]
  }
  return output
}

function getRandomIndex(length) {
  if (length <= 0) return 0
  const randomBuffer = new Uint32Array(1)
  crypto.getRandomValues(randomBuffer)
  return randomBuffer[0] % length
}

function createInitialState() {
  const decks = DECK_KEYS.reduce((accumulator, key) => {
    accumulator[key] = shuffleArray(promptBank[key] ?? [])
    return accumulator
  }, {})

  return {
    decks,
    selectedDeck: null,
    activeCard: null,
    discardPile: [],
  }
}

function TruthDareGame() {
  const initialState = useMemo(() => createInitialState(), [])
  const [decks, setDecks] = useState(initialState.decks)
  const [selectedDeck, setSelectedDeck] = useState(initialState.selectedDeck)
  const [activeCard, setActiveCard] = useState(initialState.activeCard)
  const [discardPile, setDiscardPile] = useState(initialState.discardPile)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isDiscarding, setIsDiscarding] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const cardRef = useRef(null)

  const totalRemaining = DECK_KEYS.reduce(
    (total, key) => total + (decks[key]?.length ?? 0),
    0,
  )

  const canRandomDraw = !activeCard && totalRemaining > 0

  const statusText = (() => {
    if (activeCard) {
      return activeCard.type === 'Truth'
        ? 'Answer honestly, then discard to continue.'
        : 'Complete the dare, then discard to continue.'
    }
    if (totalRemaining === 0) return 'All prompts played. Reset to start fresh.'
    return 'Pick a deck or hit Random to draw.'
  })()

  const drawFromDeck = (key) => {
    if (activeCard || (decks[key]?.length ?? 0) === 0) return

    const [nextCard, ...remaining] = decks[key]
    setDecks((previous) => ({ ...previous, [key]: remaining }))
    setSelectedDeck(key)
    setActiveCard({ deckKey: key, text: nextCard, type: META[key].type })
    setIsFlipped(false)
    setIsDrawing(true)

    setTimeout(() => {
      setIsDrawing(false)
      setIsFlipped(true)
    }, 300)
  }

  const selectDeck = (key) => {
    if ((decks[key]?.length ?? 0) === 0 || activeCard) return
    drawFromDeck(key)
  }

  const drawRandom = () => {
    if (!canRandomDraw) return

    const availableDecks = DECK_KEYS.filter((key) => (decks[key]?.length ?? 0) > 0)
    const randomKey = availableDecks[getRandomIndex(availableDecks.length)]
    drawFromDeck(randomKey)
  }

  const discardCard = () => {
    if (!activeCard) return
    setIsDiscarding(true)
    setTimeout(() => {
      setDiscardPile((previous) => [activeCard, ...previous])
      setActiveCard(null)
      setIsDiscarding(false)
      setIsFlipped(false)
    }, 400)
  }

  const handleCardOverlayClick = (event) => {
    if (cardRef.current && event.target === cardRef.current) {
      discardCard()
    }
  }

  const resetGame = () => {
    const nextState = createInitialState()
    setDecks(nextState.decks)
    setSelectedDeck(nextState.selectedDeck)
    setActiveCard(nextState.activeCard)
    setDiscardPile(nextState.discardPile)
  }

  return (
    <main className="td-app">
      <header className="page-header td-top">
        <h1>Truth or Dare</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <details className="td-how-to-play">
        <summary>
          <span className="td-arrow" aria-hidden="true">{'>'}</span>
          <span>How to play</span>
        </summary>
        <p>Pass the phone around and take turns.</p>
        <ul>
          <li>Pick Truth or Dare, or tap Random for a surprise.</li>
          <li>Complete the prompt, then discard.</li>
          <li>Skip if you must, but where's the fun in that?</li>
        </ul>
      </details>

      <section className="td-status-bar" aria-live="polite">
        <span>{statusText}</span>
        <span>{totalRemaining} left</span>
      </section>

      <section className="td-decks" aria-label="Prompt decks">
        <div className="deck-row">
          {DECK_KEYS.map((key) => {
            const remaining = decks[key]?.length ?? 0
            const isEmpty = remaining === 0

            return (
              <button
                key={key}
                type="button"
                className={`td-deck ${isEmpty ? 'empty' : ''}`}
                onClick={() => selectDeck(key)}
                disabled={isEmpty || !!activeCard}
              >
                <div className="td-deck-stack">
                  {[...Array(Math.max(0, Math.min(5, Math.ceil(remaining / 20))))].map((_, index) => (
                    <div
                      key={index}
                      className="td-stack-card"
                      style={{
                        backgroundColor: META[key].color,
                        transform: `translateX(${index * 2}px) translateY(${index * -2}px)`,
                      }}
                    />
                  ))}
                </div>
                <span className="td-deck-category">{META[key].type}</span>
                <span className="td-deck-count">{remaining}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="td-controls" aria-label="Game controls">
        <button type="button" onClick={drawRandom} disabled={!canRandomDraw} className="td-random-btn">
          Random
        </button>
        <div className="td-controls-secondary">
          <button type="button" onClick={discardCard} disabled={!activeCard} className="td-secondary">
            Skip / Discard
          </button>
          <button type="button" onClick={resetGame} className="td-secondary">
            Reset
          </button>
        </div>
      </section>

      {activeCard && (
        <div
          ref={cardRef}
          className={`td-card-overlay ${isDiscarding ? 'discarding' : ''}`}
          onClick={handleCardOverlayClick}
          role="presentation"
        >
          <div className={`td-card-modal ${isDrawing ? 'drawing' : ''} ${isFlipped ? 'flipped' : ''}`}>
            <div className="td-card-inner">
              <div
                className="td-card-back"
                style={{
                  background: `linear-gradient(145deg, ${META[activeCard.deckKey].color}, ${META[activeCard.deckKey].color}dd)`,
                }}
              >
                <span className="td-card-back-label">{activeCard.type}</span>
              </div>
              <div className="td-card-front">
                <span
                  className="td-card-type"
                  style={{ color: META[activeCard.deckKey].color }}
                >
                  {META[activeCard.deckKey].type}
                </span>
                <p className="td-card-prompt">{activeCard.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="td-footer">
        <button
          type="button"
          className="td-history-btn"
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
        >
          {discardPile.length} played
        </button>
      </footer>

      {showHistory && discardPile.length > 0 && (
        <div className="td-history-overlay" onClick={() => setShowHistory(false)} role="presentation">
          <div className="td-history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="td-history-header">
              <h2>Previously Played ({discardPile.length})</h2>
              <button
                type="button"
                className="td-close-btn"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                ✕
              </button>
            </div>
            <div className="td-history-cards">
              {discardPile.map((card, index) => (
                <div key={index} className="td-history-card" style={{ borderLeftColor: META[card.deckKey].color }}>
                  <span className="td-history-card-type">
                    {META[card.deckKey].type}
                  </span>
                  <p className="td-history-card-text">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default TruthDareGame
