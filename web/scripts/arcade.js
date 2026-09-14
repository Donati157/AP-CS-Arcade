// Home page behaviour: the whole BetLife card acts as its Play button.
const card = document.getElementById('card-betlife');
const play = card.querySelector('.play-btn');
card.addEventListener('click', (event) => {
  if (event.target.closest('a')) return; // the link handles itself
  play.click();
});
