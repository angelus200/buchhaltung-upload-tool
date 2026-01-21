import ExcelJS from 'exceljs';

interface BilanzPosition {
  sachkonto: string;
  kontobezeichnung?: string;
  betrag: number;
}

interface GuVPosition {
  sachkonto: string;
  kontobezeichnung?: string;
  betrag: number;
}

interface ExportOptions {
  unternehmen: string;
  stichtag: string;
  jahr?: number;
}

const formatCurrency = (value: number): string => {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Exportiert eine Bilanz als Excel-Datei
 */
export const exportBilanzExcel = async (
  aktiva: BilanzPosition[],
  passiva: BilanzPosition[],
  options: ExportOptions
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Buchhaltung KI';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Bilanz');

  // Header
  worksheet.mergeCells('A1:C1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Bilanz';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:C2');
  const companyCell = worksheet.getCell('A2');
  companyCell.value = options.unternehmen;
  companyCell.font = { size: 12 };
  companyCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:C3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `Stichtag: ${formatDate(options.stichtag)}`;
  dateCell.font = { size: 10 };
  dateCell.alignment = { horizontal: 'center' };

  // Aktiva
  let currentRow = 5;
  worksheet.getCell(`A${currentRow}`).value = 'Aktiva';
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Konto';
  worksheet.getCell(`B${currentRow}`).value = 'Bezeichnung';
  worksheet.getCell(`C${currentRow}`).value = 'Betrag';
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2980B9' },
  };
  worksheet.getRow(currentRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const summeAktiva = aktiva.reduce((sum, pos) => sum + pos.betrag, 0);

  aktiva.forEach((pos) => {
    worksheet.getCell(`A${currentRow}`).value = pos.sachkonto;
    worksheet.getCell(`B${currentRow}`).value = pos.kontobezeichnung || '';
    worksheet.getCell(`C${currentRow}`).value = pos.betrag;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
    currentRow++;
  });

  worksheet.getCell(`B${currentRow}`).value = 'Summe Aktiva';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`C${currentRow}`).value = summeAktiva;
  worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' },
  };
  currentRow += 2;

  // Passiva
  worksheet.getCell(`A${currentRow}`).value = 'Passiva';
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Konto';
  worksheet.getCell(`B${currentRow}`).value = 'Bezeichnung';
  worksheet.getCell(`C${currentRow}`).value = 'Betrag';
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE67E22' },
  };
  worksheet.getRow(currentRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const summePassiva = passiva.reduce((sum, pos) => sum + pos.betrag, 0);

  passiva.forEach((pos) => {
    worksheet.getCell(`A${currentRow}`).value = pos.sachkonto;
    worksheet.getCell(`B${currentRow}`).value = pos.kontobezeichnung || '';
    worksheet.getCell(`C${currentRow}`).value = pos.betrag;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
    currentRow++;
  });

  worksheet.getCell(`B${currentRow}`).value = 'Summe Passiva';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`C${currentRow}`).value = summePassiva;
  worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' },
  };
  currentRow += 2;

  // Differenz
  const differenz = Math.abs(summeAktiva - summePassiva);
  if (differenz < 0.01) {
    worksheet.getCell(`A${currentRow}`).value = '✓ Bilanz ausgeglichen';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FF27AE60' } };
  } else {
    worksheet.getCell(`A${currentRow}`).value = `⚠ Differenz: ${formatCurrency(differenz)}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, color: { argb: 'FFE74C3C' } };
  }

  // Column widths
  worksheet.getColumn('A').width = 15;
  worksheet.getColumn('B').width = 50;
  worksheet.getColumn('C').width = 20;

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Bilanz_${options.unternehmen.replace(/\s+/g, '_')}_${formatDate(options.stichtag).replace(/\./g, '')}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportiert eine GuV als Excel-Datei
 */
export const exportGuVExcel = async (
  ertraege: GuVPosition[],
  aufwendungen: GuVPosition[],
  options: ExportOptions
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Buchhaltung KI';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('GuV');

  // Header
  worksheet.mergeCells('A1:C1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Gewinn- und Verlustrechnung';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:C2');
  const companyCell = worksheet.getCell('A2');
  companyCell.value = options.unternehmen;
  companyCell.font = { size: 12 };
  companyCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:C3');
  const dateCell = worksheet.getCell('A3');
  const zeitraum = options.jahr
    ? `Geschäftsjahr ${options.jahr}`
    : `Zeitraum bis ${formatDate(options.stichtag)}`;
  dateCell.value = zeitraum;
  dateCell.font = { size: 10 };
  dateCell.alignment = { horizontal: 'center' };

  // Erträge
  let currentRow = 5;
  worksheet.getCell(`A${currentRow}`).value = 'Erträge';
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Konto';
  worksheet.getCell(`B${currentRow}`).value = 'Bezeichnung';
  worksheet.getCell(`C${currentRow}`).value = 'Betrag';
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF27AE60' },
  };
  worksheet.getRow(currentRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const summeErtraege = ertraege.reduce((sum, pos) => sum + pos.betrag, 0);

  ertraege.forEach((pos) => {
    worksheet.getCell(`A${currentRow}`).value = pos.sachkonto;
    worksheet.getCell(`B${currentRow}`).value = pos.kontobezeichnung || '';
    worksheet.getCell(`C${currentRow}`).value = pos.betrag;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
    currentRow++;
  });

  worksheet.getCell(`B${currentRow}`).value = 'Summe Erträge';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`C${currentRow}`).value = summeErtraege;
  worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' },
  };
  currentRow += 2;

  // Aufwendungen
  worksheet.getCell(`A${currentRow}`).value = 'Aufwendungen';
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  worksheet.getCell(`A${currentRow}`).value = 'Konto';
  worksheet.getCell(`B${currentRow}`).value = 'Bezeichnung';
  worksheet.getCell(`C${currentRow}`).value = 'Betrag';
  worksheet.getRow(currentRow).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE74C3C' },
  };
  worksheet.getRow(currentRow).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  currentRow++;

  const summeAufwendungen = aufwendungen.reduce((sum, pos) => sum + pos.betrag, 0);

  aufwendungen.forEach((pos) => {
    worksheet.getCell(`A${currentRow}`).value = pos.sachkonto;
    worksheet.getCell(`B${currentRow}`).value = pos.kontobezeichnung || '';
    worksheet.getCell(`C${currentRow}`).value = pos.betrag;
    worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
    currentRow++;
  });

  worksheet.getCell(`B${currentRow}`).value = 'Summe Aufwendungen';
  worksheet.getCell(`B${currentRow}`).font = { bold: true };
  worksheet.getCell(`C${currentRow}`).value = summeAufwendungen;
  worksheet.getCell(`C${currentRow}`).numFmt = '#,##0.00 "€"';
  worksheet.getCell(`C${currentRow}`).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' },
  };
  currentRow += 2;

  // Ergebnis
  const gewinnVerlust = summeErtraege - summeAufwendungen;
  if (gewinnVerlust > 0) {
    worksheet.getCell(`A${currentRow}`).value = `Jahresüberschuss: ${formatCurrency(gewinnVerlust)}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF27AE60' } };
  } else if (gewinnVerlust < 0) {
    worksheet.getCell(`A${currentRow}`).value = `Jahresfehlbetrag: ${formatCurrency(Math.abs(gewinnVerlust))}`;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FFE74C3C' } };
  } else {
    worksheet.getCell(`A${currentRow}`).value = 'Ausgeglichen: 0,00 €';
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 12 };
  }

  // Column widths
  worksheet.getColumn('A').width = 15;
  worksheet.getColumn('B').width = 50;
  worksheet.getColumn('C').width = 20;

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `GuV_${options.unternehmen.replace(/\s+/g, '_')}_${options.jahr || 'aktuell'}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};

/**
 * Exportiert einen Anlagenspiegel als Excel-Datei
 */
export const exportAnlagenspiegelExcel = async (
  anlagen: any[],
  options: ExportOptions
): Promise<void> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Buchhaltung KI';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Anlagenspiegel');

  // Header
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'Anlagenspiegel';
  titleCell.font = { size: 18, bold: true };
  titleCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:H2');
  const companyCell = worksheet.getCell('A2');
  companyCell.value = options.unternehmen;
  companyCell.font = { size: 12 };
  companyCell.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:H3');
  const dateCell = worksheet.getCell('A3');
  dateCell.value = `Stichtag: ${formatDate(options.stichtag)}`;
  dateCell.font = { size: 10 };
  dateCell.alignment = { horizontal: 'center' };

  // Table headers
  let currentRow = 5;
  const headers = [
    'Bezeichnung',
    'Anschaffung',
    'AHK',
    'ND',
    'Methode',
    'Jahres-AfA',
    'Kum. AfA',
    'Restwert',
  ];

  headers.forEach((header, index) => {
    const cell = worksheet.getCell(currentRow, index + 1);
    cell.value = header;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF34495E' },
    };
  });
  currentRow++;

  // Data rows
  const summeAHK = anlagen.reduce((sum, a) => sum + (a.anschaffungskosten || 0), 0);
  const summeJahresAfa = anlagen.reduce((sum, a) => sum + (a.jahresAfa || 0), 0);
  const summeAbgeschrieben = anlagen.reduce((sum, a) => sum + (a.abgeschrieben || 0), 0);
  const summeRestwert = anlagen.reduce((sum, a) => sum + (a.restwert || 0), 0);

  anlagen.forEach((anlage) => {
    worksheet.getCell(currentRow, 1).value = anlage.bezeichnung;
    worksheet.getCell(currentRow, 2).value = anlage.anschaffungsdatum
      ? formatDate(anlage.anschaffungsdatum)
      : '-';
    worksheet.getCell(currentRow, 3).value = anlage.anschaffungskosten || 0;
    worksheet.getCell(currentRow, 3).numFmt = '#,##0.00 "€"';
    worksheet.getCell(currentRow, 4).value = `${anlage.nutzungsdauer || 0} J`;
    worksheet.getCell(currentRow, 5).value = anlage.abschreibungsmethode || 'linear';
    worksheet.getCell(currentRow, 6).value = anlage.jahresAfa || 0;
    worksheet.getCell(currentRow, 6).numFmt = '#,##0.00 "€"';
    worksheet.getCell(currentRow, 7).value = anlage.abgeschrieben || 0;
    worksheet.getCell(currentRow, 7).numFmt = '#,##0.00 "€"';
    worksheet.getCell(currentRow, 8).value = anlage.restwert || 0;
    worksheet.getCell(currentRow, 8).numFmt = '#,##0.00 "€"';
    currentRow++;
  });

  // Summary row
  worksheet.getCell(currentRow, 1).value = 'Summe';
  worksheet.getCell(currentRow, 1).font = { bold: true };
  worksheet.getCell(currentRow, 3).value = summeAHK;
  worksheet.getCell(currentRow, 3).numFmt = '#,##0.00 "€"';
  worksheet.getCell(currentRow, 3).font = { bold: true };
  worksheet.getCell(currentRow, 6).value = summeJahresAfa;
  worksheet.getCell(currentRow, 6).numFmt = '#,##0.00 "€"';
  worksheet.getCell(currentRow, 6).font = { bold: true };
  worksheet.getCell(currentRow, 7).value = summeAbgeschrieben;
  worksheet.getCell(currentRow, 7).numFmt = '#,##0.00 "€"';
  worksheet.getCell(currentRow, 7).font = { bold: true };
  worksheet.getCell(currentRow, 8).value = summeRestwert;
  worksheet.getCell(currentRow, 8).numFmt = '#,##0.00 "€"';
  worksheet.getCell(currentRow, 8).font = { bold: true };
  worksheet.getRow(currentRow).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFECF0F1' },
  };

  // Column widths
  worksheet.getColumn(1).width = 40;
  worksheet.getColumn(2).width = 15;
  worksheet.getColumn(3).width = 15;
  worksheet.getColumn(4).width = 10;
  worksheet.getColumn(5).width = 15;
  worksheet.getColumn(6).width = 15;
  worksheet.getColumn(7).width = 15;
  worksheet.getColumn(8).width = 15;

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Anlagenspiegel_${options.unternehmen.replace(/\s+/g, '_')}_${formatDate(options.stichtag).replace(/\./g, '')}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
