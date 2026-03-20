/**
 * Simulador CC2 – Búsquedas Dinámicas: Reducción Total
 *
 * • Carga una estructura de Expansión Total (.json con tipo: 'expTotal').
 * • Permite eliminar claves; tras eliminar, si D.O. < 75 % se reduce
 *   a la mitad: n → n/2  (siempre que n > 2).
 * • D.O. = (# registros ocupados) / (# cubetas).
 * • Re-inserta en el orden original (sin la clave eliminada).
 */

// ==================== VARIABLES GLOBALES ====================
let rtCubetas      = 2;
let rtRegistros    = 3;
let rtCubetasOrig  = 2;
let rtMatriz       = [];
let rtColisiones   = [];
let rtOrdenInsert  = [];
let rtInicializado = false;
let rtAnimEnCurso  = false;
let rtTimeouts     = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsRT() {
    rtTimeouts.forEach(t => clearTimeout(t));
    rtTimeouts = [];
    rtAnimEnCurso = false;
}

function mostrarMensajeRT(msg, tipo) {
    const el = document.getElementById('mensajeRedTotal');
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
}

function contarRegistrosRT() {
    let ocupados = 0;
    for (let c = 0; c < rtCubetas; c++) {
        for (let r = 0; r < rtRegistros; r++) {
            if (rtMatriz[c][r] !== null) ocupados++;
        }
        ocupados += rtColisiones[c].length;
    }
    return ocupados;
}

function calcularDO_RT() {
    const registros = contarRegistrosRT();
    const porcentaje = registros / rtCubetas;
    return { registros, cubetas: rtCubetas, porcentaje };
}

// ==================== CREAR ESTRUCTURA (interna) ====================

function crearEstructuraRT(cubetas, registros, preservar) {
    rtCubetas    = cubetas;
    rtRegistros  = registros;
    rtMatriz     = [];
    rtColisiones = [];
    for (let c = 0; c < cubetas; c++) {
        rtMatriz[c]     = new Array(registros).fill(null);
        rtColisiones[c] = [];
    }
    if (!preservar) {
        rtOrdenInsert = [];
    }
}

function insertarEnMatrizRT(clave) {
    const k   = parseInt(clave, 10);
    const col = k % rtCubetas;

    for (let r = 0; r < rtRegistros; r++) {
        if (rtMatriz[col][r] === null) {
            rtMatriz[col][r] = clave;
            return { col, row: r, colision: false };
        }
    }
    rtColisiones[col].push(clave);
    return { col, row: -1, colision: true, colIdx: rtColisiones[col].length - 1 };
}

function actualizarDescripcionRT() {
    const desc = document.getElementById('descripcionRedTotal');
    const { registros, cubetas, porcentaje } = calcularDO_RT();
    desc.innerHTML =
        `<strong>Reducción Total</strong> — Cubetas: <code>${rtCubetas}</code> | Registros/cubeta: <code>${rtRegistros}</code> | ` +
        `Hash: <code>H(k) = k mod ${rtCubetas}</code><br>` +
        `D.O. = ${registros}/${cubetas} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> ` +
        `${porcentaje < 1.25 && rtCubetas > 2 ? '⚠️ Se reducirá al siguiente eliminar' : ''}`;
}

// ==================== RENDERIZADO ====================

function renderizarRT() {
    const container = document.getElementById('visualizacionRedTotal');
    if (!container || !rtInicializado) {
        if (container) container.innerHTML = '<div class="text-muted text-center">Cargue una estructura para visualizar</div>';
        return;
    }

    let html = '<div class="matriz-cubetas-container">';
    html += '<table class="tabla-cubetas">';

    html += '<thead><tr><th class="cubeta-header"></th>';
    for (let c = 0; c < rtCubetas; c++) {
        html += `<th class="cubeta-header" data-col="${c}">${c}</th>`;
    }
    html += '</tr></thead>';

    html += '<tbody>';
    for (let r = 0; r < rtRegistros; r++) {
        html += `<tr><td class="cubeta-index">${r + 1}</td>`;
        for (let c = 0; c < rtCubetas; c++) {
            const v = rtMatriz[c][r];
            const vacia = v === null;
            html += `<td class="cubeta-celda ${vacia ? 'cubeta-vacia' : 'cubeta-ocupada'}" data-col="${c}" data-row="${r}">` +
                    `${vacia ? '' : v}</td>`;
        }
        html += '</tr>';
    }

    const maxCol = Math.max(0, ...rtColisiones.map(a => a.length));
    for (let r = 0; r < maxCol; r++) {
        html += `<tr><td class="cubeta-index" style="font-size:0.7rem;">Col ${r + 1}</td>`;
        for (let c = 0; c < rtCubetas; c++) {
            const v = rtColisiones[c][r];
            if (v !== undefined) {
                html += `<td class="cubeta-celda cubeta-colision" data-col="${c}" data-colrow="${r}">${v}</td>`;
            } else {
                html += `<td class="cubeta-celda cubeta-vacia"></td>`;
            }
        }
        html += '</tr>';
    }

    html += '</tbody></table>';

    // Barra D.O.
    const { registros, cubetas, porcentaje } = calcularDO_RT();
    const pct = (porcentaje * 100).toFixed(1);
    const clase = porcentaje >= 1.25 ? 'do-normal' : porcentaje >= 0.5 ? 'do-warning' : 'do-danger';
    html += `<div class="do-bar-container">`;
    html += `<div class="d-flex justify-content-between do-label"><span>D.O.</span><span>${registros}/${cubetas} = ${pct} %</span></div>`;
    html += `<div class="do-bar-bg"><div class="do-bar-fill ${clase}" style="width:${Math.min(pct, 100)}%"></div></div>`;
    html += `</div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ==================== REDUCCIÓN ====================

function reducirTotal() {
    const nuevoCubetas = Math.floor(rtCubetas / 2);
    if (nuevoCubetas < 2) return false;

    const claves = [...rtOrdenInsert];
    crearEstructuraRT(nuevoCubetas, rtRegistros, true);
    claves.forEach(cl => insertarEnMatrizRT(cl));
    return true;
}

// ==================== ACCIÓN: ELIMINAR ====================

function eliminarRedTotal() {
    if (rtAnimEnCurso) limpiarTimeoutsRT();

    if (!rtInicializado) {
        mostrarMensajeRT('Primero debe cargar una estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveRedTotal');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeRT('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const k = parseInt(clave, 10);
    const col = k % rtCubetas;

    // Build cell list and find target
    const celdas = [];
    for (let r = 0; r < rtRegistros; r++) {
        celdas.push({ tipo: 'main', row: r, valor: rtMatriz[col][r] });
    }
    for (let ci = 0; ci < rtColisiones[col].length; ci++) {
        celdas.push({ tipo: 'col', colrow: ci, valor: rtColisiones[col][ci] });
    }

    let encontradoIdx = -1;
    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].valor === clave) { encontradoIdx = i; break; }
    }

    if (encontradoIdx === -1) {
        mostrarMensajeRT(`La clave "${clave}" no existe en la estructura`, 'danger');
        return;
    }

    input.value = '';
    rtAnimEnCurso = true;
    renderizarRT();

    let delay = 300;

    rtTimeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionRedTotal .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        // Sequential scan animation up to found cell
        for (let i = 0; i <= encontradoIdx; i++) {
            rtTimeouts.push(setTimeout(() => {
                if (i > 0) {
                    const prevItem = celdas[i - 1];
                    let prevCelda;
                    if (prevItem.tipo === 'main') prevCelda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${prevItem.row}"]`);
                    else prevCelda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${prevItem.colrow}"]`);
                    if (prevCelda) prevCelda.classList.remove('cubeta-buscando');
                }
                const item = celdas[i];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-buscando');
            }, delay * i));
        }

        // After scan: highlight red for deletion
        rtTimeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionRedTotal .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            const foundItem = celdas[encontradoIdx];
            let celdaElim;
            if (foundItem.tipo === 'main') celdaElim = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${foundItem.row}"]`);
            else celdaElim = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${foundItem.colrow}"]`);
            if (celdaElim) celdaElim.classList.add('cubeta-eliminada-anim');

            rtTimeouts.push(setTimeout(() => {
                // Perform deletion
                if (foundItem.tipo === 'main') {
                    rtMatriz[col][foundItem.row] = null;
                    if (rtColisiones[col].length > 0) {
                        rtMatriz[col][foundItem.row] = rtColisiones[col].shift();
                    }
                } else {
                    rtColisiones[col].splice(foundItem.colrow, 1);
                }

                const idx = rtOrdenInsert.indexOf(clave);
                if (idx !== -1) rtOrdenInsert.splice(idx, 1);

                const { registros: regs, cubetas: cubs, porcentaje } = calcularDO_RT();
                renderizarRT();
                actualizarDescripcionRT();

                const ubicacion = foundItem.tipo === 'col' ? `Colisión #${foundItem.colrow + 1}` : `Fila ${foundItem.row + 1}`;

                if (porcentaje < 1.25 && rtCubetas > 2) {
                    rtTimeouts.push(setTimeout(() => {
                        const prevN = rtCubetas;
                        const exito = reducirTotal();

                        if (exito) {
                            renderizarRT();
                            actualizarDescripcionRT();
                            document.getElementById('cubetasRedTotal').value = rtCubetas;

                            const { registros: r2, cubetas: c2, porcentaje: p2 } = calcularDO_RT();
                            mostrarMensajeRT(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                                `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> (&lt; 125 %) → ` +
                                `<span class="text-primary fw-bold">Reducción Total: ${prevN} → ${rtCubetas} cubetas</span><br>` +
                                `Nueva D.O. = ${r2}/${c2} = <strong>${(p2 * 100).toFixed(1)} %</strong>. ` +
                                `Se re-insertaron ${rtOrdenInsert.length} claves con H(k) = k mod ${rtCubetas}.`,
                                'info'
                            );

                            document.querySelectorAll('#visualizacionRedTotal .cubeta-ocupada').forEach(c => {
                                c.classList.add('cubeta-insertada');
                            });

                            rtTimeouts.push(setTimeout(() => {
                                document.querySelectorAll('#visualizacionRedTotal .cubeta-insertada').forEach(c => {
                                    c.classList.remove('cubeta-insertada');
                                });
                                rtAnimEnCurso = false;
                            }, 1500));
                        } else {
                            mostrarMensajeRT(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                                `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> — No se puede reducir más (mínimo 2 cubetas).`,
                                'success'
                            );
                            rtAnimEnCurso = false;
                        }
                    }, 600));
                } else {
                    mostrarMensajeRT(
                        `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                        `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong>`,
                        'success'
                    );
                    rtTimeouts.push(setTimeout(() => { rtAnimEnCurso = false; }, 800));
                }
            }, 600));
        }, delay * (encontradoIdx + 1) + 200));
    }, 100));
}

// ==================== ACCIÓN: BUSCAR ====================

function buscarRedTotal() {
    if (rtAnimEnCurso) limpiarTimeoutsRT();

    if (!rtInicializado) {
        mostrarMensajeRT('Primero debe cargar una estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveRedTotal');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeRT('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const k = parseInt(clave, 10);
    const col = k % rtCubetas;

    rtAnimEnCurso = true;
    renderizarRT();

    const celdas = [];
    for (let r = 0; r < rtRegistros; r++) {
        celdas.push({ tipo: 'main', row: r, valor: rtMatriz[col][r] });
    }
    for (let ci = 0; ci < rtColisiones[col].length; ci++) {
        celdas.push({ tipo: 'col', colrow: ci, valor: rtColisiones[col][ci] });
    }

    let delay = 300;
    let encontradoIdx = -1;
    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].valor === clave) { encontradoIdx = i; break; }
    }
    const scanHasta = encontradoIdx >= 0 ? encontradoIdx : celdas.length - 1;

    rtTimeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionRedTotal .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        for (let i = 0; i <= scanHasta; i++) {
            rtTimeouts.push(setTimeout(() => {
                if (i > 0) {
                    const prevItem = celdas[i - 1];
                    let prevCelda;
                    if (prevItem.tipo === 'main') prevCelda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${prevItem.row}"]`);
                    else prevCelda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${prevItem.colrow}"]`);
                    if (prevCelda) prevCelda.classList.remove('cubeta-buscando');
                }
                const item = celdas[i];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-buscando');
            }, delay * i));
        }

        rtTimeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionRedTotal .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            if (encontradoIdx >= 0) {
                const item = celdas[encontradoIdx];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedTotal .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-encontrada-anim');

                const ubicacion = item.tipo === 'col' ? `Colisión #${item.colrow + 1}` : `Fila ${item.row + 1}`;
                mostrarMensajeRT(
                    `H(${clave}) = ${clave} mod ${rtCubetas} = <strong>${col}</strong> → Cubeta ${col}<br>` +
                    `<span class="text-success fw-bold">Clave "${clave}" encontrada en ${ubicacion}</span>`,
                    'success'
                );

                rtTimeouts.push(setTimeout(() => {
                    if (celda) celda.classList.remove('cubeta-encontrada-anim');
                    if (header) header.classList.remove('cubeta-header-activa');
                    rtAnimEnCurso = false;
                }, 2000));
            } else {
                mostrarMensajeRT(
                    `H(${clave}) = ${clave} mod ${rtCubetas} = <strong>${col}</strong> → Cubeta ${col}<br>` +
                    `<span class="text-danger fw-bold">Clave "${clave}" no encontrada</span>`,
                    'danger'
                );
                if (header) header.classList.remove('cubeta-header-activa');
                rtAnimEnCurso = false;
            }
        }, delay * (scanHasta + 1) + 200));
    }, 100));
}

// ==================== LIMPIAR ====================

function limpiarRedTotal() {
    if (!confirm('¿Limpiar la estructura completamente?')) return;
    limpiarTimeoutsRT();
    rtInicializado = false;
    rtOrdenInsert = [];
    document.getElementById('redTotalContenido').classList.add('d-none');
    document.getElementById('redTotalCargarInicial').classList.remove('d-none');
    document.getElementById('claveRedTotal').value = '';
    const el = document.getElementById('mensajeRedTotal');
    if (el) el.classList.add('d-none');
}

// ==================== GUARDAR / CARGAR ====================

function guardarRedTotal() {
    const datos = JSON.stringify({
        tipo: 'redTotal',
        cubetas: rtCubetas,
        cubetasOrig: rtCubetasOrig,
        registros: rtRegistros,
        matriz: rtMatriz,
        colisiones: rtColisiones,
        ordenInsert: rtOrdenInsert
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'reduccion_total.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeRT('Estructura guardada correctamente', 'success');
}

function cargarRedTotal() {
    document.getElementById('fileInputRedTotal').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fileInputRedTotal').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const d = JSON.parse(ev.target.result);
                // Aceptar tipo 'expTotal' o 'redTotal'
                if (d.tipo !== 'expTotal' && d.tipo !== 'redTotal') {
                    throw new Error('Debe cargar una estructura de Expansión Total');
                }
                rtCubetas     = d.cubetas;
                rtCubetasOrig = d.cubetasOrig || d.cubetas;
                rtRegistros   = d.registros;
                rtMatriz      = d.matriz;
                rtColisiones  = d.colisiones;
                rtOrdenInsert = d.ordenInsert;
                rtInicializado = true;

                document.getElementById('cubetasRedTotal').value   = rtCubetas;
                document.getElementById('registrosRedTotal').value = rtRegistros;
                document.getElementById('redTotalCargarInicial').classList.add('d-none');
                document.getElementById('redTotalContenido').classList.remove('d-none');
                renderizarRT();
                actualizarDescripcionRT();
                mostrarMensajeRT('Estructura de Expansión Total cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeRT('Error al cargar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
});


