const META = {
  perception: { label: "Perception", color: "#d9534f", colorDark: "#c9302c" },
  connection: { label: "Connection", color: "#d4a44a", colorDark: "#b8892e" },
  reflection: { label: "Reflection", color: "#8b6bb3", colorDark: "#6f4f9b" },
  wildcard: { label: "Wild Card", color: "#4a7c59", colorDark: "#3a6147" }
};

const DECK_KEYS = Object.keys(META);

// DOM Elements
const deckArea = document.getElementById("deckArea");
const hintText = document.getElementById("hintText");
const drawnCard = document.getElementById("drawnCard");
const cardBack = drawnCard.querySelector(".card-back");
const cardCategory = document.getElementById("cardCategory");
const cardText = document.getElementById("cardText");
const discardBtn = document.getElementById("discardBtn");
const discardStack = document.getElementById("discardStack");
const discardMeta = document.getElementById("discardMeta");
const shuffleBtn = document.getElementById("shuffleBtn");
const randomPickBtn = document.getElementById("randomPickBtn");
const resetBtn = document.getElementById("resetBtn");

let state = null;

// Utility: Shuffle array
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Build initial decks from question bank
function buildDecks() {
  if (!window.QUESTION_BANK) {
    throw new Error("questions-data.js not loaded");
  }
  const decks = {};
  DECK_KEYS.forEach((key) => {
    decks[key] = { remaining: [...window.QUESTION_BANK[key]] };
  });
  return decks;
}

// Count total remaining cards
function totalRemaining() {
  return DECK_KEYS.reduce((sum, key) => sum + state.decks[key].remaining.length, 0);
}

// Render a stack of cards (for deck or discard pile)
function renderStack(container, count) {
  container.innerHTML = "";
  const layers = Math.max(0, Math.min(7, Math.ceil(count / 4)));

  for (let i = 0; i < layers; i++) {
    const card = document.createElement("div");
    card.className = "stack-card";

    // Position each card with slight offset for depth effect
    const offsetX = i * 1.5;
    const offsetY = i * -2;
    card.style.setProperty("--offset-x", `${offsetX}px`);
    card.style.setProperty("--offset-y", `${offsetY}px`);
    card.style.setProperty("--rotation", "0deg");
    card.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    card.style.zIndex = i;

    // Fan animation properties (for shuffle)
    const fanAngle = (i - layers / 2) * 15;
    const fanX = Math.sin(fanAngle * Math.PI / 180) * 40;
    const fanY = -Math.abs(Math.cos(fanAngle * Math.PI / 180) * 20) - 10;
    card.style.setProperty("--fan-x", fanX);
    card.style.setProperty("--fan-y", fanY);
    card.style.setProperty("--fan-rot", fanAngle);

    container.appendChild(card);
  }
}

// Update all deck visuals
function renderDecks() {
  DECK_KEYS.forEach((key) => {
    const deck = deckArea.querySelector(`[data-deck="${key}"]`);
    const stack = document.getElementById(`stack-${key}`);
    const countEl = document.getElementById(`count-${key}`);
    const count = state.decks[key].remaining.length;

    // Update count
    countEl.textContent = count;

    // Update stack visuals
    renderStack(stack, count);

    // Update deck state classes
    deck.classList.toggle("selected", state.selectedDeck === key);
    deck.classList.toggle("empty", count === 0);
  });

  // Update button states
  shuffleBtn.disabled =
    state.activeCard !== null ||
    state.selectedDeck === null ||
    state.decks[state.selectedDeck]?.remaining.length < 2;

  randomPickBtn.disabled = state.activeCard !== null || totalRemaining() === 0;
}

// Update discard pile visual
function renderDiscard() {
  const count = state.discardPile.length;
  renderStack(discardStack, count);
  discardMeta.textContent = `${count} discarded`;
}

// Update hint text
function setHint(text) {
  hintText.textContent = text;
  hintText.style.display = text ? "block" : "none";
}

// Select a deck
function selectDeck(key) {
  if (state.decks[key].remaining.length === 0) return;

  state.selectedDeck = key;
  setHint(`${META[key].label} — tap again to draw`);
  renderDecks();
}

// Draw a card with flip animation
function drawCard(key) {
  if (state.activeCard) return;

  const deck = state.decks[key];
  if (!deck || deck.remaining.length === 0) return;

  const text = deck.remaining.shift();
  state.activeCard = { deckKey: key, text };

  // Set card content
  cardCategory.textContent = META[key].label;
  cardText.textContent = text;

  // Set card back color to match deck
  cardBack.style.background = `linear-gradient(145deg, ${META[key].color}, ${META[key].colorDark})`;

  // Show card and trigger animations
  drawnCard.classList.remove("hidden", "flipping", "drawing", "discarding");
  drawnCard.classList.add("drawing");

  // After draw animation, trigger flip
  setTimeout(() => {
    drawnCard.classList.remove("drawing");
    drawnCard.classList.add("flipping");
  }, 300);

  // Show discard button
  discardBtn.classList.remove("hidden");

  // Hide hint
  setHint("");

  renderDecks();
}

// Handle deck click
function handleDeckClick(deckEl) {
  if (!deckEl || state.activeCard) return;

  const key = deckEl.dataset.deck;
  if (state.decks[key].remaining.length === 0) return;

  if (state.selectedDeck !== key) {
    selectDeck(key);
  } else {
    drawCard(key);
  }
}

// Fan & restack shuffle animation
function animateShuffle(key) {
  const deck = deckArea.querySelector(`[data-deck="${key}"]`);
  if (!deck) return;

  deck.classList.remove("shuffling");
  void deck.offsetWidth; // Force reflow
  deck.classList.add("shuffling");

  // Remove class after animation
  setTimeout(() => {
    deck.classList.remove("shuffling");
    renderDecks(); // Re-render to reset positions
  }, 1200);
}

// Shuffle the selected deck
function shuffleSelected() {
  if (!state.selectedDeck || state.activeCard) return;

  const deck = state.decks[state.selectedDeck];
  if (deck.remaining.length < 2) return;

  // Shuffle the array
  deck.remaining = shuffleArray(deck.remaining);

  // Trigger animation
  animateShuffle(state.selectedDeck);

  setHint(`${META[state.selectedDeck].label} shuffled`);
}

// Random pick - select random deck and draw
function randomPick() {
  if (state.activeCard) return;

  const available = DECK_KEYS.filter(key => state.decks[key].remaining.length > 0);
  if (available.length === 0) {
    setHint("All decks empty — reset to play again");
    return;
  }

  const key = available[Math.floor(Math.random() * available.length)];
  state.selectedDeck = key;
  renderDecks();

  // Small delay then draw
  setTimeout(() => {
    drawCard(key);
  }, 200);
}

// Discard current card
function discardCard() {
  if (!state.activeCard) return;

  // Calculate discard pile position for animation
  const pileRect = discardStack.getBoundingClientRect();
  const cardRect = drawnCard.getBoundingClientRect();
  const discardX = pileRect.left - cardRect.left - cardRect.width / 2 + pileRect.width / 2;
  const discardY = pileRect.top - cardRect.top - cardRect.height / 2 + pileRect.height / 2;

  drawnCard.style.setProperty("--discard-x", `${discardX}px`);
  drawnCard.style.setProperty("--discard-y", `${discardY}px`);

  drawnCard.classList.remove("flipping");
  drawnCard.classList.add("discarding");
  discardBtn.classList.add("hidden");

  setTimeout(() => {
    state.discardPile.unshift(state.activeCard);
    state.activeCard = null;

    drawnCard.classList.add("hidden");
    drawnCard.classList.remove("discarding", "flipping");

    // Reset card inner transform
    drawnCard.querySelector(".card-inner").style.transform = "";

    if (totalRemaining() === 0) {
      setHint("All cards played — reset to start fresh");
    } else if (state.selectedDeck && state.decks[state.selectedDeck].remaining.length > 0) {
      setHint(`${META[state.selectedDeck].label} — tap again to draw`);
    } else {
      setHint("Tap a deck to continue");
    }

    renderDecks();
    renderDiscard();
  }, 400);
}

// Reset the game
function resetGame() {
  state = {
    decks: buildDecks(),
    selectedDeck: null,
    activeCard: null,
    discardPile: []
  };

  drawnCard.classList.add("hidden");
  drawnCard.classList.remove("drawing", "flipping", "discarding");
  discardBtn.classList.add("hidden");

  setHint("Tap a deck to begin");
  renderDecks();
  renderDiscard();
}

// Event listeners
deckArea.addEventListener("click", (e) => {
  const deck = e.target.closest(".deck");
  handleDeckClick(deck);
});

shuffleBtn.addEventListener("click", shuffleSelected);
randomPickBtn.addEventListener("click", randomPick);
resetBtn.addEventListener("click", resetGame);
discardBtn.addEventListener("click", discardCard);

// Initialize
resetGame();
