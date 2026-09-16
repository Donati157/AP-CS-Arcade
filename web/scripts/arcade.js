// Home page: renders one card per arcade slot from games.json, which the build script generates
// from every games/<game>/game.json. Nothing about a game is hard-coded here.
const grid = document.getElementById('game-grid');

const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function card(game) {
  const name = escapeHtml(game.name);
  if (!game.playable) {
    return `<article class="game-card soon" aria-label="${name}, coming soon">
      <div class="game-thumb thumb-soon" aria-hidden="true">?</div>
      <h2 class="game-name">${name.toUpperCase()}</h2>
      <p class="game-desc">Coming Soon</p>
      <button class="soon-btn" type="button" disabled>COMING SOON</button>
    </article>`;
  }
  return `<article class="game-card playable" data-route="${escapeHtml(game.route)}">
    <span class="badge">PLAYABLE</span>
    <div class="game-thumb thumb-${escapeHtml(game.id)} thumb-playable" aria-hidden="true">${name.toUpperCase()}</div>
    <h2 class="game-name">${name.toUpperCase()}</h2>
    <p class="game-desc">${escapeHtml(game.description)}</p>
    <a class="play-btn" href="${escapeHtml(game.route)}">▶ PLAY</a>
  </article>`;
}

fetch('games.json')
  .then((response) => response.json())
  .then((games) => {
    grid.innerHTML = games.sort((a, b) => a.slot - b.slot).map(card).join('');
    // The whole card acts as the Play button.
    grid.querySelectorAll('.game-card.playable').forEach((el) => {
      el.addEventListener('click', (event) => {
        if (event.target.closest('a')) return;
        el.querySelector('.play-btn').click();
      });
    });
  })
  .catch(() => {
    grid.innerHTML = '<p class="grid-error">The game list could not be loaded. Run <code>node scripts/build-web-games.mjs</code> and serve the web folder.</p>';
  });
