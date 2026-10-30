# PLAYER+ — como funciona e como se configura

O PLAYER+ é um selo. Ele muda o que aparece no portal e no BetLife, e não muda nada do jogo: não dá
dinheiro, não rebobina anos, não edita atributo, não entra em save nenhum. Uma vida antiga carrega
igual com ou sem ele.

O que este documento existe para registrar é a parte que não dá para ler no código: onde vive o
segredo, e o que esta proteção realmente promete.

## Por que existe uma função de servidor num site estático

Tudo em `web/` é público. Qualquer pessoa abre o arquivo e lê. Se a conferência do código de
ativação estivesse ali, ela não seria uma proteção — seria um aviso de onde está a resposta.

Então o navegador nunca vê o código certo. Ele manda o que o jogador digitou para
`POST /api/player-plus` e pergunta. Quem compara é [`api/player-plus.mjs`](../api/player-plus.mjs),
com um valor que vive numa variável de ambiente da Vercel e não no repositório.

A persistência é protegida do mesmo lugar. Se o status ficasse guardado como `plus: true`, bastava
abrir o painel do navegador e escrever isso à mão. Em vez disso a ativação devolve um **bilhete
assinado** (HMAC-SHA256) com um segredo que só o servidor conhece, e o site reapresenta esse bilhete
a cada visita para ser conferido. Um valor inventado no `localStorage` não tem assinatura válida e
não vira nada.

O código nunca é registrado em log — nem certo, nem errado. De uma tentativa falha registra-se que
houve uma tentativa falha.

## As duas variáveis

No projeto da Vercel, em *Settings → Environment Variables*:

| nome | o que é | onde |
| --- | --- | --- |
| `PLAYER_PLUS_CODE` | o código que o jogador digita | Production, Preview, Development |
| `PLAYER_PLUS_SECRET` | 32 bytes aleatórios em hexadecimal, usados para assinar o bilhete | Production, Preview, Development |

Marque as duas como **Sensitive**: assim nem o painel as mostra de volta depois de salvas.

Sem as duas configuradas a função responde `503 not-configured` **de propósito**. Ela não cai num
código embutido como plano B, porque é exatamente isso que ela existe para evitar.

Trocar o `PLAYER_PLUS_SECRET` invalida todos os bilhetes já emitidos — quem estava PLAYER+ precisa
ativar outra vez. É o botão de "expulsar todo mundo", se um dia for preciso.

## Para rodar localmente

Crie `.env.player-plus` na raiz (o git o ignora) com as mesmas duas variáveis e suba
`node tools/serve.mjs`. Esse servidor chama **o mesmo arquivo** de `api/` que a Vercel chamaria —
não existe uma segunda implementação de mentira que poderia passar enquanto a de produção falha.

Os testes tiram o código do ambiente, nunca de dentro deles: ver
[`tests/env-player-plus.mjs`](../tests/env-player-plus.mjs). Este repositório é público, e "fora do
frontend" não é o mesmo que "fora do código público".

## O que esta proteção não promete

**O código é curto.** Validar no servidor impede que alguém *leia* o código no JavaScript público, e
o freio atrasa a adivinhação automática, mas um código de quatro dígitos tem dez mil combinações e
não resiste a um script paciente. Enquanto o PLAYER+ só acende um selo, o risco é cosmético. **No
dia em que ele destravar qualquer coisa de verdade, o código precisa ficar mais longo** — e aí o
freio de memória abaixo também precisa virar um limitador de verdade.

**O freio é honesto sobre o que é:** um contador em memória, que vale por instância da função e zera
quando ela hiberna. Conta só tentativa errada — uma versão anterior contava os acertos junto e
barrava o próprio jogador legítimo, o que foi encontrado pelo teste de celular.

**A ativação é por navegador.** Não existe sistema de contas no Arcade; o bilhete fica no
`localStorage` da origem. Ativar no celular não ativa no computador, e limpar os dados do site
desativa. O portal e o BetLife compartilham o status porque são a mesma origem.

## Os testes

| arquivo | o que prova |
| --- | --- |
| [`tests/player-plus.test.mjs`](../tests/player-plus.test.mjs) | o servidor: bilhete forjado recusado, código errado sem bilhete, `503` sem configuração, nada em log, e o código em nenhum arquivo que o navegador baixa |
| [`tests/player-plus-flow.mjs`](../tests/player-plus-flow.mjs) | o navegador: os dois botões, os dois idiomas, celular, recarregar, `localStorage` mexido à mão, servidor fora do ar — e que o aviso antigo não reaparece |
