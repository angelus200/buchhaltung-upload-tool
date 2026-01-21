#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ";" && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some((field) => field !== "")) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = "";
      }
      if (char === "\r" && nextChar === "\n") {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some((field) => field !== "")) {
      lines.push(currentLine);
    }
  }

  return lines;
}

const filePath = path.join(process.env.HOME!, "Downloads", "download_krwe_22593_28245_20260115", "20250101", "DebitorenKreditorenstammdaten.csv");
const fileContent = fs.readFileSync(filePath, "latin1");
const rows = parseCSV(fileContent);

console.log(`Total rows: ${rows.length}`);
console.log("\nFirst 10 rows:");
rows.slice(0, 10).forEach((row, i) => {
  const kontonr = row[0];
  const name = row[1];
  const kontoNr = parseInt(kontonr);

  let typ = "unknown";
  if (kontoNr >= 10000 && kontoNr <= 69999) {
    typ = "debitor";
  } else if (kontoNr >= 70000 && kontoNr <= 99999) {
    typ = "kreditor";
  }

  console.log(`${i + 1}. Konto: ${kontonr}, Name: ${name?.substring(0, 40)}, Typ: ${typ}, Fields: ${row.length}`);
});

// Count by type
let debitoren = 0;
let kreditoren = 0;
let other = 0;

rows.forEach(row => {
  const kontonr = row[0];
  const name = row[1];

  if (!kontonr || !name) {
    console.log(`Skipped: kontonr=${kontonr}, name=${name}`);
    return;
  }

  const kontoNr = parseInt(kontonr);
  if (isNaN(kontoNr)) {
    console.log(`Invalid number: ${kontonr}`);
    return;
  }

  if (kontoNr >= 10000 && kontoNr <= 69999) {
    debitoren++;
  } else if (kontoNr >= 70000 && kontoNr <= 99999) {
    kreditoren++;
  } else {
    other++;
  }
});

console.log(`\nSummary:`);
console.log(`  Debitoren: ${debitoren}`);
console.log(`  Kreditoren: ${kreditoren}`);
console.log(`  Other: ${other}`);
