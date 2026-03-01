/**
 * Simulador CC2 – Búsquedas Dinámicas: Expansión Total
 *
 * • Estructura: matriz  n (cubetas) × m (registros por cubeta).
 * • Hash: H(k) = k mod n.
 * • D.O. ≥ 75 % → expansión total: n se duplica, se re-insertan las claves
 *   en el mismo orden que las ingresó el usuario.
 * • Colisiones (cubeta llena) se muestran debajo de la columna correspondiente
 *   en rojo.
 * • Encabezados horizontales empiezan en 0; índices verticales en 1.
 */

// ==================== VARIABLES GLOBALES ====================
let etCubetas      = 2;          // n actual (siempre par)
let etRegistros    = 3;          // m (fijo)
let etCubetasOrig  = 2;          // n original (para Limpiar)
let etMatriz       = [];         // n × m  (etMatriz[col][fila])
let etColisiones   = [];         // etColisiones[col] = [claves extra…]
let etOrdenInsert  = [];         // orden real de inserción del usuario
let etInicializado = false;
let etAnimEnCurso  = false;
let etTimeouts     = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsET() {
    etTimeouts.forEach(t => clearTimeout(t));
    etTimeouts = [];
    etAnimEnCurso = false;
}

function mostrarMensajeET(msg, tipo) {
    const el = document.getElementById('mensajeExpTotal');
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
}

function calcularDO() {
    let ocupados = 0;
    for (let c = 0; c < etCubetas; c++) {
        for (let r = 0; r < etRegistros; r++) {
            if (etMatriz[c][r] !== null) ocupados++;
        }
    }
    const total = etCubetas * etRegistros;
    return { ocupados, total, porcentaje: ocupados / total };
}

// ==================== CREAR ESTRUCTURA ====================

function crearEstructuraET(cubetas, registros, preservar) {
    etCubetas    = cubetas;
    etRegistros  = registros;
    etMatriz     = [];
    etColisiones = [];
    for (let c = 0; c < cubetas; c++) {
        etMatriz[c]     = new Array(registros).fill(null);
        etColisiones[c] = [];
    }
    if (!preservar) {
        etOrdenInsert = [];
    }
}

function crearEstructuraExpTotal() {
    limpiarTimeoutsET();

    const cubetas   = parseInt(document.getElementById('cubetasExpTotal').value) || 2;
    const registros = parseInt(document.getElementById('registrosExpTotal').value) || 3;

    if (cubetas < 2 || cubetas % 2 !== 0) {
        mostrarMensajeET('El número de cubetas debe ser par (≥ 2)', 'warning');
        return;
    }
    if (registros < 1) {
        mostrarMensajeET('Debe haber al menos 1 registro por cubeta', 'warning');
        return;
    }

    etCubetasOrig = cubetas;
    crearEstructuraET(cubetas, registros, false);
    etInicializado = true;

    document.getElementById('expTotalControles').classList.remove('d-none');
    actualizarDescripcionET();
    renderizarET();
    mostrarMensajeET(`Estructura creada: ${cubetas} cubetas × ${registros} registros`, 'success');
}

function actualizarDescripcionET() {
    const desc = document.getElementById('descripcionExpTotal');
    const { ocupados, total, porcentaje } = calcularDO();
    desc.innerHTML =
        `<strong>Expansión Total</strong> — Cubetas: <code>${etCubetas}</code> | Registros/cubeta: <code>${etRegistros}</code> | ` +
        `Hash: <code>H(k) = k mod ${etCubetas}</code><br>` +
        `D.O. = ${ocupados}/${total} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> ` +
        `${porcentaje >= 0.75 ? '⚠️ Se expandirá al siguiente insertar' : ''}`;
}

// ==================== RENDERIZADO ====================

function renderizarET() {
    const container = document.getElementById('visualizacionExpTotal');
    if (!container || !etInicializado) {
        if (container) container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    let html = '<div class="matriz-cubetas-container">';
    html += '<table class="tabla-cubetas">';

    // Encabezado: cubetas empiezan en 0
    html += '<thead><tr><th class="cubeta-header"></th>';
    for (let c = 0; c < etCubetas; c++) {
        html += `<th class="cubeta-header" data-col="${c}">${c}</th>`;
    }
    html += '</tr></thead>';

    // Cuerpo: registros (filas empiezan en 1)
    html += '<tbody>';
    for (let r = 0; r < etRegistros; r++) {
        html += `<tr><td class="cubeta-index">${r + 1}</td>`;
        for (let c = 0; c < etCubetas; c++) {
            const v = etMatriz[c][r];
            const vacia = v === null;
            html += `<td class="cubeta-celda ${vacia ? 'cubeta-vacia' : 'cubeta-ocupada'}" data-col="${c}" data-row="${r}">` +
                    `${vacia ? '' : v}</td>`;
        }
        html += '</tr>';
    }

    // Filas de colisión
    const maxCol = Math.max(0, ...etColisiones.map(a => a.length));
    for (let r = 0; r < maxCol; r++) {
        html += `<tr><td class="cubeta-index" style="font-size:0.7rem;">Col ${r + 1}</td>`;
        for (let c = 0; c < etCubetas; c++) {
            const v = etColisiones[c][r];
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
    const { ocupados, total, porcentaje } = calcularDO();
    const pct = (porcentaje * 100).toFixed(1);
    const clase = porcentaje >= 0.75 ? 'do-danger' : porcentaje >= 0.5 ? 'do-warning' : 'do-normal';
    html += `<div class="do-bar-container">`;
    html += `<div class="d-flex justify-content-between do-label"><span>D.O.</span><span>${ocupados}/${total} = ${pct} %</span></div>`;
    html += `<div class="do-bar-bg"><div class="do-bar-fill ${clase}" style="width:${pct}%"></div></div>`;
    html += `</div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ==================== INSERTAR (sin expansión, una celda) ====================

function insertarEnMatriz(clave) {
    const k   = parseInt(clave, 10);
    const col = k % etCubetas;

    // Buscar espacio libre en la cubeta
    for (let r = 0; r < etRegistros; r++) {
        if (etMatriz[col][r] === null) {
            etMatriz[col][r] = clave;
            return { col, row: r, colision: false };
        }
    }
    // No hay espacio → colisión
    etColisiones[col].push(clave);
    return { col, row: -1, colision: true, colIdx: etColisiones[col].length - 1 };
}

// ==================== EXPANSIÓN ====================

function expandirTotal() {
    const nuevoCubetas = etCubetas * 2;
    const claves = [...etOrdenInsert]; // preservar orden

    crearEstructuraET(nuevoCubetas, etRegistros, true);

    // Re-insertar en orden original
    claves.forEach(cl => insertarEnMatriz(cl));
}

// ==================== ACCIÓN: INSERTAR ====================

function insertarExpTotal() {
    if (etAnimEnCurso) limpiarTimeoutsET();

    if (!etInicializado) {
        mostrarMensajeET('Primero debe crear la estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveExpTotal');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeET('Ingrese una clave numérica válida', 'warning');
        return;
    }

    // Verificar duplicado
    for (let c = 0; c < etCubetas; c++) {
        if (etMatriz[c].includes(clave) || etColisiones[c].includes(clave)) {
            mostrarMensajeET(`La clave "${clave}" ya existe en la estructura`, 'warning');
            return;
        }
    }

    input.value = '';
    etOrdenInsert.push(clave);

    const k   = parseInt(clave, 10);
    const col = k % etCubetas;
    const res = insertarEnMatriz(clave);

    // Calcular D.O. después de insertar
    const { ocupados, total, porcentaje } = calcularDO();

    renderizarET();
    actualizarDescripcionET();
    etAnimEnCurso = true;

    // Animación: resaltar la celda insertada
    etTimeouts.push(setTimeout(() => {
        let celda;
        if (!res.colision) {
            celda = document.querySelector(`#visualizacionExpTotal .cubeta-celda[data-col="${res.col}"][data-row="${res.row}"]`);
        } else {
            celda = document.querySelector(`#visualizacionExpTotal .cubeta-celda[data-col="${res.col}"][data-colrow="${res.colIdx}"]`);
        }
        // Resaltar encabezado de columna
        const header = document.querySelector(`#visualizacionExpTotal .cubeta-header[data-col="${res.col}"]`);
        if (header) header.classList.add('cubeta-header-activa');

        if (celda) celda.classList.add('cubeta-insertada');

        const colisionMsg = res.colision
            ? ` — <span class="text-danger fw-bold">¡Colisión! Cubeta ${col} llena, desbordamiento #${res.colIdx + 1}</span>`
            : '';

        etTimeouts.push(setTimeout(() => {
            mostrarMensajeET(
                `D.O. = ${ocupados}/${total} = <strong>${(porcentaje * 100).toFixed(1)} %</strong><br>` +
                `H(${clave}) = ${clave} mod ${etCubetas} = <strong>${col}</strong> → Cubeta ${col}${colisionMsg}` ,
                res.colision ? 'warning' : 'success'
            );

            // Verificar si necesita expansión
            if (porcentaje >= 0.75) {
                etTimeouts.push(setTimeout(() => {
                    const prevN = etCubetas;
                    expandirTotal();
                    renderizarET();
                    actualizarDescripcionET();

                    const { ocupados: o2, total: t2, porcentaje: p2 } = calcularDO();
                    mostrarMensajeET(
                        `H(${clave}) = ${clave} mod ${prevN} = <strong>${col}</strong> → Cubeta ${col}${colisionMsg}<br>` +
                        `D.O. alcanzó <strong>${(porcentaje * 100).toFixed(1)} %</strong> (≥ 75 %) → ` +
                        `<span class="text-primary fw-bold">Expansión Total: ${prevN} → ${etCubetas} cubetas</span><br>` +
                        `Nueva D.O. = ${o2}/${t2} = <strong>${(p2 * 100).toFixed(1)} %</strong>. ` +
                        `Se re-insertaron ${etOrdenInsert.length} claves con H(k) = k mod ${etCubetas}.`,
                        'info'
                    );

                    // Resaltar todas las celdas que se reubicaron
                    document.querySelectorAll('#visualizacionExpTotal .cubeta-ocupada').forEach(c => {
                        c.classList.add('cubeta-insertada');
                    });

                    etTimeouts.push(setTimeout(() => {
                        document.querySelectorAll('#visualizacionExpTotal .cubeta-insertada').forEach(c => {
                            c.classList.remove('cubeta-insertada');
                        });
                        etAnimEnCurso = false;
                    }, 1200));
                }, 800));
            } else {
                etTimeouts.push(setTimeout(() => {
                    if (celda) celda.classList.remove('cubeta-insertada');
                    if (header) header.classList.remove('cubeta-header-activa');
                    etAnimEnCurso = false;
                }, 1000));
            }
        }, 350));
    }, 100));
}

// ==================== LIMPIAR ====================

function limpiarExpTotal() {
    if (!confirm('¿Limpiar la estructura y volver al tamaño original?')) return;
    limpiarTimeoutsET();
    crearEstructuraET(etCubetasOrig, etRegistros, false);
    renderizarET();
    actualizarDescripcionET();
    document.getElementById('claveExpTotal').value = '';
    mostrarMensajeET(`Estructura reiniciada a ${etCubetasOrig} cubetas × ${etRegistros} registros`, 'success');
}

// ==================== GUARDAR / CARGAR ====================

function guardarExpTotal() {
    const datos = JSON.stringify({
        tipo: 'expTotal',
        cubetas: etCubetas,
        cubetasOrig: etCubetasOrig,
        registros: etRegistros,
        matriz: etMatriz,
        colisiones: etColisiones,
        ordenInsert: etOrdenInsert
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'expansion_total.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeET('Estructura guardada correctamente', 'success');
}

function cargarExpTotal() {
    document.getElementById('fileInputExpTotal').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fileInputExpTotal').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const d = JSON.parse(ev.target.result);
                if (d.tipo !== 'expTotal') throw new Error('Formato inválido');
                etCubetas     = d.cubetas;
                etCubetasOrig = d.cubetasOrig;
                etRegistros   = d.registros;
                etMatriz      = d.matriz;
                etColisiones  = d.colisiones;
                etOrdenInsert = d.ordenInsert;
                etInicializado = true;
                document.getElementById('cubetasExpTotal').value   = etCubetasOrig;
                document.getElementById('registrosExpTotal').value = etRegistros;
                document.getElementById('expTotalControles').classList.remove('d-none');
                renderizarET();
                actualizarDescripcionET();
                mostrarMensajeET('Estructura cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeET('Error al cargar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // Ocultar bienvenida al cambiar de tab
    const tabs = document.querySelectorAll('#busquedasDinTabs button[data-bs-toggle="pill"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function () {
            const bienvenida = document.getElementById('panel-bienvenida-din');
            if (bienvenida) bienvenida.style.display = 'none';
        });
    });
});

