# BetLife — o nome do pet e a animação da moeda

Duas coisas pequenas de jogabilidade, feitas com o mesmo critério do resto: o jogo decide, a
animação conta; o estado não muda de forma nenhuma antes da confirmação; e nada aqui é recorte de
desenho de ninguém — a mão, as duas faces da moeda e o palco são desenho original do BetLife.

---

## 1. O jogador escolhe o nome do pet

Antes, adotar um animal era um clique e pronto: o jogo dava o nome. Agora o nome é do jogador.

### O fluxo

1. a lista da casa de adoção mostra o animal, a raça, a idade e a taxa;
2. o clique abre um cartão com a **ilustração do bicho**, espécie, raça, idade, expectativa de vida,
   taxa e saldo;
3. o cartão pergunta **"Como você quer chamar seu pet?"**, com um nome sugerido já preenchido e
   selecionado — é só digitar por cima;
4. confirmar adota; **Agora não** sai sem deixar rastro.

### Onde cada decisão mora

| Coisa | Onde | Por quê |
|---|---|---|
| limpar o nome digitado | `Pets.cleanName` | aceita espaço e acento, tira controle e espaço repetido — `\n` colado quebraria a linha do diário |
| recusar nome vazio ou longo | `Pets.nameProblem` | mede em **pontos de código**: um nome com acento vale o mesmo que um sem |
| sugerir um nome | `Pets.suggestName` | deriva da semente e da idade, **sem tocar no RNG do jogo** — sugerir não pode deslocar a vida |
| o campo no cartão | `Modals.confirm` (`opts.field`) | é o mesmo cartão de confirmação de sempre, com um campo |
| o laço de validação | `askPetName` em `betlife.js` | nome inválido volta o cartão com o aviso e com o que a pessoa escreveu |
| a trava de adoção dupla | `G.adoptFromSource` | a lista desabilita a linha, mas a trava tem de ser no jogo: a interface pode mandar um clique atrasado |

O limite é de **24 caracteres**, e o campo corta sozinho — quem cola um nome de 40 letras vê 24, não
um erro. O botão de adotar **desliga enquanto o campo está vazio**, então o jogador vê que um bicho
sem nome não passa antes de tentar.

### Os caminhos de adoção

- **As quatro casas** (Centro de Resgate, Gatil, Canil, Pet Shop) — todas pelo mesmo cartão. É o
  caminho que o jogador usa.
- **A atividade `adopt_<espécie>`** — existe na API e nos testes, e também recebe o nome (`petName`).
  Hoje o menu de atividades manda a linha "Bichos" para a tela das casas, então esse caminho não tem
  porta na interface; mesmo assim ele pergunta o nome, porque a porta pode voltar.
- **Bicho que chega por acontecimento** (um cachorro que entra para a família, o bicho que já existe
  na casa quando o personagem nasce) — continua com nome gerado. Aí não houve adoção: ninguém
  escolheu o animal, e um cartão pedindo nome no meio de um acontecimento seria uma pergunta sobre
  algo que o jogador não pediu. Está anotado como limitação, não como esquecimento.

### O que cancelar faz

Nada. Não cobra a taxa, não cria o animal, não escreve no diário, não marca o anúncio como adotado.
Medido no navegador comparando dinheiro, número de bichos e tamanho do diário antes e depois.

---

## 2. O sorteio, em duas apresentações

### A ordem, que é o ponto

O sorteio sai **antes** de qualquer pixel: `G.randomChoice(state, modal)`, o mesmo RNG do jogo, a
mesma função de antes da animação existir. A mão não escolhe nada — ela anda até a opção que já
venceu. Inverter isso faria a decisão depender de posição na tela, e um replay com a mesma semente
deixaria de contar a mesma história.

### Duas apresentações, porque uma moeda só decide entre duas coisas

| Opções | O que aparece | O link diz |
|---|---|---|
| exatamente 2 | **a moeda**: placas Cara e Coroa, a mão aperta a que venceu, a moeda gira e cai nessa face | *Tirar na moeda* |
| 3 ou mais | **o sorteio**: as opções em lista, a mão aperta a que venceu, um marcador corre pela lista desacelerando até parar nela | *Deixar no sorteio* |

Com duas opções a moeda decide **de verdade**: cara é a primeira, coroa é a segunda, e a face sai da
opção sorteada. Com três ou mais, mostrar uma moeda seria afirmar algo falso sobre como a escolha foi
feita — então não há moeda nenhuma na tela, e a revelação nomeia a opção: *"O sorteio escolheu:
Contar para um adulto"*. O rótulo do link muda junto: prometer uma moeda e mostrar outra coisa seria
o jogo mentindo sobre o próprio acaso.

Nos dois casos o resultado é o de `randomChoice`, e a sequência, o ritmo e a mão são os mesmos — o
que muda é o randomizador do meio.

### A sequência e o ritmo

| Momento | ms | O que acontece |
|---|---|---|
| entrada | 100 | a mão é posta fora da tela, embaixo e à direita |
| viagem | 760 | sobe até a placa, com aceleração e desaceleração |
| mira | 170 | encosta na placa, antecipação |
| clique | 170 | o indicador abaixa 10 px e gira 9°; a placa afunda e escurece |
| volta | 120 | o dedo sobe; a placa fica marcada |
| acaso | 1080 | a moeda é lançada e gira oito voltas — ou o marcador corre pela lista, desacelerando; a mão sai de cena |
| revelação | 380 | a frase do resultado entra |
| respiro | 140 | o palco segura antes de responder o cartão |

**2,92 s no total**, dentro dos 2,5 a 3 s pedidos — ajustado olhando o navegador, não no papel: a
primeira versão tinha 3,4 s e cansava na segunda vez.

A mão é posicionada **pela ponta do dedo**, não pelo canto do desenho: `TIP` guarda onde a ponta
está dentro do SVG, em fração da largura e da altura, e o destino é calculado a partir disso. Sem
essa conta a mão aponta *para o lado* do botão.

**O texto nunca fica debaixo da mão**, e isso é layout, não sorte:

- na moeda, o rótulo (`Cara`/`Coroa`) fica **acima** do desenho e o dedo mira na parte de baixo da
  placa — o corpo da mão fica abaixo da ponta, então mirar mais alto cobriria a palavra;
- no sorteio, o rótulo fica **à esquerda** e o alvo do dedo é o marcador **à direita** — por isso a
  mão não cobre o nome de opção nenhuma, nem da que ela aperta nem das outras;
- as opções não escolhidas só saem de cena **no toque**, e não antes: enquanto a mão viaja, todas
  continuam legíveis;
- a mão **sai de cena antes** de a frase do resultado aparecer, nas duas apresentações.

Isso é medido, não suposto: a suíte compara a caixa da *arte* da mão (não a do SVG, que tem margem
transparente) com a caixa de **todos** os rótulos visíveis, no quadro da mira e no do clique.

### As travas

- **Cliques repetidos durante a animação não sorteiam de novo.** `answering` fica levantado do
  primeiro clique até o cartão ser respondido. Testado com três cliques seguidos, vinte vezes.
- **A interface nunca fica presa.** Toda a animação está em `try/finally`, e há um temporizador de
  guarda que remove o palco mesmo que algo no meio falhe. O sorteio é calculado *fora* do `try`: se
  falhasse ali com `answering` já levantado, o cartão ficaria sem resposta para sempre.
- **Menos movimento, se for a preferência do sistema.** Com `prefers-reduced-motion` não há mão nem
  giro: a moeda já está na face que saiu, a placa vencedora está marcada, o resultado está escrito, e
  em 0,9 s o cartão é respondido.
- **Celular.** Testado a 390×844 com toque: a mão encolhe para 104 px e a ponta continua caindo
  dentro da placa, porque o cálculo vem da medida real do elemento.

---

## 3. O que a implementação revelou

### Três vazamentos de tradução

Estão detalhados em [BETLIFE-PORTUGUES.md](BETLIFE-PORTUGUES.md), seção 9, e viraram as invariantes
10 e 11. Em resumo: **o cartão de confirmação não traduzia nada do que recebia** (toda confirmação do
jogo, em inglês), **a lista de bichos das atividades estava congelada em inglês desde o import do
módulo**, e **a tela inicial tinha `Bank Balance` e `$0` crus no template**. As nove invariantes
anteriores passavam porque todas verificavam se a tradução *existe*; nenhuma verificava se o código
*pede* por ela.

### Dois defeitos de WebKit

- **A primeira transição da sequência se perdia.** Pôr a mão fora da tela e, no mesmo instante,
  trocar a classe que liga a transição fazia o WebKit ir direto ao destino, sem animar: a mão
  aparecia já no botão. A correção é a receita clássica — posicionar com `transition: none`, forçar o
  cálculo de layout (`void el.offsetWidth`) e só então devolver a transição.
- **`backface-visibility: hidden` não escondeu a face de trás.** A moeda clássica são duas faces
  empilhadas, uma virada 180°, as costas invisíveis. Neste WebKit a face de trás desenhava por cima
  o tempo todo, e a moeda mostrava **coroa mesmo quando tinha dado cara** — testei ainda com
  separação em Z e com a perspectiva no pai direto, e o resultado não mudou. A solução foi parar de
  depender disso: a face visível é escolhida por atributo (`data-show`), é uma só, e o giro continua
  sendo o giro — a 60 ms por meia-volta ninguém vê a gravação espelhada. A troca acontece com a
  moeda **já no ar**, para a resposta não ficar à mostra na moeda parada.

---

## 4. Os testes

### Novos nesta rodada

| Suíte | O que fixa | Resultado |
|---|---|---|
| `tests/pets.test.mjs` (11) | nome limpo, nome recusado, sugestão que não mexe no RNG, taxa cobrada uma vez, adoção dupla barrada, cancelar sem rastro, nome no save e na vida inteira | 11/11 |
| `tests/pets-flow.mjs` (29, WebKit) | o cartão, o campo, o botão que desliga, o corte em 24, cancelar, adotar com nome e com sugestão, o nome em três telas, a recarga, três cliques, as quatro casas, o aviso traduzido | **29/29 en · 29/29 pt** |
| `tests/sorteio.mjs` (44, WebKit) | 20 sorteios de moeda + 12 de sorteio múltiplo: as duas faces acontecem, as três opções podem ganhar, a ponta do dedo cai dentro da opção sorteada, **a mão não cobre rótulo nenhum** (no quadro da mira e no do clique), o dedo desce, três cliques = um sorteio, a moeda cai na face que saiu, o marcador para na opção certa, as outras apagam no toque, volta para a vida; quatro opções; celular; movimento reduzido | **44/44 en · 44/44 pt** |
| invariantes 10, 11 e 12 | o cartão de confirmação traduz o que recebe; o catálogo de atividades guarda chave; toda frase de `toast()` e `ask()` está no catálogo | parte dos 97 |

### A regressão inteira, nos dois idiomas

| Suíte | Inglês | Português |
|---|---|---|
| `node --test tests/*.test.mjs` | **97/97** | — (mesmo processo) |
| `leak-audit` (192 telas) | — | **0 frases em inglês, 0 erro de página** |
| `navigation-audit` | 740 ações · **0 fora do destino** | 740 ações · **0 fora do destino** |
| `button-audit` | 1077 cliques · **0 erro JS** | 1115 cliques · **0 erro JS** |
| `full-lives` | 42/42 (duas execuções) | 42/42 |
| `long-life` | 14/14 | 14/14 |
| `session-scope` (morte, sem download, volta ao Arcade) | 63/63 | — |
| `returns-to-life` | 13/13 | — |
| `idioma` · `save-idioma` · `genero-vida` | 13/13 · 26/26 · 16/16 | — |

Os dois "suspeitos de morto" do `button-audit` são os mesmos falsos positivos de sempre (o
`newLife` pelo menu funciona isolado), iguais nos dois idiomas e anteriores a esta rodada.

### Três testes que estavam errados, e o que isso ensinou

- **`full-lives` verificava a recusa de compra em inglês** (`/afford|money|Not So Fast/i`). Passava em
  português porque o título do cartão *vazava* em inglês. Quando o cartão passou a ser traduzido de
  verdade, o teste quebrou — e o errado era o teste. Agora aceita os dois idiomas.
- **A geometria do dedo era medida cedo demais.** O primeiro quadro da mira pega a mão ainda 26 px
  abaixo do destino (ela sobe na antecipação); com a mira na parte de baixo da placa isso reprovava
  um alinhamento correto. Passou a ser medida no último quadro da janela de clique.
- **Uma vida aleatória morreu aos 22** e reprovou "chegou a uma idade plausível" (≥ 35). A `VIDA A`
  do `full-lives` é semeada pelo relógio: repeti a suíte duas vezes, 42/42 nas duas, e as 50 vidas
  semeadas do relatório de equilíbrio continuam com mínimo 45. Era acaso, não regressão.

## 5. Limitações

- **Bicho que chega por acontecimento não pergunta o nome** (ver acima). É decisão, não falta.
- **A atividade `adopt_<espécie>` não tem porta na interface** hoje: o menu manda "Bichos" para a
  tela das casas. O caminho está implementado e testado pela API.
- **A moeda aparece só com duas opções.** Com três ou mais entra o sorteio em lista — não é uma
  limitação, é o contrário dela: duas faces não resolvem três caminhos, e mostrar uma moeda ali
  seria afirmar algo falso sobre como a escolha foi feita.
- **O nome de um bicho não pode ser trocado depois.** Quem errou o nome convive com ele — como na
  vida.

## 6. Evidências visuais no repositório

As capturas abaixo saem do `tests/capturas-sorteio-pets.mjs`, no mesmo navegador dos testes. Os
quadros avulsos de cada animação não foram versionados: as duas pranchas já os contêm lado a lado,
na ordem, e versionar as duas coisas seria guardar a mesma imagem duas vezes.

| arquivo | o que mostra |
|---|---|
| [`moeda/storyboard-moeda.png`](betlife-capturas/moeda/storyboard-moeda.png) | a moeda, nove quadros: cartão, entrada, viagem, mira, aperto, giro, desaceleração, resultado, volta à vida |
| [`moeda/storyboard-sorteio.png`](betlife-capturas/moeda/storyboard-sorteio.png) | o sorteio múltiplo, os mesmos nove momentos — sem moeda em quadro nenhum |
| [`moeda/celular-moeda-no-clique.png`](betlife-capturas/moeda/celular-moeda-no-clique.png) | 390×844, o quadro do toque: a mão não cobre Cara nem Coroa |
| [`moeda/celular-sorteio-no-clique.png`](betlife-capturas/moeda/celular-sorteio-no-clique.png) | 390×844, três opções legíveis com a mão em cena |
| [`moeda/celular-moeda-resultado.png`](betlife-capturas/moeda/celular-moeda-resultado.png) · [`moeda/celular-sorteio-resultado.png`](betlife-capturas/moeda/celular-sorteio-resultado.png) | a mão já saiu quando o resultado aparece |
| [`pets/cartao-pt.png`](betlife-capturas/pets/cartao-pt.png) · [`pets/cartao-en.png`](betlife-capturas/pets/cartao-en.png) | o cartão de adoção nos dois idiomas, mesma estrutura |
| [`pets/01-as-casas.png`](betlife-capturas/pets/01-as-casas.png) … [`pets/07-em-relacionamentos.png`](betlife-capturas/pets/07-em-relacionamentos.png) | o caminho inteiro da adoção: lista, nome sugerido, nome vazio recusado, nome escolhido, diário, relacionamentos |
