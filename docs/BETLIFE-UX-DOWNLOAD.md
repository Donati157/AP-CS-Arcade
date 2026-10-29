# BetLife — o download, a morte, o idioma e a navegação

Nada commitado, empurrado ou publicado. Só BetLife foi tocado.

---

## 1. O download — a causa exata, e ela é minha

Você pediu para identificar a causa antes de mexer. Varri todo caminho capaz de disparar um
download no jogo:

```
game/save.js:55   URL.createObjectURL(new Blob([raw], { type: 'application/json' }))
game/save.js:57   a.href = url; a.download = nome
game/save.js:58   document.body.appendChild(a); a.click(); a.remove()
```

**Existe exatamente um**, e ele é chamado de um lugar só: `ofereceVidaAntiga()`, em `betlife.js`.
**Código meu**, escrito na rodada em que você pediu para não apagar vidas antigas em silêncio.

| pergunta | resposta |
|---|---|
| é disparado por um botão? | **sim** — só por clique, nunca sozinho |
| é disparado ao envelhecer, morrer ou começar outra vida? | **não**. Nenhum desses caminhos toca em download |
| então por que incomoda? | porque o cartão **bloqueava a entrada do jogo** e o botão **principal** era "Download it" |

Essa é a falha real: tecnicamente voluntário, na prática obrigatório. Eu li "ofereça uma forma de
exportar" e construí um diálogo de arquivo na porta de entrada de um simulador de vida. Errado.

### A correção

O cartão continua existindo — você pediu para não apagar dados em silêncio — mas inverteu de eixo:

> **An old saved life**
> BetLife keeps your progress in this tab now, so Antonia Reis, 41 will not be loaded again.
> Tap Start playing and it is cleared for good.
> **[ Start playing ]**  ← botão grande, azul, principal
> *Save a copy first (.json)* ← linha discreta, sublinhada, embaixo

Para isso, `confirm()` ganhou `opts.secondary`: a escolha marcada sai como link discreto em vez de
botão de peso igual. Serve a qualquer opção que não pode parecer o caminho esperado.

**Medido no navegador, com espião em `HTMLAnchorElement.click`:**

| | |
|---|---|
| abrir o jogo com vida antiga no disco | **0 downloads** |
| tocar em "Start playing" | **0 downloads**, vida antiga limpa, preferências mantidas |
| jogar, envelhecer 12 anos e recomeçar | **0 downloads** |
| morrer e percorrer o fluxo inteiro | **0 downloads** |
| pedir a cópia de propósito | 1 arquivo, com a vida de verdade dentro |

---

## 2. A morte — resumo visual, nova vida e saída para o Arcade

O que já existia: uma **lápide** desenhada, com faixa de encerramento ("Unlucky", "Wealthy"…), nome,
idade e epitáfio gerado da própria vida — *"Saoirse lived to the age of 27, worked 5 years, rising to
Mission Specialist, shared life with Ines, raised a child."* Depois dela, o cartão com as opções de
nova vida.

E existia uma tela de **resumo** mais rica — fatos, marcos, memória — que **só era alcançável pela
barra inferior**, e **não havia botão para o Arcade em lugar nenhum do fluxo de morte**.

### O que acrescentei

- No cartão pós-vida: **"See the whole life"** e **"← back to the Arcade"**.
- Na tela de resumo: **"← BACK TO THE ARCADE"**, ao lado de NEW LIFE e MAIN MENU.
- Uma ação `arcade` no jogo, que leva ao mesmo destino do link do topo.

O resumo, visto no navegador, traz: idade, local de nascimento, formação, carreira e empregador,
anos trabalhados, patrimônio, cônjuge, filhos, amigos feitos, bens — e a lista de marcos da vida
inteira, da formatura ao primeiro emprego ao nascimento do filho.

**Verificado clicando:** lápide → Continue → cartão com as cinco opções → "See the whole life" → tela
de resumo → "BACK TO THE ARCADE" → chegou em `/web/` (o hub).

---

## 3. O idioma

**Causa:** não existe tradução nenhuma no BetLife. O seletor oferecia quatro idiomas, gravava a
escolha e **esse valor nunca era lido por ninguém** — uma única ocorrência no código, a de escrita.

**Corrigido na rodada anterior, e mantido:** o cartão agora diz o que é verdade —

> **Welcome to BetLife!**
> BetLife is written in **English**.
> *Português, Español, Français: not translated yet.*

A preferência passou a ser lida de verdade, e um `pt` gravado por uma versão antiga cai de volta para
o idioma completo em vez de fingir que funciona. `LANGUAGES` é a fonte única: quando uma tradução
ficar pronta, basta virar `completo: true`.

**O que NÃO está feito, e é decisão sua:** traduzir. São **16.436 palavras em 45 arquivos**, das
quais 8.080 de narrativa, com **136 funções de texto interpolado** e 293 interpolações só em
`ui/screens.js`. Não há camada onde interceptar — cada string está embutida na lógica. É uma rodada
própria, e eu faria por camadas verificáveis (interface → relatórios → dados do mundo → narrativa),
com o português só entrando no seletor na última.

---

## 4. As ações que não voltam à tela principal

**Não reproduzi**, e já expliquei por quê no relatório anterior; o resumo:

| tentativa | resultado |
|---|---|
| auditoria por **destino** de ação, 4 idades, 29 telas | **736 ações, 0 fora do destino** |
| cada interação com pessoa, pelo caminho real, 5 idades | **241, 0 presas** |
| ações de bem e de trabalho, **no site publicado × local** | voltam à vida nos dois |

Duas coisas que vale repetir porque mudaram desde o primeiro relatório:

1. **Tentei endurecer a regra e piorei o jogo** (22 ações presas contra 0). A auditoria nova pegou,
   revertí, e o motivo ficou escrito no código.
2. **Achei um defeito real da publicação anterior:** o `betlife.js?v=250` não foi incrementado, e é
   o único mecanismo que força o navegador a buscar o arquivo novo. Um navegador com ele em cache
   segue rodando o arquivo de setembro — onde o Chirper de fato não voltava. Agora o build carimba o
   **hash do conteúdo** sozinho. **É a explicação mais provável do que você viu.**

---

## 5. Arquivos alterados

| arquivo | o quê |
|---|---|
| `games/betlife/web/betlife.js` | cartão da vida antiga invertido (jogar primeiro); ação `arcade`; `summary` e `arcade` no cartão pós-vida |
| `games/betlife/web/ui/modals.js` | `opts.secondary` em `confirm()`; "See the whole life" e "back to the Arcade" no pós-vida |
| `games/betlife/web/ui/screens.js` | botão do Arcade na tela de resumo |
| `games/betlife/web/betlife.css` | estilo da escolha secundária e do botão extra |
| `games/betlife/web/tests/session-scope.mjs` | +13 verificações de download e morte |

Poly Kart, Flappy Bruh e os outros jogos: **nenhum arquivo tocado.**

---

## 6. Testes

| suíte | resultado |
|---|---|
| 9 unitárias | **68 ✅** |
| `session-scope.mjs` — sessão, Chirper, idioma, **download**, **morte** | **63 ✅** |
| `full-lives.mjs` — vidas A–E | **42 ✅** |
| `long-life.mjs` — vida inteira | **14 ✅** |
| `navigation-audit.mjs` — destino por ação | **736 ações, 0 fora do destino, 0 erros ✅** |

A auditoria de navegação rodou de novo depois destas mudanças, para garantir que acrescentar botões
ao fluxo de morte não desarrumou nada:

```
idade 10: 133 ações · fora do destino: 0      idade 30: 207 ações · fora do destino: 0
idade 19: 195 ações · fora do destino: 0      idade 55: 201 ações · fora do destino: 0

TOTAL: 736 cliques · 230 ações concluídas · fora do destino: 0 · erros de página: 0
```

### No navegador, clicando

- Vida antiga no disco → cartão com **"Start playing"** grande e "Save a copy first (.json)" discreto.
- "Start playing" → **nenhum download**, disco limpo, jogo começa.
- Morte → lápide com nome, idade e epitáfio → Continue → cinco opções → "See the whole life" →
  resumo com fatos e marcos → "BACK TO THE ARCADE" → hub do Arcade.
- Em nenhum ponto do percurso o navegador baixou coisa alguma.

---

## 7. O que continua em aberto

1. **Nenhuma tradução.** O jogo agora diz isso em vez de prometer quatro idiomas. Traduzir é a
   decisão de escopo da seção 3.
2. **O problema das ações não foi reproduzido.** A causa mais provável que consegui demonstrar — o
   cache-buster — está corrigida, mas só terá efeito na próxima publicação.
3. **O cartão da vida antiga só aparece para quem já jogou na versão publicada.** Em instalação nova
   ele nunca surge. Se você quiser que ele suma de vez, é uma linha — mas aí a vida antiga seria
   apagada sem aviso, que é o oposto do que você pediu antes.
