import pandas as pd
import mysql.connector
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()

# Database connection
db_url = os.getenv('DATABASE_URL')
parsed = urlparse(db_url)
db_config = {
    'user': parsed.username,
    'password': parsed.password,
    'host': parsed.hostname,
    'port': parsed.port or 3306,
    'database': parsed.path.lstrip('/'),
    'ssl_disabled': False
}

conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()

company_id = 90002  # Angelus Managementberatung und Service KG

# ============ KREDITOREN ============
print("=== KREDITOREN IMPORT ===")
df_kred = pd.read_excel('/home/ubuntu/upload/Kreditorenstammdaten2025-AngelusManagementberatung&ServiceKG.xlsx', header=1)
df_kred.columns = ['Konto', 'K_I', 'Beschriftung', 'Strasse', 'Postfach', 'PLZ', 'Ort', 'Land', 
                   'Telefon', 'Fax', 'Email', 'UstIdNr', 'Kurzbezeichnung', 'AlternativerSuchname',
                   'KundenLiefNr', 'Bank', 'BLZ', 'Kontonummer_Bank', 'IBAN', 'SEPAMandatsreferenz',
                   'Status', 'Bearbeitungsdatum', 'Zahlungssperre', 'Anlageart']

# Filter nur aktive Kreditoren (K/I = I)
df_kred = df_kred[df_kred['K_I'] == 'I']
print(f"Anzahl Kreditoren in Excel: {len(df_kred)}")

updated_kred = 0
inserted_kred = 0

for _, row in df_kred.iterrows():
    kontonummer = str(row['Konto']).strip() if pd.notna(row['Konto']) else None
    if not kontonummer:
        continue
    
    name = str(row['Beschriftung']).strip() if pd.notna(row['Beschriftung']) else None
    strasse = str(row['Strasse']).strip() if pd.notna(row['Strasse']) else None
    plz = str(row['PLZ']).strip() if pd.notna(row['PLZ']) else None
    ort = str(row['Ort']).strip() if pd.notna(row['Ort']) else None
    land = str(row['Land']).strip() if pd.notna(row['Land']) else None
    telefon = str(row['Telefon']).strip() if pd.notna(row['Telefon']) else None
    email = str(row['Email']).strip() if pd.notna(row['Email']) else None
    ust_id = str(row['UstIdNr']).strip() if pd.notna(row['UstIdNr']) else None
    kurzbezeichnung = str(row['Kurzbezeichnung']).strip()[:50] if pd.notna(row['Kurzbezeichnung']) else None
    iban = str(row['IBAN']).strip().replace(' ', '') if pd.notna(row['IBAN']) else None
    
    # Check if exists
    cursor.execute("SELECT id FROM kreditoren WHERE unternehmenId = %s AND kontonummer = %s", (company_id, kontonummer))
    existing = cursor.fetchone()
    
    if existing:
        # Update
        cursor.execute("""
            UPDATE kreditoren SET 
                name = %s, kurzbezeichnung = %s, strasse = %s, plz = %s, ort = %s, land = %s,
                telefon = %s, email = %s, ustIdNr = %s, iban = %s, updatedAt = NOW()
            WHERE unternehmenId = %s AND kontonummer = %s
        """, (name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ust_id, iban, company_id, kontonummer))
        updated_kred += 1
    else:
        # Insert
        cursor.execute("""
            INSERT INTO kreditoren (unternehmenId, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ustIdNr, iban, createdAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (company_id, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ust_id, iban))
        inserted_kred += 1

conn.commit()
print(f"Kreditoren aktualisiert: {updated_kred}")
print(f"Kreditoren neu eingefügt: {inserted_kred}")

# ============ DEBITOREN ============
print("\n=== DEBITOREN IMPORT ===")
df_deb = pd.read_excel('/home/ubuntu/upload/Debitorenstammdaten2025-AngelusManagementberatung&ServiceKG.xlsx', header=1)
df_deb.columns = ['Konto', 'K_I', 'Beschriftung', 'Strasse', 'Postfach', 'PLZ', 'Ort', 'Land', 
                  'Telefon', 'Fax', 'Email', 'UstIdNr', 'Kurzbezeichnung', 'AlternativerSuchname',
                  'KundenLiefNr', 'Bank', 'BLZ', 'Kontonummer_Bank', 'IBAN', 'SEPAMandatsreferenz',
                  'Status', 'Bearbeitungsdatum', 'Zahlungssperre', 'Anlageart']

# Filter nur aktive Debitoren (K/I = I)
df_deb = df_deb[df_deb['K_I'] == 'I']
print(f"Anzahl Debitoren in Excel: {len(df_deb)}")

updated_deb = 0
inserted_deb = 0

for _, row in df_deb.iterrows():
    kontonummer = str(row['Konto']).strip() if pd.notna(row['Konto']) else None
    if not kontonummer:
        continue
    
    name = str(row['Beschriftung']).strip() if pd.notna(row['Beschriftung']) else None
    strasse = str(row['Strasse']).strip() if pd.notna(row['Strasse']) else None
    plz = str(row['PLZ']).strip() if pd.notna(row['PLZ']) else None
    ort = str(row['Ort']).strip() if pd.notna(row['Ort']) else None
    land = str(row['Land']).strip() if pd.notna(row['Land']) else None
    telefon = str(row['Telefon']).strip() if pd.notna(row['Telefon']) else None
    email = str(row['Email']).strip() if pd.notna(row['Email']) else None
    ust_id = str(row['UstIdNr']).strip() if pd.notna(row['UstIdNr']) else None
    kurzbezeichnung = str(row['Kurzbezeichnung']).strip()[:50] if pd.notna(row['Kurzbezeichnung']) else None
    
    # Check if exists
    cursor.execute("SELECT id FROM debitoren WHERE unternehmenId = %s AND kontonummer = %s", (company_id, kontonummer))
    existing = cursor.fetchone()
    
    if existing:
        # Update
        cursor.execute("""
            UPDATE debitoren SET 
                name = %s, kurzbezeichnung = %s, strasse = %s, plz = %s, ort = %s, land = %s,
                telefon = %s, email = %s, ustIdNr = %s, updatedAt = NOW()
            WHERE unternehmenId = %s AND kontonummer = %s
        """, (name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ust_id, company_id, kontonummer))
        updated_deb += 1
    else:
        # Insert
        cursor.execute("""
            INSERT INTO debitoren (unternehmenId, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ustIdNr, createdAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
        """, (company_id, kontonummer, name, kurzbezeichnung, strasse, plz, ort, land, telefon, email, ust_id))
        inserted_deb += 1

conn.commit()
print(f"Debitoren aktualisiert: {updated_deb}")
print(f"Debitoren neu eingefügt: {inserted_deb}")

# ============ ZUSAMMENFASSUNG ============
print("\n=== ZUSAMMENFASSUNG ===")
cursor.execute("SELECT COUNT(*) FROM kreditoren WHERE unternehmenId = %s", (company_id,))
total_kred = cursor.fetchone()[0]
cursor.execute("SELECT COUNT(*) FROM debitoren WHERE unternehmenId = %s", (company_id,))
total_deb = cursor.fetchone()[0]

print(f"Gesamt Kreditoren in DB: {total_kred}")
print(f"Gesamt Debitoren in DB: {total_deb}")

cursor.close()
conn.close()
