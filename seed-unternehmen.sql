-- ============================================
-- SQL Insert für 5 neue Unternehmen
-- Buchhaltungs-App (buchhaltung-ki.app)
-- ============================================

-- FIRMA 2: Angelus Managementberatungs und Service KG (DE)
INSERT INTO unternehmen (
  name, rechtsform, landCode, land, waehrung, kontenrahmen,
  steuernummer, ustIdNr, strasse, plz, ort,
  telefon, email, website, handelsregister,
  wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
) VALUES (
  'Angelus Managementberatungs und Service KG', 'KG', 'DE', 'Deutschland', 'EUR', 'SKR04',
  '143/501/60818', 'DE279532189', 'Konrad-Zuse-Platz 8', '81829', 'München',
  '0800 175 077 0', 'office@angelus.group', 'www.angelus.group', 'Amtsgericht München, HRA 102 679',
  1, '#6366f1', 1, 1, NOW(), NOW()
);
INSERT INTO user_unternehmen (userId, unternehmenId, rolle, buchungenLesen, buchungenSchreiben, stammdatenLesen, stammdatenSchreiben, berichteLesen, berichteExportieren, einladungenVerwalten, createdAt)
VALUES (1, LAST_INSERT_ID(), 'admin', 1, 1, 1, 1, 1, 1, 1, NOW());

-- FIRMA 3: commercehelden GmbH (AT)
INSERT INTO unternehmen (
  name, rechtsform, landCode, land, waehrung, kontenrahmen,
  steuernummer, strasse, plz, ort,
  wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
) VALUES (
  'commercehelden GmbH', 'GmbH', 'AT', 'Österreich', 'EUR', 'OeKR',
  '81 505/0224', 'Pembaurstraße 14', '6020', 'Innsbruck',
  1, '#ec4899', 1, 1, NOW(), NOW()
);
INSERT INTO user_unternehmen (userId, unternehmenId, rolle, buchungenLesen, buchungenSchreiben, stammdatenLesen, stammdatenSchreiben, berichteLesen, berichteExportieren, einladungenVerwalten, createdAt)
VALUES (1, LAST_INSERT_ID(), 'admin', 1, 1, 1, 1, 1, 1, 1, NOW());

-- FIRMA 4: Emo Retail OG (AT)
INSERT INTO unternehmen (
  name, rechtsform, landCode, land, waehrung, kontenrahmen,
  steuernummer, strasse, plz, ort,
  wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
) VALUES (
  'Emo Retail OG', 'OG', 'AT', 'Österreich', 'EUR', 'OeKR',
  '90 348/9649', 'Pembaurstraße 14', '6020', 'Innsbruck',
  1, '#f97316', 1, 1, NOW(), NOW()
);
INSERT INTO user_unternehmen (userId, unternehmenId, rolle, buchungenLesen, buchungenSchreiben, stammdatenLesen, stammdatenSchreiben, berichteLesen, berichteExportieren, einladungenVerwalten, createdAt)
VALUES (1, LAST_INSERT_ID(), 'admin', 1, 1, 1, 1, 1, 1, 1, NOW());

-- FIRMA 5: Trademark24-7 AG (CH)
INSERT INTO unternehmen (
  name, rechtsform, landCode, land, waehrung, kontenrahmen,
  ustIdNr, handelsregister, strasse, plz, ort, website,
  wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
) VALUES (
  'Trademark24-7 AG', 'AG', 'CH', 'Schweiz', 'CHF', 'KMU',
  'CHE-246.473.858', 'CH-130-3033361-7', 'Kantonsstrasse 1', '8807', 'Freienbach', 'www.brands-wanted.com',
  1, '#ef4444', 1, 1, NOW(), NOW()
);
INSERT INTO user_unternehmen (userId, unternehmenId, rolle, buchungenLesen, buchungenSchreiben, stammdatenLesen, stammdatenSchreiben, berichteLesen, berichteExportieren, einladungenVerwalten, createdAt)
VALUES (1, LAST_INSERT_ID(), 'admin', 1, 1, 1, 1, 1, 1, 1, NOW());

-- FIRMA 6: Marketplace24-7 GmbH (CH)
INSERT INTO unternehmen (
  name, rechtsform, landCode, land, waehrung, kontenrahmen,
  ustIdNr, handelsregister, strasse, plz, ort, website,
  wirtschaftsjahrBeginn, farbe, aktiv, createdBy, createdAt, updatedAt
) VALUES (
  'Marketplace24-7 GmbH', 'GmbH', 'CH', 'Schweiz', 'CHF', 'KMU',
  'CHE-351.662.058', 'CH-130-4033363-2', 'Kantonsstrasse 1', '8807', 'Freienbach', 'www.non-dom.group',
  1, '#8b5cf6', 1, 1, NOW(), NOW()
);
INSERT INTO user_unternehmen (userId, unternehmenId, rolle, buchungenLesen, buchungenSchreiben, stammdatenLesen, stammdatenSchreiben, berichteLesen, berichteExportieren, einladungenVerwalten, createdAt)
VALUES (1, LAST_INSERT_ID(), 'admin', 1, 1, 1, 1, 1, 1, 1, NOW());

-- Überprüfung
SELECT id, name, landCode, kontenrahmen, farbe FROM unternehmen ORDER BY id DESC LIMIT 6;
