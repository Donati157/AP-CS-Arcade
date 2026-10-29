'use strict';
// Interações com pessoas e bichos, em português do Brasil.
// `{name}` é o nome da pessoa; `{amount}` dinheiro; `{years}` anos juntos; `{baby}` o bebê;
// `{kind}` menino/menina; `{them}` o pronome dela/dele. Nenhum nome próprio é traduzido.
export const PT_PESSOAS = {
  // ---- o que aparece no diário --------------------------------------------------------------
  'You spent quality time with {name}.': 'Você passou um tempo bom com {name}.',
  'You and {name} had a long, easy conversation.': 'Você e {name} tiveram uma conversa longa e tranquila.',
  'Your conversation with {name} ended awkwardly.': 'Sua conversa com {name} terminou sem jeito.',
  '{name} was touched by your compliment.': '{name} se derreteu com o seu elogio.',
  'You gave {name} a thoughtful gift.': 'Você deu um presente pensado para {name}.',
  'You asked {name} for advice and came away wiser.': 'Você pediu conselho a {name} e saiu mais sábio.',
  'You and {name} had a heated argument.': 'Você e {name} tiveram uma discussão feia.',
  '{name} gave you {amount} of pocket money.': '{name} te deu {amount} de mesada.',
  '{name} said not this time.': '{name} disse que hoje não.',
  'You helped {name} with homework.': 'Você ajudou {name} com a lição de casa.',
  'You played with {name} until you were both worn out.': 'Você brincou com {name} até os dois cansarem.',
  'You took {name} for a long walk.': 'Você levou {name} para um passeio longo.',
  '{name} devoured the treat you bought.': '{name} devorou o petisco que você comprou.',
  'You and {name} went to the movies and argued about the ending all the way home.':
    'Você e {name} foram ao cinema e discutiram o final o caminho inteiro de volta.',
  'You and {name} went to a concert and sang until you were hoarse.':
    'Você e {name} foram a um show e cantaram até ficar roucos.',
  'You spent the afternoon playing with {name}.': 'Você passou a tarde brincando com {name}.',
  'You took {name} to the doctor for a checkup and waited with a magazine.':
    'Você levou {name} ao médico para um check-up e esperou lendo revista.',
  'You and {name} celebrated {years} years together.': 'Você e {name} comemoraram {years} anos juntos.',
  '{name} said it was too soon. The evening was awkward.': '{name} disse que era cedo demais. A noite ficou sem graça.',
  'You proposed to {name}, and {name} said yes. You are engaged!':
    'Você pediu {name} em casamento, e {name} disse sim. Vocês estão noivos!',
  'You and {name} talked about starting a family and decided to keep trying.':
    'Você e {name} falaram em ter filhos e decidiram continuar tentando.',
  'You and {name} welcomed a baby {kind} named {baby} into the world.':
    'Você e {name} deram as boas-vindas a {baby}, um {kind} recém-nascido.',
  'You and {name} got married in a small, joyful ceremony.':
    'Você e {name} se casaram numa cerimônia pequena e alegre.',
  'You ended things with {name}.': 'Você terminou com {name}.',
  'You decided to stop spending time with {name}.': 'Você decidiu parar de conviver com {name}.',
  'You and {name} talked about the things you never say out loud.':
    'Você e {name} falaram das coisas que ninguém diz em voz alta.',
  'You tried to open up to {name}, and it did not land the way you hoped.':
    'Você tentou se abrir com {name}, e não saiu como esperava.',
  'You and {name} walked until you ran out of pavement.': 'Você e {name} caminharam até a calçada acabar.',
  'You took {name} out to eat and stayed until the place emptied.':
    'Você levou {name} para comer e ficaram até o lugar esvaziar.',
  'You did the chores before {name} could ask.': 'Você fez as tarefas antes que {name} pedisse.',
  '{name} told you about growing up, and you listened to all of it.':
    '{name} contou da própria infância, e você ouviu tudo.',
  'You and {name} took on the afternoon as a team.': 'Você e {name} enfrentaram a tarde como uma dupla.',
  'You read {name} a story and did all the voices.': 'Você leu uma história para {name} fazendo todas as vozes.',
  'You taught {name} something you are good at.': 'Você ensinou a {name} algo em que é bom.',
  'You and {name} revised together and actually got through it.':
    'Você e {name} estudaram juntos e realmente deram conta da matéria.',
  'You and {name} spent the whole lunch break complaining about work.':
    'Você e {name} passaram o almoço inteiro reclamando do trabalho.',
  "You covered {name}'s shift. It was long, and {name} noticed.":
    'Você cobriu o turno de {name}. Foi longo, e {name} reparou.',
  'You checked in on {name} out of the blue, and it meant something.':
    'Você deu notícias a {name} do nada, e isso significou algo.',
  'You and {name} had an evening with no phones and no plans.':
    'Você e {name} tiveram uma noite sem celular e sem planos.',
  'You and {name} are best friends now, and both of you know it.':
    'Você e {name} são melhores amigos agora, e os dois sabem disso.',
  'You told {name} how much the friendship means. It landed awkwardly.':
    'Você disse a {name} o quanto a amizade importa. Ficou estranho.',
  'You apologised to {name}, and the air cleared.': 'Você se desculpou com {name}, e o clima limpou.',
  'You apologised to {name}. It was heard, but not accepted.':
    'Você se desculpou com {name}. Foi ouvido, mas não aceito.',
  '{name} learned a new trick and will not stop doing it.':
    '{name} aprendeu um truque novo e não para de repetir.',
  '{name} watched you closely and learned nothing.': '{name} olhou com atenção e não aprendeu nada.',
  'You took {name} to the vet. Everything checked out.': 'Você levou {name} ao veterinário. Estava tudo bem.',
  'You and {name} buried the hatchet. It felt like a weight lifted.':
    'Você e {name} fizeram as pazes. Foi como tirar um peso das costas.',
  'You offered {name} an olive branch. {name} was not ready yet.':
    'Você estendeu a mão a {name}. {name} ainda não estava pronto.',
  'You told {name} exactly what you thought. Neither of you backed down.':
    'Você disse a {name} exatamente o que pensava. Nenhum dos dois recuou.',
  'You ignored {name} completely. It bothered {them} more than you.':
    'Você ignorou {name} completamente. Incomodou mais a {them} do que a você.',
  'You found {name} a loving new home.': 'Você encontrou um lar novo e carinhoso para {name}.',
  'You gave {name} a bath. Most of the water ended up on you.':
    'Você deu banho em {name}. A maior parte da água acabou em você.',
  'You asked {name} out. {name} said it was better to stay friends.':
    'Você chamou {name} para sair. {name} disse que era melhor ficar na amizade.',
  'You asked {name} out, and {name} said yes. You are now a couple.':
    'Você chamou {name} para sair, e {name} aceitou. Agora vocês namoram.',
  'You are already with someone.': 'Você já está com alguém.',

  // ---- motivos de mudança de atributo (aparecem no registro da vida) ---------------------------
  'time with {name}': 'tempo com {name}',
  'conversation with {name}': 'conversa com {name}',
  'complimented {name}': 'elogiou {name}',
  'gift for {name}': 'presente para {name}',
  'advice from {name}': 'conselho de {name}',
  'argued with {name}': 'discussão com {name}',
  'allowance from {name}': 'mesada de {name}',
  'helped {name}': 'ajudou {name}',
  'played with {name}': 'brincou com {name}',
  'walked {name}': 'passeou com {name}',
  'treat for {name}': 'petisco para {name}',
  'movies with {name}': 'cinema com {name}',
  'concert with {name}': 'show com {name}',
  'checkup for {name}': 'check-up de {name}',
  'cared for {name}': 'cuidou de {name}',
  'broke up with {name}': 'terminou com {name}',
  'unfriended {name}': 'deixou de ser amigo de {name}',
  'heart to heart with {name}': 'conversa franca com {name}',
  'walk with {name}': 'caminhada com {name}',
  'meal with {name}': 'refeição com {name}',
  'helped {name} at home': 'ajudou {name} em casa',
  'stories from {name}': 'histórias de {name}',
  'teamed up with {name}': 'fez dupla com {name}',
  'story with {name}': 'história com {name}',
  'taught {name}': 'ensinou {name}',
  'studied with {name}': 'estudou com {name}',
  'lunch with {name}': 'almoço com {name}',
  'covered for {name}': 'cobriu o turno de {name}',
  'checked in on {name}': 'deu notícias a {name}',
  'date night with {name}': 'encontro com {name}',
  'best friends with {name}': 'melhores amigos de {name}',
  'apologised to {name}': 'pediu desculpa a {name}',
  'training {name}': 'treinando {name}',
  'bathed {name}': 'deu banho em {name}',
  'vet for {name}': 'veterinário de {name}',
  'made peace with {name}': 'fez as pazes com {name}',
  'confronted {name}': 'enfrentou {name}',
  'ignored {name}': 'ignorou {name}',
  'rehomed {name}': 'arrumou um lar para {name}',
  'started dating {name}': 'começou a namorar {name}',
  '{name} said no': '{name} disse não',
};
