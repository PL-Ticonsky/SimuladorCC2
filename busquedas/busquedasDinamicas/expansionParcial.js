/**
 * Simulador CC2 – Búsquedas Dinámicas: Expansión Parcial
 *
 * Igual que Expansión Total excepto que la expansión incrementa n
 * en la mitad: nuevo_n = n + floor(n/2).
 * Dos expansiones parciales ≈ una total (n → n+n/2 → (n+n/2)+floor((n+n/2)/2) …).
 * Ejemplo: 2 → 3 → 4 → 6 → 9 → …
 */

// ==================== VARIABLES GLOBALES ====================
let epCubetas      = 2;
let epRegistros    = 3;
let epCubetasOrig  = 2;
let epMatriz       = [];
let epColisiones   = [];
let epOrdenInsert  = [];
let epInicializado = false;
let epAnimEnCurso  = false;
let epTimeouts     = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsEP() {
    epTimeouts.forEach(t => clearTimeout(t));
    epTimeouts = [];
    epAnimEnCurso = false;
}

function mostrarMensajeEP(msg, tipo) {
    const el = document.getElementById('mensajeExpParcial');
    if (!el) return;
    el.className = `alert alert-${tipo}`;
    el.innerHTML = msg;
    el.classList.remove('d-none');
}

function calcularDO_EP() {
    let ocupados = 0;
    for (let c = 0; c < epCubetas; c++) {
        for (let r = 0; r < epRegistros; r++) {
            if (epMatriz[c][r] !== null) ocupados++;
        }
    }
    const total = epCubetas * epRegistros;
    return { ocupados, total, porcentaje: ocupados / total };
}

// ==================== CREAR ESTRUCTURA ====================

function crearEstructuraEP(cubetas, registros, preservar) {
    epCubetas    = cubetas;
    epRegistros  = registros;
    epMatriz     = [];
    epColisiones = [];
    for (let c = 0; c < cubetas; c++) {
        epMatriz[c]     = new Array(registros).fill(null);
        epColisiones[c] = [];
    }
    if (!preservar) {
        epOrdenInsert = [];
    }
}

function crearEstructuraExpParcial() {
    limpiarTimeoutsEP();

    const cubetas   = parseInt(document.getElementById('cubetasExpParcial').value) || 2;
    const registros = parseInt(document.getElementById('registrosExpParcial').value) || 3;

    if (cubetas < 2 || cubetas % 2 !== 0) {
        mostrarMensajeEP('El número de cubetas debe ser par (≥ 2)', 'warning');
        return;
    }
    if (registros < 1) {
        mostrarMensajeEP('Debe haber al menos 1 registro por cubeta', 'warning');
        return;
    }

    epCubetasOrig = cubetas;
    crearEstructuraEP(cubetas, registros, false);
    epInicializado = true;

    document.getElementById('expParcialControles').classList.remove('d-none');
    actualizarDescripcionEP();
    renderizarEP();
    mostrarMensajeEP(`Estructura creada: ${cubetas} cubetas × ${registros} registros`, 'success');
}

function actualizarDescripcionEP() {
    const desc = document.getElementById('descripcionExpParcial');
    const { ocupados, total, porcentaje } = calcularDO_EP();
    desc.innerHTML =
        `<strong>Expansión Parcial</strong> — Cubetas: <code>${epCubetas}</code> | Registros/cubeta: <code>${epRegistros}</code> | ` +
        `Hash: <code>H(k) = k mod ${epCubetas}</code><br>` +
        `D.O. = ${ocupados}/${total} = <strong>${(porcentaje * 100).toFixed(1)} %</strong> ` +
        `${porcentaje >= 0.75 ? '⚠️ Se expandirá al siguiente insertar' : ''}`;
}

// ==================== RENDERIZADO ====================

function renderizarEP() {
    const container = document.getElementById('visualizacionExpParcial');
    if (!container || !epInicializado) {
        if (container) container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    let html = '<div class="matriz-cubetas-container">';
    html += '<table class="tabla-cubetas">';

    // Encabezado: cubetas empiezan en 0
    html += '<thead><tr><th class="cubeta-header"></th>';
    for (let c = 0; c < epCubetas; c++) {
        html += `<th class="cubeta-header" data-col="${c}">${c}</th>`;
    }
    html += '</tr></thead>';

    // Cuerpo
    html += '<tbody>';
    for (let r = 0; r < epRegistros; r++) {
        html += `<tr><td class="cubeta-index">${r + 1}</td>`;
        for (let c = 0; c < epCubetas; c++) {
            const v = epMatriz[c][r];
            const vacia = v === null;
            html += `<td class="cubeta-celda ${vacia ? 'cubeta-vacia' : 'cubeta-ocupada'}" data-col="${c}" data-row="${r}">` +
                    `${vacia ? '' : v}</td>`;
        }
        html += '</tr>';
    }

    // Filas de colisión
    const maxCol = Math.max(0, ...epColisiones.map(a => a.length));
    for (let r = 0; r < maxCol; r++) {
        html += `<tr><td class="cubeta-index" style="font-size:0.7rem;">Col ${r + 1}</td>`;
        for (let c = 0; c < epCubetas; c++) {
            const v = epColisiones[c][r];
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
    const { ocupados, total, porcentaje } = calcularDO_EP();
    const pct = (porcentaje * 100).toFixed(1);
    const clase = porcentaje >= 0.75 ? 'do-danger' : porcentaje >= 0.5 ? 'do-warning' : 'do-normal';
    html += `<div class="do-bar-container">`;
    html += `<div class="d-flex justify-content-between do-label"><span>D.O.</span><span>${ocupados}/${total} = ${pct} %</span></div>`;
    html += `<div class="do-bar-bg"><div class="do-bar-fill ${clase}" style="width:${pct}%"></div></div>`;
    html += `</div>`;

    html += '</div>';
    container.innerHTML = html;
}

// ==================== INSERTAR (una celda) ====================

function insertarEnMatrizEP(clave) {
    const k   = parseInt(clave, 10);
    const col = k % epCubetas;

    for (let r = 0; r < epRegistros; r++) {
        if (epMatriz[col][r] === null) {
            epMatriz[col][r] = clave;
            return { col, row: r, colision: false };
        }
    }
    epColisiones[col].push(clave);
    return { col, row: -1, colision: true, colIdx: epColisiones[col].length - 1 };
}

// ==================== EXPANSIÓN PARCIAL ====================

function expandirParcial() {
    const incremento = Math.floor(epCubetas / 2);
    const nuevoCubetas = epCubetas + incremento;
    const claves = [...epOrdenInsert];

    crearEstructuraEP(nuevoCubetas, epRegistros, true);
    claves.forEach(cl => insertarEnMatrizEP(cl));
}

// ==================== ACCIÓN: INSERTAR ====================

function insertarExpParcial() {
    if (epAnimEnCurso) limpiarTimeoutsEP();

    if (!epInicializado) {
        mostrarMensajeEP('Primero debe crear la estructura', 'warning');
        return;
    }

    const input = document.getElementById('claveExpParcial');
    const clave = input.value.trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeEP('Ingrese una clave numérica válida', 'warning');
        return;
    }

    // Duplicado
    for (let c = 0; c < epCubetas; c++) {
        if (epMatriz[c].includes(clave) || epColisiones[c].includes(clave)) {
            mostrarMensajeEP(`La clave "${clave}" ya existe en la estructura`, 'warning');
            return;
        }
    }

    input.value = '';
    epOrdenInsert.push(clave);

    const k   = parseInt(clave, 10);
    const col = k % epCubetas;
    const res = insertarEnMatrizEP(clave);

    const { ocupados, total, porcentaje } = calcularDO_EP();

    renderizarEP();
    actualizarDescripcionEP();
    epAnimEnCurso = true;

    epTimeouts.push(setTimeout(() => {
        let celda;
        if (!res.colision) {
            celda = document.querySelector(`#visualizacionExpParcial .cubeta-celda[data-col="${res.col}"][data-row="${res.row}"]`);
        } else {
            celda = document.querySelector(`#visualizacionExpParcial .cubeta-celda[data-col="${res.col}"][data-colrow="${res.colIdx}"]`);
        }
        const header = document.querySelector(`#visualizacionExpParcial .cubeta-header[data-col="${res.col}"]`);
        if (header) header.classList.add('cubeta-header-activa');
        if (celda) celda.classList.add('cubeta-insertada');

        const colisionMsg = res.colision
            ? ` — <span class="text-danger fw-bold">¡Colisión! Cubeta ${col} llena, desbordamiento #${res.colIdx + 1}</span>`
            : '';

        epTimeouts.push(setTimeout(() => {
            mostrarMensajeEP(
                `D.O. = ${ocupados}/${total} = <strong>${(porcentaje * 100).toFixed(1)} %</strong><br>` +
                `H(${clave}) = ${clave} mod ${epCubetas} = <strong>${col}</strong> → Cubeta ${col}${colisionMsg}`,
                res.colision ? 'warning' : 'success'
            );

            if (porcentaje >= 0.75) {
                epTimeouts.push(setTimeout(() => {
                    const prevN = epCubetas;
                    const incremento = Math.floor(prevN / 2);
                    expandirParcial();
                    renderizarEP();
                    actualizarDescripcionEP();

                    const { ocupados: o2, total: t2, porcentaje: p2 } = calcularDO_EP();
                    mostrarMensajeEP(
                        `H(${clave}) = ${clave} mod ${prevN} = <strong>${col}</strong> → Cubeta ${col}${colisionMsg}<br>` +
                        `D.O. alcanzó <strong>${(porcentaje * 100).toFixed(1)} %</strong> (≥ 75 %) → ` +
                        `<span class="text-primary fw-bold">Expansión Parcial: ${prevN} + ${incremento} = ${epCubetas} cubetas</span><br>` +
                        `Nueva D.O. = ${o2}/${t2} = <strong>${(p2 * 100).toFixed(1)} %</strong>. ` +
                        `Se re-insertaron ${epOrdenInsert.length} claves con H(k) = k mod ${epCubetas}.`,
                        'info'
                    );

                    document.querySelectorAll('#visualizacionExpParcial .cubeta-ocupada').forEach(c => {
                        c.classList.add('cubeta-insertada');
                    });

                    epTimeouts.push(setTimeout(() => {
                        document.querySelectorAll('#visualizacionExpParcial .cubeta-insertada').forEach(c => {
                            c.classList.remove('cubeta-insertada');
                        });
                        epAnimEnCurso = false;
                    }, 1200));
                }, 800));
            } else {
                epTimeouts.push(setTimeout(() => {
                    if (celda) celda.classList.remove('cubeta-insertada');
                    if (header) header.classList.remove('cubeta-header-activa');
                    epAnimEnCurso = false;
                }, 1000));
            }
        }, 350));
    }, 100));
}

// ==================== LIMPIAR ====================

function limpiarExpParcial() {
    if (!confirm('¿Limpiar la estructura y volver al tamaño original?')) return;
    limpiarTimeoutsEP();
    crearEstructuraEP(epCubetasOrig, epRegistros, false);
    renderizarEP();
    actualizarDescripcionEP();
    document.getElementById('claveExpParcial').value = '';
    mostrarMensajeEP(`Estructura reiniciada a ${epCubetasOrig} cubetas × ${epRegistros} registros`, 'success');
}

// ==================== GUARDAR / CARGAR ====================

function guardarExpParcial() {
    const datos = JSON.stringify({
        tipo: 'expParcial',
        cubetas: epCubetas,
        cubetasOrig: epCubetasOrig,
        registros: epRegistros,
        matriz: epMatriz,
        colisiones: epColisiones,
        ordenInsert: epOrdenInsert
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'expansion_parcial.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeEP('Estructura guardada correctamente', 'success');
}

function cargarExpParcial() {
    document.getElementById('fileInputExpParcial').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fileInputExpParcial').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const d = JSON.parse(ev.target.result);
                if (d.tipo !== 'expParcial') throw new Error('Formato inválido');
                epCubetas     = d.cubetas;
                epCubetasOrig = d.cubetasOrig;
                epRegistros   = d.registros;
                epMatriz      = d.matriz;
                epColisiones  = d.colisiones;
                epOrdenInsert = d.ordenInsert;
                epInicializado = true;
                document.getElementById('cubetasExpParcial').value   = epCubetasOrig;
                document.getElementById('registrosExpParcial').value = epRegistros;
                document.getElementById('expParcialControles').classList.remove('d-none');
                renderizarEP();
                actualizarDescripcionEP();
                mostrarMensajeEP('Estructura cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeEP('Error al cargar: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
});

