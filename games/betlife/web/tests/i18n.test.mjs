// Guarda da localização. Três invariantes, cada uma correspondendo a um jeito de o inglês voltar:
//
//   1. toda chave que o código manda para `t()` tem tradução em pt;
//   2. todo literal estático que chega à tela tem tradução — ou está na lista de nomes próprios;
//   3. nenhum módulo chama `t()` sem importar `t`.
//
// A terceira existe porque uma vez custou um `ReferenceError` em produção: o codemod converteu as
// frases do arquivo e não inseriu o import. `node --check` não pega isso, e a sintaxe estava certa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CATALOGO_PT } from '../game/i18n/catalogo-pt.js';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const catalogo = new Set(Object.keys(CATALOGO_PT));

// Nomes próprios do mundo do jogo: endereços, as redes sociais fictícias e o nome do próprio jogo.
// Não se traduzem, do mesmo jeito que não se traduz 'Harborview University'.
const NOMES_PROPRIOS = new Set(['14 Quiet Meadow Ln', '702 Ferry St', '18 Linden Row', '259 Birchfield Blvd',
  '3 Heron Point', 'Chirper', 'Streamly', 'SoundWave', 'Snapshot', 'BetLife',
  // marca e saudação multilíngue do cartão de idioma: não são frases a traduzir
  'AP CS Arcade', 'PLAYER+', 'Hello! Hola! Olá! Hallo!']);

function arquivos(dir) {
  const saida = [];
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === 'i18n' || nome === 'tests') continue;
    const cam = join(dir, nome);
    if (statSync(cam).isDirectory()) saida.push(...arquivos(cam));
    else if (nome.endsWith('.js')) saida.push(cam);
  }
  return saida;
}
const FONTES = arquivos(RAIZ).map((c) => [relative(RAIZ, c), readFileSync(c, 'utf8')]);
const desencapa = (s) => s.replace(/\\(['"\\])/g, '$1').replace(/\\n/g, '\n');

// Mesmo scanner de `tests/i18n-chaves.mjs`: o primeiro argumento de `t(...)`, inteiro, porque
// metade das chaves chega por condicional — `t(n === 1 ? 'uma' : 'várias')`.
function chavesDe(src) {
  const achadas = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== 't' || src[i + 1] !== '(') continue;
    if (/[\w$.]/.test(src[i - 1] || ' ')) continue;
    let j = i + 2, prof = 0;
    while (j < src.length) {
      const c = src[j];
      if (c === '(' || c === '[' || c === '{') { prof++; j++; continue; }
      if (c === ')' && prof === 0) break;
      if (c === ')' || c === ']' || c === '}') { prof--; j++; continue; }
      if (c === ',' && prof === 0) break;
      if (c === "'" || c === '"' || c === '`') {
        let k = j + 1, bruto = '';
        while (k < src.length && src[k] !== c) {
          if (src[k] === '\\') { bruto += src[k] + src[k + 1]; k += 2; continue; }
          bruto += src[k]; k++;
        }
        const comparacao = /(===|!==|==|!=)\s*$/.test(src.slice(Math.max(0, j - 6), j));
        if (c !== '`' && !comparacao && bruto) achadas.push(desencapa(bruto));
        j = k + 1; continue;
      }
      j++;
    }
  }
  return achadas;
}

test('every t() key in the source has a Portuguese translation', () => {
  const faltando = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js')) continue;   // `t` ali é o helper local de <text> do SVG
    for (const chave of chavesDe(src)) if (!catalogo.has(chave)) faltando.push(`${arq}: ${JSON.stringify(chave)}`);
  }
  assert.deepEqual(faltando, [], `sem tradução:\n${faltando.join('\n')}`);
});

test('every static interface literal is translated or a proper noun', () => {
  const PROPS = new Set(['name', 'sub', 'title', 'text', 'label', 'note', 'badge', 'pack', 'titleNote',
    'tagline', 'question', 'hint', 'breed', 'employer', 'reason', 'desc', 'description', 'summary', 'prompt',
  'band', 'bandRole', 'category']);
  const FUNCS = new Set(['row', 'section', 'note', 'empty', 'titleBar', 'infoRow', 'screen', 'toast',
    'info', 'addJournal', 't', 'pushModal']);
  const LIT = /(?<![\w$])(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
  const faltando = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js')) continue;
    for (const m of src.matchAll(LIT)) {
      const txt = desencapa(m[1] ?? m[2] ?? '');
      if (!txt || txt.length < 3 || catalogo.has(txt) || NOMES_PROPRIOS.has(txt)) continue;
      if (!/[A-Za-z]{3}/.test(txt)) continue;
      // identificador interno (`friendship`, `lifeStage`): uma unica palavra em minusculas ou
      // camelCase nunca e rotulo de tela. Rotulo de dado que parece isso ('student', 'retired')
      // ja esta no catalogo e foi descartado antes desta linha.
      if (/^[a-z][a-zA-Z0-9]*$/.test(txt)) continue;
      const antes = src.slice(Math.max(0, m.index - 40), m.index);
      const prop = antes.match(/(\w+)\s*:\s*$/);
      const fn = antes.match(/(\w+)\(\s*$/);
      if (!(prop && PROPS.has(prop[1])) && !(fn && FUNCS.has(fn[1])) && !/choices:\s*\[[^\]]*$/.test(antes)) continue;
      faltando.push(`${arq}: ${JSON.stringify(txt)}`);
    }
  }
  assert.deepEqual(faltando, [], `texto estático sem tradução:\n${faltando.join('\n')}`);
});

test('no module calls t() without importing it', () => {
  const quebrados = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js')) continue;
    if (!/(?<![\w$.])t\(/.test(src)) continue;
    const importa = /import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*['"][^'"]*i18n\/index\.js['"]/.test(src);
    const define = /(?:function|const|let)\s+t\b/.test(src);
    if (!importa && !define) quebrados.push(arq);
  }
  assert.deepEqual(quebrados, [], `usam t() sem importar: ${quebrados.join(', ')}`);
});

// Quarta invariante, a mais forte: NENHUMA prosa inglesa fica sem tradução em todo o código, nem
// dentro de um ternário, nem no meio de um `${}` — os dois pontos cegos que deixaram passar
// 'Go back to school' e 'Age: 0 years' nas rodadas anteriores.
//
// O que sobra é classificado à mão nas duas listas abaixo, e é exatamente a distinção que a
// auditoria pedia: nome próprio não se traduz; motivo de `statLog` nunca chega à tela (só ao
// console, por `betlife.statLog()`), então traduzi-lo seria trabalho sem efeito.
const NOMES_DO_MUNDO = new Set([
  "14 Quiet Meadow Ln",
  "18 Linden Row",
  "259 Birchfield Blvd",
  "3 Heron Point",
  "702 Ferry St",
  "Alex Carter",
  "BetLife",
  "Bluefield Analytics",
  "Bluefield Labs",
  "Bright Owl Tutoring",
  "Brightwave Media",
  "Buenos Aires",
  "Cape Town",
  "Cedar Grove Hospital",
  "Cedar Grove School of Medicine",
  "Chirper",
  "City of Harborview",
  "Clef & Fret Records",
  "Copper Kettle Diner",
  "Grand Lantern Hotel",
  "Halloran & Reyes LLP",
  "Halloran School of Law",
  "Harbor Herald Press",
  "Harbor Point High School",
  "Harbor Republic Air Force",
  "Harbor Republic Army",
  "Harbor Republic Coast Guard",
  "Harbor Republic Marines",
  "Harbor Republic Navy",
  "Harbor Space Agency",
  "Harborview City Council",
  "Harborview Comets",
  "Harborview Fire Department",
  "Harborview Graduate School",
  "Harborview Public Library",
  "Harborview University",
  "Ironwood Technical Institute",
  "Keystone Infrastructure",
  "Lantern Street Theatre",
  "Lantern Studio",
  "Ledger & Lane",
  "Lumen Solar",
  "Maple Grove Elementary",
  "Maple Street Market",
  "Mexico City",
  "Northwind Logistics",
  "Piston Brothers Garage",
  "Pixel Harbor Software",
  "Ridgeline Fitness",
  "Riverside Middle School",
  "Riverside School District",
  "Snapshot",
  "SoundWave",
  "Streamly",
  "Summit Partners",
  "Summit School of Business",
  "Sunny Cove Pool",
  "The Harbor Herald",
  "The Saffron Table",
  "Volt & Vine Electric"
]);
const MOTIVOS_DE_LOG = new Set([
  "HR complaint",
  "HR training",
  "abandoned",
  "adopted",
  "asked for help",
  "bank loan",
  "bought",
  "car trouble",
  "day with everyone",
  "driving licence",
  "dropped out",
  "drove the",
  "eye exam",
  "failed driving test",
  "flexible hours",
  "flip a coin",
  "freelance gig",
  "gave away",
  "graduated high school",
  "inheritance",
  "interest on debt",
  "job recruiter",
  "joined club",
  "left",
  "let go",
  "living costs",
  "living costs (debt)",
  "lost job",
  "maintenance for",
  "middle school",
  "money trouble",
  "moved on",
  "name change",
  "new baby",
  "new glasses",
  "new relationship",
  "paid off loan",
  "pocket money",
  "posted on",
  "program completed",
  "proposal declined",
  "raise refused",
  "renovated",
  "repaired",
  "resigned",
  "retired",
  "scrapped",
  "skipped class",
  "sold",
  "student loan",
  "team change",
  "took it easy at work",
  "trade certificate",
  "university degree",
  "work stress",
  "work warning",
  "worked harder",
  "year off",
  "yearly settlement"
]);

test('no untranslated English prose anywhere in the source', () => {
  const LIT = /(?<![\w$])(?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g;
  const TECNICO = /[/\\]|^\s|rgba?\(|url\(|#[0-9a-f]{3}|^bl-|\bbl-|^[Mm][-\d]|translate\(|scale\(|^top:|^betlife\.[a-z.]+$|^[a-z.]+\.(js|json|css)$|^\([a-z-]+:\s/;
  // Já em português (texto que este projeto escreveu em pt desde o começo) ou mensagem que só o
  // desenvolvedor vê, num `throw`.
  const JA_PT = /[áàâãéêíóôõúüç]/i;
  const NAO_E_INTERFACE = new Set(['Uma vida salva', 'event without id',
    'Mexico City, Mexico']);  // exemplo citado no comentario de traduzLocal()
  const ePalavra = (t) => (t.match(/[A-Za-z][A-Za-z'\u2019-]{1,}/g) || []).length >= 2;
  const faltando = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js') || arq.includes('i18n')) continue;
    for (const m of src.matchAll(LIT)) {
      const txt = desencapa(m[1] ?? m[2] ?? '');
      if (!txt || catalogo.has(txt) || NOMES_DO_MUNDO.has(txt) || MOTIVOS_DE_LOG.has(txt)) continue;
      if (JA_PT.test(txt) || NAO_E_INTERFACE.has(txt)) continue;
      if (!ePalavra(txt) || TECNICO.test(txt) || txt.includes('<') || txt.includes('${')) continue;
      if (!/^[A-Za-z$(\u2190]/.test(txt.trim())) continue;
      faltando.push(`${arq}: ${JSON.stringify(txt)}`);
    }
  }
  assert.deepEqual(faltando, [], `prosa inglesa sem traducao:\n${faltando.join('\n')}`);
});

// Quinta invariante: duas traduções diferentes para a MESMA chave em catálogos diferentes.
//
// Os catálogos são registrados em sequência, então o último a entrar ganha em silêncio. Foi assim
// que um 'Age': 'Envelhecer' acrescentado no fim sobrescreveu o 'Age': 'Idade' que já existia — e o
// efeito não foi só textual: a palavra maior estourou o botão redondo de envelhecer.
test('no key has two different translations across catalogues', async () => {
  const arquivos = ['frases', 'pessoas', 'narrativa', 'eventos', 'dados', 'sentencas', 'decisoes',
    'eventos-vida', 'resto'];
  const exporta = { frases: 'PT_FRASES', pessoas: 'PT_PESSOAS', narrativa: 'PT_NARRATIVA',
    eventos: 'PT_EVENTOS_FRASES', dados: 'PT_DADOS', sentencas: 'PT_SENTENCAS', decisoes: 'PT_DECISOES',
    'eventos-vida': 'PT_EVENTOS_VIDA', resto: 'PT_RESTO' };
  const visto = new Map();
  const conflitos = [];
  for (const f of arquivos) {
    const m = await import(`../game/i18n/pt/${f}.js`);
    for (const [k, v] of Object.entries(m[exporta[f]])) {
      const antes = visto.get(k);
      if (antes && antes.v !== v) conflitos.push(`${JSON.stringify(k)}: ${antes.f}=${JSON.stringify(antes.v)} vs ${f}=${JSON.stringify(v)}`);
      visto.set(k, { f, v });
    }
  }
  assert.deepEqual(conflitos, [], `traducoes conflitantes:\n${conflitos.join('\n')}`);
});

// Sexta invariante: nó de texto dentro de HTML cru.
//
// As outras cinco olham literais de string. Mas metade da interface é montada como template de HTML
// — `<button ...>Start a custom life!</button>` — e ali o texto não é um literal separado, é parte
// de uma cadeia maior que já contém `class=`, `data-action=` e expressões. Foi esse o maior ponto
// cego da rodada: 26 frases, entre elas o formulário inteiro de vida personalizada e os botões do
// cartão de morte.
test('no untranslated text node inside raw HTML templates', () => {
  // Remove o conteúdo de cada `${...}` e devolve só o texto literal do template.
  function soLiteral(tpl) {
    let fora = '', prof = 0;
    for (let i = 0; i < tpl.length; i++) {
      if (!prof && tpl.startsWith('${', i)) { prof = 1; fora += '\u0000'; i++; continue; }
      if (prof) {
        // Dentro da expressão conta TODA chave, porque `t('x', { n: 8 })` tem um objeto literal e o
        // `}` dele não fecha o `${`. Contar só `${`/`}` fazia o scanner sair cedo e tratar o resto
        // da expressão como se fosse texto da tela.
        if (tpl[i] === '{') prof++;
        else if (tpl[i] === '}') prof--;
        continue;
      }
      fora += tpl[i];
    }
    return fora;
  }
  const faltando = [];
  for (const [arq, src] of FONTES) {
    if (!arq.startsWith('ui/') && arq !== 'betlife.js') continue;
    for (const m of src.matchAll(/`(?:[^`\\]|\\.)*`/g)) {
      for (const [, bruto] of soLiteral(m[0].slice(1, -1)).matchAll(/>([^<>]+)</g)) {
        const txt = bruto.replaceAll('\u0000', '').trim();
        // ATENÇÃO: aqui NÃO se dispensa o que está no catálogo. Num nó de texto dentro do template
        // a tradução nunca é pedida — ter entrada no catálogo não muda nada, o inglês vai para a
        // tela do mesmo jeito. Foi assim que `<span>Bank Balance</span>` da tela inicial ficou em
        // inglês num jogo em português enquanto 'Bank Balance': 'Saldo' estava no catálogo.
        if (!txt || NOMES_DO_MUNDO.has(txt) || NOMES_PROPRIOS.has(txt)) continue;
        if (!/[A-Za-z]{3}/.test(txt)) continue;                 // número, símbolo, moeda
        if (/^[a-z][a-zA-Z0-9]*$/.test(txt)) continue;          // identificador interno
        if (/^[A-Z]+$/.test(txt) && txt.length <= 5) continue;  // 'BET', 'LIFE' da marca
        faltando.push(`${arq}: ${JSON.stringify(txt)}`);
      }
    }
  }
  assert.deepEqual(faltando, [], `texto em HTML cru sem traducao:\n${faltando.join('\n')}`);
});

// Sétima invariante: toda frase que tem par { m, f } precisa receber `_g` no ponto de origem.
//
// O par sozinho não basta. A fronteira do diário injeta o gênero do JOGADOR, mas só alcança frase
// que chega a ela sem tradução; frase com nome interpolado é traduzida na origem, e ali quem sabe
// de quem se fala é o chamador. Sem `_g` o par devolve o masculino em silêncio — foi exatamente o
// que aconteceu com "Você foi contratado como Bombeira".
test('every paired phrase passes _g at its call site', () => {
  const comPar = new Set(Object.entries(CATALOGO_PT).filter(([, v]) => v && typeof v === 'object').map(([k]) => k));
  const semG = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js') || arq.includes('i18n')) continue;
    for (const m of src.matchAll(/(?<![\w$.])t\(\s*'((?:[^'\\]|\\.)*)'/g)) {
      const chave = desencapa(m[1]);
      if (!comPar.has(chave)) continue;
      // avança até fechar a chamada e procura `_g` dentro dela
      let j = m.index + m[0].length, prof = 1;
      while (j < src.length && prof > 0) {
        const c = src[j];
        if (c === '(' || c === '[' || c === '{') prof++;
        else if (c === ')' || c === ']' || c === '}') prof--;
        j++;
      }
      if (!src.slice(m.index, j).includes('_g')) {
        semG.push(`${arq}: ${JSON.stringify(chave)}`);
      }
    }
  }
  assert.deepEqual(semG, [], `frase com par { m, f } sem _g na chamada:\n${semG.join('\n')}`);
});

// Oitava invariante: `_g` duas vezes no mesmo objeto.
//
// `{ _g: step.gender, whoName: ..., _g: c.who.gender }` é JavaScript válido: a segunda chave vence,
// sem aviso. Aconteceu de verdade nesta rodada, e a frase passou a concordar com a pessoa errada —
// o tipo de defeito que nenhum teste de texto pega, porque o texto sai perfeitamente gramatical.
test('no t() call passes _g twice in the same object', () => {
  const ruins = [];
  for (const [arq, src] of FONTES) {
    if (arq.endsWith('pictograms.js') || arq.includes('i18n')) continue;
    for (const m of src.matchAll(/(?<![\w$.])t\(/g)) {
      let j = m.index + m[0].length, prof = 1, chamada = '';
      while (j < src.length && prof > 0) {
        const c = src[j];
        if (c === '(' || c === '[' || c === '{') prof++;
        else if (c === ')' || c === ']' || c === '}') prof--;
        if (prof > 0) chamada += c;
        j++;
      }
      const quantos = (chamada.match(/\b_g\s*:/g) || []).length;
      if (quantos > 1) ruins.push(`${arq}: ${chamada.slice(0, 90)}`);
    }
  }
  assert.deepEqual(ruins, [], `_g repetido na mesma chamada:\n${ruins.join('\n')}`);
});

// Nona invariante: rótulo de UMA palavra.
//
// As invariantes de prosa exigem duas palavras, e a de contexto exige propriedade ou chamada. Um
// 'Nothing' dentro de um ternário não é nem uma coisa nem outra — e foi assim que a tela de
// finanças mostrou "Devendo: Nothing" num jogo inteiramente em português.
test('no untranslated single-word label in interface files', () => {
  // Marcas, siglas e as letras do exame de vista: não são frases.
  const NAO_E_ROTULO = new Set(['PLUS', 'EDITOR', 'PREMIUM', 'NOW', 'BET', 'LIFE', 'OK', 'EFHLTZ',
    'SourceGraphic', 'BetLife', 'Chirper', 'Snapshot', 'SoundWave', 'Streamly',
    // meses: o código guarda a forma capitalizada e `traduzData()` procura a minúscula
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December']);
  const faltando = [];
  for (const [arq, src] of FONTES) {
    if (!arq.startsWith('ui/') && !arq.startsWith('game/') && arq !== 'betlife.js') continue;
    if (arq.includes('i18n') || arq.endsWith('pictograms.js') || arq.endsWith('icons.js')) continue;
    // `life-generator.js` e `pets.js` são listas de nome próprio (pessoas, bichos, cidades):
    // centenas de palavras capitalizadas que não são rótulo de interface e não se traduzem.
    if (arq.endsWith('life-generator.js') || arq.endsWith('pets.js') || arq.endsWith('save.js')) continue;
    for (const m of src.matchAll(/(?<![\w$.])(?:'([A-Z][a-zA-Z]{2,15})'|"([A-Z][a-zA-Z]{2,15})")/g)) {
      const w = m[1] ?? m[2];
      if (catalogo.has(w) || NAO_E_ROTULO.has(w) || NOMES_DO_MUNDO.has(w) || NOMES_PROPRIOS.has(w)) continue;
      // valor de atributo técnico, não rótulo
      const antes = src.slice(Math.max(0, m.index - 30), m.index);
      if (/(data-|action|icon|target|kind|tone|band|feature|type|key|id)\s*[:=]\s*$/.test(antes)) continue;
      // literal comparado é valor, nunca rótulo de tela: `event.key !== 'Enter'`, `face === 'Tails'`.
      // Mesma dispensa que o extrator de chaves de `t()` já fazia por este mesmo motivo.
      if (/(===|!==|==|!=)\s*$/.test(antes)) continue;
      faltando.push(`${arq}: ${JSON.stringify(w)}`);
    }
  }
  assert.deepEqual(faltando, [], `rotulo de uma palavra sem traducao:\n${faltando.join('\n')}`);
});

// Décima invariante: o CARTÃO DE CONFIRMAÇÃO traduz o que recebe.
//
// Esta nasceu do pior tipo de falha de tradução que eu vi aqui: as frases estavam todas no
// catálogo — 'Adopt this pet?', 'Scrap it?', 'Delete account?' — e as nove invariantes anteriores
// passavam, porque elas verificam que a tradução EXISTE. O que faltava era o cartão pedir por ela:
// `Modals.confirm` escrevia `esc(opts.title)` sem `t()`, e toda confirmação do jogo aparecia em
// inglês dentro de um jogo inteiramente em português. A auditoria de tela não pegou porque esses
// cartões só existem depois de um clique, e ela varre telas.
//
// Então aqui a verificação é de comportamento, não de existência: entrega inglês à fronteira e
// exige que nada do inglês saia do outro lado.
test('the interface confirmation card translates everything it is handed', async () => {
  const { setLanguage } = await import('../game/i18n/index.js');
  const Modals = await import('../ui/modals.js');
  const entregue = { title: 'Adopt this pet?', text: 'A pet joins your family for life.', band: 'Pets',
    facts: [['Fee', 'Baby'], ['Bank Balance', 'Nothing']], choices: ['Adopt', 'Not now'],
    field: { label: 'What do you want to call your pet?', value: 'Mochi',
      hint: 'You can keep the suggested name or type your own.' } };
  setLanguage('pt');
  const html = Modals.confirm(entregue, { player: { gender: 'female' } });
  setLanguage('en');
  const cru = ['Adopt this pet?', 'A pet joins your family for life.', 'Pets', 'Fee', 'Baby',
    'Bank Balance', 'Nothing', 'Adopt', 'Not now', 'What do you want to call your pet?',
    'You can keep the suggested name or type your own.'];
  // 'Mochi' é o valor digitado: nome próprio, não se traduz. Se aparecer aqui é bug do teste.
  const sobrou = cru.filter((s) => s !== 'Mochi' && html.includes(s) && CATALOGO_PT[s] !== s);
  assert.deepEqual(sobrou, [], `o cartão devolveu em inglês:\n${sobrou.join('\n')}`);
  assert.ok(html.includes('Mochi'), 'o nome digitado tem de sobreviver intacto');
});

// Décima primeira invariante: o CATÁLOGO DE ATIVIDADES guarda chave, não frase pronta.
//
// Irmã da décima, e a mais traiçoeira das duas. `SUBMENUS` é montado no import do módulo, e no
// import `setLanguage()` ainda não rodou — então um `t()` ali devolve inglês e GRAVA o inglês na
// estrutura. Quando a frase tem número interpolado ('lives about 13 years'), o resultado nem
// chave é: nenhuma tradução vai alcançá-lo depois, em nenhum idioma. A lista inteira de bichos
// ficou assim, em inglês, dentro de um jogo em português.
test('the activity catalogue stores keys, not sentences already translated', async () => {
  const { CATEGORIES } = await import('../game/activities.js');
  const faltando = [];
  const olha = (txt, onde) => {
    if (!txt || typeof txt !== 'string' || !/[A-Za-z]{3}/.test(txt)) return;
    if (!catalogo.has(txt)) faltando.push(`${onde}: ${JSON.stringify(txt)}`);
  };
  for (const cat of CATEGORIES) {
    olha(cat.name, `${cat.id}.name`);
    olha(cat.sub, `${cat.id}.sub`);
    if (cat.action) { olha(cat.action.name, `${cat.id}.action.name`); olha(cat.action.sub, `${cat.id}.action.sub`); }
    for (const item of cat.items || []) { olha(item.name, `${cat.id}/${item.id}.name`); olha(item.sub, `${cat.id}/${item.id}.sub`); }
  }
  assert.deepEqual(faltando, [], `texto de atividade fora do catálogo:\n${faltando.join('\n')}`);
});

// Décima segunda invariante: toda frase entregue a `toast()` e a `ask()` está no catálogo.
//
// As duas são fronteiras que recebem texto cru de trinta lugares de `betlife.js`, e a segunda
// invariante não alcança as duas: ela exige que o literal esteja logo depois de `funcao(` ou de uma
// propriedade conhecida, e `toast(choice === 'pass' ? 'Passed!' : 'Not this time', ...)` não é nem
// uma coisa nem outra. 'Passed!' atravessou as onze invariantes anteriores: tem uma palavra só (a
// de prosa exige duas), termina em '!' (a de rótulo só aceita letras) e mora num ternário.
test('every phrase handed to toast() and ask() is in the catalogue', () => {
  const src = FONTES.find(([arq]) => arq === 'betlife.js')[1];
  // Propriedades que carregam identificador, não frase: ícone, tom, destino, ação.
  const PULAR = new Set(['icon', 'tone', 'kind', 'feature', 'do', 'game', 'target', 'secondary',
    'danger', 'person', 'traitSet', 'eventId']);
  const literaisDa = (nome) => {
    const achados = [];
    for (const m of src.matchAll(new RegExp(`(?<![\\w$.])${nome}\\(`, 'g'))) {
      let i = m.index + m[0].length, prof = 0;
      while (i < src.length) {
        const c = src[i];
        if (c === '(' || c === '[' || c === '{') { prof++; i++; continue; }
        if (c === ')' && prof === 0) break;
        if (c === ')' || c === ']' || c === '}') { prof--; i++; continue; }
        if (c === "'" || c === '"') {
          let j = i + 1, bruto = '';
          while (j < src.length && src[j] !== c) { if (src[j] === '\\') { bruto += src[j + 1]; j += 2; continue; } bruto += src[j]; j++; }
          const antes = src.slice(Math.max(0, i - 24), i);
          const prop = antes.match(/(\w+)\s*:\s*$/);
          if (bruto && !/(===|!==|==|!=)\s*$/.test(antes) && !(prop && PULAR.has(prop[1]))) achados.push(bruto);
          i = j + 1; continue;
        }
        i++;
      }
    }
    return achados;
  };
  const faltando = [];
  for (const nome of ['toast', 'ask']) {
    for (const txt of literaisDa(nome)) {
      if (!/[A-Za-z]{3}/.test(txt)) continue;
      if (/^[a-z][a-zA-Z0-9]*$/.test(txt)) continue;      // 'blue', 'green', 'star': tom e ícone
      if (catalogo.has(txt) || NOMES_PROPRIOS.has(txt) || NOMES_DO_MUNDO.has(txt)) continue;
      faltando.push(`${nome}(): ${JSON.stringify(txt)}`);
    }
  }
  assert.deepEqual(faltando, [], `frase de aviso fora do catálogo:\n${faltando.join('\n')}`);
});
