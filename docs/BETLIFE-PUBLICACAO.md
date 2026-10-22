# BetLife — versão candidata à publicação

**Nada foi commitado, empurrado ou publicado.** Este documento descreve uma candidata **construída e
testada como site de verdade**, não um diff.

> **Para você conferir com as próprias mãos**, enquanto esta sessão estiver de pé:
> **candidata → <http://127.0.0.1:8101/web/>** · **produção (o que está no ar) → <http://127.0.0.1:8102/web/>**
> As duas são builds completos, com os três jogos. Abra o mesmo caminho nas duas e compare.

## Como a candidata foi montada

O Vercel constrói com `node scripts/build-web-games.mjs` e serve `web/`; `web/games/` é gerado e não
é versionado. Então o que está no ar é **o HEAD construído**, nada mais.

Para comparar sem adivinhar, montei três árvores e construí as três:

| árvore | o que é | onde |
|---|---|---|
| **PRODUÇÃO** | `git archive HEAD` + build | servida em `:8102` |
| **CANDIDATA** | HEAD + **só** as mudanças do BetLife e do mecanismo de sessão + build | servida em `:8101` |
| local | a árvore de trabalho inteira (inclui Poly Kart não commitado) | `:8099` |

**A candidata exclui o Poly Kart de propósito.** Ver "Risco 1".

---

## 1. Diferenças entre produção e candidata, medidas

Cada linha é uma prova de comportamento rodada **nas duas**, no mesmo navegador WebKit, com cliques
reais. Não é leitura de diff.

| prova | PRODUÇÃO (no ar) | CANDIDATA |
|---|---|---|
| Chirper · Post → onde para | **fica em `socialAccount`** ❌ | tela principal ✅ |
| Chirper · Post executa a ação | sim ✅ | sim ✅ |
| Chirper · Delete → onde para | **fica em `socialMedia`** ❌ | tela principal ✅ |
| Chirper · Delete remove a conta | sim ✅ | sim ✅ |
| Matrícula impossível | **8 cursos clicáveis; clicar NÃO FAZ NADA** ❌ | diz o motivo, sem cursos mortos ✅ |
| Onde o progresso é gravado | **`localStorage` (disco)** ❌ | `sessionStorage` (aba) ✅ |
| Guarda de sessão | **não existe** ❌ | existe ✅ |
| Fechar a aba e reabrir o site | **a vida antiga volta** ❌ | começa do zero ✅ |

E, chamando `lifeSummary()` direto nas duas árvores, numa vida sem nenhum emprego:

| | PRODUÇÃO | CANDIDATA |
|---|---|---|
| resumo de quem nunca trabalhou | `Cannot read properties of null (reading 'yearsWorked')` ❌ | `Career: Never worked` ✅ |

### Progressão (as correções das rodadas anteriores), medida em 30 vidas

| | PRODUÇÃO | CANDIDATA |
|---|---|---|
| vidas passivas que conseguem emprego | **0 / 30** | **20 / 30** |
| saldo final mediano (passivo) | **−$2.414.670** | **−$60.841** |
| expulsos de casa sem renda aos 24 | **25 / 25** | **0 / 25** |
| saldo mediano jogando ativamente | $1.112.645 | $1.169.947 |

---

## 2. Regras de sessão, no navegador — `tests/session-scope.mjs`, **37 de 37**

Rodado **contra a candidata**. "Fechar a aba" é um contexto novo que herda o `localStorage` (o disco)
e começa com `sessionStorage` vazio — que é o que o navegador faz. Recarregar não fecha a aba, e
testar com reload seria testar outra coisa.

| regra que você pediu | resultado |
|---|---|
| recarregar a página mantém a vida | ✅ mesma pessoa, mesma idade |
| voltar ao hub e entrar de novo cria vida nova | ✅ |
| **abrir outra aba inicia uma vida independente** | ✅ vidas diferentes; jogar numa não altera a outra; recarregar a aba B recupera a vida **da aba B** |
| fechar a aba encerra a sessão daquela vida | ✅ e **nada de progresso sobra no disco** |
| preferências permanecem | ✅ `betlife.web.setup`, `betlife.web.language` |
| recordes e ghosts do Poly Kart permanecem | ✅ sobrevivem ao fechar da aba e a entrar em outro jogo |

**O armazenamento do Poly Kart não foi alterado.** Ele só guarda melhores tempos e ghosts; não tem
partida em andamento para zerar, e nenhum arquivo dele foi tocado.

---

## 3. Verificações de publicação

| item | resultado |
|---|---|
| arquivos modificados e não rastreados | inventariados e classificados (seção 4) |
| dependências entre arquivos | fecho de `import`/`src`/`href` percorrido a partir das 4 entradas |
| build completo | `node scripts/build-web-games.mjs` → 3 jogos publicados, `games.json` escrito |
| referências quebradas | **0** na candidata (e 0 na produção, e 0 no local) |
| compatibilidade com o Arcade | hub + 3 jogos respondem **200**; `games.json` lista os três como jogáveis |
| alterações acidentais em outros jogos | Poly Kart **fora da candidata**; Flappy recebe só a guarda gerada, com `KEYS = []` (inócua) |
| rollback | ver seção 6 |

A única diferença da candidata fora do BetLife é a guarda de sessão gerada no `index.html` de cada
jogo e a limpeza de marcadores no hub. Para o Flappy a guarda é literalmente `KEYS = []`: entra e não
faz nada, porque ele não grava nada.

---

## 4. Arquivos necessários para publicar

**BetLife — 18 arquivos**

```
 M games/betlife/game.json                      sessionKeys
 M games/betlife/web/betlife.js                 volta à tela principal; matrícula relata recusa
 M games/betlife/web/betlife.css
 M games/betlife/web/game/save.js               progresso em sessionStorage + limpeza do disco
 M games/betlife/web/game/game-state.js         higherEducationBlock, offeredJob, contratação
 M games/betlife/web/game/summary.js            guarda que faltava em ribbon()
 M games/betlife/web/game/year.js               sair de casa exige emprego ou reserva
 M games/betlife/web/game/decisions/career.js   decisão friendJobOffer
 M games/betlife/web/ui/screens.js              telas de matrícula mostram o motivo
 M games/betlife/web/tests/{depth,life}.test.mjs  asserções que passavam sem testar
 ?? games/betlife/web/tests/{refusals,economy}.test.mjs
 ?? games/betlife/web/tests/{button-audit,full-lives,long-life,session-scope,returns-to-life}.mjs
```

**Mecanismo de sessão — 2 arquivos**

```
 M scripts/build-web-games.mjs   sessionGuard; limpa sessionStorage E localStorage
 M web/index.html                o hub limpa os marcadores ao carregar
```

**Documentação — 5** · `docs/BETLIFE-{REFERENCIAS,RODADA,SESSAO,PUBLICACAO}.md`,
`docs/arcade-session-audit.md`, `docs/betlife-capturas/`

**Infra — 1** · `.gitignore` (`node_modules/`, do Playwright)

**Fora da candidata:** `tools/serve.mjs` e `.claude/launch.json` são ferramenta de desenvolvimento,
não vão ao site. E os **24 caminhos do Poly Kart**.

---

## 5. Riscos

### Risco 1 — o Poly Kart não commitado (o maior)

A árvore de trabalho tem **24 caminhos do Poly Kart alterados e não commitados**: 1.633 linhas
inseridas, 1.554 removidas, 3 arquivos novos, 1 apagado. É uma reconstrução inteira de uma rodada
anterior.

**Um `git add -A` publicaria isso junto com o BetLife.** A candidata o exclui.

Para registro: o estado local do Poly Kart **passa nos próprios testes** (6 + 18 + 30 = 54
verificações). Não é trabalho quebrado — é trabalho que não foi testado nesta rodada e que você não
pediu para publicar. Publicá-lo é uma decisão separada.

### Risco 2 — quem já tem uma vida gravada no disco

O site no ar grava a vida em `localStorage` e nunca a apaga. Quem jogou lá tem uma vida no disco
agora. A candidata remove essa chave em toda gravação, leitura e limpeza (`dropLegacyDiskSave`), sem
tocar em nenhuma outra. **Efeito prático: na primeira visita à versão nova, a vida antiga do disco
some.** É o comportamento pedido, mas vale dizer em voz alta: é a perda de uma vida que ficou
gravada por causa do bug.

### Risco 3 — modo privado

Em janela privada o `sessionStorage` pode lançar. Todas as chamadas estão em `try/catch` e o jogo
segue em memória: a vida funciona enquanto a aba viver e não é gravada. Sem regressão — a produção
já se comportava assim.

### Risco 4 — a guarda nos jogos embutidos

Flappy e Poly Kart passam a receber a guarda gerada com `KEYS = []`. Não lê nem escreve nada além de
um marcador próprio em `sessionStorage`. Verificado: os recordes do Poly Kart sobrevivem ao fechar da
aba e a entrar em outro jogo.

---

## 6. Procedimento de publicação e rollback

**Já existe rede de segurança:** `~/arcade-pre-publicacao-20261021-1455.tar.gz` (2,0 MB, 52 caminhos)
com tudo que não está no Git neste momento.

### Publicar (quando você autorizar)

```bash
cd ~/Documents/Claude/Projects/"AP CS Arcade"

# 1. confirmar que nada do Poly Kart entra
git add games/betlife scripts/build-web-games.mjs web/index.html docs .gitignore
git status --short                      # a lista encenada NÃO pode conter "Poly Kart"

# 2. commit
git commit -m "fix(betlife): Chirper volta à tela principal, progresso por aba e as correções da auditoria"

# 3. empurrar — o Vercel constrói e publica sozinho
git push origin master
```

### Rollback

**Antes do push** — nada a desfazer: `git reset --soft HEAD~1` tira o commit e mantém os arquivos.

**Depois do push**, dois caminhos:

```bash
# A. reverter pelo Git (o Vercel reconstrói o estado anterior)
git revert --no-edit <sha-do-commit>
git push origin master

# B. painel do Vercel → Deployments → a implantação anterior → "Promote to Production"
#    (instantâneo; não li o painel para confirmar que está habilitado nesta conta)
```

O caminho A é o que eu garanto: é Git puro, e o Vercel reconstrói do commit revertido. O caminho B é
mais rápido, mas não o verifiquei.

### Como conferir que deu certo, depois de publicar

1. abrir o BetLife, jogar até uns 5 anos, **fechar a aba**, reabrir o site → deve começar do zero;
2. Chirper → **Post** → deve voltar à tela principal;
3. Chirper → **Delete Account** → confirmar → conta some e volta à tela principal;
4. abrir a tela de universidade já formado → deve **dizer o motivo**, não listar cursos mortos;
5. Poly Kart → os melhores tempos continuam lá.

---

## 7. Resultado dos testes na candidata

| suíte | verificações | resultado |
|---|---|---|
| 9 suítes unitárias (rodadas **dentro da árvore candidata**) | 68 | **68 ✅** |
| `session-scope.mjs` (Chirper + regras de sessão + outros jogos) | 37 | **37 ✅** |
| `full-lives.mjs` (vidas A–E, nascimento ao encerramento) | 43 | **43 ✅** |
| `long-life.mjs` (vida inteira, acúmulo de estado) | 14 | **14 ✅** |
| `button-audit.mjs` (cliques reais em todas as telas) | 1.103 cliques, 33 telas | **0 mortos, 0 erros ✅** |
| referências quebradas no site construído | — | **0** |

A auditoria de botões percorreu a candidata em 13 estágios de vida (9 por repetição de caminho, 4 por
deep-link), **1.103 cliques reais**, 33 telas distintas, **zero erro de JavaScript** e **zero botão
morto confirmado**. Os 2 suspeitos são o falso positivo conhecido do rastreador (o cartão pós-vida
é auto-respondido antes da medição), reclassificados pela própria segunda tentativa isolada.

Vida completa de exemplo, na candidata: *Ines Adeyemi, morreu aos 77 · escola aos 5 · formatura aos
18 · **1º emprego aos 22** · aposentadoria aos 65 · 170 entradas de diário.* A linha do primeiro
emprego é justamente a que a produção não consegue produzir.
