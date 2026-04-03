/**
 * battery-bar-card — Custom Lovelace card voor Home Assistant
 * Versie: 1.3.0
 *
 * Wijzigingen v1.3.0:
 *   - Nieuw: tap_action ondersteuning voor navigatie bij klikken
 *
 * Wijzigingen v1.2.0:
 *   - Nieuw: font_weight optie voor tekstdikte (bijv. 400=normaal, 700=bold, standaard: 800)
 *
 * Wijzigingen v1.1.0:
 *   - Nieuw: font_color optie voor vaste tekstkleur (bijv. "#ffffff" voor wit)
 *
 * Configuratie-opties:
 *   entities:          lijst van entity_id's
 *   title:             optionele koptekst boven de kaart
 *   segments:          aantal segmenten (standaard: 10)
 *   height:            hoogte van de batterij in px (standaard: 65)
 *   font_size:         grootte van het percentage getal (standaard: 30)
 *   font_color:        vaste kleur voor het percentage (bijv. "#ffffff") — overschrijft automatische kleur
 *   font_weight:       dikte van het percentage getal (bijv. 400, 600, 700, 800) standaard: 800
 *   low_threshold:     drempel voor rood (standaard: 15)
 *   mid_threshold:     drempel voor oranje (standaard: 30)
 *   show_name:         naam boven elke batterij tonen (standaard: false)
 */

const SEG_COLORS_HIGH = [
  '#003fa3','#0052cc','#0068f5',
  '#0088ff','#00aaff','#00c4ff',
  '#00d4ff','#00e0ff','#40eaff','#80f4ff',
];
const SEG_COLORS_MID = [
  '#7a3a00','#a05000','#c06800','#e08000',
  '#f59a00','#ffb300','#ffbf20','#ffcc40','#ffd966','#ffe080',
];

class BatteryBarCard extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.entities && !config.entity) {
      throw new Error('battery-bar-card: geef minimaal één entity op');
    }
    this._config = {
      title:         config.title         ?? null,
      segments:      config.segments      ?? 10,
      height:        config.height        ?? 65,
      font_size:     config.font_size     ?? 30,
      font_color:    config.font_color    ?? null,
      font_weight:   config.font_weight   ?? 800,
      tap_action:    config.tap_action    ?? null,
      low_threshold: config.low_threshold ?? 15,
      mid_threshold: config.mid_threshold ?? 30,
      show_name:     config.show_name     ?? false,
      entities: config.entities ? config.entities : [config.entity],
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _getPct(entityId) {
    const state = this._hass?.states[entityId];
    if (!state) return null;
    let val = parseFloat(state.state);
    if (isNaN(val)) val = parseFloat(state.attributes?.battery_level);
    if (isNaN(val)) return null;
    return Math.min(100, Math.max(0, Math.round(val)));
  }

  _getName(entityId) {
    const state = this._hass?.states[entityId];
    return state?.attributes?.friendly_name ?? entityId;
  }

  _levelInfo(pct, cfg) {
    if (pct > cfg.mid_threshold) {
      return { pctColor: '#00eeff', segColors: SEG_COLORS_HIGH };
    }
    if (pct > cfg.low_threshold) {
      return { pctColor: '#ffcc00', segColors: SEG_COLORS_MID };
    }
    return { pctColor: '#ff3355', segColors: Array(10).fill('#ff2244') };
  }

  _makeSVG(pct, uid, cfg) {
    const isLow      = pct <= cfg.low_threshold;
    const SEGS       = cfg.segments;
    const info       = this._levelInfo(pct, cfg);
    const filledSegs = Math.round((pct / 100) * SEGS);

    const W = 300, H = cfg.height, RX = 4;
    const padX = 8, padY = Math.max(6, Math.round(H * 0.13));
    const innerW = W - padX * 2;
    const innerH = H - padY * 2;
    const gap    = 3.5;
    const segW   = (innerW - gap * (SEGS - 1)) / SEGS;

    const colors = info.segColors.length >= SEGS
      ? info.segColors.slice(0, SEGS)
      : Array.from({ length: SEGS }, (_, i) =>
          info.segColors[Math.floor(i * info.segColors.length / SEGS)]);

    let segsHtml = '';
    for (let i = 0; i < SEGS; i++) {
      const active = i < filledSegs;
      const sx     = padX + i * (segW + gap);
      const sy     = padY;
      const fill   = active ? colors[i] : '#04101e';
      const anim   = active && isLow
        ? 'style="animation: blinkSeg 1.1s ease-in-out infinite;"'
        : '';

      segsHtml += `
        <g ${anim}>
          <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}"
            width="${segW.toFixed(1)}" height="${innerH.toFixed(1)}"
            rx="2" ry="2" fill="${fill}"/>
          ${active ? `
          <rect x="${sx.toFixed(1)}" y="${sy.toFixed(1)}"
            width="${segW.toFixed(1)}" height="${innerH.toFixed(1)}"
            rx="2" ry="2" fill="${fill}" opacity="0.4"
            style="filter:blur(5px);"/>
          <rect x="${(sx+1).toFixed(1)}" y="${(sy+1.5).toFixed(1)}"
            width="${(segW-2).toFixed(1)}" height="${(innerH*0.38).toFixed(1)}"
            rx="1.5" ry="1.5" fill="rgba(255,255,255,0.26)"/>
          ` : ''}
        </g>`;
    }

    return `
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
           style="position:absolute;top:0;left:0;width:100%;height:100%;">
        <defs>
          <linearGradient id="bg_${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#18304a"/>
            <stop offset="20%"  stop-color="#0c1e30"/>
            <stop offset="55%"  stop-color="#060d18"/>
            <stop offset="85%"  stop-color="#050c15"/>
            <stop offset="100%" stop-color="#0d1e2e"/>
          </linearGradient>
          <linearGradient id="str_${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="#2a5a80"/>
            <stop offset="100%" stop-color="#04101e"/>
          </linearGradient>
          <linearGradient id="gls_${uid}" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="rgba(255,255,255,0.09)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
          <filter id="shd_${uid}">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.6)"/>
          </filter>
        </defs>
        <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"
          fill="transparent" filter="url(#shd_${uid})"/>
        <rect x="0" y="0" width="${W}" height="${H}" rx="${RX}" ry="${RX}"
          fill="url(#bg_${uid})" stroke="url(#str_${uid})" stroke-width="1.5"/>
        ${segsHtml}
        <rect x="2" y="1.5" width="${W-4}" height="${H*0.26}"
          rx="${RX-1}" ry="${RX-1}" fill="url(#gls_${uid})"/>
      </svg>`;
  }

  _render() {
    if (!this._config) return;
    const cfg = this._config;

    const rows = cfg.entities.map((entityId, i) => {
      const pct  = this._getPct(entityId);
      const name = this._getName(entityId);
      const uid  = `bbc_${i}`;

      if (pct === null) {
        return `<div class="batt-row">
          <div class="batt-wrap" style="height:${cfg.height}px; ${cfg.tap_action ? 'cursor:pointer;' : ''}" onclick="this.getRootNode().host._handleTap()">
            <div class="unavailable">Onbeschikbaar: ${entityId}</div>
          </div>
        </div>`;
      }

      const info    = this._levelInfo(pct, cfg);
      const isLow   = pct <= cfg.low_threshold;
      const pctAnim = isLow ? 'blink-txt' : '';

      // font_color: gebruik vaste kleur indien opgegeven, anders automatisch
      const textColor = cfg.font_color ?? info.pctColor;
      const glowColor = cfg.font_color ?? info.pctColor;

      return `
        <div class="batt-row">
          ${cfg.show_name ? `<div class="batt-name">${name}</div>` : ''}
          <div class="batt-wrap" style="height:${cfg.height}px; ${cfg.tap_action ? 'cursor:pointer;' : ''}" onclick="this.getRootNode().host._handleTap()">
            ${this._makeSVG(pct, uid, cfg)}
            <div class="pct-label ${pctAnim}"
              style="font-size:${cfg.font_size}px;
                     color:${textColor};
                     text-shadow: 0 0 8px ${glowColor},
                       0 1px 4px rgba(0,0,0,0.95),
                       0 -1px 4px rgba(0,0,0,0.95),
                       1px 0 4px rgba(0,0,0,0.95),
                       -1px 0 4px rgba(0,0,0,0.95);">
              ${pct}%
            </div>
          </div>
        </div>`;
    }).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          background: linear-gradient(160deg, #0a1628 0%, #060e1a 100%);
          border: 1px solid #0e2a45;
          border-radius: 16px;
          padding: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6),
                      inset 0 1px 0 rgba(255,255,255,0.04);
          overflow: hidden;
        }
        .card-header {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #00d4ff;
          text-shadow: 0 0 12px rgba(0,212,255,0.5);
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px solid #0e2a45;
        }
        .batt-row { margin-bottom: 8px; }
        .batt-row:last-child { margin-bottom: 0; }
        .batt-name {
          font-size: 11px;
          color: #5a7a9a;
          margin-bottom: 4px;
          padding-left: 2px;
        }
        .batt-wrap {
          position: relative;
          width: 100%;
        }
        .pct-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-weight: ${cfg.font_weight};
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.5px;
          pointer-events: none;
          white-space: nowrap;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        .unavailable {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #5a7a9a;
          font-size: 12px;
          font-style: italic;
        }
        @keyframes blinkSeg {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.08; }
        }
        .blink-txt { animation: blinkTxt 1.1s ease-in-out infinite; }
        @keyframes blinkTxt {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      </style>
      <ha-card>
        ${cfg.title ? `<div class="card-header">⚡ ${cfg.title}</div>` : ''}
        ${rows}
      </ha-card>`;
  }

  _handleTap() {
    const cfg = this._config;
    if (!cfg.tap_action) return;
    const action = cfg.tap_action.action;
    if (action === "navigate" && cfg.tap_action.navigation_path) {
      window.history.pushState(null, "", cfg.tap_action.navigation_path);
      window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true }));
    } else if (action === "more-info") {
      const entityId = cfg.entities?.[0] ?? cfg.entity;
      this.dispatchEvent(new CustomEvent("hass-more-info", { bubbles: true, composed: true, detail: { entityId } }));
    } else if (action === "url" && cfg.tap_action.url_path) {
      window.open(cfg.tap_action.url_path, "_blank");
    }
  }

  getCardSize() {
    return Math.ceil(this._config?.entities?.length ?? 1);
  }

  static getStubConfig() {
    return {
      entities: ['sensor.mijn_batterij'],
      height: 65,
      font_size: 30,
      font_color: null,
      font_weight: 800,
      segments: 10,
      low_threshold: 15,
      mid_threshold: 30,
      show_name: false,
    };
  }
}

customElements.define('battery-bar-card', BatteryBarCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'battery-bar-card',
  name:        'Battery Bar Card',
  description: 'Horizontale batterij balk met gesegmenteerde vulling en percentage overlay.',
  preview:     true,
});
