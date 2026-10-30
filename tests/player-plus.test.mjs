// O SERVIDOR DO PLAYER+: o que ele aceita, o que recusa, e o que nunca diz.
//
// Estes testes existem porque a promessa do PLAYER+ é inteira do servidor. Se o navegador pudesse
// decidir, não haveria nada para testar aqui — e nada para proteger.
import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { assinar, conferir } from '../api/player-plus.mjs';
import { codigoReal } from './env-player-plus.mjs';

const SEGREDO = 'segredo-de-teste-nao-usado-em-lugar-nenhum';
// O código REAL não entra aqui — o repositório é público. Estes testes plantam um código de mentira
// no ambiente com `comAmbiente` e verificam o comportamento, que é o mesmo qualquer que seja o valor.
// Quem precisa do código de verdade é um único teste, o que varre os arquivos, e ele o pede ao ambiente.
const CODIGO = 'codigo-de-teste-nao-e-o-de-producao';

// Um par req/res de mentira, do tamanho exato que o handler usa.
function chamada(body, { method = 'POST', ip = '10.0.0.1' } = {}) {
  const res = { statusCode: 0, headers: {}, corpo: null,
    setHeader(k, v) { this.headers[k] = v; },
    end(texto) { this.corpo = JSON.parse(texto); } };
  const req = { method, headers: { 'x-forwarded-for': ip }, body };
  return handler(req, res).then(() => res);
}

function comAmbiente(fn, { codigo = CODIGO, segredo = SEGREDO } = {}) {
  const antes = [process.env.PLAYER_PLUS_CODE, process.env.PLAYER_PLUS_SECRET];
  if (codigo === null) delete process.env.PLAYER_PLUS_CODE; else process.env.PLAYER_PLUS_CODE = codigo;
  if (segredo === null) delete process.env.PLAYER_PLUS_SECRET; else process.env.PLAYER_PLUS_SECRET = segredo;
  return Promise.resolve(fn()).finally(() => {
    if (antes[0] === undefined) delete process.env.PLAYER_PLUS_CODE; else process.env.PLAYER_PLUS_CODE = antes[0];
    if (antes[1] === undefined) delete process.env.PLAYER_PLUS_SECRET; else process.env.PLAYER_PLUS_SECRET = antes[1];
  });
}

/* ── O bilhete ───────────────────────────────────────────────────────────────────────────────── */

test('um bilhete assinado é aceito pelo mesmo segredo', () => {
  assert.equal(conferir(SEGREDO, assinar(SEGREDO)), true);
});

test('um bilhete assinado NÃO é aceito por outro segredo', () => {
  assert.equal(conferir('outro-segredo', assinar(SEGREDO)), false);
});

test('dois bilhetes seguidos são diferentes', () => {
  // Se fossem iguais, um bilhete vazado serviria para sempre e para todos.
  assert.notEqual(assinar(SEGREDO), assinar(SEGREDO));
});

test('mexer nos dados invalida a assinatura', () => {
  const bom = assinar(SEGREDO);
  const [dados, assinatura] = bom.split('.');
  const mexido = `${dados.slice(0, -1)}${dados.at(-1) === 'A' ? 'B' : 'A'}.${assinatura}`;
  assert.notEqual(mexido, bom);
  assert.equal(conferir(SEGREDO, mexido), false);
});

test('inventar um bilhete à mão não funciona — é isto que protege o localStorage', () => {
  for (const tentativa of ['true', '1', 'plus', '{"plus":true}', 'a.b', '.', '', 'eyJ2IjoxfQ.x',
    `${Buffer.from('{"v":1}').toString('base64url')}.qualquercoisa`]) {
    assert.equal(conferir(SEGREDO, tentativa), false, `aceitou ${JSON.stringify(tentativa)}`);
  }
});

test('conferir não explode com lixo', () => {
  for (const lixo of [null, undefined, 42, {}, [], 'x'.repeat(5000)]) {
    assert.equal(conferir(SEGREDO, lixo), false);
  }
});

/* ── A ativação ──────────────────────────────────────────────────────────────────────────────── */

test('o código certo devolve um bilhete que confere', () => comAmbiente(async () => {
  const r = await chamada({ code: CODIGO });
  assert.equal(r.statusCode, 200);
  assert.equal(r.corpo.ok, true);
  assert.equal(conferir(SEGREDO, r.corpo.token), true);
}));

test('o código certo com espaços em volta também vale', () => comAmbiente(async () => {
  assert.equal((await chamada({ code: ` ${CODIGO} ` })).corpo.ok, true);
}));

test('o código errado é recusado e NÃO vem bilhete junto', () => comAmbiente(async () => {
  // Erros derivados do próprio código de mentira: um a menos, um a mais, um caractere trocado.
  for (const errado of [CODIGO.slice(0, -1), `${CODIGO}x`, `x${CODIGO.slice(1)}`, 'abcd', '0000', ' ']) {
    const r = await chamada({ code: errado }, { ip: `10.0.0.${Math.random()}` });
    assert.equal(r.corpo.ok, false, `aceitou ${errado}`);
    assert.equal(r.corpo.token, undefined);
    assert.equal(r.statusCode, errado.trim() ? 401 : 400);
  }
}));

test('a resposta de recusa não conta nada sobre o código certo', () => comAmbiente(async () => {
  const r = await chamada({ code: '9999' });
  const texto = JSON.stringify(r.corpo);
  assert.equal(texto.includes(CODIGO), false);
  assert.equal(texto.length < 60, true, `resposta grande demais: ${texto}`);
}));

test('sem código vem 400, não 401', () => comAmbiente(async () => {
  assert.equal((await chamada({})).statusCode, 400);
}));

test('o bilhete é conferido pela rota de token', () => comAmbiente(async () => {
  const { token } = (await chamada({ code: CODIGO })).corpo;
  assert.equal((await chamada({ token })).corpo.ok, true);
  assert.equal((await chamada({ token: 'inventado' })).corpo.ok, false);
  assert.equal((await chamada({ token: '' })).corpo.ok, false);
}));

test('conferir um bilhete nunca devolve um bilhete novo', () => comAmbiente(async () => {
  // Senão a rota de conferência viraria uma rota de ativação sem código.
  const r = await chamada({ token: assinar(SEGREDO) });
  assert.equal(r.corpo.token, undefined);
}));

test('sem variável de ambiente não existe ativação — e não há código embutido', () => comAmbiente(async () => {
  const r = await chamada({ code: CODIGO });
  assert.equal(r.statusCode, 503);
  assert.equal(r.corpo.error, 'not-configured');
}, { codigo: null, segredo: null }));

test('só POST', () => comAmbiente(async () => {
  for (const method of ['GET', 'PUT', 'DELETE']) {
    assert.equal((await chamada({ code: CODIGO }, { method })).statusCode, 405);
  }
}));

test('tentativas demais do mesmo lugar são freadas', () => comAmbiente(async () => {
  const ip = `10.9.9.${Date.now() % 250}`;
  let freou = false;
  for (let i = 0; i < 20; i++) {
    const r = await chamada({ code: 'errado' }, { ip });
    if (r.statusCode === 429) { freou = true; break; }
  }
  assert.equal(freou, true, 'nunca freou');
}));

test('muitos acertos seguidos NUNCA são freados — o freio conta erro, não acerto', () => comAmbiente(async () => {
  // Foi exatamente isto que quebrou o teste de celular: o freio contava os acertos junto, e o
  // jogador legítimo levava 429 por ter ativado algumas vezes durante a suíte.
  const ip = '10.3.3.3';
  for (let i = 0; i < 30; i++) {
    assert.equal((await chamada({ code: CODIGO }, { ip })).corpo.ok, true, `freou no acerto ${i + 1}`);
  }
}));

test('errar e depois acertar dentro do limite ainda funciona', () => comAmbiente(async () => {
  const ip = '10.4.4.4';
  for (let i = 0; i < 5; i++) await chamada({ code: 'errado' }, { ip });
  assert.equal((await chamada({ code: CODIGO }, { ip })).corpo.ok, true);
}));

test('o freio não atrapalha quem acerta de primeira', () => comAmbiente(async () => {
  assert.equal((await chamada({ code: CODIGO }, { ip: '10.7.7.7' })).corpo.ok, true);
}));

/* ── O que nunca pode vazar ──────────────────────────────────────────────────────────────────── */

test('o código não aparece em nenhum log, nem certo nem errado', () => comAmbiente(async () => {
  const original = console.log;
  const linhas = [];
  console.log = (...a) => linhas.push(a.join(' '));
  try {
    await chamada({ code: CODIGO }, { ip: '10.5.5.1' });
    await chamada({ code: 'errado-mas-anotado' }, { ip: '10.5.5.2' });
  } finally { console.log = original; }
  const tudo = linhas.join('\n');
  assert.equal(tudo.includes(CODIGO), false, `o código vazou: ${tudo}`);
  assert.equal(tudo.includes('errado-mas-anotado'), false, `o que foi digitado vazou: ${tudo}`);
}));

test('o código não está escrito em nenhum arquivo que o navegador baixa', async () => {
  const procurado = codigoReal();
  const { readFileSync, readdirSync, statSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  // `new URL(...).pathname` deixa %20 no lugar dos espaços do caminho; `fileURLToPath` não.
  const raiz = fileURLToPath(new URL('../web/', import.meta.url));
  const achados = [];
  (function varre(dir) {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) { varre(caminho); continue; }
      if (!/\.(js|mjs|html|css|json)$/.test(nome)) continue;
      if (readFileSync(caminho, 'utf8').includes(procurado)) achados.push(caminho.replace(raiz, ''));
    }
  })(raiz);
  assert.deepEqual(achados, [], `o código aparece em: ${achados.join(', ')}`);
});
