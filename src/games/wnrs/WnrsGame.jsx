import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import questionBank from '../../question-bank'
import './wnrs.css'

const META = {
  perception: { level: 'Level 1', category: 'Perception', color: 'var(--perception)' },
  connection: { level: 'Level 2', category: 'Connection', color: 'var(--connection)' },
  reflection: { level: 'Level 3', category: 'Reflection', color: 'var(--reflection)' },
  wildcard: { level: 'Wild', category: 'Card', color: 'var(--wildcard)' },
}

const DECK_KEYS = Object.keys(META)

function shuffleArray(items) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
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
    selectedDeck: null,
    activeCard: null,
    discardPile: [],
  }
}

function WnrsGame() {
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

  const canDrawSelected =
    !activeCard &&
    selectedDeck !== null &&
    selectedDeck !== undefined &&
    (decks[selectedDeck]?.length ?? 0) > 0

  const canShuffleSelected =
    !activeCard &&
    selectedDeck !== null &&
    selectedDeck !== undefined &&
    (decks[selectedDeck]?.length ?? 0) > 1

  const canRandomDraw = !activeCard && totalRemaining > 0

  const statusText = (() => {
    if (activeCard) return 'Card in play — discuss, then discard to continue.'
    if (totalRemaining === 0) return 'All cards played. Reset to start a fresh game.'
    if (!selectedDeck) return 'Pick a deck to begin.'
    const selectedMeta = META[selectedDeck]
    if (!selectedMeta) return 'Deck selected — draw your next card.'
    return `${selectedMeta.level} ${selectedMeta.category} selected — draw your next card.`
  })()

  const drawFromDeck = (key) => {
    if (activeCard || (decks[key]?.length ?? 0) === 0) return

    const [nextCard, ...remaining] = decks[key]
    setDecks((previous) => ({ ...previous, [key]: remaining }))
    setSelectedDeck(key)
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
    if (selectedDeck === key) {
      drawFromDeck(key)
    } else {
      setSelectedDeck(key)
    }
  }

  const drawSelected = () => {
    if (!canDrawSelected) return
    drawFromDeck(selectedDeck)
  }

  const drawRandom = () => {
    if (!canRandomDraw) return

    const availableDecks = DECK_KEYS.filter((key) => (decks[key]?.length ?? 0) > 0)
    const randomKey = availableDecks[getRandomIndex(availableDecks.length)]
    drawFromDeck(randomKey)
  }

  const shuffleSelected = () => {
    if (!canShuffleSelected) return
    setDecks((previous) => ({
      ...previous,
      [selectedDeck]: shuffleArray(previous[selectedDeck]),
    }))
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
    <main className="wnrs-app">
      <header className="page-header wnrs-top">
        <h1>We're Not Really Strangers</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <details className="how-to-play">
        <summary>
          <span className="how-to-play-arrow" aria-hidden="true">
            {'>'}
          </span>
          <span>How to play</span>
        </summary>
        <p>Designed for 2 players, and works great with groups up to 6.</p>
        <ul>
          <li>Player A draws a card and Player B answers, then switch turns.</li>
          <li>Aim to answer at least 15 cards in each level.</li>
          <li>Wild Cards must be completed unless the card says otherwise.</li>
        </ul>
      </details>

      <section className="status-bar" aria-live="polite">
        <span>{statusText}</span>
        <span>{totalRemaining} cards left</span>
      </section>

      <section className="deck-grid" aria-label="Question decks">
        {DECK_KEYS.map((key) => {
          const remaining = decks[key]?.length ?? 0
          const isSelected = selectedDeck === key
          const isEmpty = remaining === 0

          return (
            <button
              key={key}
              type="button"
              className={`deck ${isSelected ? 'selected' : ''} ${isEmpty ? 'empty' : ''}`}
              onClick={() => selectDeck(key)}
              disabled={isEmpty || !!activeCard}
              aria-pressed={isSelected}
            >
              <div className="deck-stack">
                {[...Array(Math.max(0, Math.min(7, Math.ceil(remaining / 4))))].map((_, index) => (
                  <div
                    key={index}
                    className="stack-card"
                    style={{
                      backgroundColor: META[key].color,
                      transform: `translateX(${index * 1.5}px) translateY(${index * -2}px)`,
                    }}
                  />
                ))}
              </div>
              <span className="deck-level">{META[key].level}</span>
              <span className="deck-category">{META[key].category}</span>
              <span className="deck-count">{remaining}</span>
            </button>
          )
        })}
      </section>

      <section className="controls" aria-label="Game controls">
        <button type="button" onClick={drawSelected} disabled={!canDrawSelected}>
          Draw Selected
        </button>
        <button type="button" onClick={drawRandom} disabled={!canRandomDraw}>
          Random Draw
        </button>
        <button type="button" onClick={shuffleSelected} disabled={!canShuffleSelected}>
          Shuffle Deck
        </button>
        <button type="button" onClick={discardCard} disabled={!activeCard} className="secondary">
          Discard Card
        </button>
        <button type="button" onClick={resetGame} className="secondary">
          Reset
        </button>
      </section>

      {activeCard && (
        <div
          ref={cardRef}
          className={`card-overlay ${isDiscarding ? 'discarding' : ''}`}
          onClick={handleCardOverlayClick}
          role="presentation"
        >
          <div className={`card-modal ${isDrawing ? 'drawing' : ''} ${isFlipped ? 'flipped' : ''}`}>
            <div className="card-inner">
              <div
                className="card-back"
                style={{
                  background: `linear-gradient(145deg, ${META[activeCard.deckKey].color}, ${META[activeCard.deckKey].color}cc)`,
                }}
              />
              <div className="card-front">
                <div className="card-tag-group">
                  <span className="card-level">{META[activeCard.deckKey].level}</span>
                  <span className="card-category">{META[activeCard.deckKey].category}</span>
                </div>
                <p className="card-question">{activeCard.text}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="app-footer">
        <button
          type="button"
          className="history-btn"
          onClick={() => setShowHistory(!showHistory)}
          aria-expanded={showHistory}
        >
          {discardPile.length} drawn
        </button>
      </footer>

      {showHistory && discardPile.length > 0 && (
        <div className="history-overlay" onClick={() => setShowHistory(false)} role="presentation">
          <div className="history-modal" onClick={(event) => event.stopPropagation()}>
            <div className="history-header">
              <h2>Previously Drawn Cards ({discardPile.length})</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowHistory(false)}
                aria-label="Close history"
              >
                ✕
              </button>
            </div>
            <div className="history-cards">
              {discardPile.map((card, index) => (
                <div key={index} className="history-card" style={{ borderLeftColor: META[card.deckKey].color }}>
                  <span className="history-card-level">
                    {META[card.deckKey].level} - {META[card.deckKey].category}
                  </span>
                  <p className="history-card-text">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default WnrsGame
