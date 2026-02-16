# VOLLSTÄNDIGE ANALYSE: Stammdaten.tsx - Fehlende Variablen

## VERWENDETE tRPC-PFADE IM FRONTEND

### ✅ KREDITOREN (stammdaten.kreditoren)
- list ✅
- getSuggestions ✅
- create ✅
- update ✅
- delete ✅
- convertToDebitor ✅

### ✅ DEBITOREN (stammdaten.debitoren)
- list ✅
- getSuggestions ✅
- create ✅
- update ✅
- delete ✅
- convertToKreditor ✅

### ✅ SACHKONTEN (stammdaten.sachkonten)
- list ✅
- create ✅
- update ✅
- delete ✅

### ✅ ANLAGEVERMÖGEN (jahresabschluss.anlagevermoegen)
- list ✅ (Zeile 364)
- create ✅ (Zeile 493)
- update ✅ (Zeile 505)
- delete ✅ (Zeile 517)

### ✅ BANKKONTEN (jahresabschluss.bankkonten)
- list ✅ (Zeile 370)
- create ✅ (Zeile 528)
- update ✅ (Zeile 540)
- delete ✅ (Zeile 552)

### ✅ GESELLSCHAFTER (stammdaten.gesellschafter)
- list ✅ (Zeile 376)
- create ✅ (Zeile 563)
- update ✅ (Zeile 575)
- delete ✅ (Zeile 587)

### ✅ FINANZKONTEN (finanzkonten)
- list ✅ (Zeile 382)
- create ✅ (Zeile 595)
- update ✅ (Zeile 607)
- delete ✅ (Zeile 619)

## HANDLER-FUNKTIONEN

### ✅ DEFINIERT UND VERWENDET
- handleDeleteKreditor (def: 980, use: 1416) ✅
- handleDeleteDebitor (def: 987, use: 1519) ✅
- handleDeleteSachkonto (def: 994, use: 1608) ✅
- handleDeleteAnlage (def: 1001, use: 1697) ✅
- handleDeleteBankkonto (def: 1008, use: 1787) ✅
- handleDeleteGesellschafter (def: 1015, use: 1912) ✅
- handleDeleteKreditkarte (def: 1026, use: 2023) ✅
- handleDeleteZahlungsdienstleister (def: 1033, use: 2126) ✅

## ❌ MÖGLICHE PROBLEME

### TABS IN STAMMDATEN_TYPEN OHNE BACKEND-ROUTER

1. **BETEILIGUNG** (Zeile 105-122)
   - Backend: stammdaten.beteiligungen.list ✅
   - Backend: stammdaten.beteiligungen.create ✅
   - Backend: stammdaten.beteiligungen.update ❌ FEHLT!
   - Backend: stammdaten.beteiligungen.delete ✅
   - Frontend: KEINE Queries/Mutations definiert! ❌
   - Frontend: KEINE Handler-Funktionen! ❌

2. **BROKERKONTO** (Zeile 216-230)
   - Backend: Vermutlich in finanzkonten
   - Frontend: KEINE Queries/Mutations definiert
   - Frontend: KEINE Handler-Funktionen

3. **KOSTENSTELLE** (Zeile 232-247)
   - Backend: ???
   - Frontend: KEINE Queries/Mutations definiert
   - Frontend: KEINE Handler-Funktionen

4. **VERTRAG** (Zeile 249-268)
   - Backend: ???
   - Frontend: KEINE Queries/Mutations definiert
   - Frontend: KEINE Handler-Funktionen

## FAZIT

**KEIN "deleteAllocation" gefunden!**

Der Fehler "deleteAllocation is not defined" existiert NICHT in der aktuellen Version der Datei.

**Mögliche Ursachen:**
1. Der Fehler tritt auf einer ANDEREN Seite auf (nicht Stammdaten.tsx)
2. Der Browser-Cache zeigt eine alte Version der App
3. Der Deployment hat die Änderungen noch nicht übernommen

**Empfehlung:**
1. Hard Refresh im Browser (Cmd+Shift+R)
2. Prüfen ob der Fehler wirklich auf der Stammdaten-Seite auftritt
3. Browser-Konsole öffnen und exakte Fehlermeldung kopieren
