import type { ScheduleDayRow } from './scheduleMatrix';
import { formatPeriodLabel, formatScheduleDateLong } from './scheduleDates';
import {
  formatTimeRange,
  groupWorkingByDoctor,
} from './scheduleMatrix';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildWeeklyScheduleHtml(
  rows: ScheduleDayRow[],
  from: string,
  to: string,
  title = 'Расписание врачей',
): string {
  const bodyRows = rows.flatMap(({ date, working }) => {
    if (working.length === 0) {
      return [`<tr><td>${escapeHtml(formatScheduleDateLong(date))}</td><td colspan="3" class="muted">—</td></tr>`];
    }
    const groups = groupWorkingByDoctor(working);
    return groups.map((doc, index) => {
      const dateCell = index === 0
        ? `<td rowspan="${groups.length}">${escapeHtml(formatScheduleDateLong(date))}</td>`
        : '';
      const timesHtml = doc.slots
        .map((s) => escapeHtml(formatTimeRange(s.time_from, s.time_to)))
        .join('<br />');
      return `<tr>
        ${dateCell}
        <td>${escapeHtml(doc.full_name)}</td>
        <td>${escapeHtml(doc.specialty || '—')}</td>
        <td class="times">${timesHtml}</td>
      </tr>`;
    });
  }).join('');

  const generatedAt = new Date().toLocaleString('ru-RU');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; color: #1a1a1a; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .period { color: #555; margin: 0 0 20px; font-size: 14px; }
    .meta { color: #888; font-size: 12px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border: 1px solid #ccc; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; }
    .muted { color: #888; text-align: center; }
    .times { line-height: 1.45; white-space: nowrap; }
    @media print {
      body { margin: 12mm; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <p class="period">${escapeHtml(formatPeriodLabel(from, to))}</p>
  <p class="meta">Сформировано: ${escapeHtml(generatedAt)}</p>
  <table>
    <thead>
      <tr>
        <th style="width: 28%">Дата</th>
        <th style="width: 32%">Врач</th>
        <th style="width: 22%">Специальность</th>
        <th style="width: 18%">Время</th>
      </tr>
    </thead>
    <tbody>
      ${bodyRows}
    </tbody>
  </table>
  <p class="no-print meta" style="margin-top: 24px">Используйте «Печать» в браузере или Ctrl+P / Cmd+P</p>
</body>
</html>`;
}

export function downloadWeeklyScheduleHtml(html: string, from: string, to: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `raspisanie-vrachei_${from}_${to}.html`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printWeeklyScheduleHtml(html: string): void {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = 'none';
  document.body.appendChild(frame);

  const doc = frame.contentDocument ?? frame.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(frame);
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();

  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => document.body.removeChild(frame), 1000);
  };
}
