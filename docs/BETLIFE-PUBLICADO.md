# BetLife publicado — o que foi ao ar e como foi verificado

**Link:** <https://ap-cs-arcade.vercel.app/games/betlife/>
**Commit:** `e869760` · **Branch:** `main` · **Deployment:** `success`, 22/10/2026 12:22 UTC

---

## 1. Uma parada antes de publicar, e por quê

Ao conferir o HEAD (item 7), achei algo que mudava o plano inteiro:

```
branch em que eu estava : poly-kart-fidelity-lab
branch que o site publica: main
```

A branch de trabalho era **do Poly Kart**, e tinha um commit **não publicado**:
`39abab0 feat(poly-kart): the fidelity lab` — **389 arquivos, 72.981 linhas inseridas**, incluindo
uma pasta `poly-kart-fidelity-lab/` inteira.

Commitar o BetLife ali e empurrar teria publicado o trabalho do seu amigo junto, sem ele ter pedido.

**Como resolvi:** criei um *worktree* separado a partir de `origin/main` — não da branch em que eu
estava — e trabalhei só nele:

```
git worktree add <dir> -b betlife-publicacao origin/main
git merge-base --is-ancestor 39abab0 HEAD   →  falso  ✅ o commit do Poly Kart não é ancestral
```

Com isso o commit do Poly Kart **não tinha como vazar**: ele não está na história da branch que
empurrei. Verificado de novo depois do push: `39abab0` continua só local, e os 24 arquivos do Poly
Kart continuam não commitados exatamente como estavam.

---

## 2. O que foi publicado — 34 arquivos, 0 de outro jogo

| grupo | arquivos |
|---|---|
| BetLife (fonte, manifesto, testes) | 18 |
| mecanismo de sessão | 2 — `scripts/build-web-games.mjs`, `web/index.html` |
| documentação | 13 — 5 relatórios + 8 capturas |
| infra | 1 — `.gitignore` (`node_modules/`) |

Conferido antes do commit: **0 caminhos contendo "Poly", 0 contendo "Flappy", 0 fora do escopo
autorizado.** `tools/serve.mjs` e `.claude/` ficaram de fora — são ferramenta de desenvolvimento, não
são necessários ao site.

---

## 3. A mudança que o seu item 5 exigiu, feita antes de publicar

Você pediu para **não apagar as vidas antigas em silêncio** e oferecer exportação. A versão que eu
tinha preparado **apagava** — em duas frentes, e as duas foram desfeitas:

1. `save.js` removia a chave antiga de passagem em toda gravação e leitura;
2. a guarda de sessão varria o `localStorage`, e **apagava a vida antes de o jogo subir** — o aviso
   nunca chegaria a aparecer.

Agora, ao abrir o BetLife com uma vida da versão anterior no disco, o jogo mostra um cartão:

> **A life from the old version**
> BetLife now keeps your progress in this tab only, so this saved life will not be loaded again.
> You can download it first — it is a plain JSON file you can keep.
> **Character:** Antonia Reis, 41 anos · **Size:** 0,2 KB
> **[ Download it ]  [ Discard it ]**

"Download it" entrega `betlife-antonia-reis.json` com a vida inteira. **Só depois da escolha** a
chave sai do disco. Se o download falhar, nada é removido. O aviso não se repete.

A guarda de sessão passou a **não tocar no `localStorage`**, de propósito — está escrito no código
por quê.

---

## 4. Testes no site real — depois de publicado

| suíte | onde | resultado |
|---|---|---|
| sessão + Chirper + vida antiga | **<https://ap-cs-arcade.vercel.app/>** | **50 ✅** |
| vidas A–E, nascimento ao encerramento | **site real** | **42 ✅** |
| auditoria de botões (1.065 cliques, 30 telas, 13 idades) | **site real** | **0 mortos, 0 erros ✅** |
| unitárias (na árvore publicada) | worktree de publicação | **68 ✅** |
| vida longa, acúmulo de estado | build de publicação | **14 ✅** |
| referências quebradas | build de publicação | **0** |

A auditoria de botões rodou **contra o site publicado**: 9 idades por repetição de caminho mais 4 por
deep-link, **1.065 cliques reais**, 30 telas distintas, **zero erro de página** e **zero botão morto
confirmado**.

### Conferido a olho, no site no ar

- **Chirper → Post** → voltou à tela principal, com o toast *"You posted on Chirper and picked up 46
  new followers"* e a linha no diário. (A tela do Chirper mostra Saoirse Nguyen, Mission Specialist,
  1.240 seguidores, 12 posts.)
- **Universidade já formado** → *"Not available right now — You already have a degree."* em vez de
  oito cursos que não faziam nada.
- **Hub** → os três jogos aparecem e abrem.

### As regras de sessão, no site real

| regra | resultado |
|---|---|
| recarregar a aba preserva a vida | ✅ |
| sair para o Arcade e entrar de novo começa uma vida nova | ✅ |
| outra aba começa uma vida independente | ✅ jogar numa não altera a outra |
| fechar a aba encerra aquela vida | ✅ e nada sobra no disco |
| preferências permanecem | ✅ |
| recordes e ghosts do Poly Kart permanecem | ✅ sobrevivem ao fechar da aba e a entrar em outro jogo |

---

## 5. Um defeito do meu teste, achado no site real

A primeira execução contra produção acusou *"sair do Arcade e voltar NÃO traz a vida anterior —
voltou Arjun Haddad aos 5"*. **Não era defeito do jogo.**

`full-lives.mjs` derivava a URL do hub com `BASE.replace(/web\/games\/betlife\/$/, 'web/')` — um
padrão que só casa com o layout **local**. No site publicado o caminho é `/games/betlife/`, a regex
não casava, e "voltar ao Arcade" ia para o próprio jogo: o marcador nunca era limpo. Corrigido para
tirar `games/<jogo>/` do fim, que funciona nos dois. Reexecutado: **42 de 42**.

A suíte de sessão já passava porque recebe a raiz do Arcade como argumento.

---

## 6. O que ficou de fora, e continua intacto

- **Poly Kart:** nenhum arquivo tocado. O commit `39abab0` e os 24 arquivos não commitados continuam
  só na sua máquina, na branch `poly-kart-fidelity-lab`, exatamente como estavam.
- **Flappy Bruh:** nenhum arquivo tocado. Recebe só a guarda gerada no build, com `KEYS = []` — entra
  e não faz nada, porque ele não grava nada.
- **JARVIS/SiriGPT:** não tocado nesta rodada.

---

## 7. Rollback, se precisar

```bash
cd ~/Documents/Claude/Projects/"AP CS Arcade"
git fetch origin
git revert --no-edit e869760
git push origin HEAD:main          # o Vercel reconstrói o estado anterior sozinho
```

Alternativa mais rápida: painel do Vercel → Deployments → a implantação de `67c1f26` → *Promote to
Production*. Não abri o painel, então não confirmo que está habilitado.

Rede de segurança de antes da publicação: `~/arcade-pre-publicacao-20261021-1455.tar.gz`.

---

## 8. Problemas restantes

**Nenhum bloqueante.** O que continua aberto, tudo de severidade baixa e já documentado:

| item | nota |
|---|---|
| vidas passivas extremas chegam a −$1,5 mi | mediana agora é −$60 mil; vem de quem compra casa e perde o emprego. É balanceamento |
| 2 "suspeitos de morto" na auditoria de botões | o mesmo falso positivo conhecido do rastreador (cartão pós-vida auto-respondido), reclassificado pela segunda tentativa isolada |
| as 8 lacunas da referência | clubes escolares, consentimento dos pais, popularidade, artes marciais, minijogo de exame de vista — listadas com tamanho em `BETLIFE-REFERENCIAS.md` |
| crime, e cartão-por-evento | decisões de escopo suas, descritas com alternativas em `BETLIFE-RODADA.md` |

**A branch local `poly-kart-fidelity-lab` ainda tem as alterações do BetLife na árvore de trabalho**,
agora duplicadas na história da `main`. Não mexi nela. Se quiser, dá para alinhá-la com a `main` numa
próxima rodada — mas isso toca a branch do seu amigo, então não fiz por conta própria.
