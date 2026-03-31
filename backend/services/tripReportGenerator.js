/**
 * Generates a Trip Report DOCX matching the image format:
 * Header: Vendor Name, Vehicle Type, Period
 * Top-right: Trip Amount, Extra OLT, Rate, Amount
 * Table: SR.NO, DATE, VEHICLE NO, CHA NAME, VEHICLE TYPE,
 *        OPENING TIME, MRB ARRIVAL TIME, CLOSING TIME,
 *        PER TRIP HRS, TOTAL HRS, G.T IN HRS, G.T IN HRS Charges
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageOrientation,
} = require('docx');

const fmt   = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtN  = (n) => Number(n || 0).toLocaleString('en-IN');
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' }) : '';

const border  = (c='000000', sz=6) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const noBorder = () => ({ style: BorderStyle.NIL, size: 0, color: 'FFFFFF' });
const allB = (c='000000', sz=6) => ({ top:border(c,sz), bottom:border(c,sz), left:border(c,sz), right:border(c,sz) });
const noB  = () => ({ top:noBorder(), bottom:noBorder(), left:noBorder(), right:noBorder() });

const r = (text, sz=14, bold=false, color='000000') => new TextRun({ text: String(text||''), font:'Calibri', size:sz, bold, color });

const p = (children, align=AlignmentType.LEFT) => new Paragraph({
  children: Array.isArray(children) ? children : [r(children,14)],
  alignment: align,
  spacing: { before: 0, after: 0, line: 240 },
});

const tc = (children, width, opts={}) => new TableCell({
  children: Array.isArray(children) ? children : [p(children, opts.align||AlignmentType.LEFT)],
  width: { size: width, type: WidthType.DXA },
  borders: opts.borders || allB(),
  shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  columnSpan: opts.span,
  margins: { top: 40, bottom: 40, left: 60, right: 60 },
});

const generateTripReportDocx = async (trip, customer) => {
  // ── LANDSCAPE: content width ≈ 14400 DXA (11" wide with 0.5" margins)
  const TW = 14400;

  // Column widths for the detail table (12 columns)
  const COLS = [500, 900, 1200, 1500, 1000, 900, 1100, 900, 900, 900, 900, 900];
  // Total = 11600, rest is padding

  const COL_HEADERS = [
    'SR.NO','DATE','VEHICLE NO','CHA NAME','VEHICLE\nTYPE',
    'OPENING\nTIME','MRB ARRIVAL\nTIME','CLOSING\nTIME',
    'PER TRIP\nHRS','TOTAL\nHRS','G.T IN\nHRS','G.T IN HRS\nCHARGES',
  ];

  const entries = trip.entries || [];

  // ── HEADER INFO ROWS ───────────────────────────────────────────────────────
  const infoTable = new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [1500, 3500, 2500, 2500, 2500, 1900],
    rows: [
      new TableRow({ children: [
        tc([p([r('Vendor Name',14,true)])],  1500, { borders: noB() }),
        tc([p([r(trip.vendorName||'LUCKY TRANSPORT SERVICES',14,true)])], 3500, { borders: noB() }),
        tc([p([r('',14)])], 2500, { borders: noB() }),
        tc([p([r('Details',14,true)])],  1400, { borders: allB('888888',4) }),
        tc([p([r('Rate',14,true)],AlignmentType.CENTER)],  1600, { borders: allB('888888',4) }),
        tc([p([r('Amount',14,true)],AlignmentType.RIGHT)], 1900, { borders: allB('888888',4) }),
      ]}),
      new TableRow({ children: [
        tc([p([r('Vehicle Type',14,true)])], 1500, { borders: noB() }),
        tc([p([r(trip.vehicleType||'',14)])], 3500, { borders: noB() }),
        tc([p([r(`TRIP AMOUNT`,14)])], 2500, { borders: noB() }),
        tc([p([r(fmtN(trip.tripAmount),14)],AlignmentType.CENTER)], 1400, { borders: allB('888888',4) }),
        tc([p([r(fmt(trip.ratePerTrip),14)],AlignmentType.RIGHT)], 1600, { borders: allB('888888',4) }),
        tc([p([r(fmt(trip.transportTotal),14)],AlignmentType.RIGHT)], 1900, { borders: allB('888888',4) }),
      ]}),
      new TableRow({ children: [
        tc([p([r('Period',14,true)])], 1500, { borders: noB() }),
        tc([p([r(`${fmtDate(trip.periodFrom)} TO ${fmtDate(trip.periodTo)}`,14)])], 3500, { borders: noB() }),
        tc([p([r(`Extra OLT Hrs`,14)])], 2500, { borders: noB() }),
        tc([p([r(fmt(trip.extraOltHrs),14)],AlignmentType.CENTER)], 1400, { borders: allB('888888',4) }),
        tc([p([r('185.27.00',14)],AlignmentType.RIGHT)], 1600, { borders: allB('888888',4) }),
        tc([p([r(fmt(trip.extraOltAmount),14)],AlignmentType.RIGHT)], 1900, { borders: allB('888888',4) }),
      ]}),
      new TableRow({ children: [
        tc([p([r('CHA INCLUDES:',12,true)])], 5000, { borders: noB(), span: 2 }),
        tc([p([r('ACC Monthly Pass',14)])], 2500, { borders: noB() }),
        tc([p([r('',14)])], 1400, { borders: noB() }),
        tc([p([r('',14)])], 1600, { borders: noB() }),
        tc([p([r(fmt(trip.accMonthlyPass),14)],AlignmentType.RIGHT)], 1900, { borders: allB('888888',4) }),
      ]}),
      new TableRow({ children: [
        tc([p([r('',14)])], 5000, { borders: noB(), span: 2 }),
        tc([p([r('Total Amount',14,true)])], 2500, { borders: noB() }),
        tc([p([r('',14)])], 1400, { borders: noB() }),
        tc([p([r('',14)])], 1600, { borders: noB() }),
        tc([p([r(fmt(trip.totalAmount),14,true)],AlignmentType.RIGHT)], 1900, { borders: allB('888888',4) }),
      ]}),
    ],
  });

  // ── COLUMN HEADER ROW ─────────────────────────────────────────────────────
  const headerRow = new TableRow({
    tableHeader: true,
    children: COL_HEADERS.map((h, i) => tc(
      [p([r(h, 13, true, '000000')], AlignmentType.CENTER)],
      COLS[i],
      { borders: allB('000000', 8), shade: 'C0C0C0' }
    )),
  });

  // ── DATA ROWS ─────────────────────────────────────────────────────────────
  const dataRows = entries.map((e, idx) => new TableRow({
    children: [
      tc([p([r(String(e.srNo ?? idx+1), 12)], AlignmentType.CENTER)], COLS[0]),
      tc([p([r(fmtDate(e.date), 12)], AlignmentType.CENTER)], COLS[1]),
      tc([p([r(e.vehicleNo||'', 12)])], COLS[2]),
      tc([p([r(e.chaName||'', 12)])], COLS[3]),
      tc([p([r(e.vehicleType||'', 12)], AlignmentType.CENTER)], COLS[4]),
      tc([p([r(e.openingTime||'', 12)], AlignmentType.CENTER)], COLS[5]),
      tc([p([r(e.mrbArrivalTime||'', 12)], AlignmentType.CENTER)], COLS[6]),
      tc([p([r(e.closingTime||'', 12)], AlignmentType.CENTER)], COLS[7]),
      tc([p([r(e.perTripHrs!=null ? String(e.perTripHrs):'', 12)], AlignmentType.CENTER)], COLS[8]),
      tc([p([r(e.totalHrs!=null ? String(e.totalHrs):'', 12)], AlignmentType.CENTER)], COLS[9]),
      tc([p([r(e.gtInHrs!=null ? String(e.gtInHrs):'', 12)], AlignmentType.RIGHT)], COLS[10]),
      tc([p([r(e.gtAmount!=null ? fmt(e.gtAmount):'', 12)], AlignmentType.RIGHT)], COLS[11]),
    ],
  }));

  // ── TOTAL ROW ─────────────────────────────────────────────────────────────
  const totalHrsSum  = entries.reduce((s,e) => s + (e.totalHrs||0), 0);
  const totalAmtSum  = entries.reduce((s,e) => s + (e.gtAmount||0), 0);

  const totalRow = new TableRow({
    children: [
      tc([p([r('TOTAL AMT', 13, true)], AlignmentType.RIGHT)], COLS.slice(0,10).reduce((a,b)=>a+b,0), { span: 10, borders: allB('000000',8), shade: 'E0E0E0' }),
      tc([p([r(fmt(totalHrsSum),13,true)],AlignmentType.RIGHT)], COLS[10], { borders: allB('000000',8), shade: 'E0E0E0' }),
      tc([p([r(fmt(totalAmtSum),13,true)],AlignmentType.RIGHT)], COLS[11], { borders: allB('000000',8), shade: 'E0E0E0' }),
    ],
  });

  const detailTable = new Table({
    width: { size: COLS.reduce((a,b)=>a+b,0), type: WidthType.DXA },
    columnWidths: COLS,
    rows: [headerRow, ...dataRows, totalRow],
  });

  // ── SIGNATURE ROW ─────────────────────────────────────────────────────────
  const sigTable = new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [7200, 7200],
    rows: [new TableRow({ children: [
      tc([p([r('DHL Representatives Sign', 14, true)])], 7200, { borders: noB() }),
      tc([p([r('Vendor Sign', 14, true)], AlignmentType.RIGHT)], 7200, { borders: noB() }),
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
        new Paragraph({ children: [new TextRun('')], spacing: { before: 80, after: 80 } }),
        detailTable,
        new Paragraph({ children: [new TextRun('')], spacing: { before: 120, after: 40 } }),
        sigTable,
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

module.exports = { generateTripReportDocx };
