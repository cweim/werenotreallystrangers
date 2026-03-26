import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import questionBank from './questionBank'
import './herdmentality.css'

const META = {
  food: { category: 'Food & Fun', color: 'var(--hm-food)' },
  lifestyle: { category: 'Lifestyle', color: 'var(--hm-lifestyle)' },
  general: { category: 'General', color: 'var(--hm-general)' },
  objects: { category: 'Objects', color: 'var(--hm-objects)' },
  themed: { category: 'Themed', color: 'var(--hm-themed)' },
  wordPrompts: { category: 'Word Prompts', color: 'var(--hm-word)' },
  random: { category: 'Random', color: 'var(--hm-random)' },
}

const DECK_KEYS = Object.keys(META)

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
    accumulator[key] = shuffleArray(questionBank[key] ?? [])
    return accumulator
  }, {})

  return {
    decks,
    activeCard: null,
    discardPile: [],
  }
}

function HerdMentalityGame() {
  const initialState = useMemo(() => createInitialState(), [])
  const [decks, setDecks] = useState(initialState.decks)
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
    if (activeCard) return 'Everyone write your answer, then reveal together!'
    if (totalRemaining === 0) return 'All questions used. Reset to play again.'
    return 'Pick a category or hit Random.'
  })()

  const drawFromDeck = (key) => {
    if (activeCard || (decks[key]?.length ?? 0) === 0) return

    const [nextCard, ...remaining] = decks[key]
    setDecks((previous) => ({ ...previous, [key]: remaining }))
    setActiveCard({ deckKey: key, text: nextCard })
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
    setActiveCard(nextState.activeCard)
    setDiscardPile(nextState.discardPile)
  }

  return (
    <main className="hm-app">
      <header className="page-header hm-top">
        <h1>Herd Mentality</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <details className="hm-how-to-play">
        <summary>
          <span className="hm-arrow" aria-hidden="true">{'>'}</span>
          <span>How to play</span>
        </summary>
        <p>Think like the herd! Match the most popular answer to score.</p>
        <ul>
          <li>Draw a question. Everyone writes their answer secretly.</li>
          <li>Reveal answers together. Matching the majority = 1 point.</li>
          <li>Unique answer? You get the Pink Cow and can't win while holding it.</li>
          <li>First to 8 points (without the cow) wins!</li>
        </ul>
      </details>

      <section className="hm-status-bar" aria-live="polite">
        <span>{statusText}</span>
        <span>{totalRemaining} left</span>
      </section>

      <section className="hm-decks" aria-label="Question categories">
        <div className="hm-deck-grid">
          {DECK_KEYS.map((key) => {
            const remaining = decks[key]?.length ?? 0
            const isEmpty = remaining === 0

            return (
              <button
                key={key}
                type="button"
                className={`hm-deck ${isEmpty ? 'empty' : ''}`}
                onClick={() => selectDeck(key)}
                disabled={isEmpty || !!activeCard}
              >
                <div className="hm-deck-stack">
                  {[...Array(Math.max(0, Math.min(4, Math.ceil(remaining / 5))))].map((_, index) => (
                    <div
                      key={index}
                      className="hm-stack-card"
                      style={{
                        backgroundColor: META[key].color,
                        transform: `translateX(${index * 2}px) translateY(${index * -2}px)`,
                      }}
                    />
                  ))}
                </div>
                <span className="hm-deck-category">{META[key].category}</span>
                <span className="hm-deck-count">{remaining}</span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="hm-controls" aria-label="Game controls">
        <button type="button" onClick={drawRandom} disabled={!canRandomDraw} className="hm-random-btn">
          Random
        </button>
        <div className="hm-controls-secondary">
          <button type="button" onClick={discardCard} disabled={!activeCard} className="hm-secondary">
            Next Question
          </button>
          <button type="button" onClick={resetGame} className="hm-secondary">
            Reset
          </button>
        </div>
      </section>

      {activeCard && (
        <div
          ref={cardRef}
          className={`hm-card-overlay ${isDiscarding ? 'discarding' : ''}`}
          onClick={handleCardOverlayClick}
          role="presentation"
        >
          <div className={`hm-card-modal ${isDrawing ? 'drawing' : ''} ${isFlipped ? 'flipped' : ''}`}>
            <div className="hm-card-inner">
              <div
                className="hm-card-back"
                style={{
                  background: `linear-gradient(145deg, ${META[activeCard.deckKey].color}, ${META[activeCard.deckKey].color}dd)`,
                }}
              >
                <span className="hm-card-back-label">?</span>
              </div>
              <div className="hm-card-front">
                <span
                  className="hm-card-category"
                  style={{ color: META[activeCard.deckKey].color }}
                >
                  {META[activeCard.deckKey].category}
                </span>
                <p className="hm-card-prompt">{activeCard.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="hm-footer">
        <button
          type="button"
          className="hm-history-btn"
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
        >
          {discardPile.length} played
        </button>
      </footer>

      {showHistory && discardPile.length > 0 && (
        <div className="hm-history-overlay" onClick={() => setShowHistory(false)} role="presentation">
          <div className="hm-history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="hm-history-header">
              <h2>Previously Played ({discardPile.length})</h2>
              <button
                type="button"
                className="hm-close-btn"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                ✕
              </button>
            </div>
            <div className="hm-history-cards">
              {discardPile.map((card, index) => (
                <div key={index} className="hm-history-card" style={{ borderLeftColor: META[card.deckKey].color }}>
                  <span className="hm-history-card-category">
                    {META[card.deckKey].category}
                  </span>
                  <p className="hm-history-card-text">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default HerdMentalityGame
