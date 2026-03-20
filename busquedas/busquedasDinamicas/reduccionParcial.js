/**
 * Simulador CC2 – Búsquedas Dinámicas: Reducción Parcial
 *
 * • Carga una estructura de Expansión Parcial (.json con tipo: 'expParcial').
 * • Permite eliminar claves; tras eliminar, si D.O. < 75 % se reduce
 *   parcialmente: n → n - floor(n/2)  (inversa de expansión parcial).
 * • D.O. = (# registros ocupados) / (# cubetas).
 * • Re-inserta en el orden original (sin la clave eliminada).
 */

// ==================== VARIABLES GLOBALES ====================
let rpCubetas      = 2;
let rpRegistros    = 3;
let rpCubetasOrig  = 2;
let rpMatriz       = [];
let rpColisiones   = [];
let rpOrdenInsert  = [];
let rpInicializado = false;
let rpAnimEnCurso  = false;
let rpTimeouts     = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsRP() {
    rpTimeouts.forEach(t => clearTimeout(t));
    rpTimeouts = [];
    rpAnimEnCurso = false;
}

function mostrarMensajeRP(msg, tipo) {
    const el = document.getElementById('mensajeRedParcial');
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
}

function contarRegistrosRP() {
    let ocupados = 0;
    for (let c = 0; c < rpCubetas; c++) {
        for (let r = 0; r < rpRegistros; r++) {
            if (rpMatriz[c][r] !== null) ocupados++;
        }
        ocupados += rpColisiones[c].length;
    }
    return ocupados;
}

function calcularDO_RP() {
    const registros = contarRegistrosRP();
    const porcentaje = registros / rpCubetas;
    return { registros, cubetas: rpCubetas, porcentaje };
}

// ==================== CREAR ESTRUCTURA (interna) ====================

function crearEstructuraRP(cubetas, registros, preservar) {
    rpCubetas    = cubetas;
    rpRegistros  = registros;
    rpMatriz     = [];
    rpColisiones = [];
    for (let c = 0; c < cubetas; c++) {
        rpMatriz[c]     = new Array(registros).fill(null);
        rpColisiones[c] = [];
    }
    if (!preservar) {
        rpOrdenInsert = [];
    }
}

function insertarEnMatrizRP(clave) {
    const k   = parseInt(clave, 10);
    const col = k % rpCubetas;

    for (let r = 0; r < rpRegistros; r++) {
        if (rpMatriz[col][r] === null) {
            rpMatriz[col][r] = clave;
            return { col, row: r, colision: false };
        }
    }
    rpColisiones[col].push(clave);
    return { col, row: -1, colision: true, colIdx: rpColisiones[col].length - 1 };
}

function actualizarDescripcionRP() {
    const desc = document.getElementById('descripcionRedParcial');
    const { registros, cubetas, porcentaje } = calcularDO_RP();
    desc.innerHTML =
        `<strong>Reducción Parcial</strong> — Cubetas: <code>${rpCubetas}</code> | Registros/cubeta: <code>${rpRegistros}</code> | ` +
        `Hash: <code>H(k) = k mod ${rpCubetas}</code><br>` +
        `D.O. = ${registros}/${cubetas} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> ` +
        `${porcentaje < 1.25 && rpCubetas > 2 ? '⚠️ Se reducirá al siguiente eliminar' : ''}`;
}

// ==================== RENDERIZADO ====================

function renderizarRP() {
    const container = document.getElementById('visualizacionRedParcial');
    if (!container || !rpInicializado) {
        if (container) container.innerHTML = '<div class="text-muted text-center">Cargue una estructura para visualizar</div>';
        return;
    }

    let html = '<div class="matriz-cubetas-container">';
    html += '<table class="tabla-cubetas">';

    html += '<thead><tr><th class="cubeta-header"></th>';
    for (let c = 0; c < rpCubetas; c++) {
        html += `<th class="cubeta-header" data-col="${c}">${c}</th>`;
    }
    html += '</tr></thead>';

    html += '<tbody>';
    for (let r = 0; r < rpRegistros; r++) {
        html += `<tr><td class="cubeta-index">${r + 1}</td>`;
        for (let c = 0; c < rpCubetas; c++) {
            const v = rpMatriz[c][r];
            const vacia = v === null;
            html += `<td class="cubeta-celda ${vacia ? 'cubeta-vacia' : 'cubeta-ocupada'}" data-col="${c}" data-row="${r}">` +
                    `${vacia ? '' : v}</td>`;
        }
        html += '</tr>';
    }

    const maxCol = Math.max(0, ...rpColisiones.map(a => a.length));
    for (let r = 0; r < maxCol; r++) {
        html += `<tr><td class="cubeta-index" style="font-size:0.7rem;">Col ${r + 1}</td>`;
        for (let c = 0; c < rpCubetas; c++) {
            const v = rpColisiones[c][r];
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
    const { registros, cubetas, porcentaje } = calcularDO_RP();
    const pct = (porcentaje * 100).toFixed(1);
    const clase = porcentaje >= 1.25 ? 'do-normal' : porcentaje >= 0.5 ? 'do-warning' : 'do-danger';
    html += `<div class="do-bar-container">`;
    html += `<div class="d-flex justify-content-between do-label"><span>D.O.</span><span>${registros}/${cubetas} = ${pct} %</span></div>`;
    html += `<div class="do-bar-bg"><div class="do-bar-fill ${clase}" style="width:${Math.min(pct, 100)}%"></div></div>`;
    html += `</div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ==================== REDUCCIÓN PARCIAL ====================

function reducirParcial() {
    // Inversa de expansión parcial: reducir n en floor(n/2)
    const decremento = Math.floor(rpCubetas / 2);
    const nuevoCubetas = rpCubetas - decremento;
    if (nuevoCubetas < 2) return false;

    const claves = [...rpOrdenInsert];
    crearEstructuraRP(nuevoCubetas, rpRegistros, true);
    claves.forEach(cl => insertarEnMatrizRP(cl));
    return true;
}

// ==================== ACCIÓN: ELIMINAR ====================

function eliminarRedParcial() {
    if (rpAnimEnCurso) limpiarTimeoutsRP();

    if (!rpInicializado) {
        mostrarMensajeRP('Primero debe cargar una estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveRedParcial');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeRP('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const k = parseInt(clave, 10);
    const col = k % rpCubetas;

    const celdas = [];
    for (let r = 0; r < rpRegistros; r++) {
        celdas.push({ tipo: 'main', row: r, valor: rpMatriz[col][r] });
    }
    for (let ci = 0; ci < rpColisiones[col].length; ci++) {
        celdas.push({ tipo: 'col', colrow: ci, valor: rpColisiones[col][ci] });
    }

    let encontradoIdx = -1;
    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].valor === clave) { encontradoIdx = i; break; }
    }

    if (encontradoIdx === -1) {
        mostrarMensajeRP(`La clave "${clave}" no existe en la estructura`, 'danger');
        return;
    }

    input.value = '';
    rpAnimEnCurso = true;
    renderizarRP();

    let delay = 300;

    rpTimeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionRedParcial .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        for (let i = 0; i <= encontradoIdx; i++) {
            rpTimeouts.push(setTimeout(() => {
                if (i > 0) {
                    const prevItem = celdas[i - 1];
                    let prevCelda;
                    if (prevItem.tipo === 'main') prevCelda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${prevItem.row}"]`);
                    else prevCelda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${prevItem.colrow}"]`);
                    if (prevCelda) prevCelda.classList.remove('cubeta-buscando');
                }
                const item = celdas[i];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-buscando');
            }, delay * i));
        }

        rpTimeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionRedParcial .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            const foundItem = celdas[encontradoIdx];
            let celdaElim;
            if (foundItem.tipo === 'main') celdaElim = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${foundItem.row}"]`);
            else celdaElim = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${foundItem.colrow}"]`);
            if (celdaElim) celdaElim.classList.add('cubeta-eliminada-anim');

            rpTimeouts.push(setTimeout(() => {
                if (foundItem.tipo === 'main') {
                    rpMatriz[col][foundItem.row] = null;
                    if (rpColisiones[col].length > 0) {
                        rpMatriz[col][foundItem.row] = rpColisiones[col].shift();
                    }
                } else {
                    rpColisiones[col].splice(foundItem.colrow, 1);
                }

                const idx = rpOrdenInsert.indexOf(clave);
                if (idx !== -1) rpOrdenInsert.splice(idx, 1);

                const { registros: regs, cubetas: cubs, porcentaje } = calcularDO_RP();
                renderizarRP();
                actualizarDescripcionRP();

                const ubicacion = foundItem.tipo === 'col' ? `Colisión #${foundItem.colrow + 1}` : `Fila ${foundItem.row + 1}`;

                if (porcentaje < 1.25 && rpCubetas > 2) {
                    rpTimeouts.push(setTimeout(() => {
                        const prevN = rpCubetas;
                        const decremento = Math.floor(prevN / 2);
                        const exito = reducirParcial();

                        if (exito) {
                            renderizarRP();
                            actualizarDescripcionRP();
                            document.getElementById('cubetasRedParcial').value = rpCubetas;

                            const { registros: r2, cubetas: c2, porcentaje: p2 } = calcularDO_RP();
                            mostrarMensajeRP(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                                `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> (&lt; 125 %) → ` +
                                `<span class="text-primary fw-bold">Reducción Parcial: ${prevN} - ${decremento} = ${rpCubetas} cubetas</span><br>` +
                                `Nueva D.O. = ${r2}/${c2} = <strong>${(p2 * 100).toFixed(1)} %</strong>. ` +
                                `Se re-insertaron ${rpOrdenInsert.length} claves con H(k) = k mod ${rpCubetas}.`,
                                'info'
                            );

                            document.querySelectorAll('#visualizacionRedParcial .cubeta-ocupada').forEach(c => {
                                c.classList.add('cubeta-insertada');
                            });

                            rpTimeouts.push(setTimeout(() => {
                                document.querySelectorAll('#visualizacionRedParcial .cubeta-insertada').forEach(c => {
                                    c.classList.remove('cubeta-insertada');
                                });
                                rpAnimEnCurso = false;
                            }, 1500));
                        } else {
                            mostrarMensajeRP(
                                `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                                `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> — No se puede reducir más (mínimo 2 cubetas).`,
                                'success'
                            );
                            rpAnimEnCurso = false;
                        }
                    }, 600));
                } else {
                    mostrarMensajeRP(
                        `Clave "${clave}" eliminada de Cubeta ${col}, ${ubicacion}.<br>` +
                        `D.O. = ${regs}/${cubs} = <strong>${(porcentaje * 100).toFixed(1)} %</strong>`,
                        'success'
                    );
                    rpTimeouts.push(setTimeout(() => { rpAnimEnCurso = false; }, 800));
                }
            }, 600));
        }, delay * (encontradoIdx + 1) + 200));
    }, 100));
}

// ==================== ACCIÓN: BUSCAR ====================

function buscarRedParcial() {
    if (rpAnimEnCurso) limpiarTimeoutsRP();

    if (!rpInicializado) {
        mostrarMensajeRP('Primero debe cargar una estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveRedParcial');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeRP('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const k = parseInt(clave, 10);
    const col = k % rpCubetas;

    rpAnimEnCurso = true;
    renderizarRP();

    const celdas = [];
    for (let r = 0; r < rpRegistros; r++) {
        celdas.push({ tipo: 'main', row: r, valor: rpMatriz[col][r] });
    }
    for (let ci = 0; ci < rpColisiones[col].length; ci++) {
        celdas.push({ tipo: 'col', colrow: ci, valor: rpColisiones[col][ci] });
    }

    let delay = 300;
    let encontradoIdx = -1;
    for (let i = 0; i < celdas.length; i++) {
        if (celdas[i].valor === clave) { encontradoIdx = i; break; }
    }
    const scanHasta = encontradoIdx >= 0 ? encontradoIdx : celdas.length - 1;

    rpTimeouts.push(setTimeout(() => {
        const header = document.querySelector(`#visualizacionRedParcial .cubeta-header[data-col="${col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        for (let i = 0; i <= scanHasta; i++) {
            rpTimeouts.push(setTimeout(() => {
                if (i > 0) {
                    const prevItem = celdas[i - 1];
                    let prevCelda;
                    if (prevItem.tipo === 'main') prevCelda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${prevItem.row}"]`);
                    else prevCelda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${prevItem.colrow}"]`);
                    if (prevCelda) prevCelda.classList.remove('cubeta-buscando');
                }
                const item = celdas[i];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-buscando');
            }, delay * i));
        }

        rpTimeouts.push(setTimeout(() => {
            document.querySelectorAll('#visualizacionRedParcial .cubeta-buscando').forEach(c => c.classList.remove('cubeta-buscando'));

            if (encontradoIdx >= 0) {
                const item = celdas[encontradoIdx];
                let celda;
                if (item.tipo === 'main') celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-row="${item.row}"]`);
                else celda = document.querySelector(`#visualizacionRedParcial .cubeta-celda[data-col="${col}"][data-colrow="${item.colrow}"]`);
                if (celda) celda.classList.add('cubeta-encontrada-anim');

                const ubicacion = item.tipo === 'col' ? `Colisión #${item.colrow + 1}` : `Fila ${item.row + 1}`;
                mostrarMensajeRP(
                    `H(${clave}) = ${clave} mod ${rpCubetas} = <strong>${col}</strong> → Cubeta ${col}<br>` +
                    `<span class="text-success fw-bold">Clave "${clave}" encontrada en ${ubicacion}</span>`,
                    'success'
                );

                rpTimeouts.push(setTimeout(() => {
                    if (celda) celda.classList.remove('cubeta-encontrada-anim');
                    if (header) header.classList.remove('cubeta-header-activa');
                    rpAnimEnCurso = false;
                }, 2000));
            } else {
                mostrarMensajeRP(
                    `H(${clave}) = ${clave} mod ${rpCubetas} = <strong>${col}</strong> → Cubeta ${col}<br>` +
                    `<span class="text-danger fw-bold">Clave "${clave}" no encontrada</span>`,
                    'danger'
                );
                if (header) header.classList.remove('cubeta-header-activa');
                rpAnimEnCurso = false;
            }
        }, delay * (scanHasta + 1) + 200));
    }, 100));
}

// ==================== LIMPIAR ====================

function limpiarRedParcial() {
    if (!confirm('¿Limpiar la estructura completamente?')) return;
    limpiarTimeoutsRP();
    rpInicializado = false;
    rpOrdenInsert = [];
    document.getElementById('redParcialContenido').classList.add('d-none');
    document.getElementById('redParcialCargarInicial').classList.remove('d-none');
    document.getElementById('claveRedParcial').value = '';
    const el = document.getElementById('mensajeRedParcial');
    if (el) el.classList.add('d-none');
}

// ==================== GUARDAR / CARGAR ====================

function guardarRedParcial() {
    const datos = JSON.stringify({
        tipo: 'redParcial',
        cubetas: rpCubetas,
        cubetasOrig: rpCubetasOrig,
        registros: rpRegistros,
        matriz: rpMatriz,
        colisiones: rpColisiones,
        ordenInsert: rpOrdenInsert
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'reduccion_parcial.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeRP('Estructura guardada correctamente', 'success');
}

function cargarRedParcial() {
    document.getElementById('fileInputRedParcial').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fileInputRedParcial').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const d = JSON.parse(ev.target.result);
                // Aceptar tipo 'expParcial' o 'redParcial'
                if (d.tipo !== 'expParcial' && d.tipo !== 'redParcial') {
                    throw new Error('Debe cargar una estructura de Expansión Parcial');
                }
                rpCubetas     = d.cubetas;
                rpCubetasOrig = d.cubetasOrig || d.cubetas;
                rpRegistros   = d.registros;
                rpMatriz      = d.matriz;
                rpColisiones  = d.colisiones;
                rpOrdenInsert = d.ordenInsert;
                rpInicializado = true;

                document.getElementById('cubetasRedParcial').value   = rpCubetas;
                document.getElementById('registrosRedParcial').value = rpRegistros;
                document.getElementById('redParcialCargarInicial').classList.add('d-none');
                document.getElementById('redParcialContenido').classList.remove('d-none');
                renderizarRP();
                actualizarDescripcionRP();
                mostrarMensajeRP('Estructura de Expansión Parcial cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeRP('Error al cargar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
});

