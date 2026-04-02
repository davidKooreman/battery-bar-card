# Battery Bar Card

Een custom Lovelace card voor Home Assistant die batterijniveaus weergeeft als een horizontale gesegmenteerde balk met een groot percentage getal er overheen.

## Installatie via HACS

1. Ga in Home Assistant naar **HACS → Frontend**
2. Klik op de drie puntjes rechtsboven → **Custom repositories**
3. Voer de repository URL in en kies categorie **Lovelace**
4. Klik **Add**, zoek daarna naar **Battery Bar Card** en installeer
5. Herstart Home Assistant of clear de browsercache

## Handmatige installatie

1. Download `battery-bar-card.js`
2. Zet het bestand in `/config/www/`
3. Voeg toe aan je Lovelace resources:

```yaml
resources:
  - url: /local/battery-bar-card.js
    type: module
```

## Configuratie

### Minimaal voorbeeld

```yaml
type: custom:battery-bar-card
entities:
  - sensor.logitech_muis_batterij
  - sensor.toetsenbord_batterij
```

### Volledig voorbeeld

```yaml
type: custom:battery-bar-card
title: Apparaat Batterijen
entities:
  - sensor.logitech_muis_batterij
  - sensor.toetsenbord_batterij
  - sensor.aqara_bewegingssensor_batterij
  - sensor.deursensor_keuken_batterij
height: 65
font_size: 30
segments: 10
low_threshold: 15
mid_threshold: 30
show_name: true
```

## Opties

| Optie           | Type    | Standaard | Beschrijving                                      |
|-----------------|---------|-----------|---------------------------------------------------|
| `entities`      | lijst   | verplicht | Lijst van battery sensor entity_id's              |
| `entity`        | string  | —         | Enkele entity (alternatief voor `entities`)       |
| `title`         | string  | geen      | Koptekst boven de kaart                           |
| `height`        | number  | `65`      | Hoogte van de batterij balk in pixels             |
| `font_size`     | number  | `30`      | Grootte van het percentage getal in pixels        |
| `segments`      | number  | `10`      | Aantal segmenten in de balk                       |
| `low_threshold` | number  | `15`      | Drempel (%) voor rode kleur                       |
| `mid_threshold` | number  | `30`      | Drempel (%) voor oranje/gele kleur                |
| `show_name`     | boolean | `false`   | Toon entiteitnaam boven elke balk                 |

## Kleurgedrag

| Niveau           | Kleur        | Gedrag              |
|------------------|--------------|---------------------|
| > mid_threshold  | 🔵 Cyaan blauw | Statisch            |
| > low_threshold  | 🟡 Oranje/geel | Statisch            |
| ≤ low_threshold  | 🔴 Rood        | Knippert            |

## Compatibiliteit

- Home Assistant 2023.0 of nieuwer
- Werkt met alle sensoren die een waarde van 0–100 teruggeven
- Ondersteunt ook het attribuut `battery_level`
