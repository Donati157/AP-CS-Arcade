# BetLife — referências em vídeo, e o que elas dizem sobre o build atual

Referência de **experiência e mecânica**. Nenhum código, texto, imagem, marca ou asset do jogo de
referência foi copiado; o que está aqui é descrição do que acontece na tela e a comparação com o que
o BetLife já faz.

## 0. O que consegui ver, e o que não consegui

| fonte | acesso | o que extraí |
|---|---|---|
| `youtu.be/_SIoanw3wMU` — *"Virei o MAIOR ASSASSINO do BitLife"*, 16:18, Problems Raiz | **transcrição automática completa**, 134 segmentos com timestamp | a narração descreve clique a clique o que ele abre e o que o jogo responde |
| `youtu.be/--jk76eHbiI` — *"Tentando me tornar a pessoa mais rica do mundo [BitLife]"*, 17:26, JZIN | **título, duração, descrição do autor. Transcrição NÃO.** | tema declarado pelo autor: simulador de vida, objetivo de ficar a pessoa mais rica do mundo |
| `games/betlife/Betlife videos/` — 4 gravações de tela, **55 min** | **vídeo, quadro a quadro** | a interface de verdade: telas, hierarquia, cores, ícones, modais |

**O impedimento exato no segundo vídeo.** Ele **tem** legenda automática em português
(`captionTracks: [{lang: "pt", kind: "asr"}]`), mas não consegui lê-la:

1. a API `youtube.com/api/timedtext` responde **HTTP 200 com corpo de 0 bytes** em todos os formatos
   (`xml`, `json3`, `srv3`, `vtt`) — o YouTube passou a exigir um token que a página gera;
2. o painel "Mostrar transcrição" existe no DOM mas o botão fica dentro de
   `ytd-structured-description-content-renderer`, que está `[hidden]`, com caixa de tamanho **0×0** —
   não dá para clicar nem por coordenada nem pelo DOM;
3. forçar `visibility=EXPANDED` no painel não dispara o carregamento dos dados: ele renderiza só o
   esqueleto, sem nenhum `ytd-transcript-segment-renderer`;
4. o endpoint interno `youtubei/v1/get_transcript` devolve **400 "Precondition check failed"** mesmo
   com os `params` tirados do próprio HTML da página.

No primeiro vídeo o mesmo painel carregou normalmente — é instabilidade do YouTube, não falta de
legenda. **Não inventei o conteúdo do segundo vídeo e não o usei como base para nada.** Se você
quiser que ele entre, há dois caminhos: me passar a transcrição, ou gravar a tela como fez com os
outros quatro vídeos, que é o material que mais rendeu.

**As gravações locais são a melhor referência que existe neste repositório** e não estavam sendo
usadas. Extraí quadros delas com AVFoundation (WebKit/Swift nativo, sem dependência externa).

---

## 1. Vídeo 1 — mecânicas, por timestamp

Coluna "BetLife hoje" conferida no código e no navegador, não suposta.

| t | o que acontece no vídeo | BetLife hoje | veredito |
|---|---|---|---|
| **0:24** | Começa aos **0 anos**. Quatro atributos: felicidade, saúde, inteligência ("smarts"), aparência | **igual**: `STATS = ['happiness','health','smarts','looks']`, barra com rótulo, ícone e % | ✅ preservar |
| **0:31** | Botão central **+Idade** avança um ano | **igual**: botão verde central `data-action="age"` | ✅ preservar |
| **0:39** | Aos 2 anos: *"novo amigo, um menino chamado Roberto, quer fazer amizade"* — evento com pessoa | **existe**: `events/engine.js` tem `personRequest` com `friendRequest`/`loveRequest` | ✅ preservar |
| **0:51** | A mãe quer adotar um gato; o jogador aceita | **existe**: pets com espécie, nome, tempo de vida (`pets.js`, `PET_SPECIES`) | ✅ preservar |
| **0:59** | **Aos 6 anos começa a escola**, automaticamente | **igual**: `SCHOOL_START_AGE`, `startSchool()` | ✅ preservar |
| **1:09** | **Atividades → Desenvolvimento pessoal → Ler livro**; ler aumenta intelecto e diversão | **existe**: `activities.js` com submenus e categorias; efeitos por atividade | ✅ preservar |
| **1:14** | O livro tem **132 páginas** e exige clicar muitas vezes — minijogo de repetição | **não existe**: a atividade resolve num clique | ⚠️ diferença deliberada (ver §4) |
| **1:38** | Tela da escola: **notas**, popularidade, relação com a professora | **parcial**: há nota (`gradeLetter`, `averageGrade`) e desempenho; **não há popularidade nem relação com professor** | 🔧 lacuna |
| **2:10** | **Exame de vista** como minijogo cronometrado ("clique no diferente"); falhar → usa óculos | **não existe** minijogo de vista; existe infraestrutura de minijogo (`finishMinigame`, `ui/modals.js: minigame`) | 🔧 lacuna com base pronta |
| **2:33** | **Artes marciais**: jiu-jitsu, judô, caratê, krav magá, kung fu, taekwondo | **não existe** como linha de progressão | 🔧 lacuna |
| **2:42** | **Sendo menor, precisa pedir à mãe** — e ela pode recusar, várias vezes seguidas | **não existe**: nenhuma atividade de menor passa por consentimento dos pais | 🔧 lacuna **de design**, não de código — é o que dá textura à infância |
| **2:58** | **O gato morre**; o jogador perde um atributo e lamenta | **existe**: mortalidade de pets e de parentes (`mortality.js`, `relativeDies`) | ✅ preservar |
| **3:06** | Cinema para recuperar felicidade; o ganho é pequeno | **existe**, e com **retorno decrescente** por repetição (`diminished`) — melhor que a referência | ✅ preservar |
| **3:22** | Um amigo **termina a amizade**; escolha: deixar ele tentar recuperar ou insultar | **parcial**: há `unfriend`, `apologise`, `makePeace`; **não há** o evento de ruptura iniciado pelo outro | 🔧 lacuna pequena |
| **3:38** | **Aos 14 abre a área de crimes**: furto de loja, roubar carro, travessura | **não existe** | ⚠️ **decisão de escopo sua** (ver §4) |
| **3:53** | No furto, **escolhe o item por preço**; o receptador paga uma fração | — | ⚠️ idem |
| **4:14** | **Escola secundária** por faixa etária | **igual**: elementary → middle → high, com `FIRST_MIDDLE_GRADE`, `FIRST_HIGH_GRADE` | ✅ preservar |
| **4:28** | **Clubes**: paintball, política, eletrônica, caligrafia — e **ser recusado** por atributo baixo | **não existe** clube; existe `newFriend` via atividade | 🔧 lacuna |
| **4:42** | **Academia** aumenta a parte física | **existe** como atividade | ✅ preservar |
| **5:15** | Evento de **bullying** com escolha de resposta | **existe** o formato (decisões por faixa etária em `decisions/school.js`) | ✅ preservar |
| **5:32** | A escolha violenta **mata** o colega → condenação, reformatório, **expulso da escola** | **não existe** | ⚠️ escopo seu |
| **5:54** | **Minijogo de fuga da prisão** em grade; o guarda se move a cada movimento | **não existe** | ⚠️ escopo seu |
| **6:10** | Falhar na fuga **estende a pena**; a namorada termina por ele estar preso | — | ⚠️ idem |
| **7:20** | **Carteira de motorista** por prova; depois é **pré-requisito** de outras ações | **parcial**: `player.hasLicence` existe e a atividade `driving` existe; **não é** pré-requisito de nada além de comprar veículo | 🔧 lacuna pequena |
| **8:53** | **Bens**: o carro aparece em recursos e pode ser **vendido com preço escolhido**; o comprador recusa e ele **baixa o preço** | **existe e é mais completo**: `assets.js` tem comprar, vender, dirigir, manutenção, reparo, sucatear, presentear, reformar | ✅ preservar — **melhor que a referência** |
| **9:09** | **Faixas** de arte marcial progridem (preta → vermelha) e **liberam golpes** | **não existe** | 🔧 lacuna |
| **14:21** | Depois de um evento, **ganha um emprego** com salário declarado | **existe e é muito mais completo**: `careers.js` + `career.js` com requisitos, promoção, desempenho, aumento, RH, aposentadoria, pensão | ✅ preservar — **melhor que a referência** |
| **16:00** | **Conquista** desbloqueada ao fim de uma linha de jogo | **existe**: `badges.js` com banner próprio | ✅ preservar |
| — | A vida **não termina** no vídeo | **existe e é melhor**: mortalidade por idade e saúde, causa de morte, resumo de vida, **continuar como filho** | ✅ preservar |

## 2. As gravações locais — a interface, quadro a quadro

| gravação | duração | aparelho |
|---|---|---|
| `ScreenRecording_09-15…46-39` | 0:22 | iPhone 1170×2532 |
| `ScreenRecording_09-15…47-53` | **12:34** | iPhone 1170×2532 |
| `ScreenRecording_09-16…31-35` | **13:39** | iPad 1640×2360 |
| `ScreenRecording_09-16…27-26` | **29:08** | iPad 1640×2360 |

### 2.1 Tela principal (`15-47-53` @ 0:05)

De cima para baixo: **barra vermelha** (menu sanduíche · logotipo · contador de estrelas · pílula de
assinatura) → **faixa do personagem** (avatar, nome sublinhado com bandeira e ícone de info, rótulo
do estágio à esquerda; **saldo bancário à direita**) → **diário da vida**, que ocupa o centro e é o
corpo da tela → faixa de banner → **navegação inferior de 5 itens** com o **+Idade** verde elevado no
meio → **painel de atributos** com 4 barras rotuladas e % à direita.

**O BetLife já tem essa mesma anatomia**, incluindo o botão central elevado, a faixa do personagem e
as quatro barras. É a observação mais importante deste documento: a identidade visual não precisa ser
refeita.

Três diferenças concretas:

1. **O rótulo do estágio fica no lugar do cargo.** Na referência, a segunda linha da faixa mostra a
   **profissão** quando existe ("Database Administrator", "Chief of Police", "Sr. Database
   Administrator") e o estágio só na infância ("Infant", "Elementary School Student"). O BetLife
   mostra a ocupação — **igual**. ✅
2. **O primeiro item da navegação muda de nome com a idade**: `Infant` → `School` → `Job`. O BetLife
   faz o mesmo (`updateOccupation`, `stageOf`). ✅
3. **O saldo fica verde quando positivo** e é o único número no cabeçalho. ✅ igual.

### 2.2 Modal de evento (`15-47-53` @ 3:20)

Cartão branco arredondado, **borda azul**, título em azul-forte, corpo em azul médio, scrim escuro
sobre a tela inteira — e, no rodapé do cartão, **o efeito mostrado como barra rotulada**
("Relationship" + barra verde). O jogador vê a consequência, não só o texto.

**BetLife hoje:** o modal tem banda de categoria colorida e `facts` em linhas de rótulo/valor — mas
**não mostra o efeito como barra**. 🔧 Lacuna pequena e de alto retorno: é o feedback que o §7 do seu
pedido chama de "feedback depois de decisões".

### 2.3 Modal com categoria (`13-27-26` @ 8:00)

Borda e fita de categoria **mudam de cor por tipo** ("Conflict" em vermelho-laranja, no canto
superior do cartão), e o corpo pode conter **campos de formulário** (dois menus suspensos: escolher o
golpe e escolher o alvo). **BetLife já tem a banda de categoria colorida** (`band`, `tone`). ✅

### 2.4 Tela de relacionamentos (`13-27-26` @ 10:20 e `12-31-35` @ 4:40)

Cabeçalho azul com **✕ à esquerda e título em caixa alta centralizado**. Lista com **divisórias
cinza de seção**: `Special` · `Love` · `Children` · `Enemies` · **`Late Relationships`** · **`Late
Pets`**. Cada linha: avatar · **Nome (Papel)** em azul · rótulo "Relationship" com barra verde ·
chevron `›`. Os mortos aparecem com **caveira** e "Died N years ago", sem barra.

**BetLife hoje:** `relationshipSections()` já produz seções, e `latePets` existe. ✅ Mesma estrutura.

### 2.5 Tela de uma pessoa (`13-27-26` @ 15:30)

Cabeçalho azul com **‹ voltar** e o papel em caixa alta ("WIFE"). Abaixo, seção **Activities** com
uma linha por ação: emoji · **título em azul** · subtítulo cinza de uma linha · `⋯` à direita.
Dezenas de ações por pessoa (Birth Control, Celebrate Anniversary, Compliment, Conversation,
Counseling, Deal, Divorce, Gift, Insult…).

**BetLife hoje:** `actionsFor`/`actionSections` com o mesmo padrão de linha. ✅

### 2.6 O padrão de linha que atravessa o jogo inteiro

**ícone · título em azul-forte · descrição cinza de uma linha · afordância à direita (`⋯` ou `›`)**,
com divisórias de seção em cinza. É isso que faz a referência não parecer "uma coleção de botões".
**O `row()` do BetLife (`ui/render.js`) já é exatamente esse padrão.** ✅

---

## 3. O que o BetLife tem e a referência não mostrou

Não é lacuna: é vantagem, e deve ser preservada.

- **Retorno decrescente** por repetir a mesma ação no mesmo ano (`diminished`) — impede farmar atributo.
- **Economia anual de verdade**: imposto por faixa, custo de vida proporcional, aluguel, contas da
  casa, custo por filho, **juros sobre dívida** (`economy.js`).
- **Carreira estruturada**: requisitos por vaga, níveis, desempenho, aumento, RH, militar, emprego dos
  sonhos, histórico, aposentadoria com pensão.
- **Memória epistêmica da vida**: `statLog` registra cada mudança de atributo **com o motivo**.
- **Continuar como filho** depois da morte — continuidade entre gerações.
- **Conquistas**, **redes sociais**, **bens com manutenção e reforma**, **resumo de vida**.

---

## 4. Decisões de escopo que são suas, não minhas

O primeiro vídeo é, de ponta a ponta, uma **run de assassino em série**: furto, roubo de carro,
assalto, homicídio, prisão, fuga e um sistema de ataque com escolha de golpe e de parte do corpo.
Isso é metade do tempo de tela daquele vídeo.

**Não implementei nada disso, e não vou implementar sem você pedir**, por três razões concretas:

1. o seu próprio §3 lista o que quer auditado e desenvolvido — família, escola, amizades, atributos,
   escola, educação superior, empregos, renda, relacionamentos, bens, eventos, envelhecimento e
   encerramento. **Crime não está lá**;
2. o BetLife é publicado no AP CS Arcade, um site de trabalho escolar;
3. é a diferença mais cara da lista, e construí-la por conta própria contrariaria "não crie
   funcionalidades enormes sem primeiro verificar o que já foi planejado".

**As alternativas, para você escolher:**

| opção | o que entra | custo |
|---|---|---|
| **A. nada de crime** (o que está feito) | o jogo segue focado em vida, escola, carreira, família e patrimônio | zero |
| **B. consequência leve** | pequenos deslizes na adolescência como **eventos com consequência** (ser pego colando, detenção, advertência), sem sistema de crime | baixo, cabe no motor de eventos atual |
| **C. sistema de crime** | área de crimes, polícia, julgamento, prisão com minijogo de fuga | alto, e muda o tom do jogo |

O mesmo vale para o **minijogo de ler livro página a página** (1:14): a referência o usa como fricção
deliberada. O BetLife resolve a leitura num clique, o que é mais respeitoso com o tempo do jogador.
**Mantive o clique único**; se você quiser a fricção, é um pedido de uma linha.

---

## 5. A lista de trabalho que sai daqui

Em ordem de retorno pelo esforço, só o que o seu §3 cobre:

| # | o que | de onde vem | tamanho |
|---|---|---|---|
| 1 | **Efeito como barra no modal de evento** | §2.2 | pequeno, alto retorno |
| 2 | **Popularidade e relação com professor** na tela de escola | 1:38 | pequeno |
| 3 | **Clubes escolares**, com recusa por atributo baixo | 4:28 | médio |
| 4 | **Consentimento dos pais** para atividades de menor | 2:42 | médio, muda a textura da infância |
| 5 | **Evento de ruptura de amizade** iniciado pelo outro | 3:22 | pequeno |
| 6 | **Carteira como pré-requisito** de mais coisas | 7:20 | pequeno |
| 7 | **Minijogo de exame de vista** (a infraestrutura já existe) | 2:10 | médio |
| 8 | **Artes marciais com faixas** | 2:33, 9:09 | médio |

Os itens 1, 2, 5 e 6 são os que mais aproximam a experiência sem mexer na arquitetura.
