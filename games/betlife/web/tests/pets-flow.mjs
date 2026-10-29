// Adoção com nome escolhido pelo jogador, no caminho que o jogador faz: lista de bichos, cartão,
// campo, confirmação. Em WebKit de verdade, porque o que se verifica aqui é interface — campo
// preenchido, botão que desabilita, cancelar que não cobra, nome que sobrevive à recarga.
//
// Idioma do teste: `BETLIFE_LANG=pt` roda a mesma suíte em português.
import { webkit } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:8099/web/games/betlife/';
const LANG = process.env.BETLIFE_LANG ? `&lang=${process.env.BETLIFE_LANG}` : '';
const PT = !!process.env.BETLIFE_LANG;
const VIDA = `${BASE}?seed=31&age=24${LANG}#main`;
// Recarregar SEM `seed`: com a semente na URL a página remonta a vida do zero e não leria o save —
// e era o save que este teste queria verificar.
const RECARGA = `${BASE}${LANG ? `?${LANG.slice(1)}` : ''}#main`;

let ok = 0, falhas = 0;
const checa = (nome, cond, detalhe = '') => {
  if (cond) { ok++; console.log(`  ok   ${nome}`); }
  else { falhas++; console.log(`  FALHA ${nome}${detalhe ? ' — ' + detalhe : ''}`); }
};

const navegador = await webkit.launch();
const ctx = await navegador.newContext({ viewport: { width: 420, height: 900 } });
const page = await ctx.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push(String(e)));

const espera = (ms) => page.waitForTimeout(ms);
const foto = () => page.evaluate(`(() => { const st = window.betlife.getState(); return {
  dinheiro: st.player.money, bichos: st.relationships.filter((p) => p.role === 'pet').map((p) => p.name),
  diario: st.timeline.length, ultima: (st.timeline[st.timeline.length - 1] || {}).text || '' }; })()`);

// Abre o cartão de adoção do n-ésimo animal de uma das casas.
async function abreCartao(casa, n = 0) {
  await page.evaluate(`(async () => {
    window.betlife.getState().player.money = 9000;
    window.betlife.go('petSource');
  })()`);
  await page.evaluate(`(() => { window.betlife.go('pets'); })()`);
  await espera(150);
  await page.evaluate(`(() => { const r = [...document.querySelectorAll('.bl-row')].filter((x) => x.dataset.target === 'petSource')[${casa}]; if (r) r.click(); })()`);
  await espera(200);
  const abriu = await page.evaluate(`(() => { const r = [...document.querySelectorAll('.bl-row[data-action="adoptConfirm"]')][${n}]; if (!r) return false; r.click(); return true; })()`);
  await espera(400);
  return abriu;
}
const cartao = () => page.evaluate(`(() => { const m = document.querySelector('#modal-root .bl-modal'); if (!m) return null;
  const b = m.querySelector('.bl-modal-buttons [data-choice="0"]');
  return { texto: m.innerText, campo: (m.querySelector('.bl-field-input') || {}).value ?? null,
    limite: Number((m.querySelector('.bl-field-input') || {}).maxLength || 0),
    retrato: !!m.querySelector('.bl-portrait-pic svg'), botaoLigado: !!b && !b.disabled }; })()`);
const confirma = async (qual = 0) => { await page.evaluate(`(() => { document.querySelector('#modal-root .bl-modal-buttons [data-choice="${qual}"]').click(); })()`); await espera(450); };

await page.goto(VIDA, { waitUntil: 'domcontentloaded' });
await espera(600);

// ---- 1. o cartão ------------------------------------------------------------------------------
console.log('\n1. O cartão de adoção');
checa('o cartão abre pelo primeiro animal do abrigo', await abreCartao(0, 0));
const c1 = await cartao();
checa('o cartão mostra a ilustração do animal', !!c1 && c1.retrato);
checa('o cartão traz um nome sugerido já preenchido', !!c1 && !!c1.campo, JSON.stringify(c1 && c1.campo));
checa('o cartão pergunta o nome', !!c1 && /chamar seu pet|call your pet/i.test(c1.texto), (c1 && c1.texto || '').slice(0, 60));
checa('o cartão mostra espécie, taxa e saldo', !!c1 && /(Raça|Breed)/.test(c1.texto) && /(Taxa|Fee)/.test(c1.texto) && /(Saldo|Bank Balance)/.test(c1.texto));
checa('o cartão está no idioma do jogo', !!c1 && (PT ? /Adotar este bicho/.test(c1.texto) : /Adopt this pet/.test(c1.texto)), (c1 && c1.texto || '').slice(0, 40));
checa('o campo limita o tamanho do nome', !!c1 && c1.limite === 24, String(c1 && c1.limite));

// ---- 2. nome vazio e nome longo -----------------------------------------------------------------
console.log('\n2. Nome vazio, só espaços, e nome longo');
await page.fill('.bl-field-input', '');
checa('com o campo vazio o botão de adotar desliga', !(await cartao()).botaoLigado);
await page.fill('.bl-field-input', '    ');
checa('só com espaços o botão continua desligado', !(await cartao()).botaoLigado);
await page.fill('.bl-field-input', 'A'.repeat(40));
const longo = await cartao();
checa('o campo corta o nome exagerado em 24', longo.campo.length === 24, String(longo.campo.length));
checa('e com nome válido o botão liga de novo', longo.botaoLigado);

// ---- 3. cancelar não deixa rastro ---------------------------------------------------------------
console.log('\n3. Cancelar');
const antesDeCancelar = await foto();
await confirma(1);
const depoisDeCancelar = await foto();
checa('cancelar não cobra nada', depoisDeCancelar.dinheiro === antesDeCancelar.dinheiro, `${antesDeCancelar.dinheiro} -> ${depoisDeCancelar.dinheiro}`);
checa('cancelar não cria o bicho', depoisDeCancelar.bichos.length === antesDeCancelar.bichos.length, JSON.stringify(depoisDeCancelar.bichos));
checa('cancelar não escreve no diário', depoisDeCancelar.diario === antesDeCancelar.diario);
checa('e o cartão sai da tela', (await cartao()) === null);

// ---- 4. adotar com nome escolhido ---------------------------------------------------------------
console.log('\n4. Adotar com o nome escolhido');
await abreCartao(0, 0);
const antes = await foto();
const taxa = Number((await cartao()).texto.replace(/\n/g, ' ').match(/(?:Taxa|Fee):\s*(?:US\$\s*)?\$?([\d.,]+)/)[1].replace(/\./g, '').replace(',00', ''));
const sugerido = (await cartao()).campo;
await page.fill('.bl-field-input', '  Açucena do Café  ');
await confirma(0);
const depois = await foto();
checa('o bicho entra com o nome digitado, sem os espaços das pontas', depois.bichos.includes('Açucena do Café'), JSON.stringify(depois.bichos));
checa('o nome sugerido não é usado quando o jogador escreve o seu', !depois.bichos.includes(sugerido) || sugerido === 'Açucena do Café', sugerido);
checa('a taxa é cobrada uma vez', depois.dinheiro === antes.dinheiro - taxa, `${antes.dinheiro} - ${taxa} != ${depois.dinheiro}`);
checa('o diário conta a adoção com o nome escolhido', depois.ultima.includes('Açucena do Café'), depois.ultima);
// O aviso que sobe depois da adoção é outra fronteira de texto, e vive três segundos — nenhuma
// auditoria de tela chega nele. Em português ele não pode dizer 'New Pet'.
const aviso = await page.evaluate(`document.getElementById('toast-root').innerText`);
checa('o aviso da adoção está no idioma do jogo', PT ? (/Bicho Novo/.test(aviso) && !/New Pet/.test(aviso)) : /New Pet/.test(aviso), aviso.replace(/\n/g, ' | '));

// ---- 5. o nome escolhido aparece em todo lugar ----------------------------------------------------
console.log('\n5. O nome escolhido aparece no resto do jogo');
await page.evaluate(`(() => { window.betlife.go('relationships'); })()`);
await espera(220);
const relac = await page.evaluate(`document.getElementById('game').innerText`);
checa('aparece em Relacionamentos', relac.includes('Açucena do Café'), relac.slice(0, 120).replace(/\n/g, ' | '));
await page.evaluate(`(() => { window.betlife.go('pets'); })()`);
await espera(220);
const telaBichos = await page.evaluate(`document.getElementById('game').innerText`);
checa('aparece na lista de bichos', telaBichos.includes('Açucena do Café'));
await page.evaluate(`(() => { window.betlife.go('main'); })()`);
await espera(220);
const diario = await page.evaluate(`document.getElementById('game').innerText`);
checa('aparece no diário da vida', diario.includes('Açucena do Café'));

// ---- 6. recarregar ---------------------------------------------------------------------------------
console.log('\n6. Recarregar a página');
await page.goto(RECARGA, { waitUntil: 'domcontentloaded' });
await espera(600);
const salvo = await foto();
checa('o nome sobrevive à recarga', salvo.bichos.includes('Açucena do Café'), JSON.stringify(salvo.bichos));

// ---- 7. adotar aceitando a sugestão ------------------------------------------------------------------
console.log('\n7. Adotar aceitando o nome sugerido');
await abreCartao(3, 0);                     // pet shop
const sugerido2 = (await cartao()).campo;
await confirma(0);
const comSugestao = await foto();
checa('o bicho entra com o nome sugerido quando o jogador não troca', comSugestao.bichos.includes(sugerido2), `${sugerido2} / ${JSON.stringify(comSugestao.bichos)}`);

// ---- 8. dois cliques na mesma adoção ------------------------------------------------------------------
console.log('\n8. Dois cliques seguidos');
await page.evaluate(`(() => { window.betlife.go('pets'); })()`);
await espera(150);
await page.evaluate(`(() => { const r = [...document.querySelectorAll('.bl-row')].filter((x) => x.dataset.target === 'petSource')[1]; if (r) r.click(); })()`);
await espera(200);
const antesDoDuplo = await foto();
await page.evaluate(`(() => { const r = [...document.querySelectorAll('.bl-row[data-action="adoptConfirm"]')][0]; r.click(); r.click(); r.click(); })()`);
await espera(450);
checa('três cliques abrem um cartão só', await page.evaluate(`document.querySelectorAll('#modal-root .bl-modal').length`) === 1);
await page.evaluate(`(() => { const b = document.querySelector('#modal-root .bl-modal-buttons [data-choice="0"]'); b.click(); b.click(); b.click(); })()`);
await espera(600);
const depoisDoDuplo = await foto();
checa('e adotam um bicho só', depoisDoDuplo.bichos.length === antesDoDuplo.bichos.length + 1, `${antesDoDuplo.bichos.length} -> ${depoisDoDuplo.bichos.length}`);

// ---- 9. as quatro casas -----------------------------------------------------------------------------
console.log('\n9. As quatro casas de adoção perguntam o nome');
// A casa já usada fica sem vaga (três bichos é o limite), então o estado volta ao zero antes.
await page.evaluate(`(() => { const st = window.betlife.getState(); st.relationships = st.relationships.filter((p) => p.role !== 'pet'); st.flags.adoptedFrom = []; })()`);
let casasOk = 0;
for (let i = 0; i < 4; i++) {
  if (!(await abreCartao(i, 0))) continue;
  const c = await cartao();
  if (c && c.campo && c.retrato && /chamar seu pet|call your pet/i.test(c.texto)) casasOk++;
  await confirma(1);
}
checa('as quatro casas abrem o cartão com campo de nome', casasOk === 4, `${casasOk}/4`);

checa('nenhum erro de página em todo o percurso', erros.length === 0, erros.slice(0, 2).join(' | '));
await navegador.close();
console.log(`\n${ok} ok, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
