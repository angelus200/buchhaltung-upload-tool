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
 * Exportiert eine Bilanz als PDF
 */
export const exportBilanzPDF = async (
  aktiva: BilanzPosition[],
  passiva: BilanzPosition[],
  options: ExportOptions
): Promise<void> => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Bilanz', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.unternehmen, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Stichtag: ${formatDate(options.stichtag)}`, pageWidth / 2, 37, { align: 'center' });

    // Aktiva
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Aktiva', 14, 50);

    const aktivaData = aktiva.map((pos) => [
      pos.sachkonto,
      pos.kontobezeichnung || '',
      formatCurrency(pos.betrag),
    ]);

    const summeAktiva = aktiva.reduce((sum, pos) => sum + pos.betrag, 0);

    autoTable(doc, {
      startY: 55,
      head: [['Konto', 'Bezeichnung', 'Betrag']],
      body: aktivaData,
      foot: [['', 'Summe Aktiva', formatCurrency(summeAktiva)]],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], fontStyle: 'bold' },
      footStyles: { fillColor: [236, 240, 241], fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    // Passiva
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Passiva', 14, finalY);

    const passivaData = passiva.map((pos) => [
      pos.sachkonto,
      pos.kontobezeichnung || '',
      formatCurrency(pos.betrag),
    ]);

    const summePassiva = passiva.reduce((sum, pos) => sum + pos.betrag, 0);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Konto', 'Bezeichnung', 'Betrag']],
      body: passivaData,
      foot: [['', 'Summe Passiva', formatCurrency(summePassiva)]],
      theme: 'striped',
      headStyles: { fillColor: [230, 126, 34], fontStyle: 'bold' },
      footStyles: { fillColor: [236, 240, 241], fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    // Differenz
    const differenz = Math.abs(summeAktiva - summePassiva);
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    if (differenz < 0.01) {
      doc.setTextColor(39, 174, 96);
      doc.text('✓ Bilanz ausgeglichen', 14, finalY2);
    } else {
      doc.setTextColor(231, 76, 60);
      doc.text(`⚠ Differenz: ${formatCurrency(differenz)}`, 14, finalY2);
    }

    // Footer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(
      `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Download
    const fileName = `Bilanz_${options.unternehmen.replace(/\s+/g, '_')}_${formatDate(options.stichtag).replace(/\./g, '')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    throw new Error('PDF-Export-Bibliotheken nicht verfügbar. Bitte führen Sie "pnpm install" aus.');
  }
};

/**
 * Exportiert eine GuV (Gewinn- und Verlustrechnung) als PDF
 */
export const exportGuVPDF = async (
  ertraege: GuVPosition[],
  aufwendungen: GuVPosition[],
  options: ExportOptions
): Promise<void> => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Gewinn- und Verlustrechnung', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.unternehmen, pageWidth / 2, 30, { align: 'center' });
    const zeitraum = options.jahr
      ? `Geschäftsjahr ${options.jahr}`
      : `Zeitraum bis ${formatDate(options.stichtag)}`;
    doc.text(zeitraum, pageWidth / 2, 37, { align: 'center' });

    // Erträge
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Erträge', 14, 50);

    const ertraegeData = ertraege.map((pos) => [
      pos.sachkonto,
      pos.kontobezeichnung || '',
      formatCurrency(pos.betrag),
    ]);

    const summeErtraege = ertraege.reduce((sum, pos) => sum + pos.betrag, 0);

    autoTable(doc, {
      startY: 55,
      head: [['Konto', 'Bezeichnung', 'Betrag']],
      body: ertraegeData,
      foot: [['', 'Summe Erträge', formatCurrency(summeErtraege)]],
      theme: 'striped',
      headStyles: { fillColor: [39, 174, 96], fontStyle: 'bold' },
      footStyles: { fillColor: [236, 240, 241], fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    // Aufwendungen
    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Aufwendungen', 14, finalY);

    const aufwendungenData = aufwendungen.map((pos) => [
      pos.sachkonto,
      pos.kontobezeichnung || '',
      formatCurrency(pos.betrag),
    ]);

    const summeAufwendungen = aufwendungen.reduce((sum, pos) => sum + pos.betrag, 0);

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Konto', 'Bezeichnung', 'Betrag']],
      body: aufwendungenData,
      foot: [['', 'Summe Aufwendungen', formatCurrency(summeAufwendungen)]],
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60], fontStyle: 'bold' },
      footStyles: { fillColor: [236, 240, 241], fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 100 },
        2: { cellWidth: 40, halign: 'right' },
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    });

    // Ergebnis
    const gewinnVerlust = summeErtraege - summeAufwendungen;
    const finalY2 = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');

    if (gewinnVerlust > 0) {
      doc.setTextColor(39, 174, 96);
      doc.text(`Jahresüberschuss: ${formatCurrency(gewinnVerlust)}`, 14, finalY2);
    } else if (gewinnVerlust < 0) {
      doc.setTextColor(231, 76, 60);
      doc.text(`Jahresfehlbetrag: ${formatCurrency(Math.abs(gewinnVerlust))}`, 14, finalY2);
    } else {
      doc.setTextColor(0, 0, 0);
      doc.text('Ausgeglichen: 0,00 €', 14, finalY2);
    }

    // Footer
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(
      `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Download
    const fileName = `GuV_${options.unternehmen.replace(/\s+/g, '_')}_${options.jahr || 'aktuell'}.pdf`;
    doc.save(fileName);
  } catch (error) {
    throw new Error('PDF-Export-Bibliotheken nicht verfügbar. Bitte führen Sie "pnpm install" aus.');
  }
};

/**
 * Exportiert einen Anlagenspiegel als PDF
 */
export const exportAnlagenspiegelPDF = async (
  anlagen: any[],
  options: ExportOptions
): Promise<void> => {
  try {
    const jsPDF = (await import('jspdf')).default;
    const autoTable = (await import('jspdf-autotable')).default;

    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Anlagenspiegel', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(options.unternehmen, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Stichtag: ${formatDate(options.stichtag)}`, pageWidth / 2, 37, { align: 'center' });

    // Anlagen-Tabelle
    const anlagenData = anlagen.map((anlage) => [
      anlage.bezeichnung,
      anlage.anschaffungsdatum ? formatDate(anlage.anschaffungsdatum) : '-',
      formatCurrency(anlage.anschaffungskosten || 0),
      `${anlage.nutzungsdauer || 0} J`,
      anlage.abschreibungsmethode || 'linear',
      formatCurrency(anlage.jahresAfa || 0),
      formatCurrency(anlage.abgeschrieben || 0),
      formatCurrency(anlage.restwert || 0),
    ]);

    const summeAHK = anlagen.reduce((sum, a) => sum + (a.anschaffungskosten || 0), 0);
    const summeJahresAfa = anlagen.reduce((sum, a) => sum + (a.jahresAfa || 0), 0);
    const summeAbgeschrieben = anlagen.reduce((sum, a) => sum + (a.abgeschrieben || 0), 0);
    const summeRestwert = anlagen.reduce((sum, a) => sum + (a.restwert || 0), 0);

    autoTable(doc, {
      startY: 45,
      head: [['Bezeichnung', 'Anschaffung', 'AHK', 'ND', 'Methode', 'Jahres-AfA', 'Kum. AfA', 'Restwert']],
      body: anlagenData,
      foot: [
        [
          'Summe',
          '',
          formatCurrency(summeAHK),
          '',
          '',
          formatCurrency(summeJahresAfa),
          formatCurrency(summeAbgeschrieben),
          formatCurrency(summeRestwert),
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [52, 73, 94], fontStyle: 'bold' },
      footStyles: { fillColor: [236, 240, 241], fontStyle: 'bold', textColor: [0, 0, 0] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 20 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30, halign: 'right' },
        6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' },
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
    });

    // Footer
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.text(
      `Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );

    // Download
    const fileName = `Anlagenspiegel_${options.unternehmen.replace(/\s+/g, '_')}_${formatDate(options.stichtag).replace(/\./g, '')}.pdf`;
    doc.save(fileName);
  } catch (error) {
    throw new Error('PDF-Export-Bibliotheken nicht verfügbar. Bitte führen Sie "pnpm install" aus.');
  }
};
