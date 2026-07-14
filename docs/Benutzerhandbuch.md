# Benutzerhandbuch - PC Parts Shop

Dieses Handbuch beschreibt die vollständige Nutzung des PC Parts Shops für beide Nutzergruppen: **normale Benutzer (Kunden)** und **Administratoren**.

## Inhaltsverzeichnis

1. [Systemzugang & Voraussetzungen](#1-systemzugang--voraussetzungen)
2. [Registrierung & Anmeldung](#2-registrierung--anmeldung)
   - 2.1 [Registrierung per E-Mail](#21-registrierung-per-e-mail)
   - 2.2 [Anmeldung per Passwort](#22-anmeldung-per-passwort)
   - 2.3 [Anmeldung per Magic Link / Code](#23-anmeldung-per-magic-link--code)
   - 2.4 [Abmelden](#24-abmelden)
3. [Produktübersicht & Suche](#3-produktübersicht--suche)
   - 3.1 [Produktübersicht](#31-produktübersicht)
   - 3.2 [Produktsuche](#32-produktsuche)
   - 3.3 [Produktdetailseite](#33-produktdetailseite)
4. [Warenkorb & Bestellungen](#4-warenkorb--bestellungen)
   - 4.1 [Produkt in den Warenkorb legen](#41-produkt-in-den-warenkorb-legen)
   - 4.2 [Warenkorb ansehen & verwalten](#42-warenkorb-ansehen--verwalten)
   - 4.3 [Kaufabschluss](#43-kaufabschluss)
   - 4.4 [Bestellhistorie](#44-bestellhistorie)
5. [Wunschlisten](#5-wunschlisten)
   - 5.1 [Wunschliste erstellen](#51-wunschliste-erstellen)
   - 5.2 [Produkte hinzufügen & entfernen](#52-produkte-hinzufügen--entfernen)
   - 5.3 [Wunschliste teilen & Berechtigungen](#53-wunschliste-teilen--berechtigungen)
   - 5.4 [Wunschliste löschen](#54-wunschliste-löschen)
6. [Admin-Bereich](#6-admin-bereich)
   - 6.1 [Admin-Login](#61-admin-login)
   - 6.2 [Produkte verwalten](#62-produkte-verwalten)
   - 6.3 [Benutzer verwalten](#63-benutzer-verwalten)
7. [Fehlermeldungen & Lösungen](#7-fehlermeldungen--lösungen)

## 1 Systemzugang & Voraussetzungen

Der PC Parts Shop ist eine webbasierte Anwendung, die lokal auf dem eigenen Rechner betrieben wird. Voraussetzungen:

- **Docker** und **Docker Compose** müssen installiert sein.
- Die Anwendung wird mit folgendem Befehl gestartet:

```bash
docker compose up
```

- Nach dem Start ist die Anwendung über einen modernen Webbrowser erreichbar (Chrome, Firefox, Safari, Edge).

| Bereich | URL |
|---|---|
| Shop (normale Benutzer) | `http://localhost:3000/` |
| Admin-Bereich | `http://localhost:3000/admin/` |
| Anmeldung / Registrierung | `http://localhost:3000/login.html` |
| Admin-Anmeldung | `http://localhost:3000/admin/login.html` |

> **Hinweis:** Admins werden nach der Anmeldung über `login.html` automatisch zum Admin-Bereich weitergeleitet. Der Shop (`/`) ist für Admins nicht zugänglich.

## 2 Registrierung & Anmeldung

Die Anmeldeseite (`/login.html`) enthält drei Reiter: **Anmelden**, **Registrieren** und **Magic Link**.

### 2.1 Registrierung per E-Mail

1. Den Reiter **Registrieren** auswählen.
2. Alle Pflichtfelder ausfüllen:
   - **Name** - Vollständiger Name
   - **E-Mail** - Gültige, noch nicht registrierte E-Mail-Adresse
   - **Passwort** - Mindestens 6 Zeichen
3. Schaltfläche **Registrieren** klicken.
4. Eine Bestätigungs-E-Mail wird an die angegebene Adresse gesendet.
5. Den **Bestätigungslink** in der E-Mail öffnen, um das Konto zu verifizieren.
6. Nach erfolgreicher Verifizierung erscheint auf der Anmeldeseite die Meldung *„E-Mail bestätigt! Du kannst dich jetzt anmelden."*

> **Hinweis:** Ohne Bestätigung der E-Mail-Adresse ist keine Anmeldung möglich.

> **Hinweis:** Die Anwendung erfordert einen konfigurierten SMTP-Server. Ist `EMAIL_HOST` in der `docker-compose.yml` nicht gesetzt oder auf `smtp.example.com` belassen, schlägt der E-Mail-Versand fehl und die Registrierung bricht mit einem Serverfehler ab.

### 2.2 Anmeldung per Passwort

1. Den Reiter **Anmelden** auswählen (standardmäßig aktiv).
2. **E-Mail** und **Passwort** eingeben.
3. Schaltfläche **Anmelden** klicken.
4. Bei Erfolg wird man automatisch weitergeleitet:
   - normale Benutzer → Produktübersicht `/`
   - Admins → Admin-Dashboard `/admin/`

> **Hinweis:** Gesperrte oder nicht verifizierte Konten können sich nicht anmelden.

### 2.3 Anmeldung per Magic Link / Code

Diese Methode ermöglicht eine passwortlose Anmeldung.

**Schritt 1 - Link anfordern:**

1. Den Reiter **Magic Link** auswählen.
2. Die registrierte E-Mail-Adresse eingeben.
3. Schaltfläche **Link senden** klicken.
4. Eine E-Mail mit einem Anmeldelink und einem einmaligen Code wird versendet.

**Schritt 2a - Per Link:**

- Den **Link in der E-Mail** anklicken. Man wird automatisch eingeloggt und weitergeleitet.

**Schritt 2b - Per Code (Alternative):**

1. Den **Code** aus der E-Mail kopieren.
2. Das Feld **Code** unterhalb des Trenners „oder Code eingeben" auf der Anmeldeseite ausfüllen.
3. Schaltfläche **Anmelden** klicken.

> **Hinweis:** Link und Code sind **einmalig verwendbar** und nur **15 Minuten gültig**. Danach muss ein neuer Link angefordert werden.

### 2.4 Abmelden

Die Schaltfläche **Abmelden** befindet sich oben rechts in der Navigationsleiste. Ein Klick beendet die aktuelle Session und leitet zur Anmeldeseite weiter.

## 3 Produktübersicht & Suche

> Dieser Bereich ist ausschließlich für normale Benutzer. Admins werden nach dem Login direkt zum Admin-Bereich weitergeleitet.

### 3.1 Produktübersicht

Nach der Anmeldung gelangt man zur Produktübersicht unter `/`. Alle verfügbaren Produkte werden als Karten dargestellt.

Jede Produktkarte zeigt:

| Feld | Beschreibung |
|---|---|
| ID | Eindeutige Produkt-ID (z.B. `ID 3`) |
| Kategorie | z.B. CPU, GPU, RAM, SSD |
| Name | Produktbezeichnung |
| Beschreibung | Kurzbeschreibung |
| Preis | Preis in Euro |
| Lagerbestand | Verfügbare Stückzahl oder *„Nicht verfügbar"* bei Bestand = 0 |
| Schaltflächen | **Details** (zur Detailseite) und **In Warenkorb** |

> **Hinweis:** Die Schaltfläche **In Warenkorb** ist deaktiviert, wenn der Lagerbestand 0 beträgt.

### 3.2 Produktsuche

Oberhalb der Produktkarten befindet sich eine Suchleiste mit drei Feldern:

| Feld | Funktion |
|---|---|
| **Produkt-ID** | Sucht ein Produkt direkt anhand seiner eindeutigen ID |
| **Name suchen** | Teilsuche im Produktnamen, nicht case-sensitiv |
| **Alle Kategorien** | Dropdown-Filter nach Kategorie (CPU, GPU, RAM, SSD, Mainboard, Netzteil, Gehäuse, Kühlung) |

**Verwendung:**

1. Eines oder mehrere Felder ausfüllen.
2. Schaltfläche **Suchen** klicken oder `Enter` drücken.
3. Die Produktkarten aktualisieren sich entsprechend der Eingabe.

> **Hinweis:** Wird eine ID eingegeben, werden Name und Kategorie ignoriert - die ID-Suche hat immer Vorrang.

### 3.3 Produktdetailseite

Ein Klick auf die Schaltfläche **Details** einer Produktkarte öffnet die Detailseite unter `/product.html?id=...`

Die Detailseite zeigt alle Produktinformationen (Kategorie, Name, Beschreibung, Preis, Lagerbestand) und ermöglicht das Hinzufügen zum Warenkorb über die Schaltfläche **In Warenkorb**.

Der Link **Zurück zur Übersicht** führt zurück zur Produktliste.

## 4 Warenkorb & Bestellungen

### 4.1 Produkt in den Warenkorb legen

- Auf der **Produktübersicht** oder der **Detailseite** die Schaltfläche **In Warenkorb** klicken.
- Eine Erfolgsmeldung *„Zum Warenkorb hinzugefügt!"* erscheint kurz unterhalb der Navigationsleiste.
- Wird dasselbe Produkt erneut hinzugefügt, erhöht sich die Menge im Warenkorb automatisch.

### 4.2 Warenkorb ansehen & verwalten

Den Warenkorb über den Navigationspunkt **Warenkorb** aufrufen.

Die Tabelle zeigt alle eingelegten Artikel:

| Spalte | Inhalt |
|---|---|
| Produkt | Name des Artikels |
| Preis | Einzelpreis in Euro |
| Menge | Eingelegte Stückzahl |
| Gesamt | Zwischensumme dieser Position |
| Aktion | Schaltfläche **Entfernen** |

Am Ende der Tabelle wird der **Gesamtbetrag** aller Positionen angezeigt.

**Artikel entfernen:**

- Schaltfläche **Entfernen** in der jeweiligen Zeile klicken.
- Der Artikel wird sofort aus dem Warenkorb gelöscht und die Tabelle aktualisiert sich.

### 4.3 Kaufabschluss

1. Im Warenkorb die Schaltfläche **Jetzt kaufen** klicken.
2. Den Bestätigungsdialog *„Möchtest du alle Artikel im Warenkorb kaufen?"* mit **OK** bestätigen.
3. Bei Erfolg:
   - Der Lagerbestand aller bestellten Produkte wird reduziert.
   - Der Warenkorb wird geleert.
   - Die Bestellnummer und der Gesamtbetrag werden angezeigt.
   - Eine **Bestellbestätigung** wird automatisch per E-Mail gesendet. Sie enthält die Bestellnummer, alle bestellten Artikel mit Menge und Preis sowie den Gesamtbetrag.

> **Hinweis:** Sind beim Kaufversuch Produkte nicht mehr ausreichend auf Lager, wird der Kauf abgelehnt und eine Fehlermeldung angezeigt. Der Warenkorb bleibt erhalten.

### 4.4 Bestellhistorie

Über den Navigationspunkt **Bestellungen** gelangt man zur persönlichen Kaufhistorie.

Jede Bestellung wird als Karte dargestellt mit:

- **Bestellnummer** (z.B. *Bestellung #12*)
- **Datum und Uhrzeit** der Bestellung
- **Artikeltabelle** mit Produktname, Menge und Preis zum Kaufzeitpunkt
- **Gesamtbetrag**

> **Hinweis:** Die Preise in der Bestellhistorie spiegeln den Preis zum Kaufzeitpunkt wider - auch wenn sich der aktuelle Produktpreis seitdem geändert hat.

## 5 Wunschlisten

Wunschlisten sind über den Navigationspunkt **Wunschlisten** erreichbar. Diese Funktion steht ausschließlich normalen Benutzern zur Verfügung - Admins haben keinen Zugriff auf diesen Bereich.

### 5.1 Wunschliste erstellen

1. Schaltfläche **+ Neue Liste** oben rechts klicken. Ein Formular klappt auf.
2. Felder ausfüllen:
   - **Name** - Bezeichnung der Wunschliste (Pflichtfeld)
   - **Beschreibung** - Optionale Beschreibung
3. Schaltfläche **Erstellen** klicken.
4. Die neue Liste erscheint sofort in der Übersicht mit:
   - ID der Liste, Name, Badge **Besitzer** und Name des Erstellers

### 5.2 Produkte hinzufügen & entfernen

**Produkt hinzufügen** (nur für Besitzer und Benutzer mit Schreibberechtigung):

1. Schaltfläche **+ Produkt** auf der gewünschten Wunschliste klicken.
2. Im Suchfeld den **Produktnamen** oder die **Produkt-ID** eingeben. Ab dem ersten Zeichen erscheint ein Live-Dropdown mit bis zu 3 passenden Ergebnissen (Name, Preis, Lagerbestand).
3. Das gewünschte Produkt aus dem Dropdown **auswählen** (Maus oder `Enter`). Es erscheint als Chip im Auswahlbereich.
4. Schaltfläche **Hinzufügen** klicken.

> **Tipp:** Mit der `Escape`-Taste lässt sich das Dropdown schließen. Ein Klick auf das **×** im Chip hebt die Auswahl auf.

**Produkt entfernen** (nur für Besitzer und Benutzer mit Schreibberechtigung):

- Das **×-Symbol** neben einem Produkt-Chip in der Liste klicken. Das Produkt wird sofort entfernt.

### 5.3 Wunschliste teilen & Berechtigungen

Der **Besitzer** einer Wunschliste kann anderen Benutzern Zugriff gewähren. Es gibt zwei Stufen:

| Berechtigung | Liste sehen | Produkte bearbeiten |
|---|---|---|
| **Lesen** (`read`) | Ja | Nein |
| **Schreiben** (`write`) | Ja | Ja |

**Berechtigung vergeben:**

1. Schaltfläche **Berechtigung** auf der gewünschten Liste klicken (nur für den Besitzer sichtbar). Ein Modal-Fenster öffnet sich.
2. Im Feld **Benutzer suchen** den Namen oder die E-Mail eingeben (mindestens 2 Zeichen). Ein Live-Dropdown zeigt bis zu 3 passende Benutzer.
3. Den gewünschten Benutzer aus dem Dropdown **auswählen**.
4. Unter **Berechtigung** zwischen **Lesen** und **Schreiben** wählen.
5. Schaltfläche **Speichern** klicken.

Eine geteilte Liste erscheint anschließend auch in der Wunschlisten-Ansicht des berechtigten Benutzers - mit dem Badge `read` oder `write` und dem Namen des Besitzers.

### 5.4 Wunschliste löschen

Nur der **Besitzer** einer Wunschliste kann diese löschen.

**Variante 1 - Direkt aus der Liste:**

1. Schaltfläche **Löschen** auf der jeweiligen Wunschliste klicken.
2. Den Bestätigungsdialog mit **OK** bestätigen.

**Variante 2 - Per ID:**

1. Schaltfläche **ID löschen** oben rechts klicken. Ein Modal-Fenster öffnet sich.
2. Die **Wunschlisten-ID** eingeben (die ID wird auf jeder Karte oben links angezeigt, z.B. `ID 4`).
3. Schaltfläche **Löschen** klicken.

## 6 Admin-Bereich

Der Admin-Bereich ist unter `http://localhost:3000/admin/` erreichbar und ausschließlich für Administratoren zugänglich. Normale Benutzerkonten werden mit der Meldung *„Kein Admin-Zugriff"* abgewiesen.

### 6.1 Admin-Login

1. Die Seite `/admin/login.html` aufrufen.
2. **E-Mail** und **Passwort** eines Admin-Kontos eingeben.
3. Schaltfläche **Anmelden** klicken.
4. Bei erfolgreicher Anmeldung wird man zum Admin-Dashboard unter `/admin/` weitergeleitet. Der Name des eingeloggten Admins wird oben in der Navigationsleiste angezeigt.

### 6.2 Produkte verwalten

Die Produktverwaltung ist das Standard-Dashboard unter `/admin/`.

#### Produktliste & Suche

Alle Produkte werden in einer Tabelle dargestellt:

| Spalte | Inhalt |
|---|---|
| ID | Eindeutige Produkt-ID |
| Name | Produktbezeichnung |
| Kategorie | z.B. CPU, GPU |
| Preis | Preis in Euro |
| Bestand | Verfügbare Stückzahl (grünes Badge = verfügbar, rotes Badge = 0) |
| Aktionen | Schaltflächen **Bearbeiten** und **Löschen** |

Die Suchleiste funktioniert identisch zur Benutzersuche: Filter nach **ID**, **Name** (Teilsuche) und **Kategorie**. Suche per Klick auf **Suchen** oder `Enter`-Taste.

#### Produkt erstellen

1. Schaltfläche **+ Neues Produkt** oben rechts klicken. Man gelangt zum Formular unter `/admin/product-form.html`.
2. Formular ausfüllen:

| Feld | Pflicht | Beschreibung |
|---|---|---|
| Name | Ja | Produktbezeichnung |
| Beschreibung | Nein | Freitext |
| Preis (€) | Ja | Dezimalzahl, z.B. `149.99` |
| Lagerbestand | Ja | Ganzzahl, min. 0 |
| Kategorie | Nein | CPU, GPU, RAM, SSD, Mainboard, Netzteil, Gehäuse, Kühlung |

3. Schaltfläche **Speichern** klicken. Das Produkt erscheint sofort in der Produktliste.

#### Produkt bearbeiten

1. In der Produktliste die Schaltfläche **Bearbeiten** neben dem gewünschten Produkt klicken. Das Formular öffnet sich vorausgefüllt mit den aktuellen Werten.
2. Die gewünschten Felder ändern.
3. Schaltfläche **Speichern** klicken.

> **Hinweis:** Beim Speichern werden alle Felder vollständig überschrieben.

#### Produkt löschen

1. In der Produktliste die Schaltfläche **Löschen** neben dem gewünschten Produkt klicken.
2. Den Bestätigungsdialog *„Produkt wirklich löschen?"* mit **OK** bestätigen.

> **Hinweis:** Beim Löschen eines Produkts werden zugehörige Warenkorb-Einträge und Wunschlisten-Einträge automatisch mitgelöscht.

### 6.3 Benutzer verwalten

Die Benutzerverwaltung ist unter `/admin/users.html` über den Navigationspunkt **User-Verwaltung** erreichbar.

#### Alle Benutzer anzeigen

Schaltfläche **Alle anzeigen** klicken. Die Tabelle zeigt alle registrierten Benutzer:

| Spalte | Inhalt |
|---|---|
| ID | Eindeutige Benutzer-ID |
| Name | Vollständiger Name |
| E-Mail | E-Mail-Adresse |
| Rolle | `user` oder `admin` |
| Verifiziert | Ja / Nein |
| Status | Aktiv / Gesperrt |
| Aktionen | **Sperren/Entsperren** und **Löschen** |

#### Benutzer per ID suchen

1. Im Feld **User-ID suchen** eine Benutzer-ID eingeben.
2. Schaltfläche **Suchen** klicken. Der gesuchte Benutzer wird in der Tabelle angezeigt.
3. Schaltfläche **Alle anzeigen** klicken, um zur vollständigen Liste zurückzukehren.

#### Benutzer sperren / entsperren

- In der Tabelle die Schaltfläche **Sperren** oder **Entsperren** neben dem jeweiligen Benutzer klicken. Der Status wird sofort aktualisiert.

| Status | Auswirkung |
|---|---|
| Gesperrt | Benutzer kann sich nicht mehr anmelden |
| Aktiv | Benutzer kann sich normal anmelden |

#### Benutzer löschen

1. Schaltfläche **Löschen** neben dem gewünschten Benutzer klicken.
2. Den Bestätigungsdialog *„User wirklich löschen?"* mit **OK** bestätigen.

> **Hinweis:** Beim Löschen eines Benutzers werden alle zugehörigen Wunschlisten und Berechtigungen ebenfalls gelöscht. Bestellungen bleiben als anonymisierter Eintrag erhalten.

#### Neuen Admin-Account erstellen

1. Schaltfläche **+ Admin erstellen** oben rechts klicken. Ein Formular klappt auf.
2. Felder ausfüllen:
   - **Name** (Pflichtfeld)
   - **E-Mail** (Pflichtfeld, muss eindeutig sein)
   - **Passwort** (Pflichtfeld)
3. Schaltfläche **Erstellen** klicken.

Der neue Admin-Account ist sofort aktiv und bereits verifiziert - keine E-Mail-Bestätigung erforderlich.

## 7 Fehlermeldungen & Lösungen

| Meldung | Ursache | Lösung |
|---|---|---|
| *„E-Mail nicht bestätigt"* | Konto wurde nach der Registrierung noch nicht verifiziert | Bestätigungs-E-Mail prüfen und Verifizierungslink öffnen |
| *„Konto gesperrt"* | Administrator hat das Konto gesperrt | Administrator kontaktieren |
| *„E-Mail bereits registriert"* | Diese E-Mail-Adresse ist bereits vorhanden | Andere E-Mail verwenden oder direkt anmelden |
| *„Ungültige Anmeldedaten"* | E-Mail oder Passwort falsch | Zugangsdaten prüfen |
| *„Verbindungsfehler"* | Server nicht erreichbar | Prüfen ob der Server läuft (`docker compose up`) |
| *„Token abgelaufen"* | Magic-Link-Code ist älter als 15 Minuten | Neuen Magic Link anfordern |
| *„Ungültiger oder abgelaufener Token"* | Verifizierungslink bereits verwendet oder abgelaufen | Erneut registrieren oder Support kontaktieren |
| *„Produkt nicht verfügbar"* | Lagerbestand des Produkts ist 0 | Produkt kann nicht in den Warenkorb gelegt werden |
| *„Nicht genug auf Lager"* | Angefragte Menge übersteigt den Lagerbestand | Menge reduzieren |
| *„Warenkorb ist leer"* | Kaufversuch ohne Artikel im Warenkorb | Zuerst Produkte hinzufügen |
| *„Kein Admin-Zugriff"* | Anmeldung im Admin-Bereich mit einem normalen Benutzerkonto | Admin-Zugangsdaten verwenden |
| *„Nur der Besitzer darf löschen"* | Versuch, eine fremde Wunschliste zu löschen | Nur eigene Listen können gelöscht werden |
| *„Keine Berechtigung"* | Zugriff auf eine Wunschliste ohne Berechtigung | Besitzer um Zugriff bitten |
| *„Nur Leseberechtigung"* | Schreibaktion auf einer Liste mit nur Lesezugriff | Besitzer um Schreibberechtigung bitten |
| *„Mindestens 2 Zeichen eingeben"* | Sucheingabe zu kurz | Mindestens 2 Zeichen für die Benutzersuche eingeben |
| *„Bitte zuerst ein Produkt auswählen"* | Hinzufügen-Button ohne ausgewähltes Produkt geklickt | Produkt im Dropdown auswählen, dann Hinzufügen klicken |
