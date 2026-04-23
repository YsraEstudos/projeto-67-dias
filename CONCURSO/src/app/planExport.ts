import { getLocalTodayIsoDate, parseIsoDate } from './dateUtils';
import { formatIsoDatePtBr, subjectLabel, workActivityLabel } from './formatters';
import { getManualBlockContentSummary } from './manualPlanContentRefs';
import type { DayPlan } from './types';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const weekdayShortLabel = (isoDate: string): string =>
  new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    timeZone: 'UTC',
  }).format(parseIsoDate(isoDate));

const monthLongLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const eventLabel = (plan: DayPlan): string => {
  if (plan.hasSimulado && plan.hasRedacao) {
    return 'Simulado + Redacao';
  }

  if (plan.hasSimulado) {
    return 'Simulado';
  }

  if (plan.hasRedacao) {
    return 'Redacao';
  }

  return 'Sem evento especial';
};

const planModeLabel = (plan: DayPlan): string =>
  plan.planMode === 'manual' ? `Manual (Semana ${plan.weekNumber ?? '-'})` : 'Automatico';

const visibleBlocks = (plan: DayPlan): string[] => {
  if (plan.isRestDay) {
    return ['Domingo de descanso fixo'];
  }

  if (plan.planMode === 'manual' && plan.manualBlocks && plan.manualBlocks.length > 0) {
    return plan.manualBlocks.map((block) => {
      const movedSuffix = block.movedFromSunday ? ' [realocado do domingo]' : '';
      const contentSuffix = (() => {
        const refsSummary = getManualBlockContentSummary(block);
        const formattedRefsSummary = refsSummary?.replaceAll(' | ', ' / ');
        return formattedRefsSummary ? ` | Conteúdo programático: ${formattedRefsSummary}` : '';
      })();
      return `${block.area}: ${block.title} - ${block.detail}${contentSuffix}${movedSuffix}`;
    });
  }

  return [
    `Materia: ${subjectLabel(plan.subjects[0])} (bloco principal)`,
    `Materia: ${subjectLabel(plan.subjects[1])} (bloco principal)`,
    `Trabalho: ${workActivityLabel(plan.workActivity)} (bloco rotativo)`,
  ];
};

const fileTimestamp = (): string => getLocalTodayIsoDate();

const downloadTextFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const buildFullPlanMarkdown = (dayPlans: DayPlan[]): string => {
  const orderedPlans = [...dayPlans].sort((left, right) => left.date.localeCompare(right.date));
  const firstDate = orderedPlans[0]?.date ?? '';
  const lastDate = orderedPlans[orderedPlans.length - 1]?.date ?? '';
  const totalSimulados = orderedPlans.filter((plan) => plan.hasSimulado).length;
  const totalRedacoes = orderedPlans.filter((plan) => plan.hasRedacao).length;

  const monthKeys = [...new Set(orderedPlans.map((plan) => plan.monthKey))];
  const lines: string[] = [
    '# Plano Completo de Estudos',
    '',
    `Periodo: ${formatIsoDatePtBr(firstDate)} a ${formatIsoDatePtBr(lastDate)}`,
    `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    `Simulados planejados: ${totalSimulados}`,
    `Redacoes planejadas: ${totalRedacoes}`,
    '',
  ];

  for (const monthKey of monthKeys) {
    lines.push(`## ${monthLongLabel(monthKey)}`);
    lines.push('');

    const monthPlans = orderedPlans.filter((plan) => plan.monthKey === monthKey);
    for (const plan of monthPlans) {
      lines.push(
        `### ${weekdayShortLabel(plan.date)} ${formatIsoDatePtBr(plan.date)} | ${planModeLabel(plan)} | ${eventLabel(plan)}`,
      );
      lines.push(`- Meta de questoes objetivas: ${plan.targets.objectiveQuestions}`);
      for (const block of visibleBlocks(plan)) {
        lines.push(`- ${block}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
};

const buildFullPlanHtml = (dayPlans: DayPlan[]): string => {
  const orderedPlans = [...dayPlans].sort((left, right) => left.date.localeCompare(right.date));
  const firstDate = orderedPlans[0]?.date ?? '';
  const lastDate = orderedPlans[orderedPlans.length - 1]?.date ?? '';
  const totalSimulados = orderedPlans.filter((plan) => plan.hasSimulado).length;
  const totalRedacoes = orderedPlans.filter((plan) => plan.hasRedacao).length;
  const monthKeys = [...new Set(orderedPlans.map((plan) => plan.monthKey))];

  const monthSections = monthKeys
    .map((monthKey) => {
      const rows = orderedPlans
        .filter((plan) => plan.monthKey === monthKey)
        .map((plan) => {
          const blocks = visibleBlocks(plan)
            .map((block) => `<li>${escapeHtml(block)}</li>`)
            .join('');

          return `
            <article class="day">
              <h3>${escapeHtml(weekdayShortLabel(plan.date))} ${escapeHtml(formatIsoDatePtBr(plan.date))}</h3>
              <p class="meta">${escapeHtml(planModeLabel(plan))} | ${escapeHtml(eventLabel(plan))} | Questoes: ${plan.targets.objectiveQuestions}</p>
              <ul>${blocks}</ul>
            </article>
          `;
        })
        .join('');

      return `<section><h2>${escapeHtml(monthLongLabel(monthKey))}</h2>${rows}</section>`;
    })
    .join('');

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Plano Completo de Estudos</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
          h1 { margin: 0 0 8px; }
          h2 { margin: 28px 0 10px; padding-bottom: 4px; border-bottom: 1px solid #d1d5db; text-transform: capitalize; }
          h3 { margin: 0 0 6px; font-size: 15px; }
          p { margin: 4px 0; }
          .summary { margin-bottom: 16px; font-size: 14px; }
          .day { margin: 0 0 12px; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .meta { color: #374151; font-size: 13px; }
          ul { margin: 8px 0 0 18px; padding: 0; }
          li { margin: 2px 0; font-size: 13px; }
          @media print { body { margin: 12mm; } .day { break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h1>Plano Completo de Estudos</h1>
        <div class="summary">
          <p><strong>Periodo:</strong> ${escapeHtml(formatIsoDatePtBr(firstDate))} a ${escapeHtml(formatIsoDatePtBr(lastDate))}</p>
          <p><strong>Gerado em:</strong> ${escapeHtml(new Date().toLocaleString('pt-BR'))}</p>
          <p><strong>Simulados:</strong> ${totalSimulados} | <strong>Redacoes:</strong> ${totalRedacoes}</p>
        </div>
        ${monthSections}
      </body>
    </html>
  `;
};

export const exportFullPlanAsMarkdown = (dayPlans: DayPlan[]): void => {
  const content = buildFullPlanMarkdown(dayPlans);
  const filename = `plano-completo-${fileTimestamp()}.md`;
  downloadTextFile(content, filename, 'text/markdown;charset=utf-8');
};

export const exportFullPlanAsPdf = (dayPlans: DayPlan[]): void => {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) {
    throw new Error('Popup bloqueado. Permita popups para gerar o PDF.');
  }

  printWindow.document.write(buildFullPlanHtml(dayPlans));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
