# Chirper e progresso por aba — o que estava errado e onde

**Os dois comportamentos que você relatou são reais no site que está no ar. Nenhum dos dois é um bug
novo: os dois já estavam corrigidos na árvore de trabalho e nunca chegaram ao ar, porque todas as
rodadas anteriores terminaram com NÃO COMMIT / NÃO PUSH / NÃO DEPLOY.**

As capturas não chegaram junto com a mensagem (só o texto), mas as telas estão identificadas sem
ambiguidade: `socialMedia` (a lista de redes) e `socialAccount` (o Chirper, com Post e Delete
Account).

## 1. O diagnóstico, verificado no Git

O Vercel constrói o site com `node scripts/build-web-games.mjs` a partir do **código commitado** —
`web/games/` é gerado e não é versionado. Então o que está no ar é exatamente o HEAD, cujo último
commit a tocar o BetLife é de **21 de setembro**.

| | no ar (HEAD) | árvore de trabalho |
|---|---|---|
| `afterAction` (volta à tela principal depois de uma ação) | **não existe** | 3 ocorrências |
| `socialPost` | `report(...)` e **fica no Chirper** | volta à tela principal |
| `socialDelete` | vai para a **lista de redes**, não à principal | volta à tela principal |
| `sessionGuard` no build | **não existe** | existe |
| `sessionKeys` no manifesto | **ausente** | `["betlife.web.save"]` |
| onde o progresso é gravado | `localStorage`, **nunca limpo** | `sessionStorage` |

A última linha é a causa do item 2 do seu pedido: **no site no ar a vida fica gravada no disco e
nada a apaga**, então fechar a aba e voltar traz a vida antiga de volta. Não havia guarda nenhuma.

## 2. O que mudei agora

### 2.1 O progresso saiu do disco — `games/betlife/web/game/save.js`

A vida em andamento passou de `localStorage` para **`sessionStorage`**, que o navegador apaga sozinho
quando a aba fecha.

Antes, mesmo com a guarda, a vida ficava gravada no disco no intervalo entre fechar a aba e abrir o
site de novo, e dependia de a guarda rodar no carregamento seguinte para sumir. Qualquer falha dela
— HTML em cache sem a guarda, link direto para o arquivo do jogo, erro de script antes dela —
ressuscitava a vida antiga. Agora **não existe cópia persistente em momento nenhum**.

Continuar jogando ao navegar entre telas e ao recarregar segue funcionando: `sessionStorage`
sobrevive a tudo isso e só morre com a aba.

Acrescentei `dropLegacyDiskSave()`: toda gravação, leitura e limpeza remove de passagem a chave
antiga do `localStorage`. Quem já tem uma vida gravada no disco pelo site atual fica limpo na
primeira vez que abrir a versão nova — sem tocar em nenhuma outra chave.

### 2.2 A guarda limpa as duas áreas — `scripts/build-web-games.mjs`

```js
for (const key of KEYS) { sessionStorage.removeItem(key); localStorage.removeItem(key); }
```

O `sessionStorage` cobre o fechar da aba sozinho; a guarda agora cuida do caso **"voltou ao hub e
entrou de novo"**, e a passada no `localStorage` apaga o que ficou de versões anteriores.

### 2.3 Chirper

**Nenhuma alteração foi necessária.** O comportamento que você pediu já está correto na árvore de
trabalho desde a rodada do "voltar à tela da vida", e eu o medi clique a clique agora. O que falta é
publicar.

## 3. Decisões que você tomou nesta rodada

| pergunta | sua resposta | consequência |
|---|---|---|
| voltar ao hub e reentrar: preserva ou zera? | **zerar** | mantém a regra anterior; a guarda continua existindo exatamente para isso |
| recordes e ghosts do Poly Kart | **preservar** | **Poly Kart não foi tocado.** Ele só guarda melhores tempos e ghosts — não tem partida em andamento para zerar |

**Flappy Bruh não grava nada**, então já começa do zero sempre. Dos três jogos, só o BetLife tinha
progresso persistente.

## 4. Testes — `games/betlife/web/tests/session-scope.mjs`, **31 de 31**

Cliques reais do WebKit. "Fechar a aba" é simulado como o navegador faz: um contexto novo que herda o
`localStorage` (disco) e começa com `sessionStorage` vazio. Recarregar a página não fecha a aba, e
testar com reload seria testar a coisa errada.

| grupo | verificações |
|---|---|
| **Chirper** | a conta abre · Post volta à principal · Post entra no diário · Post não reinicia a vida · a conta continua existindo · Delete pede confirmação · a conta some · volta à principal · não reinicia a vida · **cancelar mantém a conta** · voltar funciona · voltar leva à lista · voltar não reinicia · sem erro de JS |
| **aba aberta** | jogou até alguns anos · navegar entre telas não perde progresso · recarregar recupera · **o progresso NÃO está em localStorage** · está em sessionStorage · as preferências continuam no disco · sem erro de JS |
| **aba fechada** | a vida anterior não volta · **nada de progresso sobrou no disco** · as preferências sobreviveram |
| **hub** | sair do Arcade e entrar de novo começa uma vida nova |
| **outros jogos** | Poly Kart carrega · **os recordes sobrevivem ao fechar da aba** · Flappy Bruh carrega · entrar em outro jogo não apaga os dados do Poly Kart |

### Regressão

| suíte | resultado |
|---|---|
| 9 suítes unitárias | **68 ✅** |
| `full-lives.mjs` (vidas A–E) | **43 ✅** |
| `long-life.mjs` (vida inteira) | **14 ✅** |
| `button-audit.mjs` | ver abaixo |

## 5. Arquivos alterados

| arquivo | o quê |
|---|---|
| `games/betlife/web/game/save.js` | progresso em `sessionStorage` + limpeza da chave antiga do disco |
| `scripts/build-web-games.mjs` | a guarda limpa `sessionStorage` **e** `localStorage` |
| `games/betlife/web/tests/session-scope.mjs` | **novo** — 31 verificações |
| `docs/BETLIFE-SESSAO.md` | este documento |

**Não toquei:** nenhum arquivo do Poly Kart, do Flappy Bruh, do shell do Arcade, nem do
JARVIS/SiriGPT (que ficou pausado, com o `INTEGRIDADE.md` preservado).

## 6. O que falta para isso chegar até você

Os dois problemas que você relatou só somem do site **com um commit e um push** — o Vercel constrói
a partir do código commitado, e o código commitado é de 21 de setembro. Tudo o que está descrito
aqui, mais as correções do BetLife da rodada anterior (matrícula silenciosa, resumo que quebrava,
oferta de emprego, dívida inescapável), está na árvore de trabalho sem commit.

**Não commitei nem publiquei por conta própria**, porque publicar é uma ação para fora e todas as
rodadas anteriores a proibiram explicitamente. É a sua decisão.
