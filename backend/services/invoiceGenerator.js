/**
 * Invoice DOCX Generator — Lucky Transport Services
 * Matches BLANK_INVOICE.doc template exactly.
 */

// Support both local install and global npm install
let docxModule;
try {
  docxModule = require('docx');
} catch (e) {
  // Fallback to global install location
  const globalPaths = [
    '/home/claude/.npm-global/lib/node_modules/docx',
    '/usr/lib/node_modules/docx',
    '/usr/local/lib/node_modules/docx',
  ];
  for (const p of globalPaths) {
    try { docxModule = require(p); break; } catch (_) {}
  }
  if (!docxModule) throw new Error('docx package not found. Run: npm install docx');
}

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
} = docxModule;

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '';
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
  catch (_) { return String(d).slice(0, 10); }
};

const toWords = (num) => {
  const n = Math.round(Number(num) || 0);
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven',
    'Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const convert = (n) => {
    if (n < 20)      return ones[n];
    if (n < 100)     return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000)    return ones[Math.floor(n/100)]+' Hundred'+(n%100 ? ' '+convert(n%100) : '');
    if (n < 100000)  return convert(Math.floor(n/1000))+' Thousand'+(n%1000 ? ' '+convert(n%1000) : '');
    if (n < 10000000)return convert(Math.floor(n/100000))+' Lakh'+(n%100000 ? ' '+convert(n%100000) : '');
    return convert(Math.floor(n/10000000))+' Crore'+(n%10000000 ? ' '+convert(n%10000000) : '');
  };
  return (n === 0 ? 'Zero' : convert(n)) + ' Rupees Only';
};

// ─── Border helpers ───────────────────────────────────────────────────────────
const nb  = () => ({ style: BorderStyle.NIL,    size: 0, color: 'FFFFFF' });
const sb  = (sz=8) => ({ style: BorderStyle.SINGLE, size: sz, color: '000000' });
const noB = () => ({ top: nb(), bottom: nb(), left: nb(), right: nb() });
const allB= (sz=8) => ({ top: sb(sz), bottom: sb(sz), left: sb(sz), right: sb(sz) });
const botB= () => ({ top: nb(), bottom: sb(8), left: nb(), right: nb() });

// ─── Cell factory ─────────────────────────────────────────────────────────────
const mkCell = (text, width, opts = {}) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({
      text:    String(text || ''),
      font:    opts.font    || 'Cambria',
      size:    opts.size    || 20,
      bold:    opts.bold    || false,
      color:   opts.color   || '000000',
      italics: opts.italic  || false,
    })],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: 0, after: 0, line: 276 },
  })],
  width:         { size: width, type: WidthType.DXA },
  borders:       opts.borders || noB(),
  shading:       opts.shade ? { fill: opts.shade, type: ShadingType.CLEAR } : undefined,
  verticalAlign: VerticalAlign.CENTER,
  columnSpan:    opts.span,
  margins:       { top: 60, bottom: 60, left: 100, right: 100 },
});

const mkRow = (cells) => new TableRow({ children: cells });

const sp = (before=0, after=0) => ({ before, after, line: 276 });
const cpara = (text, opts={}) => new Paragraph({
  alignment: opts.align || AlignmentType.LEFT,
  spacing: sp(opts.before||0, opts.after||40),
  children: [new TextRun({
    text: String(text||''),
    font: opts.font || 'Cambria',
    size: opts.size || 20,
    bold: opts.bold || false,
    color: opts.color || '000000',
    italics: opts.italic || false,
  })],
  border: opts.bottomBorder ? { bottom: { style: BorderStyle.SINGLE, size: 18, color: '000000' }} : undefined,
});

// ─── Main generator ───────────────────────────────────────────────────────────
const generateInvoiceDocx = async (invoice, customer, trip, company) => {
  const inv = invoice || {};
  const cus = customer || {};
  const com = company  || {};

  const base    = parseFloat(inv.base_amount)  || 0;
  const cgst    = parseFloat(inv.cgst_amount)  || 0;
  const sgst    = parseFloat(inv.sgst_amount)  || 0;
  const roundOff= parseFloat(inv.round_off)    || 0;
  const total   = parseFloat(inv.total_amount) || (base + cgst + sgst + roundOff);
  const words   = inv.amount_in_words || toWords(total);

  const W = 9700; // page content width in DXA

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
        },
      },
      children: [

        // ── Company Header ──────────────────────────────────────────────────
        cpara(com.name || 'Lucky Transport Services', {
          font: 'Bookman Old Style', size: 48, bold: true, color: '17365D',
          align: AlignmentType.CENTER, after: 40,
        }),
        cpara(com.tagline || 'Transport Contractors & Commission Agent', {
          font: 'Bookman Old Style', size: 22, bold: true, color: '948A54',
          align: AlignmentType.CENTER, after: 40,
        }),
        cpara(com.address || '', {
          font: 'Cambria', size: 20, align: AlignmentType.CENTER, after: 40,
        }),
        cpara(`Email: ${com.email || ''}  Tel: ${com.phone || ''}  Mob: ${com.mobile || ''}`, {
          font: 'Cambria', size: 20, align: AlignmentType.CENTER, after: 60,
        }),

        // ── Divider line ────────────────────────────────────────────────────
        new Paragraph({
          spacing: { before: 0, after: 80 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: '000000' }},
          children: [new TextRun('')],
        }),

        // ── TAX INVOICE title ───────────────────────────────────────────────
        cpara('TAX INVOICE', {
          font: 'Bookman Old Style', size: 28, bold: true,
          align: AlignmentType.CENTER, before: 60, after: 100,
        }),

        // ── Invoice meta (Invoice No / Date / Invoiced To) ──────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          columnWidths: [2600, 2200, 1800, 3100],
          rows: [
            mkRow([
              mkCell('Invoice Number:', 2600, { bold: true }),
              mkCell(inv.invoice_number || '', 2200, { borders: botB(), align: AlignmentType.RIGHT }),
              mkCell('Invoiced To:', 1800, { bold: true }),
              mkCell(cus.company_name || cus.companyName || '', 3100, { borders: botB() }),
            ]),
            mkRow([
              mkCell('Invoice Date:', 2600, { bold: true }),
              mkCell(fmtDate(inv.invoice_date), 2200, { borders: botB(), align: AlignmentType.RIGHT }),
              mkCell('Address:', 1800, { bold: true }),
              mkCell(cus.address || cus.city || '', 3100, { borders: botB() }),
            ]),
            mkRow([
              mkCell('Invoice Period From:', 2600, { bold: true, size: 18 }),
              mkCell(fmtDate(inv.period_from), 2200, { borders: botB(), align: AlignmentType.RIGHT, size: 18 }),
              mkCell('Due Date:', 1800, { bold: true }),
              mkCell(fmtDate(inv.due_date), 3100, { borders: botB() }),
            ]),
            mkRow([
              mkCell('Invoice Period To:', 2600, { bold: true, size: 18 }),
              mkCell(fmtDate(inv.period_to), 2200, { borders: botB(), align: AlignmentType.RIGHT, size: 18 }),
              mkCell('Location:', 1800, { bold: true }),
              mkCell(inv.location || '', 3100, { borders: botB() }),
            ]),
          ],
        }),

        new Paragraph({ spacing: sp(60, 0), children: [new TextRun('')] }),

        // ── GSTIN / SAC / State ─────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          columnWidths: [2700, 2200, 2400, 2400],
          rows: [
            mkRow([
              mkCell(`GSTIN : ${com.gstin || ''}`, 2700, { borders: allB(), bold: true, size: 18 }),
              mkCell(`DHL GSTIN: ${inv.dhl_gstin || cus.dhl_gstin || ''}`, 2200, { borders: allB(), size: 18 }),
              mkCell(`SAC NO : ${inv.sac_no || '996601'}`, 2400, { borders: allB(), size: 18 }),
              mkCell(`STATE : ${inv.state || 'Maharashtra'}  CODE: ${inv.state_code || '27'}`, 2400, { borders: allB(), size: 18 }),
            ]),
          ],
        }),
        new Table({
          width: { size: W, type: WidthType.DXA },
          columnWidths: [W],
          rows: [
            mkRow([
              mkCell(
                `PLACE OF SUPPLY: ${inv.place_of_supply || 'MUMBAI, MAHARASHTRA'}   STATE CODE: ${inv.state_code || '27'}`,
                W, { borders: allB(), bold: true, size: 18 }
              ),
            ]),
          ],
        }),

        new Paragraph({ spacing: sp(80, 0), children: [new TextRun('')] }),

        // ── Description Table ───────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          columnWidths: [7500, 2200],
          rows: [
            // Header
            mkRow([
              mkCell('DESCRIPTIONS & PARTICULARS', 7500, { borders: allB(12), bold: true, shade: 'D9D9D9' }),
              mkCell('AMOUNT (INR)', 2200, { borders: allB(12), bold: true, shade: 'D9D9D9', align: AlignmentType.CENTER }),
            ]),
            // Description content row
            mkRow([
              new TableCell({
                children: [
                  new Paragraph({ spacing: sp(40, 20), children: [new TextRun({ text: 'Local Transportation charges for Adhoc truck & jeep vehicle services', font: 'Cambria', size: 20 })] }),
                  new Paragraph({ spacing: sp(0, 20), children: [new TextRun({ text: `provided for ACC to MIDC Inbound Cargo (${inv.vehicle_type_desc || trip?.vehicle_type || ''})`, font: 'Cambria', size: 20 })] }),
                  new Paragraph({ spacing: sp(0, 40), children: [new TextRun({ text: `for the month of ${inv.invoice_month || ''}`, font: 'Cambria', size: 20 })] }),
                ],
                width: { size: 7500, type: WidthType.DXA },
                borders: allB(),
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
              }),
              new TableCell({
                children: [
                  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: sp(40, 20), children: [new TextRun({ text: '₹', font: 'Cambria', size: 20 })] }),
                  new Paragraph({ alignment: AlignmentType.RIGHT, spacing: sp(0, 40), children: [new TextRun({ text: fmt(base), font: 'Cambria', size: 20, bold: true })] }),
                ],
                width: { size: 2200, type: WidthType.DXA },
                borders: allB(),
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
              }),
            ]),
            // Total Amount row
            mkRow([
              mkCell('Total Amount', 7500, { borders: allB(), bold: true }),
              mkCell(fmt(base), 2200, { borders: allB(), bold: true, align: AlignmentType.RIGHT }),
            ]),
          ],
        }),

        new Paragraph({ spacing: sp(40, 0), children: [new TextRun('')] }),

        // ── Tax Summary Table ───────────────────────────────────────────────
        new Table({
          width: { size: W, type: WidthType.DXA },
          columnWidths: [7500, 2200],
          rows: [
            mkRow([ mkCell('Taxable Value', 7500, { borders: allB() }), mkCell(fmt(base), 2200, { borders: allB(), align: AlignmentType.RIGHT }) ]),
            mkRow([ mkCell(`Add Tax : CGST @ ${inv.cgst_rate || 9}%`, 7500, { borders: allB() }), mkCell(fmt(cgst), 2200, { borders: allB(), align: AlignmentType.RIGHT }) ]),
            mkRow([ mkCell(`Add Tax : SGST @ ${inv.sgst_rate || 9}%`, 7500, { borders: allB() }), mkCell(fmt(sgst), 2200, { borders: allB(), align: AlignmentType.RIGHT }) ]),
            mkRow([ mkCell('Round Off : (+/-)', 7500, { borders: allB() }), mkCell(fmt(roundOff), 2200, { borders: allB(), align: AlignmentType.RIGHT }) ]),
            mkRow([
              mkCell('Sub Total Amount', 7500, { borders: allB(12), bold: true, size: 22, shade: 'D9D9D9' }),
              mkCell(fmt(total), 2200, { borders: allB(12), bold: true, size: 22, shade: 'D9D9D9', align: AlignmentType.RIGHT }),
            ]),
          ],
        }),

        // ── Amount in Words ─────────────────────────────────────────────────
        new Paragraph({ spacing: sp(80, 40), children: [new TextRun({ text: `Amount In Words: ${words}`, font: 'Cambria', size: 20, bold: true })] }),

        // ── Notes ───────────────────────────────────────────────────────────
        new Paragraph({ spacing: sp(20, 20), children: [new TextRun({ text: 'Note:', font: 'Cambria', size: 20, bold: true })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: `Pan Number: ${com.pan || 'BCWPS2519D'}`, font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: `GSTIN Number: ${com.gstin || '27BCWPS2519D1Z8'}`, font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: `Service Accounting Code: ${inv.sac_no || com.sac || '996601'}`, font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: 'Dispute if any in invoice must be raised in writing within 5 days from the date of receipt of bill at your service centres. Otherwise it would be consider as an acceptance of bill.', font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: 'Delay in payment will be charged interest @ 24% p.a if payment is not made within 21 days.', font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: `Payment shall be in favour of "${com.name || 'Lucky Transport Services'}".`, font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 16), children: [new TextRun({ text: `Bank Details: ${com.bankName || ''}`, font: 'Cambria', size: 18 })] }),
        new Paragraph({ spacing: sp(0, 60), children: [new TextRun({ text: `A/c no: ${com.bankAccount || ''}  ,  IFSC code: ${com.bankIfsc || ''}  ,  Mumbai-400059`, font: 'Cambria', size: 18 })] }),

        // ── Signatory ───────────────────────────────────────────────────────
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: sp(100, 20), children: [new TextRun({ text: `For M/s ${com.name || 'Lucky Transport Services'}`, font: 'Cambria', size: 20, bold: true })] }),
        new Paragraph({ alignment: AlignmentType.RIGHT, spacing: sp(200, 20), children: [new TextRun({ text: 'Authorised Signatory', font: 'Cambria', size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: sp(120, 0), children: [new TextRun({ text: '\u201CThank you for Business\u201D', font: 'Cambria', size: 20, italics: true })] }),
      ],
    }],
  });

  return Packer.toBuffer(doc);
};

module.exports = { generateInvoiceDocx };
