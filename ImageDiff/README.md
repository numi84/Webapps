# ImageDiff

Ein einfaches Python-Tool zum Vergleich von zwei Bildern mit visueller Darstellung der Unterschiede.

## Features

- **Drag & Drop Unterstützung** für beide Bilder
- **Datei-Browser** als Alternative zum Drag & Drop
- **Umfangreiche Formatunterstützung:**
  - JPG/JPEG
  - PNG
  - BMP
  - TIFF/TIF
  - GIF
  - WEBP
  - PDF (erste Seite)
- **Einstellbare Empfindlichkeit** (0-100%, Standard: 80%)
- **Farbcodierte Unterschiede:**
  - 🟡 **Gelb**: Identische Pixel in beiden Bildern
  - 🔴 **Rot**: Unterschiedliche Pixel (heller in Bild A)
  - 🟢 **Grün**: Unterschiedliche Pixel (heller in Bild B)
- **Flexible Export-Optionen:**
  - PNG, JPEG, BMP, TIFF
  - JPEG-Qualität einstellbar (Standard: 90%)
- **Automatische Skalierung**: Größeres Bild wird auf die Größe des kleineren herunterskaliert

## Installation

### Voraussetzungen

- Python 3.8 oder höher
- pip (Python Package Manager)

### Schritt 1: Python-Abhängigkeiten installieren

```bash
cd ImageDiff
pip install -r requirements.txt
```

### Schritt 2: PDF-Support (optional)

Für PDF-Unterstützung muss zusätzlich **Poppler** installiert werden:

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install poppler-utils
```

#### macOS
```bash
brew install poppler
```

#### Windows
1. Poppler herunterladen von: https://github.com/oschwartz10612/poppler-windows/releases
2. Entpacken und den `bin`-Ordner zum PATH hinzufügen

**Hinweis:** Ohne Poppler funktioniert das Tool auch, aber ohne PDF-Support.

## Nutzung

### Starten des Programms

```bash
python image_diff.py
```

oder mit Python 3:

```bash
python3 image_diff.py
```

### Anleitung

1. **Bilder laden:**
   - **Methode 1:** Ziehe die Bilder per Drag & Drop in die entsprechenden Drop-Zonen (Image A / Image B)
   - **Methode 2:** Klicke auf "Browse..." und wähle die Bilder über den Datei-Dialog aus

2. **Empfindlichkeit einstellen:**
   - Bewege den Slider "Sensitivity" (0-100%)
   - Höhere Werte = strengerer Vergleich (mehr Unterschiede werden erkannt)
   - Standard: 80%

3. **Vergleich starten:**
   - Klicke auf "Compare Images"
   - Das Tool verarbeitet beide Bilder und erstellt ein Vergleichsbild

4. **Ergebnis speichern:**
   - Klicke auf "Save Result"
   - Wähle das gewünschte Dateiformat (PNG, JPEG, BMP, TIFF)
   - Bei JPEG: Wähle die Qualität (0-100%, Standard: 90%)
   - Wähle den Speicherort

5. **Neu starten:**
   - Klicke auf "Reset" um alle Bilder zu löschen und von vorne zu beginnen

## Validierung & Fehlerbehandlung

Das Tool überprüft automatisch:
- ✅ Ob beide Bilder geladen wurden (zeigt Warnung wenn nur ein Bild geladen ist)
- ✅ Ob die Dateiformate unterstützt werden
- ✅ Ob die Bilddateien gültig und nicht beschädigt sind
- ✅ Ob Dateien existieren

## Technische Details

### Funktionsweise des Vergleichs

1. Beide Bilder werden in RGB konvertiert
2. Das größere Bild wird auf die Größe des kleineren herunterskaliert
3. Pixel-für-Pixel Vergleich mit konfigurierbarer Toleranz
4. Farbzuordnung basierend auf Unterschieden:
   - **Gelb**: Differenz unter Schwellwert (identisch)
   - **Rot**: Unterschied vorhanden, Pixel in Bild A heller
   - **Grün**: Unterschied vorhanden, Pixel in Bild B heller

### Empfindlichkeit

Der Empfindlichkeitswert (0-100%) wird in einen RGB-Schwellwert umgerechnet:
- **0%** = sehr tolerant (fast alle Pixel werden als identisch gewertet)
- **100%** = sehr streng (kleinste Farbunterschiede werden erkannt)
- **80%** (Standard) = ausgewogener Kompromiss

## Bekannte Limitationen

- PDF-Dateien: Nur die erste Seite wird verglichen
- Große Bilder können die Verarbeitung verlangsamen
- Unterschiedliche Bildgrößen: Immer Skalierung auf kleinere Größe

## Fehlerbehebung

### "TkinterDnD2 is required..."
**Problem:** Drag & Drop funktioniert nicht
**Lösung:**
```bash
pip install tkinterdnd2
```

### "PDF support not available..."
**Problem:** PDF-Dateien können nicht geöffnet werden
**Lösung:** Poppler installieren (siehe Installation Schritt 2)

### "Failed to load image..."
**Problem:** Bilddatei kann nicht geladen werden
**Mögliche Ursachen:**
- Datei ist beschädigt
- Format wird nicht unterstützt
- Datei existiert nicht

## Lizenz

Dieses Tool wurde für den persönlichen und internen Gebrauch entwickelt.

## Support

Bei Problemen oder Fragen bitte ein Issue im Repository erstellen.
