import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './deck52.css'

const SUITS = [
  { key: 'spades', symbol: '♠', color: 'black' },
  { key: 'hearts', symbol: '♥', color: 'red' },
  { key: 'clubs', symbol: '♣', color: 'black' },
  { key: 'diamonds', symbol: '♦', color: 'red' },
]

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function createOrderedDeck() {
  const standardCards = SUITS.flatMap((suit) =>
    RANKS.map((rank) => ({
      id: `${rank}-${suit.key}`,
      rank,
      suit: suit.symbol,
      color: suit.color,
      label: `${rank}${suit.symbol}`,
      isJoker: false,
    })),
  )

  const jokers = [
    { id: 'joker-black-1', rank: 'JOKER', suit: '★', color: 'black', label: 'Joker', isJoker: true },
    { id: 'joker-red-1', rank: 'JOKER', suit: '★', color: 'red', label: 'Joker', isJoker: true },
    { id: 'joker-black-2', rank: 'JOKER', suit: '★', color: 'black', label: 'Joker', isJoker: true },
    { id: 'joker-red-2', rank: 'JOKER', suit: '★', color: 'red', label: 'Joker', isJoker: true },
  ]

  return [...standardCards, ...jokers]
}

function shuffleArray(items) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[output[index], output[swapIndex]] = [output[swapIndex], output[index]]
  }
  return output
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum)
}

function Deck52Game() {
  const orderedDeck = useMemo(() => createOrderedDeck(), [])
  const [deck, setDeck] = useState(orderedDeck)
  const [tableCards, setTableCards] = useState([])
  const [includeJokers, setIncludeJokers] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isShuffling, setIsShuffling] = useState(false)
  const [cardOffset, setCardOffset] = useState({ x: 0, y: 0 })
  const cardOffsetRef = useRef({ x: 0, y: 0 })

  const areaRef = useRef(null)
  const topCardRef = useRef(null)
  const dragState = useRef({
    pointerId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })
  const tableDragState = useRef({
    pointerId: null,
    cardId: null,
    isDragging: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  })

  const topCard = deck[0]
  const visibleDepth = Math.min(8, deck.length)
  const jokerCount = deck.filter((card) => card.isJoker).length

  const handlePointerDown = (event) => {
    if (!topCard || !topCardRef.current) return

    dragState.current = {
      pointerId: event.pointerId,
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      originX: cardOffset.x,
      originY: cardOffset.y,
      moved: false,
    }

    topCardRef.current.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event) => {
    const area = areaRef.current
    const drag = dragState.current
    if (!area || !drag.isDragging || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true
    }

    const centerLeft = area.clientWidth / 2 - 63
    const centerTop = area.clientHeight / 2 - 88
    const minOffsetX = 16 - centerLeft
    const maxOffsetX = area.clientWidth - 126 - 16 - centerLeft
    const minOffsetY = 16 - centerTop
    const maxOffsetY = area.clientHeight - 176 - 16 - centerTop

    const nextX = clamp(drag.originX + deltaX, minOffsetX, maxOffsetX)
    const nextY = clamp(drag.originY + deltaY, minOffsetY, maxOffsetY)

    cardOffsetRef.current = { x: nextX, y: nextY }
    setCardOffset({ x: nextX, y: nextY })
  }

  const handlePointerEnd = (event) => {
    const drag = dragState.current
    if (!drag.isDragging || drag.pointerId !== event.pointerId) return

    const movedDistance = Math.hypot(cardOffsetRef.current.x, cardOffsetRef.current.y)
    const shouldDrawCard = drag.moved && movedDistance > 60

    if (shouldDrawCard) {
      const area = areaRef.current
      if (topCard && area) {
        const placedX = area.clientWidth / 2 - 63 + cardOffsetRef.current.x
        const placedY = area.clientHeight / 2 - 88 + cardOffsetRef.current.y
        setTableCards((previous) => [
          ...previous,
          {
            id: `table-${topCard.id}-${previous.length}`,
            card: topCard,
            x: placedX,
            y: placedY,
            rotation: 0,
          },
        ])
      }

      setDeck((previous) => previous.slice(1))
      setIsOpen(false)
      cardOffsetRef.current = { x: 0, y: 0 }
      setCardOffset({ x: 0, y: 0 })
    } else if (!drag.moved && topCard) {
      setIsOpen((previous) => !previous)
    } else {
      cardOffsetRef.current = { x: 0, y: 0 }
      setCardOffset({ x: 0, y: 0 })
    }

    if (topCardRef.current?.hasPointerCapture(event.pointerId)) {
      topCardRef.current.releasePointerCapture(event.pointerId)
    }

    dragState.current = {
      pointerId: null,
      isDragging: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      moved: false,
    }
  }

  const handleTableCardPointerDown = (event, cardId) => {
    event.stopPropagation()

    setTableCards((previous) => {
      const cardIndex = previous.findIndex((entry) => entry.id === cardId)
      if (cardIndex === -1) return previous

      const selectedCard = previous[cardIndex]
      tableDragState.current = {
        pointerId: event.pointerId,
        cardId,
        isDragging: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: selectedCard.x,
        originY: selectedCard.y,
        moved: false,
      }

      const reordered = [...previous]
      reordered.splice(cardIndex, 1)
      reordered.push(selectedCard)
      return reordered
    })

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleTableCardPointerMove = (event) => {
    const area = areaRef.current
    const drag = tableDragState.current
    if (!area || !drag.isDragging || drag.pointerId !== event.pointerId || !drag.cardId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      drag.moved = true
    }

    const nextX = clamp(drag.originX + deltaX, 16, Math.max(16, area.clientWidth - 126 - 16))
    const nextY = clamp(drag.originY + deltaY, 16, Math.max(16, area.clientHeight - 176 - 16))

    setTableCards((previous) =>
      previous.map((entry) => {
        if (entry.id !== drag.cardId) return entry
        return {
          ...entry,
          x: nextX,
          y: nextY,
          rotation: 0,
        }
      }),
    )
  }

  const handleTableCardPointerEnd = (event) => {
    const drag = tableDragState.current
    if (!drag.isDragging || drag.pointerId !== event.pointerId) return

    if (event.currentTarget?.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    tableDragState.current = {
      pointerId: null,
      cardId: null,
      isDragging: false,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      moved: false,
    }
  }

  const shuffleDeck = () => {
    const totalCards = deck.length + tableCards.length
    if (totalCards <= 1 || isShuffling) return

    setIsShuffling(true)
    setTimeout(() => {
      setDeck((previous) => shuffleArray([...previous, ...tableCards.map((entry) => entry.card)]))
      setTableCards([])
      setIsOpen(false)
      cardOffsetRef.current = { x: 0, y: 0 }
      setCardOffset({ x: 0, y: 0 })
      setIsShuffling(false)
    }, 460)
  }

  const toggleJokers = () => {
    setIncludeJokers((previous) => {
      const next = !previous

      setDeck((currentDeck) => {
        if (!next) {
          return currentDeck.filter((card) => !card.isJoker)
        }

        const missingJokers = orderedDeck.filter(
          (card) => card.isJoker && !currentDeck.some((existing) => existing.id === card.id),
        )
        return [...currentDeck, ...missingJokers]
      })

      setTableCards((previous) => {
        if (!next) {
          return previous.filter((entry) => !entry.card.isJoker)
        }
        return previous
      })

      setIsOpen(false)
      cardOffsetRef.current = { x: 0, y: 0 }
      setCardOffset({ x: 0, y: 0 })
      return next
    })
  }

  return (
    <main className="deck52-app app-shell">
      <header className="page-header">
        <h1>52-Card Deck</h1>
        <Link to="/" className="back-link">
          ← Back to Home
        </Link>
      </header>

      <section className="deck52-controls" aria-label="Deck controls">
        <button
          type="button"
          onClick={shuffleDeck}
          disabled={deck.length + tableCards.length <= 1 || isShuffling}
        >
          Shuffle
        </button>
        <button
          type="button"
          className={`secondary ${includeJokers ? 'active' : ''}`}
          onClick={toggleJokers}
          aria-pressed={includeJokers}
        >
          Jokers: {includeJokers ? 'On' : 'Off'}
        </button>
      </section>

      <section className="deck52-status" aria-live="polite">
        <span>{deck.length} cards in deck</span>
        <span>{tableCards.length} cards on table</span>
        <span>{jokerCount} jokers in deck</span>
      </section>

      <section ref={areaRef} className="deck52-table" aria-label="Card table">
        {tableCards.map((entry) => (
          <div
            key={entry.id}
            className={`table-card ${entry.card.color === 'red' ? 'red' : 'black'}`}
            style={{
              left: `${entry.x}px`,
              top: `${entry.y}px`,
              transform: `rotate(${entry.rotation}deg)`,
            }}
            onPointerDown={(event) => handleTableCardPointerDown(event, entry.id)}
            onPointerMove={handleTableCardPointerMove}
            onPointerUp={handleTableCardPointerEnd}
            onPointerCancel={handleTableCardPointerEnd}
          >
            <div className="card-front-face">
              <span className="corner top-left">
                {entry.card.rank}
                <span>{entry.card.suit}</span>
              </span>
              <span className="center-symbol">{entry.card.isJoker ? 'JOKER' : entry.card.suit}</span>
              <span className="corner bottom-right">
                {entry.card.rank}
                <span>{entry.card.suit}</span>
              </span>
            </div>
          </div>
        ))}

        {topCard ? (
          <div className={`deck52-center ${isShuffling ? 'shuffling' : ''}`}>
            <div className="deck52-stack" aria-hidden="true">
              {[...Array(visibleDepth)].map((_, index) => (
                <div
                  key={index}
                  className="deck-shadow"
                  style={{ transform: `translate(${index * -1.8}px, ${index * 1.8}px)` }}
                />
              ))}
            </div>

            <button
              ref={topCardRef}
              type="button"
              className={`top-card ${isOpen ? 'open' : ''} ${topCard.color === 'red' ? 'red' : 'black'}`}
              style={{ transform: `translate(${cardOffset.x}px, ${cardOffset.y}px)` }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              aria-label="Top card. Tap to open or close. Drag to move card."
            >
              <div className="top-card-inner">
                <div className="card-back-face" />
                <div className="card-front-face">
                  <span className="corner top-left">
                    {topCard.rank}
                    <span>{topCard.suit}</span>
                  </span>
                  <span className="center-symbol">{topCard.isJoker ? 'JOKER' : topCard.suit}</span>
                  <span className="corner bottom-right">
                    {topCard.rank}
                    <span>{topCard.suit}</span>
                  </span>
                </div>
              </div>
            </button>
          </div>
        ) : (
          <p className="empty-table">Deck is empty.</p>
        )}
      </section>
    </main>
  )
}

export default Deck52Game
