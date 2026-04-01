/**
 * Simulador CC2 - Búsquedas por Índices: Un Nivel
 * Índice Primario (no denso): ri = b  → una entrada por bloque de datos.
 * Índice Secundario (denso):  ri = r  → una entrada por registro de datos.
 * Accesos con índice: ⌈log₂(bi)⌉ + 1
 * Accesos sin índice: ⌈log₂(b)⌉
 */

// ==================== VARIABLES GLOBALES ====================
let unNivelParams = null;   // objeto con todos los cálculos del último "Crear"
let unNivelInicializado = false;

// ==================== UTILIDADES ====================

function mostrarMensajeUnNivel(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeUnNivel');
    if (!alertDiv) return;
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function ocultarMensajeUnNivel() {
    const alertDiv = document.getElementById('mensajeUnNivel');
    if (alertDiv) alertDiv.classList.add('d-none');
}

/** ⌊x⌋ */
function piso(x) { return Math.floor(x); }

/** ⌈x⌉ */
function techo(x) { return Math.ceil(x); }

/**
 * Calcula todos los parámetros del índice de un nivel.
 * @param {string} tipo  'primario' | 'secundario'
 * @param {number} r     registros del archivo
 * @param {number} B     bytes por bloque en disco
 * @param {number} R     bytes por registro dato
 * @param {number} Ri    bytes por registro índice (V+P)
 * @returns {object}
 */
function calcularUnNivel(tipo, r, B, R, Ri) {
    const bfr  = piso(B / R);                   // reg. dato por bloque
    const b    = techo(r / bfr);                // bloques datos
    const bfri = piso(B / Ri);                  // reg. índice por bloque
    const ri   = tipo === 'primario' ? b : r;   // entradas índice
    const bi   = techo(ri / bfri);              // bloques índice

    const accesosSinIndice  = techo(Math.log2(b));           // búsqueda binaria s/índice
    const accesosConIndice  = techo(Math.log2(bi)) + 1;      // búsqueda binaria en índice + 1 dato

    return { tipo, r, B, R, Ri, bfr, b, bfri, ri, bi, accesosSinIndice, accesosConIndice };
}

// ==================== CREAR ESTRUCTURA ====================

function crearUnNivel() {
    ocultarMensajeUnNivel();

    const tipo = document.getElementById('tipoIndiceUnNivel').value;
    const r  = parseInt(document.getElementById('rUnNivel').value);
    const B  = parseInt(document.getElementById('BUnNivel').value);
    const R  = parseInt(document.getElementById('RUnNivel').value);
    const Ri = parseInt(document.getElementById('RiUnNivel').value);

    // Validaciones
    if (!r || !B || !R || !Ri || r < 1 || B < 1 || R < 1 || Ri < 1) {
        mostrarMensajeUnNivel('Complete todos los campos con valores positivos.', 'warning');
        return;
    }
    if (R > B) {
        mostrarMensajeUnNivel('El registro dato (R) no puede ser mayor que el bloque (B).', 'warning');
        return;
    }
    if (Ri > B) {
        mostrarMensajeUnNivel('El registro índice (Ri) no puede ser mayor que el bloque (B).', 'warning');
        return;
    }

    unNivelParams = calcularUnNivel(tipo, r, B, R, Ri);
    unNivelInicializado = true;

    // Descripción
    const tipoLabel = tipo === 'primario' ? 'Primario (no denso)' : 'Secundario (denso)';
    const riExpl    = tipo === 'primario'
        ? `ri = b = <strong>${unNivelParams.b}</strong> (una entrada por bloque de datos)`
        : `ri = r = <strong>${unNivelParams.r}</strong> (una entrada por registro)`;

    document.getElementById('descripcionUnNivel').innerHTML =
        `<strong>Índice ${tipoLabel}:</strong> ${riExpl}. 
         bfri = ⌊${B}/${Ri}⌋ = <strong>${unNivelParams.bfri}</strong> registros índice/bloque → 
         bi = ⌈${unNivelParams.ri}/${unNivelParams.bfri}⌉ = <strong>${unNivelParams.bi}</strong> bloques de índice.`;

    document.getElementById('unNivelControles').classList.remove('d-none');
    document.getElementById('tablaUnNivel').classList.remove('d-none');

    renderizarTablaUnNivel(unNivelParams);
    renderizarVisualizacionUnNivel(unNivelParams);
    mostrarMensajeUnNivel('Estructura creada correctamente.', 'success');
}

// ==================== TABLA DE CÁLCULOS ====================

function renderizarTablaUnNivel(p) {
    const tipoLabel = p.tipo === 'primario' ? 'Primario' : 'Secundario';
    const tabla = document.getElementById('tablaCalcUnNivel');

    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Parámetro</th>
                <th>Fórmula</th>
                <th>Sustitución</th>
                <th>Resultado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>bfr (reg. dato/bloque)</td>
                <td>⌊B / R⌋</td>
                <td>⌊${p.B} / ${p.R}⌋</td>
                <td><strong>${p.bfr}</strong></td>
            </tr>
            <tr>
                <td>b (bloques datos)</td>
                <td>⌈r / bfr⌉</td>
                <td>⌈${p.r} / ${p.bfr}⌉</td>
                <td><strong>${p.b}</strong></td>
            </tr>
            <tr>
                <td>bfri (reg. índice/bloque)</td>
                <td>⌊B / Ri⌋</td>
                <td>⌊${p.B} / ${p.Ri}⌋</td>
                <td><strong>${p.bfri}</strong></td>
            </tr>
            <tr>
                <td>ri (entradas de índice)</td>
                <td>${p.tipo === 'primario' ? 'ri = b' : 'ri = r'}</td>
                <td>${p.tipo === 'primario' ? `b = ${p.b}` : `r = ${p.r}`}</td>
                <td><strong>${p.ri}</strong></td>
            </tr>
            <tr>
                <td>bi (bloques índice)</td>
                <td>⌈ri / bfri⌉</td>
                <td>⌈${p.ri} / ${p.bfri}⌉</td>
                <td><strong>${p.bi}</strong></td>
            </tr>
            <tr class="fila-resultado">
                <td>Accesos <em>sin</em> índice</td>
                <td>⌈log₂(b)⌉</td>
                <td>⌈log₂(${p.b})⌉ = ⌈${Math.log2(p.b).toFixed(4)}⌉</td>
                <td><strong>${p.accesosSinIndice}</strong></td>
            </tr>
            <tr class="fila-accesos">
                <td>Accesos <em>con</em> índice ${tipoLabel}</td>
                <td>⌈log₂(bi)⌉ + 1</td>
                <td>⌈log₂(${p.bi})⌉ + 1 = ⌈${Math.log2(p.bi).toFixed(4)}⌉ + 1</td>
                <td><strong>${p.accesosConIndice}</strong></td>
            </tr>
        </tbody>
    `;
}

// ==================== VISUALIZACIÓN ====================

function calcularRangoBloque(indiceBloque, capacidadPorBloque, totalRegistros) {
    const inicio = (indiceBloque * capacidadPorBloque) + 1;
    const finPotencial = (indiceBloque + 1) * capacidadPorBloque;
    const usados = Math.max(0, Math.min(capacidadPorBloque, totalRegistros - inicio + 1));
    const finReal = usados > 0 ? (inicio + usados - 1) : null;
    return {
        inicio,
        finReal,
        finPotencial,
        usados,
        capacidad: capacidadPorBloque,
        sobrantes: Math.max(0, capacidadPorBloque - usados)
    };
}

function construirFilasResumen(rango, etiqueta, anclas = new Set()) {
    if (!rango || rango.usados <= 0) {
        return [{ idx: '-', valor: 'Sin registros', vacia: true }];
    }

    const filas = [];
    const segundo = Math.min(rango.inicio + 1, rango.finReal);
    const pushReal = (clave) => {
        filas.push({
            idx: clave,
            valor: `${etiqueta} ${clave}`,
            key: clave,
            ancla: anclas.has(clave)
        });
    };

    pushReal(rango.inicio);
    if (segundo !== rango.inicio) pushReal(segundo);
    if (rango.finReal - rango.inicio > 2) filas.push({ idx: '...', valor: '...', vacia: true });
    if (rango.finReal !== segundo && rango.finReal !== rango.inicio) pushReal(rango.finReal);

    if (rango.sobrantes > 0) {
        filas.push({
            idx: `${rango.finReal + 1} - ${rango.finPotencial}`,
            valor: `${etiqueta} sin uso`,
            overflow: true,
            vacia: true
        });
    }

    return filas;
}

function obtenerIndicesBloquesVisuales(totalBloques, bloquesClave = []) {
    if (totalBloques <= 0) return [];
    const base = [0, 1, totalBloques - 1, ...bloquesClave]
        .filter((idx) => idx >= 0 && idx < totalBloques);
    return [...new Set(base)].sort((a, b) => a - b);
}

function generarColumna(titulo, totalBloques, labelColor, capacidadPorBloque, totalRegistros, etiquetaFila, rolColumna, bloquesClave = [], anclas = new Set()) {
    const indicesVisuales = obtenerIndicesBloquesVisuales(totalBloques, bloquesClave);
    let html = `<div class="indices-columna">`;
    html += `<div class="indices-columna-titulo">${titulo}</div>`;
    html += `<div class="nivel-label ${labelColor}">${totalBloques} bloque${totalBloques !== 1 ? 's' : ''}</div>`;
    html += `<div class="indices-bloques-stack">`;

    indicesVisuales.forEach((indiceBloque, posicion) => {
        const rango = calcularRangoBloque(indiceBloque, capacidadPorBloque, totalRegistros);
        const filas = construirFilasResumen(rango, etiquetaFila, anclas);

        html += `<div class="indices-bloque">`;
        html += `<div class="indices-bloque-header">B${indiceBloque + 1}</div>`;
        html += `<div class="indices-bloque-body">`;

        filas.forEach((fila) => {
            const claseOverflow = fila.overflow ? 'celda-overflow' : '';
            const claseAncla = fila.ancla ? 'celda-ancla' : '';
            const dataKey = Number.isInteger(fila.key)
                ? `data-col-role="${rolColumna}" data-key="${fila.key}" data-block="${indiceBloque + 1}"`
                : '';
            html += `<div class="indices-celda ${fila.vacia ? 'celda-vacia' : ''} ${claseOverflow} ${claseAncla}" ${dataKey}>
                        <span class="indices-celda-idx">${fila.idx}</span>
                        <span class="indices-celda-valor">${fila.valor}</span>
                     </div>`;
        });

        html += `</div></div>`;

        const siguiente = indicesVisuales[posicion + 1];
        if (siguiente !== undefined && siguiente - indiceBloque > 1) {
            html += `<div class="indices-bloque indices-bloque-resumen">`;
            html += `<div class="indices-bloque-body">`;
            html += `<div class="indices-ellipsis-vertical" aria-label="Bloques omitidos">`;
            html += `<span>•</span><span>•</span><span>•</span>`;
            html += `</div>`;
            html += `</div></div>`;
        }

    });

    html += `</div>`;

    html += `</div>`;
    return html;
}

function generarConector(label) {
    return `<div class="indices-conector">
                <div class="indices-flecha">→</div>
                <div class="indices-flecha-label">${label}</div>
            </div>`;
}

function renderizarVisualizacionUnNivel(p) {
    const container = document.getElementById('visualizacionUnNivel');
    if (!container) return;

    const clavesIndice = [
        1,
        Math.min(p.bfri, p.ri),
        p.ri
    ].filter((k) => k >= 1);

    const bloqueDatoDesdeClaveIndice = (claveIndice) => {
        if (p.tipo === 'primario') return claveIndice;
        return Math.ceil(claveIndice / p.bfr);
    };

    const clavesDatos = [...new Set(clavesIndice.map((claveIndice) => {
        if (p.tipo === 'secundario') return claveIndice;
        const bloqueDato = bloqueDatoDesdeClaveIndice(claveIndice);
        return ((bloqueDato - 1) * p.bfr) + 1;
    }))];

    const bloquesIndiceClave = clavesIndice.map((k) => Math.ceil(k / p.bfri) - 1);
    const bloquesDatosClave = clavesDatos.map((k) => Math.ceil(k / p.bfr) - 1);

    let html = `<div class="indices-diagrama-wrapper"><div class="indices-diagrama">`;

    // Columna índice
    html += generarColumna(
        `Est. Índice${p.tipo === 'primario' ? ' (no denso)' : ' (denso)'}`,
        p.bi,
        'nivel-base',
        p.bfri,
        p.ri,
        'Reg',
        'indice',
        bloquesIndiceClave,
        new Set(clavesIndice)
    );

    html += generarConector('puntero');

    // Columna datos
    html += generarColumna(
        'Est. Datos',
        p.b,
        'nivel-datos',
        p.bfr,
        p.r,
        'Reg',
        'datos',
        bloquesDatosClave,
        new Set(clavesDatos)
    );

    html += `</div></div>`;

    // Resumen de accesos
    html += `<div class="indices-resumen-accesos">
        <div class="indices-accesos-badge indices-accesos-sin-indice">
            Sin índice: ${p.accesosSinIndice} acceso${p.accesosSinIndice !== 1 ? 's' : ''}
        </div>
        <div class="indices-accesos-badge">
            Con índice ${p.tipo}: ${p.accesosConIndice} acceso${p.accesosConIndice !== 1 ? 's' : ''}
        </div>
    </div>`;

    container.innerHTML = html;
    dibujarFlechasUnNivel(container, clavesIndice, bloqueDatoDesdeClaveIndice, p.bfr, p.tipo);
}

function dibujarFlechasUnNivel(container, clavesIndice, bloqueDatoDesdeClaveIndice, bfr, tipoIndice) {
    if (!window.d3) return;
    const wrapper = container.querySelector('.indices-diagrama-wrapper');
    if (!wrapper) return;

    const diagrama = wrapper.querySelector('.indices-diagrama');
    if (!diagrama) return;

    const conexiones = [];
    const clavesUnicas = [...new Set(clavesIndice)];
    clavesUnicas.forEach((claveIndice, idx) => {
        const bloqueDato = bloqueDatoDesdeClaveIndice(claveIndice);
        const claveDato = tipoIndice === 'secundario'
            ? claveIndice
            : ((bloqueDato - 1) * bfr) + 1;
        conexiones.push({
            sourceSelector: `[data-col-role="indice"][data-key="${claveIndice}"]`,
            targetSelector: `[data-col-role="datos"][data-key="${claveDato}"]`,
            alterna: idx === 1,
            sinPunta: true
        });
    });

    dibujarConexionesD3(wrapper, diagrama, conexiones);
}

function dibujarConexionesD3(wrapper, diagrama, conexiones) {
    if (!window.d3) return;

    if (diagrama.__indicesScrollHandler) {
        diagrama.removeEventListener('scroll', diagrama.__indicesScrollHandler);
    }
    if (window.__indicesResizeHandler) {
        window.removeEventListener('resize', window.__indicesResizeHandler);
    }

    const renderizarLineas = () => {
        d3.select(wrapper).selectAll('svg.indices-svg-conexiones').remove();

        const width = diagrama.scrollWidth;
        const height = diagrama.scrollHeight;
        const svg = d3.select(wrapper)
            .append('svg')
            .attr('class', 'indices-svg-conexiones')
            .attr('width', width)
            .attr('height', height);

        const defs = svg.append('defs');
        defs.append('marker')
            .attr('id', 'indices-arrowhead')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 9)
            .attr('refY', 0)
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#5B9BD5');

        const wrapperRect = wrapper.getBoundingClientRect();
        conexiones.forEach((conn) => {
            const sourceEl = diagrama.querySelector(conn.sourceSelector);
            const targetEl = diagrama.querySelector(conn.targetSelector);
            if (!sourceEl || !targetEl) return;

            const s = sourceEl.getBoundingClientRect();
            const t = targetEl.getBoundingClientRect();
            const x1 = (s.right - wrapperRect.left) + diagrama.scrollLeft;
            const y1 = (s.top - wrapperRect.top) + (s.height / 2) + diagrama.scrollTop;
            const x2 = (t.left - wrapperRect.left) + diagrama.scrollLeft;
            const y2 = (t.top - wrapperRect.top) + (t.height / 2) + diagrama.scrollTop;
            const curva = Math.max(30, (x2 - x1) * 0.35);

            const path = svg.append('path')
                .attr('class', `indices-linea-conexion ${conn.alterna ? 'alt' : ''}`)
                .attr('d', `M ${x1} ${y1} C ${x1 + curva} ${y1}, ${x2 - curva} ${y2}, ${x2} ${y2}`);

            if (!conn.sinPunta) {
                path.attr('marker-end', 'url(#indices-arrowhead)');
            }
        });
    };

    renderizarLineas();
    const handler = () => renderizarLineas();
    diagrama.__indicesScrollHandler = handler;
    window.__indicesResizeHandler = handler;
    diagrama.addEventListener('scroll', handler);
    window.addEventListener('resize', handler);
}

// ==================== GUARDAR / CARGAR ====================

function guardarUnNivel() {
    if (!unNivelInicializado || !unNivelParams) {
        mostrarMensajeUnNivel('No hay estructura para guardar. Primero cree una.', 'warning');
        return;
    }

    const datos = JSON.stringify({
        tipo_archivo: 'indice_un_nivel',
        params: unNivelParams
    }, null, 2);

    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indice_un_nivel_${unNivelParams.tipo}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeUnNivel('Estructura guardada correctamente.', 'success');
}

function cargarUnNivel() {
    document.getElementById('fileInputUnNivel').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    // Cargar archivo
    document.getElementById('fileInputUnNivel').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const datos = JSON.parse(ev.target.result);
                if (datos.tipo_archivo !== 'indice_un_nivel') throw new Error('Formato inválido');

                const p = datos.params;
                // Restaurar campos
                document.getElementById('tipoIndiceUnNivel').value = p.tipo;
                document.getElementById('rUnNivel').value = p.r;
                document.getElementById('BUnNivel').value = p.B;
                document.getElementById('RUnNivel').value = p.R;
                document.getElementById('RiUnNivel').value = p.Ri;

                unNivelParams = p;
                unNivelInicializado = true;

                document.getElementById('unNivelControles').classList.remove('d-none');
                document.getElementById('tablaUnNivel').classList.remove('d-none');

                const tipoLabel = p.tipo === 'primario' ? 'Primario (no denso)' : 'Secundario (denso)';
                document.getElementById('descripcionUnNivel').innerHTML =
                    `<strong>Índice ${tipoLabel}:</strong> Estructura cargada desde archivo.`;

                renderizarTablaUnNivel(p);
                renderizarVisualizacionUnNivel(p);
                mostrarMensajeUnNivel('Estructura cargada correctamente.', 'success');
            } catch (err) {
                mostrarMensajeUnNivel('Error al cargar el archivo: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // Ocultar bienvenida al cambiar tab
    const tabs = document.querySelectorAll('#busquedasIndTabs button[data-bs-toggle="pill"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function () {
            const bienvenida = document.getElementById('panel-bienvenida-ind');
            if (bienvenida) bienvenida.style.display = 'none';
        });
    });
});