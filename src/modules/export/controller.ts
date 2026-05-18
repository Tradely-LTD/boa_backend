import { Request, Response } from 'express';
import { db } from '../../db';
import { applicationsTable } from '../../db/schemas/applicationsSchema';
import { aggregationCentresTable } from '../../db/schemas/aggregationCentresSchema';

const printHtml = (title: string, headers: string[], rows: (string | number | null | undefined)[][]): string => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: Arial, sans-serif; font-size: 8.5px; color: #1e293b; background: #fff; }
    .page-header { background: #166534; color: #fff; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; }
    .page-header .brand { font-size: 13px; font-weight: bold; letter-spacing: 0.02em; }
    .page-header .subtitle { font-size: 8px; opacity: 0.8; margin-top: 2px; }
    .page-header .meta { text-align: right; font-size: 7.5px; opacity: 0.85; }
    .report-title { padding: 12px 20px 10px; border-bottom: 2px solid #166534; }
    .report-title h1 { font-size: 12px; font-weight: bold; color: #166534; }
    .report-title p { font-size: 7.5px; color: #64748b; margin-top: 2px; }
    .table-wrap { padding: 12px 20px 20px; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #166534; }
    th { text-align: left; padding: 5px 7px; font-size: 7.5px; text-transform: uppercase; letter-spacing: .06em; color: #fff; font-weight: 600; }
    td { padding: 5px 7px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 8px; color: #374151; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer { border-top: 1px solid #e2e8f0; padding: 8px 20px; font-size: 7px; color: #94a3b8; display: flex; justify-content: space-between; }
    @media print { @page { margin: 0.8cm; size: A4 landscape; } body { font-size: 7.5px; } }
  </style>
</head>
<body>
  <div class="page-header">
    <div>
      <div class="brand">Bank of Agriculture — AgriHub</div>
      <div class="subtitle">Federal Republic of Nigeria</div>
    </div>
    <div class="meta">
      Generated: ${new Date().toLocaleString('en-GB')}<br/>
      Confidential — Internal Use Only
    </div>
  </div>
  <div class="report-title">
    <h1>${title}</h1>
    <p>${rows.length} record${rows.length !== 1 ? 's' : ''} exported</p>
  </div>
  <div class="table-wrap">
    <table>
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c ?? '—'}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
  <div class="footer">
    <span>Bank of Agriculture — AgriHub Platform</span>
    <span>${title} — ${new Date().toLocaleDateString('en-GB')}</span>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

const escape = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines   = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  return lines.join('\n');
};

export const exportApplications = async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(applicationsTable);
    if (req.query.format === 'html') {
      const headers = ['Ref ID', 'Centre Name', 'Type', 'State', 'LGA', 'Status', 'Owner', 'Manager', 'Capacity (MT)', 'Date'];
      const data = rows.map(r => [r.refId, r.centreName, r.centreType, r.state, r.lga, r.status, r.ownerName, r.managerName, r.capacityMt, r.createdAt?.slice(0, 10)]);
      res.setHeader('Content-Type', 'text/html');
      return res.send(printHtml('BOA Applications Report', headers, data));
    }
    const csv  = toCsv(rows as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="boa-applications.csv"');
    return res.send(csv);
  } catch {
    return res.status(500).json({ success: false, message: 'Export failed.' });
  }
};

export const exportCentres = async (req: Request, res: Response) => {
  try {
    const rows = await db.select().from(aggregationCentresTable);
    if (req.query.format === 'html') {
      const headers = ['Ref ID', 'Centre Name', 'Type', 'State', 'LGA', 'Status', 'Owner', 'Manager', 'Capacity (MT)', 'Approved'];
      const data = rows.map(r => [r.refId, r.centreName, r.centreType, r.state, r.lga, r.status, r.ownerName, r.managerName, r.capacityMt, r.approvedAt?.slice(0, 10)]);
      res.setHeader('Content-Type', 'text/html');
      return res.send(printHtml('BOA Aggregation Centres Report', headers, data));
    }
    const csv  = toCsv(rows as any);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="boa-aggregation-centres.csv"');
    return res.send(csv);
  } catch {
    return res.status(500).json({ success: false, message: 'Export failed.' });
  }
};
