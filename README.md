# Design to Cost für Windows und Mac

Offizielle Downloads und signierte Updatebeschreibungen für Design to Cost. Der Quellcode der App wird separat in einem privaten Repository gepflegt.

## Mac

[Aktuelle Mac-Version herunterladen](macos/README.md)

- Eigenes natives Mac-App-Fenster für Intel und Apple Silicon, ab macOS 13.3.
- DMG oder ZIP; Installation in einem eigenen beschreibbaren Benutzerordner ohne Administratorrechte.
- Lokale Berechnung, Projekte und Excel-Funktionen; keine Internetverbindung für die Arbeit erforderlich.
- Updateprüfung beim Start, signierte Pakete, Installation nach Auswahl und Wiederherstellung bei fehlgeschlagenem Neustart.
- Ohne Apple Developer ID und Notarisierung; beim ersten Öffnen kann eine manuelle Freigabe erforderlich sein. [Anleitung von Apple](https://support.apple.com/de-de/102445).

## Web 1.3.1

[Web-App öffnen](https://design-to-cost-web.vercel.app)

Die Berechnung und Speicherung laufen lokal im Browser. Nach vollständigem Laden ist ein Offline-Neustart möglich. Projektdateien regelmässig als `.dtcost` exportieren.

## Windows 1.3.1

[Aktuelle Windows-Version herunterladen](https://github.com/patrikbritschgi/design-to-cost-releases/releases/latest)

- Eigenes Windows-App-Fenster für Windows 10/11 x64.
- Installation im eigenen Benutzerkonto ohne Administratorrechte oder portable ZIP-Ausgabe.
- Vollständige Fensterlaufzeit enthalten; Berechnung, Projekte und Excel-Funktionen laufen lokal und offline.
- Ab Version 1.2.0: Updateprüfung beim Start und Aktualisierung nach bewusster Auswahl. Automatische Prüfungen lassen sich abschalten.

Version 1.1.1 benötigt einmal ein manuelles Upgrade auf die aktuelle Windows-Ausgabe. Ab 1.2.0 ist das signierte Update auf 1.3.1 in der App möglich. Das ZIP vollständig in einen eigenen Ordner entpacken; den Unterordner WebView2 mitführen. Projekte und Einstellungen bleiben bei einer Aktualisierung erhalten.

In Web und Windows 1.3.1: eingebettete Bilder und interaktive STEP-Vorschau mit Volumen, Oberfläche und Bounding Box, Spaltenfilter und Mehrfachbearbeitung, Blechkostenschätzung sowie ausführliche Excel-/PDF-Berichte. [Installations- und Bedienhinweise](https://github.com/patrikbritschgi/design-to-cost-releases/releases/download/v1.3.1/README.md).

Web und Windows 1.3.1 verwenden Projektformat 5 einschliesslich Anhängen und Schätzungsnachweisen. Die bestehende Mac-App 1.3.0 bleibt unverändert und kann Format 5 nicht öffnen; für sie eine separate Format-4-Datei aufbewahren. Vor der Migration wird eine Sicherung angelegt.

## Veröffentlichung und Prüfung

Mac und Windows verwenden getrennte Updatekanäle. GitHubs `releases/latest` bleibt dem Windows-Kanal zugeordnet. Updatebeschreibungen sind mit dem hier veröffentlichten Ed25519-Prüfschlüssel signiert. EXE und Installer besitzen keine Windows-Herausgebersignatur; Mac-Apps besitzen eine technische Ad-hoc-Signatur. Lizenzhinweise liegen den Paketen bei.

Veröffentlichungen werden zuerst als Entwurf vollständig vorbereitet. Ein gesondert gestarteter Ablauf prüft die Signatur, alle Pakete und die erlaubten öffentlichen Dateien, bevor er den Release veröffentlicht. Dieses Repository enthält keine Benutzerprojekte und keinen privaten App-Quellcode.
