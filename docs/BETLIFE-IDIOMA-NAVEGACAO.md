# BetLife — idioma e navegação

Nada commitado, empurrado ou publicado. Só BetLife foi tocado.

---

## PROBLEMA 1 — o seletor de idioma

### Causa real

**Não existe nenhuma tradução no BetLife.** O seletor oferecia quatro idiomas, gravava a escolha em
`localStorage` e **esse valor nunca era lido por ninguém** — procurei no código inteiro:

```
betlife.js:182   localStorage.setItem('betlife.web.language', lang)   ← única ocorrência
```

Não há arquivo de tradução, catálogo, função `t()` nem nada parecido. A única consequência de
escolher português era um toast: *"BetLife text is available in English for now. Your choice was
saved."* Ou seja: o seletor **apresentava quatro idiomas como funcionais** quando nenhum além do
inglês existia.

### O tamanho real de traduzir

Medi o texto voltado ao jogador: **2.543 strings, ~16.436 palavras, em 45 arquivos.**

| natureza | palavras | strings |
|---|---|---|
| narrativa de eventos e decisões | 8.080 | 870 |
| interface (telas, botões, rótulos) | 3.275 | 506 |
| relatórios do motor (recusas, resultados) | 2.251 | 402 |
| dados do mundo (carreiras, atividades, lojas) | 1.653 | 520 |
| interações com pessoas | 1.177 | 229 |

E a estrutura torna o trabalho maior do que o número sugere: **542 textos de narrativa são estáticos,
mas 136 são funções com interpolação** (`(c) => \`${c.whoName} veio passar o fim de semana…\``), e
`ui/screens.js` sozinho tem **293 interpolações**. Não existe camada de apresentação onde interceptar:
cada string está embutida na lógica. Traduzir de verdade é um refactor de ~2.500 pontos em 45
arquivos — e um refactor desse tamanho invalida a base de testes que acabamos de construir.

**Não comecei esse refactor por conta própria.** É grande demais para eu decidir sozinho e devolver
meio verificado.

### O que fiz agora

A sua própria regra — *"se algum idioma não tiver tradução completa, não o apresente como
funcional"* — torna uma coisa obrigatória e imediata: **parar de oferecer idioma que não existe.**

`ui/modals.js` passou a ter uma fonte única da verdade:

```js
export const LANGUAGES = [
  { id: 'en', nome: 'English',    completo: true  },
  { id: 'pt', nome: 'Português',  completo: false },
  { id: 'es', nome: 'Español',    completo: false },
  { id: 'fr', nome: 'Français',   completo: false },
];
```

O cartão só lista o que está **completo**. Hoje, o jogador vê:

> **Welcome to BetLife!**
> BetLife is written in **English**.
> *Português, Español, Français: not translated yet.*

O toast enganoso saiu. E a escolha gravada **passou a ser lida** (`idiomaEscolhido()`): um `pt` que
tenha ficado no disco de uma versão antiga cai de volta para o idioma completo, em vez de fingir que
funciona. Quando uma tradução ficar pronta, basta virar `completo: true`.

**Verificado no navegador:** seletor mostra só `en` · nenhum toast enganoso · com `pt` gravado o
cartão volta para `en`. Captura: `docs/betlife-capturas/idioma-honesto.png`.

### Idiomas efetivamente suportados

**Inglês. Só.** É o que o jogo agora diz.

### A decisão que é sua

| opção | o que entra | tamanho |
|---|---|---|
| **A. como está** | o jogo é honesto: inglês, e diz isso | feito |
| **B. português completo** | camada de i18n + 16.4k palavras traduzidas + 136 funções interpoladas reescritas + toda a base de testes revalidada | rodada própria, grande |
| **C. português só na interface** | 3.275 palavras; menus e botões em português, narrativa em inglês | médio — **mas viola a sua própria regra**: seria apresentar o português como funcional sem estar |

Se escolher **B**, eu faria por camadas verificáveis — interface, relatórios do motor, dados do
mundo, narrativa — com o português só entrando no seletor na última.

---

## PROBLEMA 2 — ações que não voltam à tela principal

### Por que os testes anteriores não pegaram — você está certo

`button-audit.mjs` perguntava **"mudou alguma coisa?"**. Um botão que altera o personagem e deixa o
jogador parado numa tela secundária passava por ela sem uma reclamação. Foi por isso que ela deu
1.065 cliques "sem defeito" enquanto o jogo, em uso, prendia telas. Um botão responder ao clique não
diz nada sobre onde a navegação terminou — exatamente como você escreveu.

### O que tentei, e por que desfiz

`afterAction()` decide voltar à tela principal por uma **heurística**: "o diário cresceu?".

```js
if (state.timeline.length === journalBefore) return;   // não cresceu → fica parado
go('main');
```

Isso me pareceu frágil, e tentei substituir por algo aparentemente mais rigoroso: comparar uma
**impressão digital do personagem** (dinheiro, os quatro atributos, carreira, educação, proximidade
de cada pessoa, redes sociais, flags) antes e depois, voltando sempre que algo mudasse.

**Piorei o jogo, e a auditoria nova pegou.**

| | ações fora do destino |
|---|---|
| heurística do diário (o que está publicado) | **0 de 736** |
| "impressão digital" | **22 de 736** |

A causa: uma ação que concede uma **conquista** deixa o banner na fila (`state.pending`), e enquanto
a fila não esvazia a ação não terminou — então a verificação adiava, e a volta à vida só acontecia
quando o banner sumia sozinho, **três segundos depois**, num pulo de tela sem causa aparente para
quem está jogando. Tentei emendar guardando a impressão digital até a fila esvaziar; aí o `Scrap`
de um bem passou a prender o jogador numa tela de um bem que acabara de deixar de existir.

**Revertido.** A regra publicada é a certa, e agora está no código o motivo: *o diário cresce em toda
ação que o jogador entende como concluída, porque é ele que conta a história da vida — e é
exatamente esse o critério certo para devolver o jogador a ela.*

Isto é o valor da auditoria: ela existe há duas horas e o primeiro defeito que pegou foi meu.

### A auditoria que faltava — `tests/navigation-audit.mjs` (nova)

Ela afirma o **destino**, não a reação ao clique. Para cada ação: tela de origem, clique real,
estado antes e depois, cartão aberto ou não, e a tela em que terminou — comparados contra a regra:

```
Ação que mudou o personagem e não deixou cartão aberto  →  TELA PRINCIPAL
Abrir tela, consultar, configurar                        →  não devolve
Ação que pede mais escolhas                              →  fica no fluxo enquanto o cartão estiver aberto
```

```
736 cliques · 4 idades · 29 telas · 230 delas eram AÇÕES CONCLUÍDAS
fora do destino esperado: 0
```

Ações concluídas por tela de origem: `person:47 · jobs:46 · asset:18 · hr:14 · school:13 ·
partTimeJobs:12 · shop:11 · military:10 · dream:9 · socialMedia:9 · socialAccount:9 · occupation:6 ·
job:6 · tradeSchool:6 · education:6 · relationships:4 · identity:4`.

### Não consegui reproduzir o seu caso — e aqui está tudo que tentei

Isto precisa ser dito sem enfeite: **procurei o defeito e não o encontrei.**

| tentativa | resultado |
|---|---|
| auditoria por destino, 4 idades, 29 telas | 736 ações, **0 fora do destino** |
| jogar como gente: do zero, envelhecendo, entrando pelas seções | 3 "presos" que, conferidos, eram **imprecisão do meu seletor** |
| cada atividade, uma a uma, pelo rótulo, aos 27 | 9 de 9 voltam |
| **cada interação com pessoa, pelo caminho real**, 5 idades | **241 interações, 0 presas** |
| **as ações de bem e de trabalho, no SITE PUBLICADO × local** | Scrap, Drive, Maintenance, Work Harder: **voltam à vida nos dois** |

A última linha é a mais importante: testei contra o site que você usa, e as ações voltam.

### Uma pista falsa que persegui, e que vale registrar

Varri o código por funções que mudam o personagem sem chamar `addJournal` e achei 19 — entre elas
`scrap`, `drive`, `maintenance`, `workHarder`, `askForRaise`. Concluí que seriam o seu bug e **estava
errado**: quem escreve no diário é o *chamador* (`assetAction`, `job`), não essas funções. Medi no
site publicado antes de afirmar, e as quatro que consegui alcançar voltam à vida normalmente.

### E o site publicado? Conferi, com evidência

Você pediu para não culpar o cache sem prova. Medi:

| conferência | resultado |
|---|---|
| os 49 arquivos publicados × o meu build local | **49 de 49 byte a byte idênticos** (sha256) |
| `betlife.js` no ar contém `afterAction`? | **sim**, 3 ocorrências |
| service worker? | **nenhum** |
| cabeçalho de cache do Vercel | `public, max-age=0, must-revalidate` |

**O que está no ar é exatamente o que eu testo.**

### Mas achei um defeito real da minha publicação anterior

O `index.html` referencia `betlife.js?v=250` — **o único mecanismo** que força um navegador a buscar
o arquivo novo — e eu publiquei sem incrementá-lo:

```
antes (67c1f26): betlife.js?v=250
depois (e869760): betlife.js?v=250      ← idêntico
```

Com `must-revalidate` o navegador deveria buscar assim mesmo, mas depender disso é frágil. **É a
explicação mais provável do que você está vendo:** um navegador com `betlife.js?v=250` em cache
continua rodando o arquivo de setembro, onde o Chirper de fato não voltava.

**Corrigido na raiz:** o build carimba o número com o **hash do conteúdo**, automaticamente.

```
betlife.css?v=0427d46e03
betlife.js?v=38f3e0ee31
```

Verificado: muda quando o arquivo muda, volta ao mesmo valor quando o conteúdo volta.
**Limitação:** os módulos internos (`game/*.js`) são importados sem `?v=` e seguem dependendo do
`must-revalidate`; versioná-los exigiria reescrever todos os `import`.

---

## Arquivos alterados

| arquivo | o quê |
|---|---|
| `games/betlife/web/betlife.js` | `idiomaEscolhido()` lê a preferência; toast enganoso removido; o porquê da regra de navegação registrado no código |
| `games/betlife/web/ui/modals.js` | `LANGUAGES` como fonte única; o cartão só oferece o que está completo |
| `games/betlife/web/betlife.css` | estilo da nota "not translated yet" |
| `scripts/build-web-games.mjs` | `stampAssetVersion()` — cache-buster por hash de conteúdo |
| `games/betlife/web/tests/navigation-audit.mjs` | **novo** — auditoria por destino de ação |

Poly Kart, Flappy Bruh e os outros jogos: **nenhum arquivo tocado.** As regras de sessão e a
exportação de vidas antigas continuam como estavam, e foram reverificadas.

---

## Testes

| suíte | resultado |
|---|---|
| 9 suítes unitárias | **68 ✅** |
| `session-scope.mjs` — sessão, Chirper, vida antiga | **50 ✅** |
| `full-lives.mjs` — vidas A–E | **42 ✅** |
| `long-life.mjs` — vida inteira | **14 ✅** |
| `navigation-audit.mjs` — destino por ação | **736 ações, 0 fora do destino, 0 erros ✅** |
| interações com pessoa pelo caminho real | **241, 0 presas ✅** |

### Visual, no navegador — os dois comportamentos

Você pediu para não aceitar "corrigido" só porque teste automatizado passou. Abri no navegador e
vi acontecer:

- `docs/betlife-capturas/idioma-honesto.png` — o cartão dizendo "BetLife is written in English" e
  "Português, Español, Français: not translated yet".
- `docs/betlife-capturas/antes-acao-pessoa.png` → `depois-acao-volta-a-vida.png` — **Compliment** na
  tela de uma pessoa, e o jogo de volta na vida com o toast *"Maya was touched by your compliment"*
  e a linha nova no diário.
- **Scrap** na tela de um bem: cartão de confirmação "Scrapping pays only a tenth of the value" →
  confirmar → **volta à vida**, com o toast *"You scrapped the meridian roadster for $27 in parts"* e
  a linha no diário. É exatamente a ação que a minha tentativa de "endurecer" a regra tinha quebrado,
  e por isso vale como prova dos dois lados: do defeito que eu criei e da reversão que o desfez.
- **Cache-buster, ponta a ponta:** o `index.html` publicado carrega `betlife.js?v=071dfefb0b`, o
  hash do arquivo é `071dfefb0b`, e o servidor entrega 200 nessa URL. O número mudou sozinho quando
  revertí o arquivo — é o conteúdo que manda.

---

## Estado final da candidata

Com o código revertido, a auditoria de navegação rodou inteira nas quatro idades:

```
idade 10: 133 ações · fora do destino: 0
idade 19: 195 ações · fora do destino: 0
idade 30: 207 ações · fora do destino: 0
idade 55: 201 ações · fora do destino: 0

TOTAL: 736 cliques · 230 ações concluídas · fora do destino: 0 · erros de página: 0
```

---

## Limitações restantes

1. **Não reproduzi o problema 2**, nem local nem no site publicado. A causa mais provável que
   consegui demonstrar é o cache-buster que não foi incrementado na publicação anterior — corrigido
   na raiz. **Se voltar a acontecer depois da próxima publicação, me diga a ação e a tela exatas**,
   que eu vou direto nela.
5. **Tentei endurecer a regra de navegação e piorei; revertido.** A auditoria nova pegou (22 ações
   fora do destino contra 0 da regra atual). Fica o registro no código para ninguém repetir.
6. **`node --check` não valida um módulo ES.** Ele passou num arquivo que o navegador recusava. Os
   testes agora usam `import()` de verdade.
2. **Nenhum idioma além do inglês.** O jogo agora diz isso em vez de prometer quatro.
3. **Módulos internos sem versão na URL.** Dependem do `must-revalidate`.
4. **O cache-buster novo só terá efeito na próxima publicação** — que depende da sua autorização.
