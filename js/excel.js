/* Grupo HL Gestão · Exportador XLSX nativo. Gera um arquivo Excel verdadeiro,
   sem CDN, CSV ou bibliotecas externas; mantém os valores numéricos editáveis. */
(function (root) {
  'use strict';
  const encoder = new TextEncoder();
  const bytes = value => encoder.encode(value);
  const esc = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
  const a1 = index => {
    let i = index + 1, label = '';
    while (i > 0) { i -= 1; label = String.fromCharCode(65 + i % 26) + label; i = Math.floor(i / 26); }
    return label;
  };
  const excelDate = value => {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y,m,d] = value.split('-').map(Number);
      return (Date.UTC(y,m-1,d) - Date.UTC(1899,11,30)) / 86400000;
    }
    const d = new Date(value);
    if (!Number.isFinite(d.getTime())) return null;
    return (Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds()) - Date.UTC(1899,11,30)) / 86400000;
  };
  const cellXml = (value, ref, header) => {
    if (value === null || value === undefined || value === '') return '';
    let style = header ? 1 : 0, v = value;
    if (typeof value === 'object' && !Array.isArray(value)) {
      v = value.v;
      style = ({money:2, date:3, percent:4, integer:5})[value.type] || style;
      if (value.type === 'date') v = excelDate(value.v);
    }
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}" s="${style}"><v>${v}</v></c>`;
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
  };
  const sheetXml = sheet => {
    const rows = sheet.rows || [];
    const maxCol = Math.max(1, ...rows.map(row => row.length));
    const colDefs = Array.from({ length: maxCol }, (_, c) => {
      const lengths = rows.slice(0, 150).map(row => {
        let v = row[c]; if (v && typeof v === 'object') v = v.v;
        return String(v ?? '').length;
      });
      const w = Math.min(c === 0 ? 37 : 30, Math.max(12, Math.min(40, Math.max(...lengths, 0) + 3)));
      return `<col min="${c + 1}" max="${c + 1}" width="${w}" customWidth="1"/>`;
    }).join('');
    const body = rows.map((row, ri) => `<row r="${ri + 1}"${ri === 0 ? ' ht="30" customHeight="1"' : ''}>${row.map((v, ci) => cellXml(v, `${a1(ci)}${ri + 1}`, ri === 0)).join('')}</row>`).join('');
    const lastRow = Math.max(rows.length, 1), lastCol = a1(maxCol - 1);
    const filter = sheet.filter === false || rows.length < 2 ? '' : `<autoFilter ref="A1:${lastCol}${lastRow}"/>`;
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <dimension ref="A1:${lastCol}${lastRow}"/>
      <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews>
      <sheetFormatPr defaultRowHeight="18"/><cols>${colDefs}</cols><sheetData>${body}</sheetData>${filter}
      <pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.25" footer="0.25"/>
      </worksheet>`;
  };
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <numFmts count="4"><numFmt numFmtId="164" formatCode="&quot;R$&quot; #,##0.00;[Red](&quot;R$&quot; #,##0.00)"/>
      <numFmt numFmtId="165" formatCode="dd/mm/yyyy hh:mm"/>
      <numFmt numFmtId="166" formatCode="0.0%"/>
      <numFmt numFmtId="167" formatCode="0"/></numFmts>
      <fonts count="2"><font><sz val="11"/><color rgb="FF28312A"/><name val="Aptos"/></font>
      <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>
      <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
      <fill><patternFill patternType="solid"><fgColor rgb="FF24251F"/><bgColor indexed="64"/></patternFill></fill></fills>
      <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
      <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
      <cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
      <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFill="1" applyFont="1" applyAlignment="1"><alignment vertical="center"/></xf>
      <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
      <xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
      <xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
      <xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>
      <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : c >>> 1;
    crcTable[i] = c >>> 0;
  }
  const crc32 = data => { let c = -1; for (const x of data) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const u16 = (dv, off, value) => dv.setUint16(off, value, true);
  const u32 = (dv, off, value) => dv.setUint32(off, value >>> 0, true);
  function zip(entries) {
    const parts = [], directory = [];
    let offset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    const dosDate = ((Math.max(1980, now.getFullYear()) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    entries.forEach(([name, contents]) => {
      const filename = bytes(name), data = bytes(contents), checksum = crc32(data);
      const local = new Uint8Array(30 + filename.length), v = new DataView(local.buffer);
      u32(v, 0, 0x04034b50); u16(v, 4, 20); u16(v, 6, 0x0800); u16(v, 8, 0);
      u16(v, 10, dosTime); u16(v, 12, dosDate); u32(v, 14, checksum);
      u32(v, 18, data.length); u32(v, 22, data.length); u16(v, 26, filename.length); u16(v, 28, 0);
      local.set(filename, 30); parts.push(local, data);
      const central = new Uint8Array(46 + filename.length), cv = new DataView(central.buffer);
      u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800);
      u16(cv, 10, 0); u16(cv, 12, dosTime); u16(cv, 14, dosDate); u32(cv, 16, checksum);
      u32(cv, 20, data.length); u32(cv, 24, data.length); u16(cv, 28, filename.length);
      u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u16(cv, 36, 0);
      u32(cv, 38, 0); u32(cv, 42, offset); central.set(filename, 46);
      directory.push(central); offset += local.length + data.length;
    });
    const dirLength = directory.reduce((a, b) => a + b.length, 0);
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    u32(ev, 0, 0x06054b50); u16(ev, 4, 0); u16(ev, 6, 0);
    u16(ev, 8, entries.length); u16(ev, 10, entries.length);
    u32(ev, 12, dirLength); u32(ev, 16, offset); u16(ev, 20, 0);
    return new Blob([...parts, ...directory, end], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  }
  function createWorkbookBlob(sheets) {
    if (!Array.isArray(sheets) || !sheets.length || sheets.length > 25) throw new Error('Nenhuma aba para exportar.');
    const names = sheets.map((sheet, i) => String(sheet.name || `Aba ${i+1}`).replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31));
    const book = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${names.map((name, i) => `<sheet name="${esc(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`;
    const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
    const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
    const created = new Date().toISOString();
    return zip([
      ['[Content_Types].xml', types],
      ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>'],
      ['docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>Grupo HL Gestão</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created></cp:coreProperties>`],
      ['xl/workbook.xml', book], ['xl/_rels/workbook.xml.rels', rels], ['xl/styles.xml', stylesXml],
      ...sheets.map((sheet, i) => [`xl/worksheets/sheet${i + 1}.xml`, sheetXml(sheet)])
    ]);
  }
  function exportWorkbook(sheets, filename) {
    const blob = createWorkbookBlob(sheets), url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename.endsWith('.xlsx') ? filename : filename + '.xlsx';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
  root.HLExcel = {createWorkbookBlob, exportWorkbook};
})(typeof window === 'undefined' ? globalThis : window);
