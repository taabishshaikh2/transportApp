/**
 * Generates a filled Lucky Transport Services TAX INVOICE as a .docx Buffer.
 * Matches the BLANK_INVOICE.doc template exactly.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageOrientation, UnderlineType,
} = require('docx');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const toWords = (num) => {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const convert = (n) => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n/10)] + (n % 10 ? ' ' + ones[n%10] : '');
    if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + convert(n%100) : '');
    if (n < 100000) return convert(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' ' + convert(n%1000) : '');
    if (n < 10000000) return convert(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' ' + convert(n%100000) : '');
    return convert(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' ' + convert(n%10000000) : '');
  };
  const integer = Math.floor(num);
  const decimal = Math.round((num - integer) * 100);
  let result = convert(integer) + ' Rupees';
  if (decimal > 0) result += ' and ' + convert(decimal) + ' Paise';
  return result + ' Only';
};

// ─── Style helpers ────────────────────────────────────────────────────────────
const FONT = 'Cambria';
const FONT_HEAD = 'Bookman Old Style';
const NAVY  = '17365D';
const GOLD  = '948A54';
const BLACK = '000000';

const run = (text, opts = {}) => new TextRun({
  text,
  font: opts.font || FONT,
  size: opts.size || 20,
  bold: opts.bold || false,
  color: opts.color || BLACK,
  underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  italics: opts.italic || false,
});

const para = (children, opts = {}) => new Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: opts.align || AlignmentType.LEFT,
  spacing: { line: 276, before: opts.before || 0, after: opts.after || 0 },
});

const border = (color = BLACK, sz = 8) => ({ style: BorderStyle.SINGLE, size: sz, color });
const noBorder = () => ({ style: BorderStyle.NIL, size: 0, color: 'FFFFFF' });
const allBorders = (c, sz) => ({ top: border(c,sz), bottom: border(c,sz), left: border(c,sz), right: border(c,sz) });
const bottomBorder = (c='000000', sz=8) => ({ top: noBorder(), bottom: border(c,sz), left: noBorder(), right: noBorder() });
const noAllBorders = () => ({ top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() });

const cell = (children, opts = {}) => new TableCell({
  children: Array.isArray(children) ? children : [para(children)],
  width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
  columnSpan: opts.span,
  rowSpan: opts.rowSpan,
  borders: opts.borders || noAllBorders(),
  shading: opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  verticalAlign: opts.vAlign || VerticalAlign.CENTER,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
});

// ─── Main generator ───────────────────────────────────────────────────────────
const generateInvoiceDocx = async (invoice, customer, trip, company) => {
  const cgst   = invoice.cgstAmount || 0;
  const sgst   = invoice.sgstAmount || 0;
  const roundOff = invoice.roundOff || 0;
  const subTotal = invoice.baseAmount + cgst + sgst + roundOff;

  // ── PAGE WIDTH: A4 portrait (9026 DXA content at 1" margins)
  const TOTAL_W = 9700;

  // ── HEADER ────────────────────────────────────────────────────────────────
  const headerSection = [
    // Company Name
    para([run(company.name || 'LUCKY TRANSPORT SERVICES', { font: FONT_HEAD, size: 52, bold: true, color: NAVY })], { align: AlignmentType.CENTER }),
    para([run(company.tagline || 'TRANSPORT CONTRACTORS & COMMISSION AGENT', { font: FONT_HEAD, size: 22, bold: true, color: GOLD })], { align: AlignmentType.CENTER }),
    para([run(company.address || '', { font: FONT, size: 20 })], { align: AlignmentType.CENTER }),
    para([
      run('Email: ', { size: 20 }),
      run(company.email || '', { size: 20, underline: true }),
      run(`  Tel: ${company.phone || ''}  Mob: ${company.mobile || ''}`, { size: 20 }),
    ], { align: AlignmentType.CENTER }),
    // Horizontal rule via bottom-border paragraph
    new Paragraph({
      children: [run('')],
      border: { bottom: border(BLACK, 18) },
      spacing: { before: 60, after: 60 },
    }),
    para([run('TAX INVOICE', { font: FONT_HEAD, size: 28, bold: true })], { align: AlignmentType.CENTER, before: 80 }),
  ];

  // ── INVOICE META TABLE (Invoice Number / Date / Invoiced To) ──────────────
  const metaTable = new Table({
    width: { size: TOTAL_W, type: WidthType.DXA },
    columnWidths: [2400, 2200, 1800, 3300],
    borders: { insideH: noBorder(), insideV: noBorder() },
    rows: [
      new TableRow({ children: [
        cell([para([run('Invoice Number:', { bold: true, size: 20 })])], { width: 2400 }),
        cell([para([run(invoice.invoiceNumber || '', { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: bottomBorder() }),
        cell([para([run('Invoiced To:', { bold: true, size: 20 })])], { width: 1800 }),
        cell([para([run(customer.companyName || '', { size: 20 })])], { width: 3300, borders: bottomBorder() }),
      ]}),
      new TableRow({ children: [
        cell([para([run('Invoice Date:', { bold: true, size: 20 })])], { width: 2400 }),
        cell([para([run(fmtDate(invoice.invoiceDate), { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: bottomBorder() }),
        cell([para([run('Address:', { bold: true, size: 20 })])], { width: 1800 }),
        cell([para([run(customer.address || customer.city || '', { size: 20 })])], { width: 3300, borders: bottomBorder() }),
      ]}),
      new TableRow({ children: [
        cell([para([run('Invoice Period From:', { bold: true, size: 18 })])], { width: 2400 }),
        cell([para([run(fmtDate(invoice.periodFrom), { size: 18 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: bottomBorder() }),
        cell([para([run('Due Date:', { bold: true, size: 20 })])], { width: 1800 }),
        cell([para([run(fmtDate(invoice.dueDate), { size: 20 })])], { width: 3300, borders: bottomBorder() }),
      ]}),
      new TableRow({ children: [
        cell([para([run('Invoice Period To:', { bold: true, size: 18 })])], { width: 2400 }),
        cell([para([run(fmtDate(invoice.periodTo), { size: 18 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: bottomBorder() }),
        cell([para([run('Location:', { bold: true, size: 20 })])], { width: 1800 }),
        cell([para([run(invoice.location || '', { size: 20 })])], { width: 3300, borders: bottomBorder() }),
      ]}),
    ],
  });

  // ── GSTIN / SAC / STATE row ───────────────────────────────────────────────
  const gstinTable = new Table({
    width: { size: TOTAL_W, type: WidthType.DXA },
    columnWidths: [2700, 2200, 2400, 2400],
    rows: [
      new TableRow({ children: [
        cell([para([run(`GSTIN : ${company.gstin || ''}`, { bold: true, size: 18 })])], { width: 2700, borders: allBorders() }),
        cell([para([run(`DHL GSTIN: ${invoice.dhlGstin || customer.dhlGstin || ''}`, { size: 18 })])], { width: 2200, borders: allBorders() }),
        cell([para([run(`SAC NO : ${invoice.sacNo || '996601'}`, { size: 18 })])], { width: 2400, borders: allBorders() }),
        cell([para([run(`STATE : ${invoice.state || 'Maharashtra'}  CODE: ${invoice.stateCode || '27'}`, { size: 18 })])], { width: 2400, borders: allBorders() }),
      ]}),
      new TableRow({ children: [
        cell([para([run(`PLACE OF SUPPLY: ${invoice.placeOfSupply || 'MUMBAI, MAHARASHTRA'}  STATE CODE: ${invoice.stateCode || '27'}`, { bold: true, size: 18 })])], { width: TOTAL_W, borders: allBorders() }),
      ].slice(0,1), }),
    ],
  });
  // Workaround — place of supply spans full row via single cell
  const placeRow = new Table({
    width: { size: TOTAL_W, type: WidthType.DXA },
    columnWidths: [TOTAL_W],
    rows: [new TableRow({ children: [
      cell([para([run(`PLACE OF SUPPLY: ${invoice.placeOfSupply || 'MUMBAI, MAHARASHTRA'}   STATE CODE: ${invoice.stateCode || '27'}`, { bold: true, size: 18 })])], { width: TOTAL_W, borders: allBorders() }),
    ]})],
  });

  // ── DESCRIPTION TABLE ─────────────────────────────────────────────────────
  const descTable = new Table({
    width: { size: TOTAL_W, type: WidthType.DXA },
    columnWidths: [7500, 2200],
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: [
          cell([para([run('DESCRIPTIONS & PARTICULARS', { bold: true, size: 20 })])], { width: 7500, borders: allBorders(BLACK,12), shade: 'D9D9D9' }),
          cell([para([run('AMOUNT (INR)', { bold: true, size: 20 })], { align: AlignmentType.CENTER })], { width: 2200, borders: allBorders(BLACK,12), shade: 'D9D9D9' }),
        ],
      }),
      // Description row
      new TableRow({ children: [
        cell([
          para([run('Local Transportation charges for Adhoc truck & jeep vehicle services', { size: 20 })]),
          para([run(`provided for ACC to MIDC Inbound Cargo (${invoice.vehicleTypeDesc || trip?.vehicleType || ''})`, { size: 20 })]),
          para([run(`for the month of ${invoice.invoiceMonth || ''}`, { size: 20 })]),
        ], { width: 7500, borders: allBorders() }),
        cell([
          para([run('₹', { size: 20 })]),
          para([run(fmt(invoice.baseAmount), { size: 20, bold: true })], { align: AlignmentType.RIGHT }),
        ], { width: 2200, borders: allBorders() }),
      ]}),
      // Total Amount label
      new TableRow({ children: [
        cell([para([run('Total Amount', { bold: true, size: 20 })])], { width: 7500, borders: allBorders() }),
        cell([para([run(fmt(invoice.baseAmount), { bold: true, size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders() }),
      ]}),
    ],
  });

  // ── TAX SUMMARY TABLE ─────────────────────────────────────────────────────
  const taxTable = new Table({
    width: { size: TOTAL_W, type: WidthType.DXA },
    columnWidths: [7500, 2200],
    rows: [
      new TableRow({ children: [
        cell([para([run('Taxable Value', { size: 20 })])], { width: 7500, borders: allBorders() }),
        cell([para([run(fmt(invoice.baseAmount), { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders() }),
      ]}),
      new TableRow({ children: [
        cell([para([run(`Add Tax : CGST @ ${invoice.cgstRate || 9}%`, { size: 20 })])], { width: 7500, borders: allBorders() }),
        cell([para([run(fmt(cgst), { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders() }),
      ]}),
      new TableRow({ children: [
        cell([para([run(`Add Tax : SGST @ ${invoice.sgstRate || 9}%`, { size: 20 })])], { width: 7500, borders: allBorders() }),
        cell([para([run(fmt(sgst), { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders() }),
      ]}),
      new TableRow({ children: [
        cell([para([run('Round Off : (+/-)', { size: 20 })])], { width: 7500, borders: allBorders() }),
        cell([para([run(fmt(roundOff), { size: 20 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders() }),
      ]}),
      new TableRow({ children: [
        cell([para([run('Sub Total Amount', { bold: true, size: 22 })])], { width: 7500, borders: allBorders(BLACK,12), shade: 'D9D9D9' }),
        cell([para([run(fmt(subTotal), { bold: true, size: 22 })], { align: AlignmentType.RIGHT })], { width: 2200, borders: allBorders(BLACK,12), shade: 'D9D9D9' }),
      ]}),
    ],
  });

  // ── AMOUNT IN WORDS ───────────────────────────────────────────────────────
  const words = invoice.amountInWords || toWords(subTotal);

  // ── NOTES / BANK DETAILS ──────────────────────────────────────────────────
  const footerSection = [
    para([run(`Amount In Words: ${words}`, { bold: true, size: 20 })]),
    para([run('')], { before: 60, after: 60 }),
    para([run('Note:', { bold: true, size: 20 })]),
    para([run(`Pan Number: ${company.pan || 'BCWPS2519D'}`, { size: 18 })]),
    para([run(`GSTIN Number: ${company.gstin || '27BCWPS2519D1Z8'}`, { size: 18 })]),
    para([run(`Service Accounting Code: ${invoice.sacNo || '996601'}`, { size: 18 })]),
    para([run('Dispute if any in invoice must be raised in writing within 5 days from the date of receipt', { size: 18 })]),
    para([run('of bill at your service centres. Otherwise it would be consider as an acceptance of bill.', { size: 18 })]),
    para([run('Delay in payment will be charged interest @ 24% p.a if payment is not made within 21 days.', { size: 18 })]),
    para([run(`Payment shall be in favour of "${company.name || 'Lucky Transport Services'}".`, { size: 18 })]),
    para([run(`Bank Details: ${company.bankName || ''}`, { size: 18 })]),
    para([run(`A/c no: ${company.bankAccount || ''}  , IFSC code: ${company.bankIfsc || ''}`, { size: 18 })]),
    para([run('')], { before: 100 }),
    para([run(`For M/s ${company.name || 'Lucky Transport Services'}`, { bold: true, size: 20 })], { align: AlignmentType.RIGHT }),
    para([run('')], { before: 200 }),
    para([run('Authorised Signatory', { size: 20 })], { align: AlignmentType.RIGHT }),
    para([run('"Thank you for Business"', { italic: true, size: 20 })], { align: AlignmentType.CENTER, before: 120 }),
  ];

  // ── BUILD DOCUMENT ────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [
        ...headerSection,
        para([run('')], { before: 80, after: 80 }),
        metaTable,
        para([run('')], { before: 60 }),
        gstinTable,
        placeRow,
        para([run('')], { before: 80 }),
        descTable,
        para([run('')], { before: 40 }),
        taxTable,
        para([run('')], { before: 80 }),
        ...footerSection,
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

module.exports = { generateInvoiceDocx };
