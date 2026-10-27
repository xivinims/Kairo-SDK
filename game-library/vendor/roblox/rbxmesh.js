// Robloxʼ eigenes Mesh-Format lesen (die Dateien hinter `rbxassetid://…`).
//
// Sieben Fassungen sind im Umlauf, und sie haben wenig gemeinsam:
//   1.00 / 1.01  reiner Text, ein Klammerpaar je Wert. Bei 1.00 sind die
//                Punkte doppelt so groß gespeichert — daher der Faktor 0,5.
//   2.00         binär: kleiner Kopf, dann Punkte à 40 Byte und Dreiecke à 12.
//   3.00 / 3.01  wie 2.00, zusätzlich eine Tabelle der Detailstufen (LOD).
//   4.00 … 6.00  größerer Kopf, dazu Knochen und Abschnitte, die wir überspringen.
//   7.00         ein Behälter namens COREMESH, dessen Inhalt mit Draco gepackt ist.
//
// Herauskommt immer eine fertige BufferGeometry mit Punkten, Normalen und UVs.
import * as THREE from '/vendor/three/three.module.min.js';

const THREE_VER = '0.170.0';
const DRACO_PFAD = '/vendor/three/addons/libs/draco/';

/** Steht am Anfang „version 1.00“ … „version 7.00“? */
export function istRobloxMesh(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  if (b.length < 13) return false;
  return new TextDecoder().decode(b.subarray(0, 8)) === 'version ';
}

/** @returns {Promise<THREE.BufferGeometry>} */
export async function leseRobloxMesh(buf) {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const nl = b.indexOf(10);
  if (nl < 0 || !istRobloxMesh(b)) throw new Error('Arquivo não é um mesh Roblox');
  const kopf = new TextDecoder().decode(b.subarray(0, nl)).trim();
  const m = /^version (\d+)\.(\d+)/.exec(kopf);
  if (!m) throw new Error(`Unbekannter Mesh-Kopf: ${kopf.slice(0, 24)}`);
  const gross = +m[1], klein = +m[2];
  const p = nl + 1;

  if (gross === 1) return ausText(new TextDecoder().decode(b.subarray(p)), klein);
  if (gross === 2) return ausV2(b, p);
  if (gross === 3) return ausV3(b, p);
  if (gross >= 4 && gross <= 6) return ausV4(b, p);
  if (gross === 7) return await ausV7(b, p);
  throw new Error('Versão de mesh Roblox não suportada: '+(gross + '.' + String(klein).padStart(2, '0')));
}

/* ------------------------------ 1.00 / 1.01 ------------------------------ */

function ausText(txt, klein) {
  const zeilen = txt.split('\n');
  const anzahl = parseInt(zeilen[0], 10);
  if (!(anzahl > 0)) throw new Error('Dreieckszahl fehlt');
  const gruppen = zeilen.slice(1).join('\n').match(/\[[^\]]*\]/g) || [];
  if (gruppen.length < anzahl * 9) {
    throw new Error(`Zu wenig Werte: ${gruppen.length} statt ${anzahl * 9}`);
  }
  // 1.00 speichert die Punkte in doppelter Größe, 1.01 nicht.
  const f = klein === 0 ? 0.5 : 1;
  const n = anzahl * 3;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  const zahlen = g => g.slice(1, -1).split(',');
  for (let i = 0; i < n; i++) {
    const a = zahlen(gruppen[i * 3]), c = zahlen(gruppen[i * 3 + 1]), t = zahlen(gruppen[i * 3 + 2]);
    pos[i * 3] = +a[0] * f; pos[i * 3 + 1] = +a[1] * f; pos[i * 3 + 2] = +a[2] * f;
    nor[i * 3] = +c[0]; nor[i * 3 + 1] = +c[1]; nor[i * 3 + 2] = +c[2];
    uv[i * 2] = +t[0]; uv[i * 2 + 1] = 1 - +t[1];
  }
  return baue(pos, nor, uv, null, null);
}

/* -------------------------------- binär --------------------------------- */

/** Ein Punkt belegt 40 Byte: 3 Punkt-, 3 Normalen-, 2 UV-Werte, Tangente, Farbe. */
function punkte(d, off, anzahl, schritt) {
  const pos = new Float32Array(anzahl * 3);
  const nor = new Float32Array(anzahl * 3);
  const uv = new Float32Array(anzahl * 2);
  const col = schritt >= 40 ? new Float32Array(anzahl * 4) : null;
  const roh = new Uint8Array(d.buffer, d.byteOffset, d.byteLength);
  for (let i = 0; i < anzahl; i++) {
    const o = off + i * schritt;
    pos[i * 3] = d.getFloat32(o, true);
    pos[i * 3 + 1] = d.getFloat32(o + 4, true);
    pos[i * 3 + 2] = d.getFloat32(o + 8, true);
    nor[i * 3] = d.getFloat32(o + 12, true);
    nor[i * 3 + 1] = d.getFloat32(o + 16, true);
    nor[i * 3 + 2] = d.getFloat32(o + 20, true);
    uv[i * 2] = d.getFloat32(o + 24, true);
    uv[i * 2 + 1] = 1 - d.getFloat32(o + 28, true);
    if (col) {
      // Byte 32–35 ist die Tangente, erst 36–39 die Farbe.
      col[i * 4] = roh[o + 36] / 255; col[i * 4 + 1] = roh[o + 37] / 255;
      col[i * 4 + 2] = roh[o + 38] / 255; col[i * 4 + 3] = roh[o + 39] / 255;
    }
  }
  return { pos, nor, uv, col };
}

function dreiecke(d, off, anzahl) {
  const idx = new Uint32Array(anzahl * 3);
  for (let i = 0; i < idx.length; i++) idx[i] = d.getUint32(off + i * 4, true);
  return idx;
}

function ausV2(b, p) {
  const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const kopfLen = d.getUint16(p, true);
  const pSchritt = b[p + 2] || 40;
  const nPunkte = d.getUint32(p + 4, true);
  const nFlaechen = d.getUint32(p + 8, true);
  const oP = p + kopfLen;
  const v = punkte(d, oP, nPunkte, pSchritt);
  const idx = dreiecke(d, oP + nPunkte * pSchritt, nFlaechen);
  return baue(v.pos, v.nor, v.uv, v.col, idx);
}

function ausV3(b, p) {
  const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const kopfLen = d.getUint16(p, true);
  const pSchritt = b[p + 2] || 40;
  const fSchritt = b[p + 3] || 12;
  const nLod = d.getUint16(p + 6, true);
  const nPunkte = d.getUint32(p + 8, true);
  const nFlaechen = d.getUint32(p + 12, true);
  const oP = p + kopfLen;
  const v = punkte(d, oP, nPunkte, pSchritt);
  const oF = oP + nPunkte * pSchritt;
  let idx = dreiecke(d, oF, nFlaechen);
  idx = nurFeinsteStufe(d, oF + nFlaechen * fSchritt, nLod, nFlaechen, idx);
  return baue(v.pos, v.nor, v.uv, v.col, idx);
}

/**
 * Ab 4.00 steht die Kopflänge in der Datei, alles Weitere hängt an den Zählern.
 * Die Hüllgewichte je Punkt sind nicht sicher dokumentiert — deshalb werden
 * beide bekannten Größen probiert und die genommen, deren Dreiecke aufgehen.
 */
function ausV4(b, p) {
  const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const kopfLen = d.getUint16(p, true);
  const nPunkte = d.getUint32(p + 4, true);
  const nFlaechen = d.getUint32(p + 8, true);
  const nLod = d.getUint16(p + 12, true);
  const nKnochen = d.getUint16(p + 14, true);
  const pSchritt = 40;
  const oP = p + kopfLen;
  const v = punkte(d, oP, nPunkte, pSchritt);
  const oNach = oP + nPunkte * pSchritt;

  for (const huelle of nKnochen ? [8, 16] : [0]) {
    const oF = oNach + nPunkte * huelle;
    if (oF + nFlaechen * 12 > b.byteLength) continue;
    const idx = dreiecke(d, oF, nFlaechen);
    let gut = true;
    for (let i = 0; i < idx.length; i++) if (idx[i] >= nPunkte) { gut = false; break; }
    if (!gut) continue;
    const fein = nurFeinsteStufe(d, oF + nFlaechen * 12, nLod, nFlaechen, idx);
    return baue(v.pos, v.nor, v.uv, v.col, fein);
  }
  throw new Error('Lista de triângulos inválida');
}

/** Die LOD-Tabelle sagt, wo die gröberen Stufen anfangen — wir wollen nur die erste. */
function nurFeinsteStufe(d, off, nLod, nFlaechen, idx) {
  if (nLod < 2 || off + nLod * 4 > d.byteLength) return idx;
  const ende = d.getUint32(off + 4, true);
  if (ende > 0 && ende < nFlaechen) return idx.slice(0, ende * 3);
  return idx;
}

/* --------------------------------- 7.00 --------------------------------- */

let dracoLader = null;

/**
 * 7.00 ist ein Behälter: „COREMESH“, zwei Längen, dann ein Draco-Block und
 * zuletzt ein Stück „LODS“ mit den Grenzen der Detailstufen.
 */
async function ausV7(b, p) {
  const d = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (new TextDecoder().decode(b.subarray(p, p + 8)) !== 'COREMESH') {
    throw new Error('COREMESH ausente');
  }
  const len = d.getUint32(p + 16, true);
  const start = p + 20;
  if (new TextDecoder().decode(b.subarray(start, start + 5)) !== 'DRACO') {
    throw new Error('Bloco DRACO ausente');
  }
  const ende = Math.min(start + len, b.byteLength);
  const block = b.slice(start, ende);

  const { DRACOLoader } = await import('/vendor/three/addons/loaders/DRACOLoader.js');
  if (!dracoLader) {
    dracoLader = new DRACOLoader();
    dracoLader.setDecoderPath(DRACO_PFAD);
  }
  const geo = await new Promise((res, rej) => {
    try { dracoLader.decodeDracoFile(block.buffer, res, null, null, undefined, rej); }
    catch (e) { rej(e); }
  });

  // Roblox packt alle Detailstufen in einen Block; die Tabelle dahinter sagt,
  // wo die feinste aufhört.
  // Aufbau des Anhangs: „LODS“, drei Wörter Kopf, sieben Bytes Beiwerk — die
  // Zahl der Stufen steht auf Byte 19, die Tabelle beginnt erst auf 23.
  const rest = ende;
  if (rest + 27 <= b.byteLength && new TextDecoder().decode(b.subarray(rest, rest + 4)) === 'LODS') {
    const nLod = b[rest + 19];
    const tab = rest + 23;
    const gesamt = geo.index ? geo.index.count / 3 : geo.attributes.position.count / 3;
    if (nLod >= 2 && tab + nLod * 4 <= b.byteLength) {
      const bis = d.getUint32(tab + 4, true);
      if (bis > 0 && bis < gesamt && geo.index) {
        geo.setIndex(new THREE.BufferAttribute(geo.index.array.slice(0, bis * 3), 1));
      }
    }
  }
  if (geo.attributes.uv) spiegleUV(geo.attributes.uv);
  richteFarbe(geo);
  if (!geo.attributes.normal) geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Draco gibt Robloxʼ Punktfarben als 0–255 heraus, three erwartet 0–1. Ohne
 * diese Umrechnung wird jedes Modell mit 255 multipliziert und leuchtet
 * gleichmäßig weiß — es sah aus, als fehlte die Beleuchtung.
 */
function richteFarbe(geo) {
  const c = geo.attributes.color;
  if (!c) return;
  let hoch = 0;
  for (let i = 0; i < c.array.length; i++) if (c.array[i] > hoch) hoch = c.array[i];
  if (hoch > 1.001) {
    const f = 1 / 255;
    for (let i = 0; i < c.array.length; i++) c.array[i] *= f;
    c.needsUpdate = true;
  }
  // Rein weiße Farben ändern nichts und würden nur das Material umstellen.
  const teile = c.itemSize;
  for (let i = 0; i < c.count; i++) {
    for (let k = 0; k < Math.min(3, teile); k++) {
      if (c.array[i * teile + k] < 0.99) return;
    }
  }
  geo.deleteAttribute('color');
}

function spiegleUV(attr) {
  const a = attr.array;
  for (let i = 1; i < a.length; i += 2) a[i] = 1 - a[i];
  attr.needsUpdate = true;
}

/* -------------------------------- gemein -------------------------------- */

function baue(pos, nor, uv, col, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  // Weiße Punktfarben bringen nichts und würden nur das Material umschalten.
  if (col && !nurWeiss(col)) g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  if (idx) g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingBox();
  g.computeBoundingSphere();
  return g;
}

function nurWeiss(col) {
  for (let i = 0; i < col.length; i += 4) {
    if (col[i] < 0.99 || col[i + 1] < 0.99 || col[i + 2] < 0.99) return false;
  }
  return true;
}
