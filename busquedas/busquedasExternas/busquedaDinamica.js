/**
 * Simulador CC2 – Búsquedas Dinámicas
 *
 * Dos modos de operación:
 *   - Total:   insertar expande (n → 2n) cuando D.O. ≥ 75%
 *              eliminar reduce  (n → n/2) cuando D.O. < 112%
 *   - Parcial: insertar expande en 2 fases (n → n + ⌊n/2⌋ → 2n) cuando D.O. ≥ 75%
 *              eliminar reduce  en 2 fases (n → n - ⌈n/4⌉ → ⌊n/2⌋) cuando D.O. < 112%
 *
 * Relación: dos operaciones parciales ≡ una total (exacto por ciclo base)
 *
 * Fórmulas de D.O.:
 *   Expansión: ocupados / (cubetas × registros_por_cubeta)  → umbral ≥ 75%
 *   Reducción: ocupados / cubetas                           → umbral < 112%
 *
 * "ocupados" cuenta celdas de la matriz + desbordamientos de colisión.
 */

// ==================== ESTADO GLOBAL ====================

const DIN = {
    cubetas:      2,
    registros:    3,
    cubetasOrig:  2,
    digitosClave: 3,
    matriz:       [],   // matriz[col][fila]
    colisiones:   [],   // colisiones[col] = [clave, ...]
    ordenInsert:  [],   // orden real de inserción del usuario
    inicializado: false,
    animEnCurso:  false,
    timeouts:     [],
    modo:         'total',  // 'total' | 'parcial'
    parcialExp:   { fase: 0, base: 0 },
    parcialRed:   { fase: 0, base: 0 }
};

const DELAY_PASO = 500; // ms entre pasos de animación

// ==================== UTILIDADES ====================

function dinLimpiarTimeouts() {
    DIN.timeouts.forEach(t => clearTimeout(t));
    DIN.timeouts = [];
    DIN.animEnCurso = false;
}

function dinMsg(msg, tipo) {
    const el = document.getElementById('mensajeDinamica');
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
}

function dinContarOcupados() {
    let n = 0;
    for (let c = 0; c < DIN.cubetas; c++) {
        for (let r = 0; r < DIN.registros; r++) {
            if (DIN.matriz[c][r] !== null) n++;
        }
        n += DIN.colisiones[c].length;
    }
    return n;
}

function dinDO() {
    const ocupados    = dinContarOcupados();
    const totalCeldas = DIN.cubetas * DIN.registros;
    const porcExp     = ocupados / totalCeldas;   // para expansión
    const porcRed     = ocupados / DIN.cubetas;   // para reducción
    return { ocupados, totalCeldas, porcExp, porcRed };
}

function dinValidarClave(clave) {
    if (!clave || !/^[0-9]+$/.test(clave))
        return { ok: false, msg: 'Ingrese una clave numérica válida' };
    if (clave.length !== DIN.digitosClave)
        return { ok: false, msg: `La clave debe tener exactamente ${DIN.digitosClave} dígitos` };
    return { ok: true };
}

function dinExiste(clave) {
    for (let c = 0; c < DIN.cubetas; c++) {
        if (DIN.matriz[c].includes(clave) || DIN.colisiones[c].includes(clave)) return true;
    }
    return false;
}

function dinHashCol(clave) {
    return parseInt(clave, 10) % DIN.cubetas;
}

// ==================== ESTRUCTURA INTERNA ====================

function dinCrearEstructura(cubetas, registros, preservar) {
    DIN.cubetas    = cubetas;
    DIN.registros  = registros;
    DIN.matriz     = [];
    DIN.colisiones = [];
    for (let c = 0; c < cubetas; c++) {
        DIN.matriz[c]     = new Array(registros).fill(null);
        DIN.colisiones[c] = [];
    }
    if (!preservar) DIN.ordenInsert = [];
}

function dinInsertarUno(clave) {
    const col = dinHashCol(clave);
    for (let r = 0; r < DIN.registros; r++) {
        if (DIN.matriz[col][r] === null) {
            DIN.matriz[col][r] = clave;
            return { col, row: r, colision: false };
        }
    }
    DIN.colisiones[col].push(clave);
    return { col, row: -1, colision: true, colIdx: DIN.colisiones[col].length - 1 };
}

function dinResetParciales() {
    DIN.parcialExp = { fase: 0, base: 0 };
    DIN.parcialRed = { fase: 0, base: 0 };
}

function dinResetParcialExp() {
    DIN.parcialExp = { fase: 0, base: 0 };
}

function dinResetParcialRed() {
    DIN.parcialRed = { fase: 0, base: 0 };
}

function dinSiguienteCubetasExpansion() {
    if (DIN.modo === 'total') return DIN.cubetas * 2;

    if (DIN.parcialExp.fase === 0) {
        DIN.parcialExp.base = DIN.cubetas;
        DIN.parcialExp.fase = 1;
        return DIN.parcialExp.base + Math.floor(DIN.parcialExp.base / 2);
    }

    const objetivo = DIN.parcialExp.base * 2;
    dinResetParcialExp();
    return objetivo;
}

function dinInferirBaseExpansionParcial(actual) {
    // Busca un tamaño base par tal que base + floor(base/2) = actual.
    for (let base = 2; base <= actual; base += 2) {
        if (base + Math.floor(base / 2) === actual) return base;
    }
    return 0;
}

function dinPreviewReduccionParcial() {
    if (DIN.parcialRed.fase === 1) {
        const objetivo = Math.max(2, Math.floor(DIN.parcialRed.base / 2));
        return {
            nuevaCubetas: objetivo,
            texto: `base ${DIN.parcialRed.base} → ⌊${DIN.parcialRed.base}/2⌋ = ${objetivo} (Parcial 2/2)`
        };
    }

    const baseInferida = dinInferirBaseExpansionParcial(DIN.cubetas);
    if (baseInferida > 0) {
        return {
            nuevaCubetas: baseInferida,
            texto: `${DIN.cubetas} viene de ${baseInferida} + ⌊${baseInferida}/2⌋ → ${baseInferida} (Parcial 2/2)`
        };
    }

    const objetivo = Math.max(2, DIN.cubetas - Math.ceil(DIN.cubetas / 4));
    return {
        nuevaCubetas: objetivo,
        texto: `${DIN.cubetas} − ⌈${DIN.cubetas}/4⌉ = ${objetivo} (Parcial 1/2)`
    };
}

function dinSiguienteCubetasReduccion() {
    if (DIN.modo === 'total') return Math.floor(DIN.cubetas / 2);

    const preview = dinPreviewReduccionParcial();

    if (DIN.parcialRed.fase === 1) {
        dinResetParcialRed();
        return preview.nuevaCubetas;
    }

    const baseInferida = dinInferirBaseExpansionParcial(DIN.cubetas);
    if (baseInferida > 0) {
        // Si estamos en un tamaño intermedio de expansión parcial (p. ej. 12),
        // la reducción parcial revierte al tamaño base (p. ej. 8).
        dinResetParcialRed();
        return preview.nuevaCubetas;
    }

    DIN.parcialRed.base = DIN.cubetas;
    DIN.parcialRed.fase = 1;
    return preview.nuevaCubetas;
}

// ==================== EXPANSIÓN ====================

function dinExpandir() {
    const claves = [...DIN.ordenInsert];
    const nuevaCubetas = dinSiguienteCubetasExpansion();
    dinCrearEstructura(nuevaCubetas, DIN.registros, true);
    claves.forEach(cl => dinInsertarUno(cl));
}

// ==================== REDUCCIÓN ====================

function dinReducir() {
    const claves = [...DIN.ordenInsert];
    const nuevaCubetas = dinSiguienteCubetasReduccion();
    if (nuevaCubetas < 2) return false;
    dinCrearEstructura(nuevaCubetas, DIN.registros, true);
    claves.forEach(cl => dinInsertarUno(cl));
    return true;
}

// ==================== DESCRIPCIÓN Y BARRAS ====================

function dinActualizarDescripcion() {
    const desc = document.getElementById('descripcionDinamica');
    if (!desc) return;

    const { ocupados, totalCeldas, porcExp, porcRed } = dinDO();
    const esTotal   = DIN.modo === 'total';
    const reglaExp  = esTotal
        ? 'Insertar expande: D.O. ≥ 75 % → n × 2'
        : 'Insertar expande (2 parciales = 1 total): n → n + ⌊n/2⌋ → 2n';
    const reglaRed  = esTotal
        ? 'Eliminar reduce:  D.O. < 112 % → n / 2'
        : 'Eliminar reduce (2 parciales = 1 total): n → n − ⌈n/4⌉ → ⌊n/2⌋';

    const avisoExp = porcExp >= 0.75 ? ' <span class="badge bg-warning text-dark">⚠ Expansión al insertar</span>' : '';
    const avisoRed = (porcRed * 100 < 112 && DIN.cubetas > 2) ? ' <span class="badge bg-danger">⚠ Reducción al eliminar</span>' : '';

    desc.innerHTML =
        `<strong>${esTotal ? 'Total' : 'Parcial'}</strong> — ` +
        `Cubetas: <code>${DIN.cubetas}</code> | Reg/cubeta: <code>${DIN.registros}</code> | ` +
        `Dígitos clave: <code>${DIN.digitosClave}</code> | ` +
        `<code>H(k) = k mod ${DIN.cubetas}</code><br>` +
        `<small>${reglaExp}${avisoExp} &nbsp;|&nbsp; ${reglaRed}${avisoRed}</small>`;

    dinRenderizarBarras(ocupados, totalCeldas, porcExp, porcRed);
}

function dinRenderizarBarras(ocupados, totalCeldas, porcExp, porcRed) {
    const cont = document.getElementById('doBarrasContainer');
    if (!cont) return;

    const pctExp  = (porcExp * 100).toFixed(1);
    const pctRed  = (porcRed * 100).toFixed(1);
    const fillExp = Math.min(parseFloat(pctExp), 100);

    // La barra de reducción se dibuja con escala 0..300% para visualizar D.O. > 100%.
    const ESCALA_RED_MAX = 300;
    const UMBRAL_RED = 112;
    const valorRed = parseFloat(pctRed);
    const fillRed = Math.min((valorRed / ESCALA_RED_MAX) * 100, 100);
    const markerRedLeft = (UMBRAL_RED / ESCALA_RED_MAX) * 100;

    // Barra expansión: verde < 75%, roja ≥ 75%
    const clsExp = porcExp >= 0.75 ? 'do-danger' : porcExp >= 0.5 ? 'do-warning' : 'do-normal';
    // Barra reducción: roja < 112%, verde ≥ 112%
    const clsRed = porcRed * 100 < UMBRAL_RED ? 'do-danger' : porcRed * 100 < 150 ? 'do-warning' : 'do-normal';

    cont.innerHTML = `
        <div class="do-bar-container">
            <div class="d-flex justify-content-between do-label">
                <span>D.O. Expansión <small class="text-muted">(ocupados / total celdas)</small></span>
                <span>${ocupados} / ${totalCeldas} = <strong>${pctExp} %</strong></span>
            </div>
            <div class="do-bar-bg">
                <div class="do-bar-fill do-bar-umbral-exp ${clsExp}" style="width:${fillExp}%"></div>
            </div>
            <div class="do-bar-markers">
                <span class="do-marker" style="left:75%">75 %</span>
            </div>
        </div>
        <div class="do-bar-container mt-1">
            <div class="d-flex justify-content-between do-label">
                <span>D.O. Reducción <small class="text-muted">(ocupados / cubetas)</small></span>
                <span>${ocupados} / ${DIN.cubetas} = <strong>${pctRed} %</strong></span>
            </div>
            <div class="do-bar-bg">
                <div class="do-bar-fill do-bar-umbral-red ${clsRed}" style="width:${fillRed}%"></div>
            </div>
            <div class="do-bar-markers">
                <span class="do-marker" style="left:${markerRedLeft}%">112 %</span>
            </div>
        </div>`;
}

// ==================== RENDERIZADO ====================

function dinRenderizar() {
    const container = document.getElementById('visualizacionDinamica');
    if (!container || !DIN.inicializado) {
        if (container) container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    let html = '<div class="matriz-cubetas-container"><table class="tabla-cubetas">';

    html += '<thead><tr><th class="cubeta-header"></th>';
    for (let c = 0; c < DIN.cubetas; c++) {
        html += `<th class="cubeta-header" data-col="${c}">${c}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let r = 0; r < DIN.registros; r++) {
        html += `<tr><td class="cubeta-index">${r + 1}</td>`;
        for (let c = 0; c < DIN.cubetas; c++) {
            const v = DIN.matriz[c][r];
            html += `<td class="cubeta-celda ${v === null ? 'cubeta-vacia' : 'cubeta-ocupada'}" data-col="${c}" data-row="${r}">${v === null ? '' : v}</td>`;
        }
        html += '</tr>';
    }

    const maxCol = Math.max(0, ...DIN.colisiones.map(a => a.length));
    for (let r = 0; r < maxCol; r++) {
        html += `<tr><td class="cubeta-index" style="font-size:0.7rem;">Col ${r + 1}</td>`;
        for (let c = 0; c < DIN.cubetas; c++) {
            const v = DIN.colisiones[c][r];
            html += v !== undefined
                ? `<td class="cubeta-celda cubeta-colision" data-col="${c}" data-colrow="${r}">${v}</td>`
                : `<td class="cubeta-celda cubeta-vacia"></td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// ==================== CREACIÓN DESDE UI ====================

function crearEstructuraDinamica() {
    dinLimpiarTimeouts();

    const cubetas   = parseInt(document.getElementById('cubetasDinamica').value)      || 2;
    const registros = parseInt(document.getElementById('registrosDinamica').value)    || 3;
    const digitos   = parseInt(document.getElementById('digitosClaveDinamica').value) || 3;

    if (cubetas < 2 || cubetas % 2 !== 0) { dinMsg('El número de cubetas debe ser par (≥ 2)', 'warning'); return; }
    if (registros < 1)                     { dinMsg('Debe haber al menos 1 registro por cubeta', 'warning'); return; }
    if (digitos < 1)                       { dinMsg('La cantidad de dígitos debe ser al menos 1', 'warning'); return; }

    DIN.modo         = document.getElementById('modoDinamica').value;
    DIN.cubetasOrig  = cubetas;
    DIN.digitosClave = digitos;
    dinResetParciales();
    dinCrearEstructura(cubetas, registros, false);
    DIN.inicializado = true;

    document.getElementById('dinamicaControles').classList.remove('d-none');
    dinActualizarDescripcion();
    dinRenderizar();
    dinMsg(`Estructura creada: ${cubetas} cubetas × ${registros} registros | claves de ${digitos} dígitos`, 'success');
}

function cambiarModoDinamica() {
    DIN.modo = document.getElementById('modoDinamica').value;
    dinResetParciales();
    if (DIN.inicializado) dinActualizarDescripcion();
}

// ==================== ACCIÓN: INSERTAR ====================

function insertarDinamica() {
    if (DIN.animEnCurso) dinLimpiarTimeouts();
    if (!DIN.inicializado) { dinMsg('Primero debe crear la estructura', 'warning'); return; }

    const input = document.getElementById('claveDinamica');
    const clave = input.value.trim();
    const valid = dinValidarClave(clave);
    if (!valid.ok)         { dinMsg(valid.msg, 'warning'); return; }
    if (dinExiste(clave))  { dinMsg(`La clave "${clave}" ya existe en la estructura`, 'warning'); return; }

    input.value = '';
    DIN.ordenInsert.push(clave);

    const col = dinHashCol(clave);

    // Lista de celdas a recorrer en la cubeta destino
    const celdas = [];
    for (let r = 0; r < DIN.registros; r++) celdas.push({ row: r, ocupada: DIN.matriz[col][r] !== null });

    const insertIdx  = celdas.findIndex(c => !c.ocupada);
    const esColision = insertIdx === -1;
    const pasosAnim  = esColision ? celdas.length : insertIdx + 1;

    DIN.animEnCurso = true;
    dinRenderizar();

    DIN.timeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionDinamica .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        // Animar recorrido de celdas
        for (let i = 0; i < pasosAnim; i++) {
            DIN.timeouts.push(setTimeout(() => {
                const celda = document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-row="${celdas[i].row}"]`);
                if (celda) celda.classList.add('cubeta-buscando');
                if (i > 0) {
                    const prev = document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-row="${celdas[i-1].row}"]`);
                    if (prev) prev.classList.remove('cubeta-buscando');
                }
            }, DELAY_PASO * i));
        }

        // Insertar tras la animación
        DIN.timeouts.push(setTimeout(() => {
            document.querySelectorAll(`#visualizacionDinamica .cubeta-celda[data-col="${col}"]`).forEach(c => c.classList.remove('cubeta-buscando'));

            const res = dinInsertarUno(clave);
            const { ocupados, totalCeldas, porcExp } = dinDO();
            dinRenderizar();
            dinActualizarDescripcion();

            // Resaltar celda insertada
            let celdaIns = res.colision
                ? document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${res.col}"][data-colrow="${res.colIdx}"]`)
                : document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${res.col}"][data-row="${res.row}"]`);
            if (celdaIns) celdaIns.classList.add('cubeta-insertada');

            const hdr2 = document.querySelector(`#visualizacionDinamica .cubeta-header[data-col="${res.col}"]`);
            if (hdr2) hdr2.classList.add('cubeta-header-activa');

            const colMsg = res.colision
                ? ` — <span class="text-danger fw-bold">¡Colisión! Cubeta ${col} llena → desbordamiento #${res.colIdx + 1}</span>`
                : '';

            dinMsg(
                `H(${clave}) = ${clave} mod ${DIN.cubetas} = <strong>${col}</strong> → Cubeta ${col}${colMsg}<br>` +
                `D.O. Exp = ${ocupados}/${totalCeldas} = <strong>${(porcExp*100).toFixed(1)} %</strong>`,
                res.colision ? 'warning' : 'success'
            );

            // ¿Expandir?
            if (porcExp >= 0.75) {
                DIN.timeouts.push(setTimeout(() => {
                    const prevN  = DIN.cubetas;
                    const pctAnt = (porcExp * 100).toFixed(1);
                    let incStr;
                    if (DIN.modo === 'total') {
                        incStr = `${prevN} × 2 = ${prevN * 2}`;
                    } else if (DIN.parcialExp.fase === 0) {
                        incStr = `${prevN} + ⌊${prevN}/2⌋ = ${prevN + Math.floor(prevN / 2)} (Parcial 1/2)`;
                    } else {
                        incStr = `base ${DIN.parcialExp.base} → 2 × ${DIN.parcialExp.base} = ${DIN.parcialExp.base * 2} (Parcial 2/2)`;
                    }

                    // Insertar y eliminar no deben compartir el mismo ciclo parcial.
                    dinResetParcialRed();

                    dinExpandir();
                    dinRenderizar();
                    dinActualizarDescripcion();

                    const { ocupados: o2, totalCeldas: t2, porcExp: p2 } = dinDO();
                    dinMsg(
                        `H(${clave}) = <strong>${col}</strong>${colMsg}<br>` +
                        `D.O. alcanzó <strong>${pctAnt} %</strong> (≥ 75 %) → ` +
                        `<span class="text-primary fw-bold">Expansión ${DIN.modo === 'total' ? 'Total' : 'Parcial'}: ${incStr} cubetas</span><br>` +
                        `Nueva D.O. Exp = ${o2}/${t2} = <strong>${(p2*100).toFixed(1)} %</strong>. ` +
                        `Re-insertadas ${DIN.ordenInsert.length} claves con H(k) = k mod ${DIN.cubetas}.`,
                        'info'
                    );

                    document.querySelectorAll('#visualizacionDinamica .cubeta-ocupada').forEach(c => c.classList.add('cubeta-insertada'));
                    DIN.timeouts.push(setTimeout(() => {
                        document.querySelectorAll('#visualizacionDinamica .cubeta-insertada').forEach(c => c.classList.remove('cubeta-insertada'));
                        DIN.animEnCurso = false;
                    }, 2000));
                }, 1000));
            } else {
                DIN.timeouts.push(setTimeout(() => {
                    if (celdaIns) celdaIns.classList.remove('cubeta-insertada');
                    if (hdr2) hdr2.classList.remove('cubeta-header-activa');
                    DIN.animEnCurso = false;
                }, 1800));
            }
        }, DELAY_PASO * pasosAnim + 300));
    }, 150));
}

// ==================== ACCIÓN: BUSCAR ====================

function buscarDinamica() {
    if (DIN.animEnCurso) dinLimpiarTimeouts();
    if (!DIN.inicializado) { dinMsg('Primero debe crear la estructura', 'warning'); return; }

    const clave = document.getElementById('claveDinamica').value.trim();
    const valid = dinValidarClave(clave);
    if (!valid.ok) { dinMsg(valid.msg, 'warning'); return; }

    const col    = dinHashCol(clave);
    const celdas = [];
    for (let r = 0; r < DIN.registros; r++) celdas.push({ tipo: 'main', row: r,     valor: DIN.matriz[col][r] });
    for (let i = 0; i < DIN.colisiones[col].length; i++) celdas.push({ tipo: 'col',  colrow: i, valor: DIN.colisiones[col][i] });

    const foundIdx  = celdas.findIndex(c => c.valor === clave);
    const scanHasta = foundIdx >= 0 ? foundIdx : celdas.length - 1;

    DIN.animEnCurso = true;
    dinRenderizar();

    function selEl(item) {
        return item.tipo === 'main'
            ? document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`)
            : document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
    }

    DIN.timeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionDinamica .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        for (let i = 0; i <= scanHasta; i++) {
            DIN.timeouts.push(setTimeout(() => {
                if (i > 0) { const pEl = selEl(celdas[i-1]); if (pEl) pEl.classList.remove('cubeta-buscando'); }
                const el = selEl(celdas[i]);
                if (el) el.classList.add('cubeta-buscando');
            }, DELAY_PASO * i));
        }

        DIN.timeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionDinamica .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            if (foundIdx >= 0) {
                const el = selEl(celdas[foundIdx]);
                if (el) el.classList.add('cubeta-encontrada-anim');
                const ub = celdas[foundIdx].tipo === 'col' ? `Colisión #${celdas[foundIdx].colrow + 1}` : `Fila ${celdas[foundIdx].row + 1}`;
                dinMsg(
                    `H(${clave}) = ${clave} mod ${DIN.cubetas} = <strong>${col}</strong><br>` +
                    `<span class="text-success fw-bold">Clave "${clave}" encontrada en Cubeta ${col}, ${ub}</span>`,
                    'success'
                );
                DIN.timeouts.push(setTimeout(() => {
                    if (el) el.classList.remove('cubeta-encontrada-anim');
                    if (header) header.classList.remove('cubeta-header-activa');
                    DIN.animEnCurso = false;
                }, 2500));
            } else {
                dinMsg(
                    `H(${clave}) = ${clave} mod ${DIN.cubetas} = <strong>${col}</strong><br>` +
                    `<span class="text-danger fw-bold">Clave "${clave}" no encontrada</span>`,
                    'danger'
                );
                if (header) header.classList.remove('cubeta-header-activa');
                DIN.animEnCurso = false;
            }
        }, DELAY_PASO * (scanHasta + 1) + 300));
    }, 150));
}

// ==================== ACCIÓN: ELIMINAR ====================

function eliminarDinamica() {
    if (DIN.animEnCurso) dinLimpiarTimeouts();
    if (!DIN.inicializado) { dinMsg('Primero debe crear la estructura', 'warning'); return; }

    const input = document.getElementById('claveDinamica');
    const clave = input.value.trim();
    const valid = dinValidarClave(clave);
    if (!valid.ok) { dinMsg(valid.msg, 'warning'); return; }

    const col    = dinHashCol(clave);
    const celdas = [];
    for (let r = 0; r < DIN.registros; r++) celdas.push({ tipo: 'main', row: r,     valor: DIN.matriz[col][r] });
    for (let i = 0; i < DIN.colisiones[col].length; i++) celdas.push({ tipo: 'col',  colrow: i, valor: DIN.colisiones[col][i] });

    const foundIdx = celdas.findIndex(c => c.valor === clave);
    if (foundIdx === -1) { dinMsg(`La clave "${clave}" no existe en la estructura`, 'danger'); return; }

    input.value = '';
    DIN.animEnCurso = true;
    dinRenderizar();

    function selEl(item) {
        return item.tipo === 'main'
            ? document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`)
            : document.querySelector(`#visualizacionDinamica .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
    }

    DIN.timeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionDinamica .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        // Animar recorrido hasta la celda encontrada
        for (let i = 0; i <= foundIdx; i++) {
            DIN.timeouts.push(setTimeout(() => {
                if (i > 0) { const pEl = selEl(celdas[i-1]); if (pEl) pEl.classList.remove('cubeta-buscando'); }
                const el = selEl(celdas[i]);
                if (el) el.classList.add('cubeta-buscando');
            }, DELAY_PASO * i));
        }

        // Resaltar en rojo y eliminar
        DIN.timeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionDinamica .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            const found  = celdas[foundIdx];
            const celdaE = selEl(found);
            if (celdaE) celdaE.classList.add('cubeta-eliminada-anim');

            DIN.timeouts.push(setTimeout(() => {
                // Eliminar físicamente
                if (found.tipo === 'main') {
                    DIN.matriz[col][found.row] = null;
                    if (DIN.colisiones[col].length > 0) {
                        DIN.matriz[col][found.row] = DIN.colisiones[col].shift();
                    }
                } else {
                    DIN.colisiones[col].splice(found.colrow, 1);
                }
                const idx = DIN.ordenInsert.indexOf(clave);
                if (idx !== -1) DIN.ordenInsert.splice(idx, 1);

                const { ocupados, porcRed } = dinDO();
                dinRenderizar();
                dinActualizarDescripcion();
                if (header) header.classList.remove('cubeta-header-activa');

                const ub = found.tipo === 'col' ? `Colisión #${found.colrow + 1}` : `Fila ${found.row + 1}`;

                // ¿Reducir?
                if (porcRed * 100 < 112 && DIN.cubetas > 2) {
                    DIN.timeouts.push(setTimeout(() => {
                        const prevN  = DIN.cubetas;
                        const pctAnt = (porcRed * 100).toFixed(1);
                        let decStr;
                        if (DIN.modo === 'total') {
                            decStr = `${prevN} / 2 = ${Math.floor(prevN / 2)}`;
                        } else {
                            decStr = dinPreviewReduccionParcial().texto;
                        }

                        // Eliminar y insertar no deben compartir el mismo ciclo parcial.
                        dinResetParcialExp();

                        const exito = dinReducir();

                        if (exito) {
                            dinRenderizar();
                            dinActualizarDescripcion();

                            const { ocupados: o2, porcRed: p2 } = dinDO();
                            dinMsg(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ub}.<br>` +
                                `D.O. Red = ${ocupados}/${prevN} = <strong>${pctAnt} %</strong> (< 112 %) → ` +
                                `<span class="text-primary fw-bold">Reducción ${DIN.modo === 'total' ? 'Total' : 'Parcial'}: ${decStr} cubetas</span><br>` +
                                `Nueva D.O. Red = ${o2}/${DIN.cubetas} = <strong>${(p2*100).toFixed(1)} %</strong>. ` +
                                `Re-insertadas ${DIN.ordenInsert.length} claves con H(k) = k mod ${DIN.cubetas}.`,
                                'info'
                            );

                            document.querySelectorAll('#visualizacionDinamica .cubeta-ocupada').forEach(c => c.classList.add('cubeta-insertada'));
                            DIN.timeouts.push(setTimeout(() => {
                                document.querySelectorAll('#visualizacionDinamica .cubeta-insertada').forEach(c => c.classList.remove('cubeta-insertada'));
                                DIN.animEnCurso = false;
                            }, 2000));
                        } else {
                            dinMsg(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ub}.<br>` +
                                `D.O. Red = ${ocupados}/${prevN} = <strong>${pctAnt} %</strong> — No se puede reducir más (mínimo 2 cubetas).`,
                                'success'
                            );
                            DIN.animEnCurso = false;
                        }
                    }, 800));
                } else {
                    dinMsg(
                        `Clave "${clave}" eliminada de Cubeta ${col}, ${ub}.<br>` +
                        `D.O. Red = ${ocupados}/${DIN.cubetas} = <strong>${(porcRed*100).toFixed(1)} %</strong>`,
                        'success'
                    );
                    DIN.timeouts.push(setTimeout(() => { DIN.animEnCurso = false; }, 1000));
                }
            }, 800));
        }, DELAY_PASO * (foundIdx + 1) + 300));
    }, 150));
}

// ==================== LIMPIAR ====================

function limpiarDinamica() {
    if (!confirm('¿Limpiar la estructura y volver al tamaño original?')) return;
    dinLimpiarTimeouts();
    dinResetParciales();
    dinCrearEstructura(DIN.cubetasOrig, DIN.registros, false);
    dinRenderizar();
    dinActualizarDescripcion();
    document.getElementById('claveDinamica').value = '';
    dinMsg(`Estructura reiniciada a ${DIN.cubetasOrig} cubetas × ${DIN.registros} registros`, 'success');
}

// ==================== GUARDAR / CARGAR ====================

function guardarDinamica() {
    if (!DIN.inicializado) { dinMsg('No hay estructura para guardar', 'warning'); return; }
    const payload = JSON.stringify({
        tipo: 'dinamicaUnificada',
        modo: DIN.modo,
        cubetas: DIN.cubetas,
        cubetasOrig: DIN.cubetasOrig,
        registros: DIN.registros,
        digitosClave: DIN.digitosClave,
        matriz: DIN.matriz,
        colisiones: DIN.colisiones,
        ordenInsert: DIN.ordenInsert,
        parcialExp: DIN.parcialExp,
        parcialRed: DIN.parcialRed
    });
    const blob = new Blob([payload], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `dinamica_${DIN.modo}.json`;
    a.click();
    URL.revokeObjectURL(url);
    dinMsg('Estructura guardada correctamente', 'success');
}

function cargarDinamica() {
    document.getElementById('fileInputDinamica').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    // Enter en campo clave → insertar
    const inputClave = document.getElementById('claveDinamica');
    if (inputClave) {
        inputClave.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') insertarDinamica();
        });
    }

    // Cargar archivo
    document.getElementById('fileInputDinamica').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const d = JSON.parse(ev.target.result);
                const tipos = ['dinamicaUnificada', 'expTotal', 'expParcial', 'redTotal', 'redParcial'];
                if (!tipos.includes(d.tipo)) throw new Error('Formato no compatible');

                // Normalizar modo de archivos viejos
                let modo = d.modo || d.tipo;
                if (modo === 'expTotal' || modo === 'redTotal')   modo = 'total';
                if (modo === 'expParcial' || modo === 'redParcial') modo = 'parcial';

                DIN.modo         = modo;
                DIN.cubetas      = d.cubetas;
                DIN.cubetasOrig  = d.cubetasOrig || d.cubetas;
                DIN.registros    = d.registros;
                DIN.digitosClave = d.digitosClave || 3;
                DIN.matriz       = d.matriz;
                DIN.colisiones   = d.colisiones;
                DIN.ordenInsert  = d.ordenInsert;
                DIN.parcialExp   = d.parcialExp || { fase: 0, base: 0 };
                DIN.parcialRed   = d.parcialRed || { fase: 0, base: 0 };
                DIN.inicializado = true;

                document.getElementById('cubetasDinamica').value      = DIN.cubetasOrig;
                document.getElementById('registrosDinamica').value    = DIN.registros;
                document.getElementById('digitosClaveDinamica').value = DIN.digitosClave;
                document.getElementById('modoDinamica').value         = DIN.modo;

                document.getElementById('dinamicaControles').classList.remove('d-none');
                dinRenderizar();
                dinActualizarDescripcion();
                dinMsg('Estructura cargada correctamente', 'success');
            } catch (err) {
                dinMsg('Error al cargar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // Ocultar bienvenida al cambiar de pestaña
    document.querySelectorAll('#busquedasExtTabs button[data-bs-toggle="pill"]').forEach(function (tab) {
        tab.addEventListener('shown.bs.tab', function () {
            const bienvenida = document.getElementById('panel-bienvenida-ext');
            if (bienvenida) bienvenida.style.display = 'none';
        });
    });
});
