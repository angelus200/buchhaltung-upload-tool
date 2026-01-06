import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, unternehmen, userUnternehmen } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Detaillierte Berechtigungen", () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testUserId: number;
  let testUnternehmenId: number;
  let testZuordnungId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Test-User erstellen
    const [user] = await db.insert(users).values({
      openId: `test-berechtigungen-${Date.now()}`,
      name: "Test Berechtigungen User",
      email: `test-berechtigungen-${Date.now()}@test.de`,
      role: "user",
    }).$returningId();
    testUserId = user.id;

    // Test-Unternehmen erstellen
    const [firma] = await db.insert(unternehmen).values({
      name: "Test Berechtigungen GmbH",
      kontenrahmen: "SKR03",
      createdBy: testUserId,
    }).$returningId();
    testUnternehmenId = firma.id;

    // Zuordnung erstellen mit Standard-Berechtigungen
    const [zuordnung] = await db.insert(userUnternehmen).values({
      userId: testUserId,
      unternehmenId: testUnternehmenId,
      rolle: "buchhalter",
      buchungenLesen: true,
      buchungenSchreiben: true,
      stammdatenLesen: true,
      stammdatenSchreiben: false,
      berichteLesen: true,
      berichteExportieren: false,
      einladungenVerwalten: false,
    }).$returningId();
    testZuordnungId = zuordnung.id;
  });

  afterAll(async () => {
    if (!db) return;
    // Aufräumen
    await db.delete(userUnternehmen).where(eq(userUnternehmen.id, testZuordnungId));
    await db.delete(unternehmen).where(eq(unternehmen.id, testUnternehmenId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("sollte Berechtigungen mit korrekten Standardwerten erstellen", async () => {
    if (!db) throw new Error("Datenbank nicht verfügbar");

    const [zuordnung] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, testZuordnungId));

    expect(zuordnung).toBeDefined();
    expect(zuordnung.rolle).toBe("buchhalter");
    expect(zuordnung.buchungenLesen).toBe(true);
    expect(zuordnung.buchungenSchreiben).toBe(true);
    expect(zuordnung.stammdatenLesen).toBe(true);
    expect(zuordnung.stammdatenSchreiben).toBe(false);
    expect(zuordnung.berichteLesen).toBe(true);
    expect(zuordnung.berichteExportieren).toBe(false);
    expect(zuordnung.einladungenVerwalten).toBe(false);
  });

  it("sollte einzelne Berechtigungen aktualisieren können", async () => {
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Berechtigung aktualisieren
    await db
      .update(userUnternehmen)
      .set({
        stammdatenSchreiben: true,
        berichteExportieren: true,
      })
      .where(eq(userUnternehmen.id, testZuordnungId));

    // Überprüfen
    const [updated] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, testZuordnungId));

    expect(updated.stammdatenSchreiben).toBe(true);
    expect(updated.berichteExportieren).toBe(true);
    // Andere Berechtigungen sollten unverändert sein
    expect(updated.buchungenLesen).toBe(true);
    expect(updated.einladungenVerwalten).toBe(false);
  });

  it("sollte Rolle mit passenden Berechtigungen setzen können", async () => {
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Admin-Berechtigungen setzen
    await db
      .update(userUnternehmen)
      .set({
        rolle: "admin",
        buchungenLesen: true,
        buchungenSchreiben: true,
        stammdatenLesen: true,
        stammdatenSchreiben: true,
        berichteLesen: true,
        berichteExportieren: true,
        einladungenVerwalten: true,
      })
      .where(eq(userUnternehmen.id, testZuordnungId));

    const [admin] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, testZuordnungId));

    expect(admin.rolle).toBe("admin");
    expect(admin.einladungenVerwalten).toBe(true);
    expect(admin.buchungenSchreiben).toBe(true);
    expect(admin.stammdatenSchreiben).toBe(true);
    expect(admin.berichteExportieren).toBe(true);
  });

  it("sollte Viewer-Berechtigungen korrekt einschränken", async () => {
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Viewer-Berechtigungen setzen
    await db
      .update(userUnternehmen)
      .set({
        rolle: "viewer",
        buchungenLesen: true,
        buchungenSchreiben: false,
        stammdatenLesen: true,
        stammdatenSchreiben: false,
        berichteLesen: true,
        berichteExportieren: false,
        einladungenVerwalten: false,
      })
      .where(eq(userUnternehmen.id, testZuordnungId));

    const [viewer] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, testZuordnungId));

    expect(viewer.rolle).toBe("viewer");
    expect(viewer.buchungenLesen).toBe(true);
    expect(viewer.buchungenSchreiben).toBe(false);
    expect(viewer.stammdatenSchreiben).toBe(false);
    expect(viewer.berichteExportieren).toBe(false);
    expect(viewer.einladungenVerwalten).toBe(false);
  });

  it("sollte benutzerdefinierte Berechtigungen unabhängig von der Rolle erlauben", async () => {
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Buchhalter mit erweiterten Export-Rechten
    await db
      .update(userUnternehmen)
      .set({
        rolle: "buchhalter",
        buchungenLesen: true,
        buchungenSchreiben: true,
        stammdatenLesen: true,
        stammdatenSchreiben: true,
        berichteLesen: true,
        berichteExportieren: true, // Normalerweise nicht für Buchhalter
        einladungenVerwalten: false,
      })
      .where(eq(userUnternehmen.id, testZuordnungId));

    const [custom] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, testZuordnungId));

    expect(custom.rolle).toBe("buchhalter");
    expect(custom.berichteExportieren).toBe(true);
    expect(custom.einladungenVerwalten).toBe(false);
  });
});

describe("Berechtigungs-Validierung", () => {
  it("sollte alle Berechtigungsfelder als Boolean speichern", async () => {
    const db = await getDb();
    if (!db) throw new Error("Datenbank nicht verfügbar");

    // Temporären User und Unternehmen erstellen
    const [user] = await db.insert(users).values({
      openId: `test-validation-${Date.now()}`,
      name: "Validation Test",
      email: `validation-${Date.now()}@test.de`,
      role: "user",
    }).$returningId();

    const [firma] = await db.insert(unternehmen).values({
      name: "Validation Test GmbH",
      kontenrahmen: "SKR03",
      createdBy: user.id,
    }).$returningId();

    // Zuordnung mit expliziten Boolean-Werten
    const [zuordnung] = await db.insert(userUnternehmen).values({
      userId: user.id,
      unternehmenId: firma.id,
      rolle: "viewer",
      buchungenLesen: true,
      buchungenSchreiben: false,
      stammdatenLesen: true,
      stammdatenSchreiben: false,
      berichteLesen: true,
      berichteExportieren: false,
      einladungenVerwalten: false,
    }).$returningId();

    const [result] = await db
      .select()
      .from(userUnternehmen)
      .where(eq(userUnternehmen.id, zuordnung.id));

    // Prüfen dass alle Felder korrekte Boolean-Typen haben
    expect(typeof result.buchungenLesen).toBe("boolean");
    expect(typeof result.buchungenSchreiben).toBe("boolean");
    expect(typeof result.stammdatenLesen).toBe("boolean");
    expect(typeof result.stammdatenSchreiben).toBe("boolean");
    expect(typeof result.berichteLesen).toBe("boolean");
    expect(typeof result.berichteExportieren).toBe("boolean");
    expect(typeof result.einladungenVerwalten).toBe("boolean");

    // Aufräumen
    await db.delete(userUnternehmen).where(eq(userUnternehmen.id, zuordnung.id));
    await db.delete(unternehmen).where(eq(unternehmen.id, firma.id));
    await db.delete(users).where(eq(users.id, user.id));
  });
});
