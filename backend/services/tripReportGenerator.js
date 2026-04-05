/**
 * Trip Report DOCX Generator
 * Matches the image format: landscape table with all trip entries.
 */

let docxModule;
try {
  docxModule = require('docx');
} catch (e) {
  const paths = [
    '/home/claude/.npm-global/lib/node_modules/docx',
    '/usr/lib/node_modules/docx',
    '/usr/local/lib/node_modules/docx',
  ];
  for (const p of paths) { try { docxModule = require(p); break; } catch (_) {} }
  if (!docxModule) throw new Error('docx package not found. Run: npm install docx');
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageOrientation,
} = docxModule;

const fmt     = (n) => Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = (d) => { try { return d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'}) : ''; } catch(_){ return ''; } };

const nb  = () => ({ style: BorderStyle.NIL,    size: 0, color: 'FFFFFF' });
const sb  = (sz=6) => ({ style: BorderStyle.SINGLE, size: sz, color: '000000' });
const noB = () => ({ top:nb(), bottom:nb(), left:nb(), right:nb() });
const allB= (sz=6) => ({ top:sb(sz), bottom:sb(sz), left:sb(sz), right:sb(sz) });

const tc = (text, width, opts={}) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text: String(text||''), font:'Calibri', size: opts.size||14, bold: opts.bold||false, color: opts.color||'000000' })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before:0, after:0, line:240 },
  })],
  width: { size: width, type: WidthType.DXA },
  borders: opts.borders || allB(),
  shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  columnSpan: opts.span,
  margins: { top:40, bottom:40, left:60, right:60 },
});

const generateTripReportDocx = async (trip, customer) => {
  const t   = trip     || {};
  const cus = customer || {};

  // Column widths for landscape A4 (content ~14400 DXA)
  const COLS = [500, 900, 1200, 1500, 1000, 900, 1100, 900, 900, 900, 900, 900];
  const COLS_TOTAL = COLS.reduce((a,b)=>a+b,0); // 11600

  const COL_HEADERS = [
    'SR.NO','DATE','VEHICLE NO','CHA NAME','VEHICLE\nTYPE',
    'OPENING\nTIME','MRB ARRIVAL\nTIME','CLOSING\nTIME',
    'PER TRIP\nHRS','TOTAL\nHRS','G.T IN\nHRS','G.T IN HRS\nCHARGES',
  ];

  const entries = t.entries || t.trip_entries || [];

  // ── Info rows at top ──────────────────────────────────────────────────────
  const TW = 14400;

  const infoTable = new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [1500, 3500, 2500, 1400, 1600, 1900],
    rows: [
      new TableRow({ children: [
        tc('Vendor Name', 1500, { bold:true, borders:noB() }),
        tc(t.vendor_name||t.vendorName||'LUCKY TRANSPORT SERVICES', 3500, { bold:true, borders:noB() }),
        tc('', 2500, { borders:noB() }),
        tc('Details', 1400, { bold:true, borders:allB('888888',4), align:AlignmentType.CENTER }),
        tc('Rate', 1600, { bold:true, borders:allB('888888',4), align:AlignmentType.CENTER }),
        tc('Amount', 1900, { bold:true, borders:allB('888888',4), align:AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [
        tc('Vehicle Type', 1500, { bold:true, borders:noB() }),
        tc(t.vehicle_type||t.vehicleType||'', 3500, { borders:noB() }),
        tc('TRIP AMOUNT', 2500, { borders:noB() }),
        tc(String(t.trip_amount||t.tripAmount||0), 1400, { borders:allB('888888',4), align:AlignmentType.CENTER }),
        tc(fmt(t.rate_per_trip||t.ratePerTrip||0), 1600, { borders:allB('888888',4), align:AlignmentType.RIGHT }),
        tc(fmt(t.transport_total||t.transportTotal||0), 1900, { borders:allB('888888',4), align:AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [
        tc('Period', 1500, { bold:true, borders:noB() }),
        tc(`${fmtDate(t.period_from||t.periodFrom)} TO ${fmtDate(t.period_to||t.periodTo)}`, 3500, { borders:noB() }),
        tc('Extra OLT Hrs', 2500, { borders:noB() }),
        tc(fmt(t.extra_olt_hrs||t.extraOltHrs||0), 1400, { borders:allB('888888',4), align:AlignmentType.CENTER }),
        tc('185.27', 1600, { borders:allB('888888',4), align:AlignmentType.RIGHT }),
        tc(fmt(t.extra_olt_amount||t.extraOltAmount||0), 1900, { borders:allB('888888',4), align:AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [
        tc('CHA INCLUDES:', 5000, { bold:true, borders:noB(), span:2 }),
        tc('ACC Monthly Pass', 2500, { borders:noB() }),
        tc('', 1400, { borders:noB() }),
        tc('', 1600, { borders:noB() }),
        tc(fmt(t.acc_monthly_pass||t.accMonthlyPass||0), 1900, { borders:allB('888888',4), align:AlignmentType.RIGHT }),
      ]}),
      new TableRow({ children: [
        tc('', 5000, { borders:noB(), span:2 }),
        tc('Total Amount', 2500, { bold:true, borders:noB() }),
        tc('', 1400, { borders:noB() }),
        tc('', 1600, { borders:noB() }),
        tc(fmt(t.total_amount||t.totalAmount||0), 1900, { bold:true, borders:allB('888888',4), align:AlignmentType.RIGHT }),
      ]}),
    ],
  });

  // ── Column header row ──────────────────────────────────────────────────────
  const headerRow = new TableRow({
    tableHeader: true,
    children: COL_HEADERS.map((h, i) => tc(h, COLS[i], {
      bold: true, size: 13, borders: allB(8), shade: 'C0C0C0',
      align: AlignmentType.CENTER,
    })),
  });

  // ── Data rows ──────────────────────────────────────────────────────────────
  const dataRows = entries.map((e, idx) => new TableRow({
    children: [
      tc(String(e.srNo ?? e.sr_no ?? idx+1), COLS[0], { align:AlignmentType.CENTER }),
      tc(fmtDate(e.date||e.entry_date), COLS[1], { align:AlignmentType.CENTER }),
      tc(e.vehicleNo||e.vehicle_no||'', COLS[2] ),
      tc(e.chaName||e.cha_name||'', COLS[3] ),
      tc(e.vehicleType||e.vehicle_type||'', COLS[4], { align:AlignmentType.CENTER }),
      tc(e.openingTime||e.opening_time||'', COLS[5], { align:AlignmentType.CENTER }),
      tc(e.mrbArrivalTime||e.mrb_arrival_time||'', COLS[6], { align:AlignmentType.CENTER }),
      tc(e.closingTime||e.closing_time||'', COLS[7], { align:AlignmentType.CENTER }),
      tc(e.perTripHrs!=null?String(e.perTripHrs):e.per_trip_hrs!=null?String(e.per_trip_hrs):'', COLS[8], { align:AlignmentType.CENTER }),
      tc(e.totalHrs!=null?String(e.totalHrs):e.total_hrs!=null?String(e.total_hrs):'', COLS[9], { align:AlignmentType.CENTER }),
      tc(e.gtInHrs!=null?String(e.gtInHrs):e.gt_in_hrs!=null?String(e.gt_in_hrs):'', COLS[10], { align:AlignmentType.RIGHT }),
      tc(e.gtAmount!=null?fmt(e.gtAmount):e.gt_amount!=null?fmt(e.gt_amount):'', COLS[11], { align:AlignmentType.RIGHT }),
    ],
  }));

  // ── Total row ──────────────────────────────────────────────────────────────
  const totalHrs = entries.reduce((s,e)=>s+(+(e.totalHrs??e.total_hrs??0)),0);
  const totalAmt = entries.reduce((s,e)=>s+(+(e.gtAmount??e.gt_amount??0)),0);
  const labelWidth = COLS.slice(0,10).reduce((a,b)=>a+b,0);

  const totalRow = new TableRow({
    children: [
      tc('TOTAL AMT', labelWidth, { bold:true, size:13, span:10, borders:allB(8), shade:'E0E0E0', align:AlignmentType.RIGHT }),
      tc(String(totalHrs.toFixed(2)), COLS[10], { bold:true, borders:allB(8), shade:'E0E0E0', align:AlignmentType.RIGHT }),
      tc(fmt(totalAmt), COLS[11], { bold:true, borders:allB(8), shade:'E0E0E0', align:AlignmentType.RIGHT }),
    ],
  });

  const detailTable = new Table({
    width: { size: COLS_TOTAL, type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...dataRows, totalRow],
  });

  // ── Signature row ──────────────────────────────────────────────────────────
  const sigTable = new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [7200, 7200],
    rows: [new TableRow({ children: [
      tc('DHL Representatives Sign', 7200, { bold:true, size:14, borders:noB() }),
      tc('Vendor Sign', 7200, { bold:true, size:14, borders:noB(), align:AlignmentType.RIGHT }),
    ]})],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 500, right: 500, bottom: 500, left: 500 },
        },
      },
      children: [
        infoTable,
        new Paragraph({ spacing:{ before:80, after:80 }, children:[new TextRun('')] }),
        detailTable,
        new Paragraph({ spacing:{ before:120, after:40 }, children:[new TextRun('')] }),
        sigTable,
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

module.exports = { generateTripReportDocx };
