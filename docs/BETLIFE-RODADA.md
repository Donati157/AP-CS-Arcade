# BetLife — auditoria, correções e vidas inteiras

Rodada completa no BetLife. **Sem commit, sem push, sem deploy.** Poly Kart, Flappy Bruh e os demais
jogos não foram tocados (verificado: nenhum arquivo deles alterado nesta data).

---

## 1. Análise dos dois vídeos, com timestamps

Está inteira em **[`docs/BETLIFE-REFERENCIAS.md`](BETLIFE-REFERENCIAS.md)**: 30 linhas de mecânica com
timestamp do vídeo 1, a anatomia da interface quadro a quadro das gravações locais, o que o BetLife já
faz, o que falta, e o que já é melhor que a referência.

**O que consegui e o que não consegui:**

| fonte | resultado |
|---|---|
| `youtu.be/_SIoanw3wMU` (16:18) | **transcrição completa**, 134 segmentos com timestamp |
| `youtu.be/--jk76eHbiI` (17:26) | **título, duração e descrição sim; transcrição NÃO** |
| `games/betlife/Betlife videos/` — **55 min de gravação de tela** | **vídeo quadro a quadro**, extraído com AVFoundation |

**O impedimento exato no vídeo 2.** Ele tem legenda automática em português
(`captionTracks: [{lang:"pt", kind:"asr"}]`), mas: a API `timedtext` responde **200 com 0 bytes** nos
quatro formatos; o botão "Mostrar transcrição" fica dentro de um contêiner `[hidden]` com caixa
**0×0**, inalcançável por coordenada ou DOM; forçar o painel a expandir renderiza só o esqueleto; e
`youtubei/v1/get_transcript` devolve **400 "Precondition check failed"** mesmo com os `params` tirados
do HTML da própria página. **Não inventei nada do conteúdo dele.** Se quiser que entre: me mande a
transcrição, ou grave a tela como fez com os outros quatro.

As **gravações locais estavam no repositório e não estavam sendo usadas** — são a melhor referência
que existe aqui, e foram o que mais rendeu.

---

## 2. Inventário do BetLife atual

Não é um protótipo. São **~7.500 linhas** de ES modules, mais uma versão Java legada em
`src/betlife/` que não é o que roda no Arcade.

| sistema | existe de verdade? | onde |
|---|---|---|
| entrada pelo Arcade, barra e volta | **sim** | `index.html` + shell do Arcade |
| criação de personagem (aleatória e customizada) | **sim** | `life-generator.js`, tela `newlife` |
| estado da vida, salvamento, reinício | **sim** | `game-state.js`, `save.js` |
| idade e progressão anual | **sim** | `year.js` |
| 4 atributos com registro de MOTIVO de cada mudança | **sim** | `stats.js` (`statLog`) |
| atividades por categoria, com idade mínima e retorno decrescente | **sim** | `activities.js` |
| relacionamentos, seções, ~45 interações por pessoa | **sim** | `people.js` |
| escola: fundamental → médio, notas, desempenho | **sim** | `education.js` |
| universidade, curso técnico, programas | **sim** | `education.js` |
| carreiras: requisitos, níveis, promoção, aumento, RH, militar, emprego dos sonhos | **sim** | `careers.js`, `career.js` |
| finanças: imposto por faixa, custo de vida, aluguel, filhos, juros | **sim** | `economy.js` |
| eventos e decisões por faixa etária — **365** no catálogo | **sim** | `events/`, `decisions/` |
| bens: comprar, vender, dirigir, manutenção, reparo, sucatear, presentear, reformar | **sim** | `assets.js` |
| pets com espécie e tempo de vida | **sim** | `pets.js` |
| redes sociais | **sim** | `game-state.js` |
| conquistas | **sim** | `badges.js` |
| mortalidade, causa de morte, resumo de vida | **sim** | `mortality.js`, `summary.js` |
| **continuar como filho** depois da morte | **sim** | `game-state.js` |
| ~40 telas + 8 tipos de modal | **sim** | `ui/screens.js`, `ui/modals.js` |

**Nada encontrado era "só interface".** Todo sistema listado tem lógica por trás.

---

## 3. Funcionalidades que já existiam e foram preservadas

Tudo acima. Três que valem destaque por serem **melhores que a referência**:

- **Retorno decrescente** (`diminished`): repetir a mesma ação no mesmo ano rende cada vez menos.
- **Economia anual real**: imposto progressivo, custo de vida proporcional à renda, contas de casa
  própria, custo por filho, juros sobre dívida, empréstimo estudantil que se quita sozinho.
- **`statLog`**: cada mudança de atributo guarda idade, valor antes, depois e **o motivo**.

---

## 4. Bugs encontrados, e a causa de cada um

### 4.1 Matrícula silenciosa — **corrigido**

`enrollUniversity`/`enrollTradeSchool` devolviam `false`, e o handler era `if (ok) { ... }`. Clicar num
curso quando não se podia matricular **não produzia absolutamente nada**: sem toast, sem motivo.

A tela oferecia **8 cursos + 3 técnicos** que o jogo ia recusar em silêncio, em qualquer idade testada.

**Causa:** o resto do jogo segue a convenção `{ ok, title, text }`, que `report()` mostra como toast —
`interactWith` até tem a recusa "Not Enough Money" escrita. Estes dois caminhos não seguiam.

**Correção:** `higherEducationBlock()` diz o motivo; as duas funções devolvem relatório; as telas
mostram *"Not available right now — You need to finish high school first."* em vez de listar cursos
mortos. Um diploma **não** bloqueia mais um curso técnico.

### 4.2 Resumo da vida quebrava para quem nunca trabalhou — **corrigido**

```
TypeError: null is not an object (evaluating 'career.yearsWorked')
    at game/summary.js:50
```

`careerSummary()` devolve `null` quando não houve nenhum emprego — e as duas linhas acima, **no mesmo
arquivo**, já testam `career` antes de usar. Na faixa do resumo faltava. **Toda vida que terminasse
sem emprego quebrava a tela final.**

### 4.3 Nenhum caminho do jogo contratava ninguém — **corrigido**

Toda contratação exigia abrir o quadro de vagas e se candidatar. Existiam `jobOfferFriend`,
`jobSearchTip`, `unemployedReferral` — **todos só texto**, nenhum contratava.

**Medido:** jogador que só aperta +Idade → **0 de 40 vidas com emprego**, dívida mediana **−$2.090.362**.

**Correção:** a decisão `friendJobOffer` oferece uma vaga concreta que o personagem **qualifica agora**
(`when` verifica antes de aparecer) e, aceita, contrata de verdade via `applyForCareer`, que já existia
completa. Entra pela parte de baixo da escada: indicação é pé na porta, não emprego dos sonhos.

**Depois:** **29 de 40** vidas passivas empregadas.

### 4.4 Expulso de casa aos 22 sem emprego — **corrigido**

`year.js` mandava todo mundo sair da casa dos pais aos 22 por não estar estudando — **inclusive quem
não tinha renda nenhuma**. $9.000/ano de aluguel contra $0, com **5% de juros compostos, sem piso**.

O rastro de uma vida passiva, medido ano a ano:

```
idade  emprego  renda   despesa    saldo
   22    não        0      9000       638
   26    não        0      9000    -36968
   35    não        0      9000   -162084
   60    não        0      9000   -878664     ← irrecuperável, e o jogo não avisa que é
```

Aos 40, já empregado, o jogador **ainda perdia dinheiro**: $11 mil de juros sobre $223 mil de dívida
contra $7 mil de folga. Armadilha matematicamente inescapável.

**Correção:** sai de casa quem tem emprego ou reserva para um ano de aluguel. Quem não tem continua
com os pais — que é o que acontece na vida real, e tira a dívida de inevitável.

| | antes | depois |
|---|---|---|
| vidas passivas com emprego | 0 / 40 | **29 / 40** |
| saldo final mediano (passivo) | −$2.090.362 | **−$82.621** |
| saldo final mediano (jogando ativamente) | $1.091.486 | **$1.175.421** |

### 4.5 Quatro bugs **do meu próprio auditor**, encontrados e corrigidos

Vale registrar porque quase viraram "defeitos" no relatório:

| falso positivo | causa |
|---|---|
| "Concert" e "Gift" mortos | o toast anterior, com **texto idêntico**, ainda estava na tela: nada "mudava" |
| "Volunteer" morto | eu lia `player.stats`, que **não existe** — os atributos ficam direto em `player` |
| "New Life" morto aos 68/80 | o cartão pós-vida era auto-respondido pelo meu próprio limpador antes da medição |
| "loja não avisa" | a ação é `buyConfirm`, não `buyItem`, e a recusa é **modal**, não toast |

Por isso o auditor agora **confirma todo veredito de morto numa segunda tentativa isolada**, em página
nova, sem estado herdado. Só é relatado o que morre duas vezes.

---

## 5. Auditoria de todos os botões

`tests/button-audit.mjs` — cada clique é um evento de entrada do WebKit (`page.mouse`), nunca um
dispatch sintético. Duas fases: varredura por **repetição de caminho** (para telas que dependem de
uma seleção) e cobertura por **deep-link** em quatro idades.

```
fase 1 — caminho:    9 idades (6, 10, 16, 19, 25, 35, 50, 68, 80)
fase 2 — deep-link:  4 idades × 28 telas

TOTAL: 1.100 cliques reais · 33 telas distintas
       ok 1.088 · MORTOS CONFIRMADOS 0 · ERRO JS 0
```

As 33 telas: `about, activities, activity, asset, assets, badges, careerHistory, dream, education,
finances, growing, hr, identity, job, jobs, main, menu, military, newlife, occupation, partTimeJobs,
person, petSource, pets, properties, relationships, school, shop, shopping, socialMedia, start,
tradeSchool, university`.

Um botão só conta como vivo se, depois do clique, mudou a tela, abriu/alterou um modal, apareceu um
toast, cresceu o diário **ou** mudou algo no estado. "Tem event listener" não conta.

---

## 6. Vidas completas — `tests/full-lives.mjs`, **43 de 43**

| vida | o que faz | resultado |
|---|---|---|
| **A** fluxo normal | nasce, cresce, escola, vida adulta, carreira, morre — sempre a **primeira** opção | ✅ 11 verificações |
| **B** escolhas diferentes | outra vida, sempre a **última** opção | ✅ 5 — vida materialmente diferente |
| **C** navegação intensiva | 4 rodadas abrindo e fechando tudo, envelhecendo no meio, + percursos de dois passos | ✅ 10 |
| **D** persistência | reload na sessão × sair do Arcade e voltar | ✅ 6 |
| **E** casos extremos | sem dinheiro, sem relacionamentos, limites de atributo, vida encerrada | ✅ 11 |

**Invariantes verificados ano a ano, não só no fim:** a idade nunca anda para trás · o diário nunca
encolhe · o dinheiro nunca deixa de ser número · nenhum atributo sai de 0–100 · um estágio de ensino
por vez · nunca na escola com diploma · nunca salário sem emprego (fora aposentadoria) · contagem de
pessoas nunca negativa.

Exemplo de vida A: *Clara Brooks, morreu aos 83 · escola aos 5 · formatura aos 18 · 211 entradas de
diário · 0 erros de JavaScript.*

---

## 7. Persistência e sessão do Arcade — ✅

| regra | resultado |
|---|---|
| reload **dentro** da sessão recupera a vida | ✅ mesma pessoa, mesma idade |
| sair para o Arcade e voltar **não** traz a vida anterior | ✅ sessão nova, sem vida |
| preferências do usuário continuam | ✅ |
| nenhuma chave de outro jogo apagada | ✅ |

O mecanismo já existia e está correto: `installSessionGuard` injeta, **só na cópia publicada**, um
marcador em `sessionStorage` que sobrevive ao reload e morre com a aba; a home do Arcade limpa os
marcadores ao carregar. Recordes do Poly Kart intocados.

---

## 8. Vida longa — `tests/long-life.mjs`, **14 de 14** (5 execuções)

§9 pede que uma vida longa continue tão funcional quanto uma recém-começada. Medido numa vida inteira
de 83 anos, no navegador:

```
idade  diário  nós  modal toast  ouvintes  timers  salvo(KB)  pessoas
    0       5   147      0     0        15       4        2.5        3
   25      48   231      0     0        15      70       16.8        7
   50     102   335      0     0        15     126       24.9       11
   83     195   477      0     0        15     197       37.6       15

tempo para envelhecer um ano: início 269 ms · fim 289 ms
```

**Ouvintes de evento: 15 no nascimento, 15 na morte.** Nenhum vazamento, nenhum modal preso, nenhum
toast acumulado, nenhuma lentidão.

A **fila de decisões** merece nota: duas execuções deste teste acusaram "acúmulo" ao ver 2 cartões
pendentes. Era fila normal drenando — um ano pode enfileirar uma decisão **e** uma conquista, e o
jogador responde um por vez. Medindo todo ano, em 5 execuções: **pico 3, zera em ~85% dos anos, e o
pico do último terço da vida nunca é maior que o do primeiro**. A asserção é que estava errada.

---

## 9. Qualidade visual

Comparei com as gravações. **A identidade já está certa e não precisa ser refeita.** A anatomia da
tela principal é a mesma da referência: cabeçalho vermelho com menu, marca, contador e pílula →
faixa do personagem com avatar, nome, bandeira, cargo e saldo em verde → **diário da vida como corpo
da tela** → navegação de 5 itens com o **+Age verde elevado no centro** → quatro barras de atributo
rotuladas com ícone e %. O padrão de linha (ícone · título azul · descrição cinza · `⋯`/`›`) atravessa
o jogo inteiro, que é exatamente o que impede a sensação de "botões genéricos".

O que melhorei: as telas de matrícula deixaram de listar opções mortas e passaram a **dizer o motivo**
numa seção própria.

**A diferença visual que resta é estrutural, e é decisão sua** (§11).

---

## 10. Arquivos alterados

**Corrigidos (4):**

| arquivo | o quê |
|---|---|
| `game/game-state.js` | `higherEducationBlock()`, matrículas devolvem relatório, `offeredJob()` + contratação por oferta |
| `game/summary.js` | guarda que faltava em `ribbon()` |
| `game/year.js` | sair de casa exige emprego ou reserva |
| `game/decisions/career.js` | decisão `friendJobOffer`, que contrata de verdade |
| `ui/screens.js` | telas de universidade e técnico mostram o motivo da recusa |

**Testes novos (5):** `refusals.test.mjs` (9) · `economy.test.mjs` (9, inclui decaimento por
repetição) · `button-audit.mjs` (1.100 cliques) · `full-lives.mjs` (43) · `long-life.mjs` (14).

**Testes ajustados (2):** `depth.test.mjs` e `life.test.mjs` — `assert.ok(enrollUniversity(...))`
passava até para uma recusa, porque um objeto é truthy. Agora checam `.ok`.

**Outros:** `docs/BETLIFE-REFERENCIAS.md`, `docs/BETLIFE-RODADA.md`, `tools/serve.mjs` (servidor
estático sem dependências, para rodar o Arcade local), `.gitignore` (`node_modules/`, do Playwright).

**Nenhuma alteração no shell do Arcade** foi necessária.

---

## 11. Bugs ainda abertos e decisões que são suas

**Nenhum bug crítico aberto.** O que resta:

| # | item | severidade | nota |
|---|---|---|---|
| 1 | vidas passivas extremas ainda chegam a −$1,5 mi | **baixa** | mediana agora é −$82 mil; o mínimo vem de quem compra casa e perde o emprego. Um mecanismo de falência resolveria — é balanceamento, não defeito |
| 2 | `?seed=&age=` sem hash deixa na tela `start` | **cosmética, só dev** | a fixture monta o estado mas não muda a tela; `#main` resolve |
| 3 | `tests/screenshot-all.sh` captura antes do modal montar | **cosmética, só dev** | os fixtures de modal funcionam (verifiquei os 6); falta esperar o temporizador de montagem |

**Decisões de escopo — não inventei nenhuma:**

| | alternativas |
|---|---|
| **Crime.** O vídeo 1 é, metade do tempo, uma run de assassino: furto, roubo, prisão, fuga, ataque com escolha de golpe. **Não implementei.** O seu §3 não lista crime, e o BetLife é publicado num site de trabalho escolar. | **A.** nada (como está) · **B.** deslizes leves na adolescência como eventos com consequência · **C.** sistema de crime completo |
| **Cartão por evento vs diário.** A referência mostra um cartão para cada acontecimento, com o efeito em barra ("Relationship" + barra verde). O BetLife junta tudo no diário e mostra cartão só nas decisões. | **A.** manter o diário (menos toques, mais legível) · **B.** cartão para eventos marcantes, com barra de efeito · **C.** cartão para tudo, como a referência |
| **Minijogo de ler livro** página a página (1:14 do vídeo). O BetLife resolve num clique. | **A.** manter o clique único · **B.** adicionar a fricção |

**As 8 lacunas da referência** (clubes escolares com recusa, consentimento dos pais para atividades de
menor, popularidade e relação com professor, artes marciais com faixas, minijogo de exame de vista,
evento de ruptura de amizade, carteira como pré-requisito) estão listadas com tamanho estimado no §5
de `BETLIFE-REFERENCIAS.md`. **Nenhuma é bloqueante.** As quatro primeiras são as de melhor retorno.

---

## 12. Os outros jogos foram preservados

```
nenhum arquivo de games/Poly Kart/ ou games/flappy-bruh/ alterado nesta data
web/games.json: betlife, flappy-bruh, poly-kart — os três publicados e roteados
nenhuma chave de localStorage de outro jogo tocada (verificado na Vida D)
```

---

## Resumo dos testes

| suíte | verificações | resultado |
|---|---|---|
| 9 suítes unitárias | 68 | **68 ✅** |
| `button-audit.mjs` | 1.100 cliques reais, 33 telas | **0 mortos, 0 erros ✅** |
| `full-lives.mjs` (vidas A–E) | 43 × 3 execuções | **43 ✅ nas três** |
| `long-life.mjs` (vida inteira) | 14 × 5 execuções | **14 ✅ nas cinco** |
| **total** | **125 verificações + 1.100 cliques** | **tudo passa** |

As duas suítes de navegador jogam vidas **aleatórias**, então rodei cada uma várias vezes: nenhuma
intermitência. A fila de decisões fica em **pico 3** e zera em ~85% dos anos, em todas as execuções.
