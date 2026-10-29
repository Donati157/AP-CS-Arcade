# BetLife — localização pt-BR

O que esta rodada fez, como foi medido e o que ainda não está certo.

Escopo: **somente** `games/betlife/`. Nada foi tocado em Poly Kart, Flappy Bruh ou nos outros jogos.
Nenhum commit, push ou deploy foi feito.

## 1. O sistema

A tradução é centralizada em `games/betlife/web/game/i18n/`. Nenhum arquivo do jogo pergunta em que
idioma está: todos chamam `t()` e seguem.

```
game/i18n/core.js          registro de catálogos, idioma corrente, t(texto, vars)
game/i18n/index.js         ponto único de entrada: registra os catálogos, expõe LANGUAGES
game/i18n/catalogo-pt.js   junta os nove catálogos num objeto (usado pelas auditorias)
game/i18n/pt/*.js          os catálogos
```

**A chave é a própria frase em inglês.** Não há inventário de chaves (`menu.title`, `career.hired`).
Isso tem duas consequências que valem mais que a elegância de um identificador:

- uma frase sem tradução aparece em inglês, visível, em vez de aparecer como `career.hired.v2`;
- o inglês continua sendo o original, literalmente: com o catálogo vazio, `t()` devolve o argumento.

### Onde a tradução entra

Em **fronteiras**, não em 2.300 pontos espalhados:

- `ui/render.js` — as oito funções por onde passa todo rótulo de interface (`row`, `section`,
  `infoRow`, `titleBar`, `meter`, `note`, `empty`, `footerBar`);
- `game/journal.js` — `addJournal` e `pushModal`, por onde passa toda narrativa antes de virar
  linha do diário ou cartão na tela.

Frases com nome ou valor interpolado não podem passar por fronteira (chegariam já montadas), então
essas foram convertidas na origem para `t('… {name} …', { name })`.

### O que NUNCA é traduzido

`data-action`, `data-stat`, `data-target` e os valores gerados. O `data-stat` em especial é chave de
CSS e de teste — traduzi-lo quebraria as barras de atributo em silêncio.

E os **dados** do jogo (`career.careerId`, `e.degree`, `item.name`, `p.role`) continuam em inglês no
estado, porque são comparados por string e vão gravados no save; a tradução acontece só na exibição.
É isso que mantém uma vida salva em inglês abrindo em português — provado em `tests/save-idioma.mjs`.

## 2. Quanto foi traduzido

**2.363 frases**, em nove catálogos (2.329 chaves distintas depois de resolver as repetições):

| arquivo | frases | o que cobre |
| --- | ---: | --- |
| `pt/resto.js` | 561 | avisos, erros, atividades, conquistas, faixas de idade, interações |
| `pt/dados.js` | 435 | 43 carreiras, 152 cargos, 30 bens, cursos, papéis familiares, 24 profissões, países |
| `pt/decisoes.js` | 348 | título, enunciado, cada escolha e cada desfecho das decisões |
| `pt/sentencas.js` | 264 | as frases com nome, valor ou número interpolado |
| `pt/frases.js` | 244 | a interface fixa |
| `pt/eventos-vida.js` | 186 | os eventos que acontecem sozinhos ao envelhecer |
| `pt/eventos.js` | 131 | eventos e decisões da primeira passagem |
| `pt/narrativa.js` | 98 | narrativa estática |
| `pt/pessoas.js` | 96 | interações com as pessoas |

O código manda **490 chaves** para `t()` explicitamente; as outras ~1.840 chegam pela fronteira de
`render.js` e `journal.js`, sem que o arquivo que as escreveu precise saber que existe tradução.

Cobre menus, botões, atributos, escola, universidade, profissões, relacionamentos, atividades,
eventos, decisões, notificações, mensagens de erro, finanças, Chirper, morte e resumo da vida —
inclusive o texto dinâmico, não só a interface fixa.

## 3. Como foi medido

Ferramentas separadas para cada jeito de o inglês voltar, e seis invariantes que travam o resultado.

| ferramenta | o que olha |
| --- | --- |
| `tests/i18n-chaves.mjs` | o código: toda chave que vai para `t()` tem tradução? |
| `tests/i18n-estaticas.mjs` | o código: todo literal que chega à tela sem `t()` explícito tem tradução? |
| `tests/leak-audit.mjs` | a tela renderizada: 192 telas e modais, procurando inglês |
| `tests/i18n.test.mjs` | seis invariantes, no `node --test` |
| `tests/idioma.mjs` | WebKit: aplica na hora, persiste por recarga / vida nova / reentrada |
| `tests/save-idioma.mjs` | WebKit: a mesma vida nos dois idiomas dá os mesmos números |

### As seis invariantes de `i18n.test.mjs`

1. toda chave de `t()` tem tradução em pt;
2. todo literal estático que chega à tela tem tradução — ou está na lista de nomes próprios;
3. nenhum módulo chama `t()` sem importar `t`;
4. não sobra prosa inglesa em lugar nenhum do código (nem em ternário, nem dentro de `${}`);
5. nenhuma chave tem duas traduções diferentes em catálogos diferentes;
6. nenhum nó de texto dentro de HTML cru fica sem tradução.

Cada uma dessas invariantes existe porque custou defeito real nesta rodada:

- **(3)** um codemod converteu as frases de um arquivo e não inseriu o import. O erro era
  `ReferenceError: t is not defined`, em tempo de execução, e `node --check` não pega — ele nem
  valida módulo ES.
- **(5)** uma entrada tardia `'Age': 'Envelhecer'` sobrescreveu em silêncio o `'Age': 'Idade'` que já
  existia. O efeito não foi só textual: a palavra maior estourou o botão redondo de envelhecer.
- **(6)** foi o maior ponto cego. As outras invariantes olham literais de string, mas metade da
  interface é HTML montado em template — `<button ...>Start a custom life!</button>` — e ali o texto
  não é um literal separado. Essa invariante sozinha achou 26 frases, entre elas o formulário inteiro
  de vida personalizada e os botões do cartão de morte.

### A queda dos vazamentos

Frases distintas em inglês vistas na tela renderizada, ao longo da rodada:

```
306 → 285 → 213 → 128 → 103 → 13 → 6 → 2 → 0
```

De 2.433 ocorrências para **zero**, em 192 telas e modais, sem erro de página.

A auditoria de tela chegou a zero antes do fim do trabalho, e isso é a parte interessante: ela
*amostra* telas, então zero ali significa "não vi inglês nas telas que abri", não "não há inglês".
Foi a análise estática que continuou achando coisa depois — faixa do cartão, cartão de morte, campos
do resumo da vida, o formulário de vida personalizada inteiro. Jogar uma vida inteira até a morte,
com o olho no texto a cada ano, achou mais três. As três ferramentas se complementam; nenhuma delas
sozinha teria fechado isso.

### A matriz: a mesma suíte, os dois idiomas

Requisito 8 e requisito 10 na mesma medida. Cada suíte roda duas vezes, pelo mesmo caminho de
código, mudando só o idioma — se a tradução tivesse quebrado a lógica, uma das colunas divergiria.

| suíte | inglês | português |
| --- | --- | --- |
| `full-lives` (5 vidas inteiras, do nascimento à morte) | 42/42 | 42/42 |
| `long-life` (uma vida até o fim, medindo fila e desempenho) | 14/14 | 14/14 |
| `navigation-audit` (740 cliques, destino de cada ação) | 0 fora do destino · 0 erro | 0 fora do destino · 0 erro |
| `button-audit` (1.076 cliques reais, 30 telas) | 1.063 ok · 2 suspeitos · 0 erro JS | 1.063 ok · 2 suspeitos · 0 erro JS |
| `session-scope` (aba, morte, saída ao Arcade, download) | 63/63 | — (não depende de idioma) |

Os números batem exatamente — inclusive a contagem de cliques e os dois "suspeitos" conhecidos, que
são falsos positivos do rastreador (`newLife` a partir do menu funciona isolado). Duas colunas
idênticas é a evidência que o requisito 10 pedia: a tradução não mexeu no comportamento.

E em cada idioma as decisões, empregos, relacionamentos, eventos e o desfecho foram exercitados de
verdade — `full-lives` joga a vida clicando, não simulando.

### Regressão desta rodada

| verificação | inglês | português |
| --- | --- | --- |
| 83 testes unitários (9 invariantes de i18n + 6 de moeda) | 83/83 | 83/83 |
| `full-lives` — 5 vidas inteiras, clicando | 42/42 | 42/42 |
| `long-life` — vida ao fim, fila e desempenho | 14/14 | 14/14 |
| `navigation-audit` — 740 cliques, destino de cada ação | 0 fora do destino · 0 erro | 0 fora do destino · 0 erro |
| `button-audit` — todos os botões de 30+ telas | 0 erro JS | 0 erro JS |
| `session-scope` — aba, morte, Arcade, download | 63/63 | — |
| `leak-audit` — 192 telas e modais | — | 0 inglês |
| `idioma` — aplica na hora e persiste | 13/13 | 13/13 |
| `save-idioma` — 14 campos de estado + 5 anos | 26/26 | 26/26 |
| `genero-vida` — 4 vidas, 1.196 linhas de diário | — | 16/16, zero concordância errada |
| `moeda` — formato e valor guardado | 6/6 | 6/6 |

O `navigation-audit` bate exatamente nos dois idiomas: 740 cliques, 740 ações medidas, 230
concluídas, zero fora do destino. É a evidência de que a tradução, o gênero e a moeda não mexeram em
comportamento. O `button-audit` varia alguns cliques entre as execuções porque é um rastreador e a
vida sorteada muda de uma para outra — os dois fecham com zero erro de JavaScript.

## 4. O que fica em inglês, e por quê

O varredor de prosa ainda acusa 108 cadeias. Todas foram classificadas à mão, e as listas estão
dentro de `tests/i18n.test.mjs` para que a classificação seja verificável e não uma promessa:

- **nomes próprios do mundo do jogo** — empregadores (`Harborview Fire Department`,
  `Cedar Grove Hospital`), escolas (`Harbor Point High School`), cidades (`Mexico City`),
  endereços (`14 Quiet Meadow Ln`), as redes fictícias (`Chirper`, `SoundWave`) e o nome do jogo.
  Não se traduzem, como não se traduz "Harvard";
- **motivos de `statLog`** — `'work stress'`, `'living costs'`, `'name change'`. Esses nunca chegam à
  tela: existem só para `betlife.statLog()` no console. Traduzi-los seria trabalho sem efeito;
- **dados de SVG, classes de CSS, chaves de armazenamento** — `M-40 150L150 -40l38 38L-2 188z`,
  `bl-btn bl-btn-blue`, `betlife.web.save`;
- **uma mensagem de `throw`** para o desenvolvedor (`event without id`).

Essa é exatamente a distinção que a auditoria pedia: nome próprio não é frase que escapou.

## 5. Defeitos que a tradução revelou

Não foram introduzidos por ela — estavam lá, e só apareceram quando o texto mudou de tamanho ou
quando passou a ser necessário olhar cada frase:

1. **Aumento salarial metade em inglês.** `applyRaise` concatenava `"Your salary is now $X."` à
   frase traduzida. Virava "Você pediu aumento e conseguiu. Your salary is now $227,920."
2. **`aria-label` em inglês.** O auditor de vazamento lia `innerText`; os botões Envelhecer e
   "voltar um ano" têm o rótulo só em `aria-label`, e passaram despercebidos. O auditor agora lê
   `aria-label`, `title` e `placeholder`.
3. **O cabeçalho fixo.** O link `← Back to Arcade` mora em `index.html`, fora do render, e por isso
   era o único texto em inglês que sobrava na tela. Agora `traduzCasca()` o alcança na subida e a
   cada troca de idioma.
4. **Valores de dado passados crus.** Várias chaves interpoladas recebiam `next.title`, `e.degree`,
   `a.name.toLowerCase()` sem passar por `t()`: "te promoveu a Battalion Chief", "Quebrou e precisa
   de reparos: harbor sedan".
5. **O fixture de teste furava a fronteira.** Os modais de teste em `betlife.js` iam direto para
   `state.pending` em vez de `pushModal`, e por isso nunca eram traduzidos — e, pior, testavam um
   caminho que o jogo real não usa.
6. **A faixa do cartão.** `pushModal` deliberadamente não traduz `band`, porque é chave de
   agrupamento no estado — mas a faixa também é o rótulo que aparece no topo do cartão. Ficava
   "Health" em cima de uma decisão inteiramente em português. A tradução passou para a exibição,
   em `modals.js`, e o valor no estado seguiu em inglês.
7. **Um teste que falhava sozinho.** `full-lives.mjs` comparava duas vidas sorteadas e exigia que
   pelo menos 2 de 4 eixos diferissem (profissão, idade da morte, dinheiro, formatura). Três dos
   quatro podiam coincidir por acaso, e o teste acusava falha sem nada ter quebrado — o que é pior
   que inútil numa rodada cujo objetivo é provar que a tradução não quebrou nada. Entraram mais dois
   eixos (tamanho do diário e cargo), que duas vidas aleatórias praticamente nunca igualam. O
   defeito é anterior a esta rodada; só apareceu porque a suíte passou a rodar duas vezes.
8. **Valores de dado em frases compostas.** O resumo da vida montava
   `${career.best.title} at ${career.best.employer}` e os pertences com `a.name` cru: "Head of
   Analytics at Bluefield Analytics", "Harbor Sedan, Studio Apartment".

## 6. O que ainda não está certo

- **Concordância de gênero com nomes de pessoa.** "Freya foi promovido no trabalho" — o jogo sabe o
  gênero (`p.gender`), mas a frase tem uma forma só. Consertar exige duas chaves por frase
  (`'{name} was promoted at work.'` em masculino e feminino) nas ~40 frases sobre outras pessoas.
  Não foi feito nesta rodada.
- **Profissões em forma única.** `'an accountant' → 'contador'`, inclusive quando quem exerce é
  mulher. Mesmo problema, mesma solução, mesmo custo.
- **Espanhol e francês continuam ocultos.** `LANGUAGES` os prevê com `completo: false`, e
  `LANGUAGES_READY` os remove do seletor. É o requisito 6: não oferecer o que não está traduzido.
- **Valores monetários em formato americano.** `$190,337` em vez de `$190.337`. `money()` usa
  `toLocaleString('en-US')` fixo. Mudar isso mexe em comparação de string em testes antigos; ficou
  fora desta rodada de propósito.
- **Alguns cargos ficaram com o anglicismo** que o mercado brasileiro usa de fato: "Head de
  Analytics", "Personal Trainer", "Sous Chef", "MBA". Foi escolha, não esquecimento.

## 7. Como repetir a medição

```bash
cd "games/betlife/web"
node --test tests/*.test.mjs        # 96 testes, inclui as onze invariantes de i18n
node tests/leak-audit.mjs           # 192 telas renderizadas, procurando inglês
node tests/idioma.mjs               # aplica na hora e persiste (WebKit)
node tests/save-idioma.mjs          # save compatível entre idiomas (WebKit)
node tests/pets-flow.mjs            # adoção com nome escolhido (WebKit)
node tests/sorteio.mjs              # moeda e sorteio múltiplo, geometria da mão (WebKit)
BETLIFE_LANG=pt node tests/full-lives.mjs   # qualquer suíte roda nos dois idiomas
```

`BETLIFE_LANG=pt` faz a suíte abrir o jogo com `&lang=pt`. Sem a variável, inglês — e é o mesmo
caminho de código nos dois casos, de propósito: se a tradução quebrasse a lógica, a mesma suíte
falharia em um idioma e passaria no outro.

## 8. Acabamento: gênero, moeda e naturalidade

Três frentes pedidas depois da primeira rodada.

### Concordância de gênero

O inglês não distingue: "promoted" serve para Lucas e para Freya. O português distingue, e uma frase
com forma única acerta metade das vezes. O mecanismo está no núcleo:

- uma tradução pode ser o par `{ m, f }` em vez de uma string;
- `t(texto, vars)` escolhe pelo `vars._g` — `'female'` ou `'male'`, **lido do estado**, nunca
  inferido do nome;
- `tg(rótulo, genero)` faz o mesmo para um rótulo de dado que entra no meio de outra frase;
- sem `_g` vale o masculino, que é o que o português usa quando não se sabe — e não inventa um
  gênero que o estado não afirma.

**252 entradas** têm par hoje: 134 rótulos de pessoa (cargos, profissões, papéis familiares,
espécies de bicho) mais as frases de narrativa que descrevem alguém.

O gênero chega por dois caminhos, e a distinção importa:

- **o do jogador** entra na fronteira (`addJournal`, `pushModal`), que tem o `state` — assim as
  centenas de frases do diário não precisam passar `_g` uma a uma;
- **o da outra pessoa** entra na origem. Os 107 textos de evento passaram a carregar
  `_g: c.who && c.who.gender`, e o contexto do evento ganhou `meuGenero` para as frases que falam do
  jogador mesmo tendo outra pessoa no meio ("Você ficou amiga de Freya").

Resultado medido em `tests/genero-vida.mjs`: quatro vidas inteiras em português, masculinas e
femininas, **1.196 linhas de diário, zero concordância errada**.

### Moeda

`game/i18n/moeda.js`, um lugar só. A moeda do jogo continua sendo o dólar — **formatar não é
converter**:

| | inglês | português |
| --- | --- | --- |
| positivo | `$190,337` | `US$ 190.337,00` |
| negativo | `-$500` | `-US$ 500,00` |
| zero | `$0` | `US$ 0,00` |

Os 27 pontos que formatavam dinheiro à mão com `toLocaleString('en-US')` foram para o formatador;
`money()` virou apelido de `dinheiro()`. Duas chaves traziam o `$` colado no marcador
(`earning ${salary} a year`) e passaram a receber o valor já formatado — em inglês a saída é
idêntica, caractere por caractere.

**O valor armazenado não mudou.** `tests/moeda.test.mjs` prova isso de frente: a mesma semente
simulada nos dois idiomas tem o mesmo `player.money`, o mesmo salário, o mesmo valor de bens, e
`typeof player.money === 'number'`. Nenhum teste existente dependia de string formatada — todos
verificam o número —, então nada foi enfraquecido para fazer passar.

### Naturalidade

- `Head of Analytics` era **"Head de Analytics"** → `Diretor / Diretora de Análise de Dados`;
- `Session Musician` / `Touring Musician` eram "Músico de..." → **"Musicista de Estúdio / de Turnê"**,
  que além de natural resolve o gênero sem par;
- `Social Butterfly` era o calque **"Borboleta Social"** → `Agenda Cheia`;
- `Nine to Five` era **"Das Nove às Cinco"** → `Carteira Assinada`, que é como se diz no Brasil ter
  o primeiro emprego formal;
- `Weekend Favor` era "Favor de Fim de Semana" → `Plantão de Fim de Semana`;
- os remendos `um(a)`, `seu(sua)`, `novo(a)`, `chamado(a)` e `pai/mãe` sumiram: viraram pares de
  verdade. Sobrou zero.

Ficaram de propósito os estrangeirismos que o português brasileiro realmente usa — *Personal
Trainer*, *Sous Chef*, *MBA*, *Trainee*, *designer*, *marketing*, *freelance*, *hackathon*, *spa*,
*pet shop* — e os nomes próprios.

### Mais nove defeitos que o acabamento revelou

Cada invariante nova nasceu de um deles:

7. **Par sem `_g` na origem.** "Você foi contratado como **Bombeira**" — o cargo concordava, o
   particípio não, porque a frase era traduzida na origem e a fronteira não alcança texto já
   traduzido.
8. **`_g` duas vezes no mesmo objeto.** JavaScript aceita: a segunda chave vence, em silêncio. A
   frase saiu gramaticalmente perfeita concordando com a pessoa errada.
9. **Rótulo de uma palavra.** "Devendo: **Nothing**" na tela de finanças. As invariantes de prosa
   exigem duas palavras; a de contexto exige propriedade ou chamada; `'Nothing'` num ternário não é
   nem uma coisa nem outra. Essa invariante sozinha achou **97 rótulos**.

Também apareceu, e foi corrigido: o artigo inglês do cargo (`a Firefighter`) entrava na chave e não
existia no catálogo — 152 formas com artigo foram acrescentadas apontando para a mesma tradução,
porque "contratado como bombeiro" dispensa o artigo que o inglês exige.

## 9. Três vazamentos que só a rodada de jogabilidade achou

Esta seção é um aviso sobre o método, não só um registro. As nove invariantes anteriores passavam,
a auditoria de tela dava zero, e mesmo assim havia inglês na tela — porque todas elas verificavam a
mesma coisa: **se a tradução existe**. Nenhuma verificava **se o código pede por ela**.

Os três defeitos foram encontrados ao implementar o nome dos pets e a animação da moeda, abrindo
cartões que a varredura de telas nunca abre:

1. **O cartão de confirmação não traduzia nada do que recebia.** `Modals.confirm` escrevia
   `esc(opts.title)` sem `t()`. As frases estavam todas no catálogo — `'Adopt this pet?'`,
   `'Scrap it?'`, `'Delete account?'`, `'Fee'`, `'Adopt'`, `'Not now'` — e saíam em inglês mesmo
   assim. Toda confirmação da interface, em todo o jogo. A auditoria não pegou porque esses cartões
   só existem depois de um clique, e ela varre telas.

2. **A lista de bichos das atividades estava congelada em inglês.** `SUBMENUS` é montado no import
   do módulo, e no import `setLanguage()` ainda não rodou: o `t()` ali devolveu inglês e **gravou**
   o inglês na estrutura. Pior, a frase tinha número interpolado — `'$350 · lives about 13 years'` —
   então o resultado nem chave era: nenhuma tradução iria alcançá-lo depois, em idioma nenhum.

3. **A tela inicial tinha texto cru no template.** `<span>Bank Balance</span>` e `<h1>New Life</h1>`,
   escritos direto no HTML, com `$0` à moda americana ao lado. A sexta invariante *olhava* esses nós
   de texto, mas dispensava os que tinham tradução no catálogo — exatamente o caso. Para um nó de
   texto dentro do template, estar no catálogo não vale nada: a tradução nunca é pedida.

### As invariantes que nasceram daí

10. **o cartão de confirmação traduz o que recebe.** A verificação é de comportamento: entrega
    inglês à fronteira e exige que nada do inglês volte do outro lado.
11. **o catálogo de atividades guarda chave, não frase pronta.** Percorre `CATEGORIES` e exige que
    todo nome e todo subtítulo ainda sejam chaves do catálogo.

E a sexta invariante deixou de dispensar o que está no catálogo. A correção do nº 3 passou também o
`$0` da tela inicial por `dinheiro()`, e os três `'$' + valor` que ainda sobravam no código
(`'This costs {price}'`, `'The fee is {amount}'`, o preço da lista de bichos) — dólar escrito à mão
era a última coisa fora de `game/i18n/moeda.js`.

**A lição, de novo:** tradução tem duas metades — existir e ser pedida. Catálogo cheio com fronteira
muda é indistinguível, no código, de um jogo sem tradução nenhuma.
