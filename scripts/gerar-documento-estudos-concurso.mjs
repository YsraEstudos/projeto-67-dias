import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const concursoDir = path.join(rootDir, 'CONCURSO');
const outputPath = path.join(rootDir, 'PLANO_ESTUDOS_CONCURSO_245_ITENS.md');

const loadPlanData = async () => {
  const esbuildPath = path.join(concursoDir, 'node_modules', 'esbuild', 'lib', 'main.js');
  const { build } = await import(pathToFileURL(esbuildPath).href);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'concurso-document-'));
  const entryPath = path.join(tempDir, 'entry.ts');
  const bundlePath = path.join(tempDir, 'entry.mjs');
  const seedPath = path.join(concursoDir, 'src', 'app', 'seed.ts');
  const topicsPath = path.join(concursoDir, 'src', 'data', 'topicSeeds.ts');
  const cleanModulePath = path.join(concursoDir, 'src', 'app', 'cleanConcursoModule.ts');

  fs.writeFileSync(
    entryPath,
    [
      `import { DAY_PLANS, TOPICS } from ${JSON.stringify(seedPath)};`,
      `import { TOPIC_SECTIONS } from ${JSON.stringify(topicsPath)};`,
      `import { buildCleanPlanContentItems } from ${JSON.stringify(cleanModulePath)};`,
      'export { DAY_PLANS, TOPICS, TOPIC_SECTIONS, buildCleanPlanContentItems };',
    ].join('\n'),
    'utf8',
  );

  try {
    await build({
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'es2022',
      entryPoints: [entryPath],
      outfile: bundlePath,
      logLevel: 'silent',
    });

    return await import(`${pathToFileURL(bundlePath).href}?cache=${Date.now()}`);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
};

const formatDate = (isoDate) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const cleanMarkdownText = (value) => value.replaceAll('|', '\\|').replaceAll('\n', ' ').trim();

const normalizeStudyKey = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/\b\d+\/\d+\b/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const isCalendarActivity = (item) =>
  /(revis[aã]o|simulado|reda[cç][aã]o|bateria|quest[oõ]es|fraqueza|tema|cards?|refor[cç]o|conforme erro|pegadinhas|m[eé]dio|leve|intro)/i.test(
    `${item.block.area} ${item.block.title}`,
  );

const groupForItem = (item) => {
  const text = normalizeStudyKey(`${item.block.area} ${item.block.title} ${item.block.detail}`);

  if (text.startsWith('pt') || text.includes('portugues') || text.includes('redacao')) {
    return { key: 'portugues', title: 'Língua Portuguesa e Redação' };
  }

  if (text.startsWith('rlm') || text.includes('raciocinio') || text.includes('matemat')) {
    return { key: 'rlm', title: 'Raciocínio Lógico-Matemático' };
  }

  if (text.startsWith('legis') || text.includes('lei ') || text.includes('lgpd') || text.includes('regimento')) {
    return { key: 'legislacao', title: 'Legislação e Normas' };
  }

  if (/(html|css|javascript|typescript|java|spring|angular|node|rest|soap|swagger|jwt|jpa|hibernate|webhook|mensageria|junit|mockito|arquitetura)/.test(text)) {
    return { key: 'desenvolvimento', title: 'Desenvolvimento Web e Linguagens' };
  }

  if (/(sql|pl sql|oracle|postgresql|banco|modelagem|data warehouse|data mining|olap|pytorch|keras|scikit|machine learning|roc|supervisionado|preditivo)/.test(text)) {
    return { key: 'dados', title: 'Inteligência Artificial, Dados e Banco de Dados' };
  }

  if (/(docker|kubernetes|rancher|jenkins|maven|git|gitlab|gitflow|oauth|sso|keycloak|ci cd|proxy reverso|linux|windows|active directory|powershell|processo|thread|memoria|paginacao|virtualizacao|filesystem|raid|backup|san|smb|nfs|armazenamento)/.test(text)) {
    return { key: 'infraestrutura', title: 'DevOps, Infraestrutura e Sistemas' };
  }

  return { key: 'seguranca', title: 'Redes, Segurança, Nuvem e Governança de TI' };
};

const buildUniqueCatalog = ({ topics, studyItems, topicSections }) => {
  const topicsById = new Map(topics.map((topic) => [topic.id, topic]));
  const unique = new Map();

  studyItems.filter((item) => !isCalendarActivity(item)).forEach((item) => {
    const group = groupForItem(item);
    const key = `${group.key}::${normalizeStudyKey(item.block.title)}`;
    const current = unique.get(key);
    const targetTitles = (item.block.contentTargets ?? [])
      .map((target) => topicsById.get(target.topicId)?.title ?? target.sourceTitle)
      .filter(Boolean);

    if (current) {
      current.references.push(...targetTitles);
      current.details.push(item.block.detail);
      return;
    }

    unique.set(key, {
      key,
      group,
      area: item.block.area,
      title: item.block.title.replace(/\b\d+\/\d+\b/g, '').replace(/\s{2,}/g, ' ').trim(),
      details: item.block.detail ? [item.block.detail] : [],
      references: targetTitles,
    });
  });

  const officialWritingItem = topicSections
    .flatMap((section) => section.items)
    .find((item) => item === 'Adequação da linguagem ao tipo de documento.');

  if (officialWritingItem) {
    unique.set('portugues::redacao oficial', {
      key: 'portugues::redacao oficial',
      group: { key: 'portugues', title: 'Língua Portuguesa e Redação' },
      area: 'PT',
      title: 'Redação oficial e adequação da linguagem ao tipo de documento',
      details: [],
      references: [officialWritingItem],
    });
  }

  return [...unique.values()]
    .map((item) => ({
      ...item,
      details: [...new Set(item.details.filter(Boolean))],
      references: [...new Set(item.references)],
    }))
    .sort((left, right) => left.group.title.localeCompare(right.group.title, 'pt-BR') || left.title.localeCompare(right.title, 'pt-BR'));
};

const buildMarkdown = ({ topics, topicSections, studyItems }) => {
  const catalog = buildUniqueCatalog({ topics, topicSections, studyItems });
  const catalogByGroup = catalog.reduce((map, item) => {
    const current = map.get(item.group.key) ?? { title: item.group.title, items: [] };
    current.items.push(item);
    map.set(item.group.key, current);
    return map;
  }, new Map());
  const practices = [
    'Revisões espaçadas e recuperação dos pontos fracos.',
    'Simulados completos com correção detalhada.',
    'Redação discursiva e reescrita orientada.',
    'Baterias de questões por matéria e por banca.',
    'Registro de erros, cartões e pendências de estudo.',
  ];
  const lines = [
    '# Plano de Estudos do Concurso Público',
    '',
    '## Catálogo consolidado de matérias',
    '',
    'Documento separado por área, com cada assunto listado uma única vez. As repetições do calendário, como revisões, simulados e redações numeradas, foram consolidadas em práticas complementares.',
    '',
    '| Indicador | Quantidade |',
    '| --- | ---: |',
    `| Matérias e assuntos únicos | ${catalog.length} |`,
    '| Práticas complementares | 5 |',
    `| Itens de estudo acompanháveis | ${catalog.length + practices.length} |`,
    '',
    'Use as caixas de seleção para acompanhar teoria, questões e revisão de cada assunto.',
    '',
  ];

  let itemNumber = 1;
  const groupOrder = ['portugues', 'rlm', 'legislacao', 'desenvolvimento', 'dados', 'infraestrutura', 'seguranca'];
  const orderedGroups = groupOrder
    .map((key) => catalogByGroup.get(key))
    .filter((group) => group);

  orderedGroups.forEach((group, groupIndex) => {
    lines.push(`## ${groupIndex + 1}. ${group.title}`);
    lines.push('');
    for (const item of group.items) {
      const details = item.details.length > 0 ? ` - ${cleanMarkdownText(item.details[0])}` : '';
      lines.push(`- [ ] **MAT-${String(itemNumber).padStart(3, '0')}** ${cleanMarkdownText(item.title)}${details}`);
      itemNumber += 1;
    }
    lines.push('');
  });

  lines.push('## Práticas complementares');
  lines.push('');
  practices.forEach((practice, index) => {
    lines.push(`- [ ] **PRAT-${String(index + 1).padStart(2, '0')}** ${practice}`);
  });
  lines.push('');
  lines.push('## Rotina sugerida');
  lines.push('');
  lines.push('1. Estude a teoria e faça um resumo curto ou cartões de revisão.');
  lines.push('2. Resolva questões da banca e registre os erros.');
  lines.push('3. Revise o assunto em intervalos espaçados.');
  lines.push('4. Use simulados e redações para medir o desempenho geral.');
  lines.push('');
  lines.push('## Fonte e critério');
  lines.push('');
  lines.push('- Fonte dos temas: `CONCURSO/src/data/topicSeeds.ts`.');
  lines.push('- Fonte dos blocos: `CONCURSO/src/data/manualDailyPlan.ts`.');
  lines.push('- Deduplicação: mesma área e mesmo título após normalizar acentos, caixa e numeração de recorrência.');
  lines.push(`- Documento gerado em ${formatDate('2026-07-22')}.`);
  lines.push('');

  return { markdown: lines.join('\n'), catalogCount: catalog.length, totalCount: catalog.length + practices.length };
};

const main = async () => {
  const { DAY_PLANS, TOPICS, TOPIC_SECTIONS, buildCleanPlanContentItems } = await loadPlanData();
  const studyItems = buildCleanPlanContentItems(DAY_PLANS);
  const result = buildMarkdown({ topics: TOPICS, topicSections: TOPIC_SECTIONS, studyItems });
  if (result.totalCount !== 245) {
    throw new Error(`Contagem inesperada de itens consolidados: ${result.totalCount}. Esperado: 245.`);
  }
  fs.writeFileSync(outputPath, result.markdown, 'utf8');
  console.log(`Documento gerado: ${outputPath}`);
  console.log(`Matérias únicas: ${result.catalogCount}`);
  console.log(`Itens totais com práticas: ${result.totalCount}`);
};

await main();
