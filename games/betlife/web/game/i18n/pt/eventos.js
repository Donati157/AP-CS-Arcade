'use strict';
// Eventos e decisões, em português do Brasil.
// `{whoName}` é a pessoa, `{employer}` o patrão, `{tenure}`/`{yearsWorked}`/`{yearsTogether}` anos,
// `{major}` o curso, `{them}`/`{theirs}` o pronome e `{stepparent}` padrasto/madrasta.
export const PT_EVENTOS = {};

export const PT_EVENTOS_FRASES = {
  // ---- bebê e infância ---------------------------------------------------------------------
  'You smiled for the first time, and {whoName} would not stop talking about it.':
    'Você sorriu pela primeira vez, e {whoName} não parava de falar nisso.',
  '{whoName} said a first word, and it was not the one you were hoping for.':
    '{whoName} disse a primeira palavra, e não foi a que você esperava.',
  '{whoName} played peekaboo with you until you both had the hiccups from laughing.':
    '{whoName} brincou de achou com você até os dois ficarem com soluço de tanto rir.',
  '{whoName} taught you how to clap along to songs.': '{whoName} te ensinou a bater palma no ritmo da música.',
  '{whoName} read you the same bedtime story every night for a month because you asked for it.':
    '{whoName} leu a mesma história de dormir toda noite por um mês porque você pedia.',
  '{whoName} started sleeping next to your crib every night.':
    '{whoName} passou a dormir ao lado do seu berço toda noite.',
  '{whoName} takes you to the clinic for your shots. The nurse has a very bright sticker.':
    '{whoName} te leva ao posto para tomar vacina. A enfermeira tem um adesivo bem colorido.',
  '{whoName} put broccoli on your plate and is waiting.': '{whoName} pôs brócolis no seu prato e está esperando.',
  'You knocked over a vase while playing indoors. {whoName} is about to come in.':
    'Você derrubou um vaso brincando dentro de casa. {whoName} está prestes a entrar.',
  'An older kid at the playground is picking on {whoName}.':
    'Um menino mais velho no parquinho está implicando com {whoName}.',
  'You stood up for {whoName}. The older kid backed off, surprised.':
    'Você defendeu {whoName}. O mais velho recuou, surpreso.',
  'You fetched a grown-up, and the situation ended quickly. {whoName} was grateful.': { m: "Você chamou um adulto, e aquilo acabou rápido. {whoName} ficou agradecido.", f: "Você chamou um adulto, e aquilo acabou rápido. {whoName} ficou agradecida." },
  'You stayed out of it. {whoName} did not say anything, which was worse.':
    'Você não se meteu. {whoName} não disse nada, o que foi pior.',
  '{whoName} stood up for you when an older kid was being unkind.':
    '{whoName} te defendeu quando um menino mais velho foi grosso.',
  'You and {whoName} fought over the remote for a week, then teamed up against bedtime.':
    'Você e {whoName} brigaram pelo controle remoto por uma semana e depois se uniram contra a hora de dormir.',
  'You and {whoName} invented a game with three balls and a bucket that nobody else understood.':
    'Você e {whoName} inventaram um jogo com três bolas e um balde que ninguém mais entendia.',
  'You helped {whoName} cook dinner and only broke one egg on the floor.':
    'Você ajudou {whoName} a fazer o jantar e só quebrou um ovo no chão.',
  'After a long summer of adventures, you and {whoName} became best friends.':
    'Depois de um verão inteiro de aventuras, você e {whoName} viraram melhores amigos.',
  '{whoName} played a tree in the school play, and you filmed every second of it.':
    '{whoName} fez uma árvore na peça da escola, e você filmou cada segundo.',
  'You became friends with {whoName}.': { m: 'Você ficou amigo de {whoName}.', f: 'Você ficou amiga de {whoName}.' },

  // ---- adolescência -----------------------------------------------------------------------------
  '{whoName} wants to skip the last class of the day and go get milkshakes.':
    '{whoName} quer matar a última aula do dia e ir tomar milk-shake.',
  'You skipped class with {whoName}. The milkshakes were great; the missed quiz was not.':
    'Você matou aula com {whoName}. O milk-shake foi ótimo; a prova perdida não.',
  'You stayed in class and met {whoName} afterward instead.':
    'Você ficou na aula e encontrou {whoName} depois.',
  '{whoName} tells you a secret and makes you promise not to tell anyone.':
    '{whoName} te conta um segredo e faz você prometer não contar a ninguém.',
  "You kept {whoName}'s secret, and your friendship grew stronger.":
    'Você guardou o segredo de {whoName}, e a amizade de vocês ficou mais forte.',
  "You told someone {whoName}'s secret. It got back to them within a day.":
    'Você contou o segredo de {whoName} para alguém. Em um dia a notícia voltou.',
  '{whoName} asks you to help study before a big test.':
    '{whoName} pede sua ajuda para estudar antes de uma prova importante.',
  'You spent the evening helping {whoName} study. You both did well.':
    'Você passou a noite ajudando {whoName} a estudar. Os dois foram bem.',
  'You told {whoName} you were too busy to help.': 'Você disse a {whoName} que estava ocupado demais para ajudar.',
  'You had a sleepover at {whoName}\'s house and nobody slept before two in the morning.':
    'Você dormiu na casa de {whoName} e ninguém dormiu antes das duas da manhã.',
  'You came home late and had a long talk with {whoName} about curfews.':
    'Você chegou tarde em casa e teve uma conversa longa com {whoName} sobre horário.',
  '{whoName} took you to an empty parking lot to practice driving. Only one cone was harmed.':
    '{whoName} te levou a um estacionamento vazio para treinar direção. Só um cone se machucou.',
  '{whoName} gave you honest advice about school, and it turned out to be right.':
    '{whoName} te deu um conselho sincero sobre a escola, e ele estava certo.',
  '{whoName} hit the slammed-door years. You remembered doing the same.':
    '{whoName} entrou na fase de bater a porta. Você lembrou de ter feito igual.',
  'You and {whoName} played video games until sunrise and regretted nothing.':
    'Você e {whoName} jogaram videogame até o sol nascer e não se arrependeram de nada.',
  'You and {whoName} entered a video game tournament and lost in the first round, laughing.':
    'Você e {whoName} entraram num campeonato de videogame e perderam na primeira rodada, rindo.',

  // ---- amor e família ---------------------------------------------------------------------------
  'Become friends with {them}': 'Fazer amizade',
  'Reject {them}': 'Recusar',
  'Start going out with {them}': 'Começar a namorar',
  'You let {whoName} down gently.': 'Você recusou {whoName} com jeito.',
  'You turned {whoName} down. {whoName} kept {theirs} distance after that.':
    'Você recusou {whoName}. Depois disso, {whoName} manteve distância.',
  'You started going out with {whoName}.': 'Você começou a namorar {whoName}.',
  'You met {whoName} and talked until the café closed. The morning was rough and worth it.':
    'Você conheceu {whoName} e conversaram até o café fechar. A manhã seguinte foi dura e valeu a pena.',
  '{whoName} met your parents. It was awkward for exactly one dinner.':
    '{whoName} conheceu seus pais. Foi constrangedor por exatamente um jantar.',
  'You and {whoName} moved in together and discovered you fold towels differently.':
    'Você e {whoName} foram morar juntos e descobriram que dobram toalha de jeitos diferentes.',
  '{whoName} got down on one knee at your favorite spot and asked you to spend your lives together.':
    '{whoName} se ajoelhou no seu lugar favorito e pediu você em casamento.',
  '{whoName} proposed, and you said yes. You are engaged!':
    '{whoName} te pediu em casamento, e você disse sim. Vocês estão noivos!',
  '{whoName} proposed, and you asked for a little more time. It was a quiet week.':
    '{whoName} te pediu em casamento, e você pediu mais um tempo. Foi uma semana silenciosa.',
  'You and {whoName} got married in front of everyone you love.':
    'Você e {whoName} se casaram diante de todo mundo que vocês amam.',
  'You and {whoName} celebrated {yearsTogether} years together with the whole family.':
    'Você e {whoName} comemoraram {yearsTogether} anos juntos com a família inteira.',
  'You and {whoName} renewed your vows in the garden with the kids as witnesses.':
    'Você e {whoName} renovaram os votos no jardim, com os filhos de testemunha.',
  '{whoName} planned a surprise picnic for your anniversary.':
    '{whoName} preparou um piquenique surpresa no aniversário de vocês.',
  '{whoName} brought up the idea of having a baby.': '{whoName} levantou a ideia de ter um filho.',
  'You and {whoName} decided the time was right to start a family.':
    'Você e {whoName} decidiram que era hora de ter filhos.',
  'You and {whoName} decided to wait a little longer before having children.':
    'Você e {whoName} decidiram esperar mais um pouco antes de ter filhos.',
  'You and {whoName} had a serious argument about the future and made up a week later.':
    'Você e {whoName} tiveram uma discussão séria sobre o futuro e fizeram as pazes uma semana depois.',
  'You and {whoName} did not speak for a month over something neither of you can remember now.':
    'Você e {whoName} ficaram um mês sem se falar por algo de que nenhum dos dois lembra mais.',
  'Things with {whoName} have been hard for a while, and {whoName} suggested talking to a counselor.':
    'As coisas com {whoName} andam difíceis há um tempo, e {whoName} sugeriu procurar um terapeuta.',
  'You and {whoName} went to counseling and slowly found your way back to each other.':
    'Você e {whoName} fizeram terapia de casal e aos poucos se reencontraram.',
  'You and {whoName} tried to work things out on your own. It helped a little.':
    'Você e {whoName} tentaram resolver sozinhos. Ajudou um pouco.',
  'You and {whoName} decided to go your separate ways.': 'Você e {whoName} decidiram seguir caminhos separados.',
  '{whoName} ended the relationship. You had both known for a while.':
    '{whoName} terminou o relacionamento. Os dois já sabiam fazia tempo.',
  '{whoName} took a job in another city for a year. Long-distance was harder than either of you admitted.':
    '{whoName} aceitou um emprego em outra cidade por um ano. O namoro à distância foi mais duro do que os dois admitiam.',
  'You and {whoName} spent a whole day exploring the city by bus.':
    'Você e {whoName} passaram um dia inteiro explorando a cidade de ônibus.',
  'You and {whoName} took a weekend trip and got happily lost in a new city.':
    'Você e {whoName} viajaram num fim de semana e se perderam, felizes, numa cidade nova.',
  '{whoName} got married again. You gained a {stepparent}.': '{whoName} casou de novo. Você ganhou um {stepparent}.',

  // ---- filhos e netos -----------------------------------------------------------------------------
  '{whoName} is starting school. Do you take the morning off for the first day?':
    '{whoName} vai começar a escola. Você tira a manhã de folga no primeiro dia?',
  'You walked {whoName} to the first day of school and cried a little in the car afterward.':
    'Você levou {whoName} no primeiro dia de aula e chorou um pouco no carro depois.',
  '{whoName} went off to school, and you heard all about it at dinner.':
    '{whoName} foi para a escola, e você ouviu tudo sobre o dia no jantar.',
  'You watched {whoName} graduate from high school and clapped louder than anyone.':
    'Você viu {whoName} se formar no ensino médio e bateu palma mais alto que todo mundo.',
  'You taught {whoName} a trick. It works about half the time.':
    'Você ensinou um truque a {whoName}. Funciona mais ou menos na metade das vezes.',
  '{whoName} had a baby, and you were one of the first visitors.':
    '{whoName} teve um bebê, e você foi uma das primeiras visitas.',
  '{whoName} had a baby. You are a grandparent now, and you cannot stop showing photos.':
    '{whoName} teve um bebê. Você virou avô, e não para de mostrar foto.',
  'You went to {whoName}\'s wedding and gave a speech that made people laugh in the right places.':
    'Você foi ao casamento de {whoName} e fez um discurso que arrancou risada nos lugares certos.',
  '{whoName} caught a nasty bug, and you spent a week of sleepless nights before it passed.':
    '{whoName} pegou uma virose braba, e você passou uma semana de noites mal dormidas até melhorar.',

  // ---- família e cuidado ----------------------------------------------------------------------------
  '{whoName} is finding daily life harder and could use regular help.':
    '{whoName} está achando o dia a dia mais difícil e precisaria de ajuda frequente.',
  'You started visiting {whoName} every week to help around the house.':
    'Você passou a visitar {whoName} toda semana para ajudar em casa.',
  'You paid for someone to help {whoName} a few days a week.':
    'Você pagou alguém para ajudar {whoName} alguns dias por semana.',
  'You called {whoName} more often and helped when you could.':
    'Você passou a ligar mais para {whoName} e ajudava quando dava.',
  'You started calling {whoName} every Sunday.': 'Você passou a ligar para {whoName} todo domingo.',
  '{whoName} went through a rough patch, and you were there every week.':
    '{whoName} passou por uma fase difícil, e você esteve lá toda semana.',
  '{whoName} noticed you were struggling and quietly took care of everything for a while.':
    '{whoName} percebeu que você estava mal e cuidou de tudo em silêncio por um tempo.',
  '{whoName} asks to borrow $400 to get through a rough month.':
    '{whoName} pede US$ 400,00 emprestados para atravessar um mês apertado.',
  'You lent {whoName} the money. It came back, slowly, with a pie.':
    'Você emprestou o dinheiro a {whoName}. Voltou, devagar, junto com uma torta.',
  'You could not lend the money but helped {whoName} plan a budget.':
    'Você não pôde emprestar, mas ajudou {whoName} a organizar as contas.',
  '{whoName} came to visit for a weekend, and you stayed up talking like no time had passed.':
    '{whoName} veio passar um fim de semana, e vocês viraram a noite conversando como se o tempo não tivesse passado.',
  '{whoName} stayed with you for a week. You argued about the dishes like old times.':
    '{whoName} ficou uma semana na sua casa. Vocês discutiram sobre a louça como nos velhos tempos.',
  '{whoName} visited for a week and reorganized your kitchen.':
    '{whoName} passou uma semana aí e reorganizou a sua cozinha.',
  '{whoName} visited for the holidays and fixed everything in the house that beeped.':
    '{whoName} veio passar as festas e consertou tudo que apitava na casa.',
  '{whoName} is passing through town for one night and wants to meet up. You have an early morning.':
    '{whoName} está de passagem pela cidade por uma noite e quer encontrar você. Você acorda cedo amanhã.',
  'You asked {whoName} for a rain check. The next visit was a long way off.':
    'Você pediu para {whoName} deixar para outra vez. A próxima visita demorou.',
  'You told {whoName} maybe next year. You both knew what that meant.':
    'Você disse a {whoName} que talvez ano que vem. Os dois sabiam o que aquilo queria dizer.',
  'You said no. {whoName} understood, but things were cooler for a while.':
    'Você disse que não. {whoName} entendeu, mas as coisas esfriaram por um tempo.',
  '{whoName} wants to take the road trip you two always talked about.':
    '{whoName} quer fazer a viagem de carro que vocês dois sempre comentavam.',
  'You and {whoName} took the road trip at last, arguing about the map the whole way.':
    'Você e {whoName} finalmente fizeram a viagem, discutindo sobre o mapa o caminho inteiro.',
  '{whoName} offers you the old family car if you promise to pay for the gas.':
    '{whoName} te oferece o carro velho da família se você prometer pagar a gasolina.',
  '{whoName} gave you the old family car. It rattles, and you love it.':
    '{whoName} te deu o carro velho da família. Ele chacoalha, e você ama.',
  '{whoName} taught you how to change a tire, budget a paycheck, and stay calm about both.':
    '{whoName} te ensinou a trocar um pneu, a administrar o salário e a manter a calma nas duas coisas.',
  '{whoName} asked for your advice about a big decision, and actually took it.':
    '{whoName} te pediu conselho sobre uma decisão grande, e seguiu mesmo.',
  '{whoName} spent a few days in the hospital and came home tired but recovering.': { m: "{whoName} passou alguns dias no hospital e voltou para casa cansado, mas melhorando.", f: "{whoName} passou alguns dias no hospital e voltou para casa cansada, mas melhorando." },
  'Your friend {whoName} passed away. You spoke at the memorial about the good years.':
    'Seu amigo {whoName} faleceu. Você falou na despedida sobre os bons anos.',
  "{whoName}'s family moved to another city. You promised to stay in touch.":
    'A família de {whoName} se mudou para outra cidade. Vocês prometeram manter contato.',
  '{whoName} kept you company through the long winter evenings.':
    '{whoName} te fez companhia nas noites longas de inverno.',
  '{whoName} escaped for an afternoon and came home covered in mud, very pleased.':
    '{whoName} fugiu por uma tarde e voltou coberto de lama, muito satisfeito.',

  // ---- trabalho -----------------------------------------------------------------------------------------
  'A coworker at {employer} invited you to lunch, and you found out you have a lot in common.':
    'Um colega da {employer} te chamou para almoçar, e vocês descobriram que têm muito em comum.',
  'You and {whoName} started grabbing coffee before every shift.':
    'Você e {whoName} passaram a tomar café juntos antes de todo turno.',
  '{whoName} left {employer} for a new job. You promised to keep the coffee tradition going.':
    '{whoName} saiu da {employer} para outro emprego. Vocês prometeram manter o café de sempre.',
  '{whoName} was promoted at work and brought home a cake to celebrate.': { m: "{whoName} foi promovido no trabalho e trouxe um bolo para comemorar.", f: "{whoName} foi promovida no trabalho e trouxe um bolo para comemorar." },
  '{whoName} was promoted at work and called you first.': { m: "{whoName} foi promovido no trabalho e ligou para você primeiro.", f: "{whoName} foi promovida no trabalho e ligou para você primeiro." },
  '{whoName} got a big promotion, and you celebrated with dinner out.':
    '{whoName} teve uma promoção e tanto, e vocês comemoraram jantando fora.',
  'A year-end bonus landed in your account thanks to a strong year at {employer}.':
    'Um bônus de fim de ano caiu na sua conta graças a um ano forte na {employer}.',
  'You celebrated {tenure} years at {employer}. There was cake.':
    'Você comemorou {tenure} anos de {employer}. Teve bolo.',
  '{employer} gave you a new laptop. The old one had a key missing.':
    'A {employer} te deu um notebook novo. O antigo estava sem uma tecla.',
  '{employer} moved to a new office with better light and worse parking.':
    'A {employer} mudou para um escritório novo, com luz melhor e estacionamento pior.',
  '{employer} put you on a big project. It ate your evenings for months.':
    'A {employer} te colocou num projeto grande. Ele comeu as suas noites por meses.',
  '{employer} sent you on a training course. The slides were dull; the skills were useful.':
    'A {employer} te mandou para um treinamento. Os slides eram sem graça; o que você aprendeu, útil.',
  'Your manager at {employer} asks if you can put in extra hours this year for a big push.':
    'Seu gerente na {employer} pergunta se você topa fazer horas extras este ano por causa de um esforço grande.',
  '{employer} is offering early retirement packages. You could stop working now.':
    'A {employer} está oferecendo pacotes de aposentadoria antecipada. Você poderia parar de trabalhar agora.',
  'You have worked for {yearsWorked} years. Colleagues keep asking when you will retire.':
    'Você já trabalhou {yearsWorked} anos. Os colegas vivem perguntando quando você vai se aposentar.',
  '{whoName} helped you polish your résumé and practice interview answers.':
    '{whoName} te ajudou a melhorar o currículo e a treinar respostas de entrevista.',
  '{whoName} knows someone who is hiring and can put in a good word, but the job starts at the bottom.':
    '{whoName} conhece alguém que está contratando e pode falar bem de você, mas a vaga começa de baixo.',
  '{whoName} put in a good word. Check the job board: your name is on the shortlist.':
    '{whoName} falou bem de você. Olhe o quadro de vagas: o seu nome está na lista.',
  '{whoName} mentioned an opening where they work. You promised to look at the job board.':
    '{whoName} comentou de uma vaga onde trabalha. Você prometeu olhar o quadro de vagas.',
  '{whoName} says there is an opening where they work and the manager wants to meet you this week.':
    '{whoName} diz que há uma vaga onde trabalha e que o gerente quer te conhecer esta semana.',
  '{whoName} walked you in and vouched for you.': '{whoName} te levou lá dentro e garantiu por você.',

  // ---- os pronomes e parentescos que o código produz em inglês ---------------------------------
  "him": "dele",
  "her": "dela",
  "his": "dele",
  'stepfather': 'padrasto',
  'stepmother': 'madrasta',

  // ---- universidade -------------------------------------------------------------------------------------
  'Two years into {major}, you are not sure it is right for you.':
    'Dois anos de {major}, e você não tem certeza de que é o curso certo para você.',
};
