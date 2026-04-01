/**
 * Simulador CC2 - Búsquedas por Índices: Multinivel
 * Construcción iterativa de niveles: cada nivel es un índice disperso del anterior.
 * Nivel 1: bfri (= fo = fanout) bloques; se itera hasta llegar a 1 bloque.
 * t = ⌈log_fo(ri_base)⌉  niveles   →   Accesos = t + 1
 *
 * Primario  → ri base = b   (bloques de datos)
 * Secundario → ri base = r   (registros totales)
 */

// ==================== VARIABLES GLOBALES ====================
let multiNivelParams  = null;   // resultado completo del último "Crear"
let multiNivelInicializado = false;

// ==================== UTILIDADES ====================

function mostrarMensajeMultinivel(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeMultinivel');
    if (!alertDiv) return;
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function ocultarMensajeMultinivel() {
    const alertDiv = document.getElementById('mensajeMultinivel');
    if (alertDiv) alertDiv.classList.add('d-none');
}

/**
 * Construye todos los niveles del índice multinivel.
 * Devuelve el objeto completo con params y array de niveles.
 */
function calcularMultinivel(tipo, r, B, R, Ri) {
    const bfr  = Math.floor(B / R);
    const b    = Math.ceil(r / bfr);
    const bfri = Math.floor(B / Ri);       // fanout (fo)
    const fo   = bfri;

    // ri_base: entradas que alimentan el nivel 1
    const riBase = tipo === 'primario' ? b : r;

    // Construir niveles iterativamente
    // Nivel 1 = índice del archivo base, Nivel 2 = índice del nivel 1, etc.
    const niveles = [];
    let riActual = riBase;

    while (true) {
        const bloques = Math.ceil(riActual / fo);
        niveles.push({ riEntradas: riActual, bloques });
        if (bloques <= 1) break;
        riActual = bloques;
    }

    const t = niveles.length;

    // Cálculo exacto de t también con logaritmo
    const tLog  = Math.log(riBase) / Math.log(fo);
    const accesos = t + 1; // t niveles + 1 acceso a datos

    // Accesos sin índice (para comparar)
    const accesosSinIndice = Math.ceil(Math.log2(b));

    return {
        tipo, r, B, R, Ri,
        bfr, b, bfri, fo,
        riBase,
        niveles,   // array [{riEntradas, bloques}, ...]
        t,
        tLog,
        accesos,
        accesosSinIndice
    };
}

// ==================== CREAR ESTRUCTURA ====================

function crearMultinivel() {
    ocultarMensajeMultinivel();

    const tipo = document.getElementById('tipoIndiceMultinivel').value;
    const r    = parseInt(document.getElementById('rMultinivel').value);
    const B    = parseInt(document.getElementById('BMultinivel').value);
    const R    = parseInt(document.getElementById('RMultinivel').value);
    const Ri   = parseInt(document.getElementById('RiMultinivel').value);

    if (!r || !B || !R || !Ri || r < 1 || B < 1 || R < 1 || Ri < 1) {
        mostrarMensajeMultinivel('Complete todos los campos con valores positivos.', 'warning');
        return;
    }
    if (R > B) {
        mostrarMensajeMultinivel('El registro dato (R) no puede ser mayor que el bloque (B).', 'warning');
        return;
    }
    if (Ri > B) {
        mostrarMensajeMultinivel('El registro índice (Ri) no puede ser mayor que el bloque (B).', 'warning');
        return;
    }

    multiNivelParams = calcularMultinivel(tipo, r, B, R, Ri);
    multiNivelInicializado = true;

    const tipoLabel = tipo === 'primario' ? 'Primario (no denso)' : 'Secundario (denso)';

    document.getElementById('descripcionMultinivel').innerHTML =
        `<strong>Índice Multinivel ${tipoLabel}:</strong> 
         fo = bfri = ⌊${B}/${Ri}⌋ = <strong>${multiNivelParams.fo}</strong>. 
         ri base = <strong>${multiNivelParams.riBase}</strong>. 
         t = ⌈log<sub>${multiNivelParams.fo}</sub>(${multiNivelParams.riBase})⌉ 
           = ⌈${multiNivelParams.tLog.toFixed(4)}⌉ 
           = <strong>${multiNivelParams.t} niveles</strong>. 
         Accesos = t + 1 = <strong>${multiNivelParams.accesos}</strong>.`;

    document.getElementById('multiNivelControles').classList.remove('d-none');
    document.getElementById('tablaMultinivel').classList.remove('d-none');

    renderizarTablaMultinivel(multiNivelParams);
    renderizarVisualizacionMultinivel(multiNivelParams);
    mostrarMensajeMultinivel('Estructura multinivel creada correctamente.', 'success');
}

// ==================== TABLA DE CÁLCULOS ====================

function renderizarTablaMultinivel(p) {
    const tipoLabel = p.tipo === 'primario' ? 'Primario' : 'Secundario';
    const tabla = document.getElementById('tablaCalcMultinivel');

    let filasPrevias = `
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
            <td>bfri = fo (fanout)</td>
            <td>⌊B / Ri⌋</td>
            <td>⌊${p.B} / ${p.Ri}⌋</td>
            <td><strong>${p.bfri}</strong></td>
        </tr>
        <tr>
            <td>ri base (entradas 1er nivel)</td>
            <td>${p.tipo === 'primario' ? 'ri = b' : 'ri = r'}</td>
            <td>${p.tipo === 'primario' ? `b = ${p.b}` : `r = ${p.r}`}</td>
            <td><strong>${p.riBase}</strong></td>
        </tr>
    `;

    // Filas por nivel
    let filasNiveles = p.niveles.map((niv, idx) => {
        return `
            <tr>
                <td>bi nivel ${idx + 1} (bloques)</td>
                <td>⌈ri / fo⌉</td>
                <td>⌈${niv.riEntradas} / ${p.fo}⌉ = ⌈${(niv.riEntradas / p.fo).toFixed(4)}⌉</td>
                <td><strong>${niv.bloques}</strong></td>
            </tr>
        `;
    }).join('');

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
            ${filasPrevias}
            ${filasNiveles}
            <tr class="fila-resultado">
                <td>t (niveles)</td>
                <td>⌈log<sub>fo</sub>(ri base)⌉</td>
                <td>⌈log<sub>${p.fo}</sub>(${p.riBase})⌉ = ⌈${p.tLog.toFixed(4)}⌉</td>
                <td><strong>${p.t}</strong></td>
            </tr>
            <tr class="fila-resultado">
                <td>Accesos <em>sin</em> índice</td>
                <td>⌈log₂(b)⌉</td>
                <td>⌈log₂(${p.b})⌉ = ⌈${Math.log2(p.b).toFixed(4)}⌉</td>
                <td><strong>${p.accesosSinIndice}</strong></td>
            </tr>
            <tr class="fila-accesos">
                <td>Accesos <em>con</em> índice ${tipoLabel} Multinivel</td>
                <td>t + 1</td>
                <td>${p.t} + 1</td>
                <td><strong>${p.accesos}</strong></td>
            </tr>
        </tbody>
    `;
}

// ==================== VISUALIZACIÓN ====================

/**
 * Genera una columna de bloques para la visualización multinivel.
 */
function calcularRangoBloqueMulti(indiceBloque, capacidadPorBloque, totalRegistros) {
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

function construirFilasResumenMulti(rango, etiqueta, anclas = new Set()) {
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

function obtenerIndicesBloquesVisualesMulti(totalBloques, bloquesClave = []) {
    if (totalBloques <= 0) return [];
    const base = [0, 1, totalBloques - 1, ...bloquesClave]
        .filter((idx) => idx >= 0 && idx < totalBloques);
    return [...new Set(base)].sort((a, b) => a - b);
}

function generarColumnaMulti(titulo, totalBloques, labelClass, capacidadPorBloque, totalRegistros, rolColumna, nivel, bloquesClave = [], anclas = new Set()) {
    const indicesVisuales = obtenerIndicesBloquesVisualesMulti(totalBloques, bloquesClave);
    let html = `<div class="indices-columna">`;
    html += `<div class="indices-columna-titulo">${titulo}</div>`;
    html += `<div class="nivel-label ${labelClass}">${totalBloques} blq.</div>`;
    html += `<div class="indices-bloques-stack">`;

    indicesVisuales.forEach((indiceBloque, posicion) => {
        const rango = calcularRangoBloqueMulti(indiceBloque, capacidadPorBloque, totalRegistros);
        const etiqueta = 'Reg';
        const filas = construirFilasResumenMulti(rango, etiqueta, anclas);

        html += `<div class="indices-bloque">`;
        html += `<div class="indices-bloque-header">B${indiceBloque + 1}</div>`;
        html += `<div class="indices-bloque-body">`;

        filas.forEach((fila) => {
            const claseOverflow = fila.overflow ? 'celda-overflow' : '';
            const claseAncla = fila.ancla ? 'celda-ancla' : '';
            const dataKey = Number.isInteger(fila.key)
                ? `data-col-role="${rolColumna}" data-level="${nivel}" data-key="${fila.key}" data-block="${indiceBloque + 1}"`
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

function generarConectorMulti(label) {
    return `<div class="indices-conector">
                <div class="indices-flecha">→</div>
                <div class="indices-flecha-label">${label}</div>
            </div>`;
}

function renderizarVisualizacionMultinivel(p) {
    const container = document.getElementById('visualizacionMultinivel');
    if (!container) return;

    // Los niveles están ordenados de 1 (más cercano a datos) a t (raíz).
    // Para la visualización dibujamos de derecha a izquierda conceptualmente,
    // pero en el DOM ponemos: nivel_t (raíz) → nivel_{t-1} → ... → nivel_1 → datos
    const nivelesVisuales = [...p.niveles].reverse(); // índice más alto (raíz) primero

    const bloquesClavePorNivel = {};
    const anclasPorNivel = {};
    const registrarBloque = (nivel, idx) => {
        if (!bloquesClavePorNivel[nivel]) bloquesClavePorNivel[nivel] = new Set();
        bloquesClavePorNivel[nivel].add(idx);
    };
    const registrarAncla = (nivel, key) => {
        if (!anclasPorNivel[nivel]) anclasPorNivel[nivel] = new Set();
        anclasPorNivel[nivel].add(key);
    };

    const conexiones = [];

    // Conexiones entre niveles de índice
    for (let nivel = p.t; nivel >= 2; nivel--) {
        const src = p.niveles[nivel - 1];
        const claves = [...new Set([1, Math.min(p.fo, src.riEntradas), src.riEntradas].filter((k) => k >= 1))];
        claves.forEach((clave, idx) => {
            const bloqueDestino = clave;
            const claveDestino = ((bloqueDestino - 1) * p.fo) + 1;

            registrarBloque(`idx-${nivel}`, Math.ceil(clave / p.fo) - 1);
            registrarBloque(`idx-${nivel - 1}`, bloqueDestino - 1);
            registrarAncla(`idx-${nivel}`, clave);
            registrarAncla(`idx-${nivel - 1}`, claveDestino);

            conexiones.push({
                sourceSelector: `[data-col-role="indice"][data-level="idx-${nivel}"][data-key="${clave}"]`,
                targetSelector: `[data-col-role="indice"][data-level="idx-${nivel - 1}"][data-key="${claveDestino}"]`,
                alterna: idx === 1
            });
        });
    }

    // Conexiones nivel 1 -> datos
    const nivelBase = p.niveles[0];
    const clavesBase = [...new Set([1, Math.min(p.fo, nivelBase.riEntradas), nivelBase.riEntradas].filter((k) => k >= 1))];
    clavesBase.forEach((clave, idx) => {
        const bloqueDato = p.tipo === 'primario' ? clave : Math.ceil(clave / p.bfr);
        const claveDato = p.tipo === 'secundario'
            ? clave
            : ((bloqueDato - 1) * p.bfr) + 1;

        registrarBloque('idx-1', Math.ceil(clave / p.fo) - 1);
        registrarBloque('datos', bloqueDato - 1);
        registrarAncla('idx-1', clave);
        registrarAncla('datos', claveDato);

        conexiones.push({
            sourceSelector: `[data-col-role="indice"][data-level="idx-1"][data-key="${clave}"]`,
            targetSelector: `[data-col-role="datos"][data-level="datos"][data-key="${claveDato}"]`,
            alterna: idx === 1
        });
    });

    let html = `<div class="indices-diagrama-wrapper"><div class="indices-diagrama">`;

    nivelesVisuales.forEach((niv, idx) => {
        const nivelNum = p.t - idx;              // número de nivel real (t = raíz, 1 = base)
        const isRaiz   = nivelNum === p.t;
        const levelId = `idx-${nivelNum}`;
        const labelClass = isRaiz
            ? 'nivel-top'
            : (nivelNum === p.t - 1 ? 'nivel-mid' : 'nivel-base');

        html += generarColumnaMulti(
            isRaiz ? `Nivel ${nivelNum} (Raíz)` : `Nivel ${nivelNum}`,
            niv.bloques,
            labelClass,
            p.fo,
            niv.riEntradas,
            'indice',
            levelId,
            [...(bloquesClavePorNivel[levelId] || new Set())],
            anclasPorNivel[levelId] || new Set()
        );

        html += generarConectorMulti(isRaiz ? 'apunta a' : 'apunta a');
    });

    // Columna datos
    html += generarColumnaMulti(
        'Est. Datos',
        p.b,
        'nivel-datos',
        p.bfr,
        p.r,
        'datos',
        'datos',
        [...(bloquesClavePorNivel.datos || new Set())],
        anclasPorNivel.datos || new Set()
    );

    html += `</div></div>`;

    // Resumen de accesos
    html += `<div class="indices-resumen-accesos">
        <div class="indices-accesos-badge indices-accesos-sin-indice">
            Sin índice: ${p.accesosSinIndice} acceso${p.accesosSinIndice !== 1 ? 's' : ''}
        </div>
        <div class="indices-accesos-badge">
            Multinivel (${p.t} niveles): ${p.accesos} acceso${p.accesos !== 1 ? 's' : ''}
        </div>
    </div>`;

    container.innerHTML = html;
    if (typeof dibujarConexionesD3 === 'function') {
        const wrapper = container.querySelector('.indices-diagrama-wrapper');
        const diagrama = container.querySelector('.indices-diagrama');
        if (wrapper && diagrama) dibujarConexionesD3(wrapper, diagrama, conexiones);
    }
}

// ==================== GUARDAR / CARGAR ====================

function guardarMultinivel() {
    if (!multiNivelInicializado || !multiNivelParams) {
        mostrarMensajeMultinivel('No hay estructura para guardar. Primero cree una.', 'warning');
        return;
    }

    const datos = JSON.stringify({
        tipo_archivo: 'indice_multinivel',
        params: multiNivelParams
    }, null, 2);

    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indice_multinivel_${multiNivelParams.tipo}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeMultinivel('Estructura guardada correctamente.', 'success');
}

function cargarMultinivel() {
    document.getElementById('fileInputMultinivel').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    document.getElementById('fileInputMultinivel').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            try {
                const datos = JSON.parse(ev.target.result);
                if (datos.tipo_archivo !== 'indice_multinivel') throw new Error('Formato inválido');

                const p = datos.params;
                document.getElementById('tipoIndiceMultinivel').value = p.tipo;
                document.getElementById('rMultinivel').value = p.r;
                document.getElementById('BMultinivel').value = p.B;
                document.getElementById('RMultinivel').value = p.R;
                document.getElementById('RiMultinivel').value = p.Ri;

                multiNivelParams = p;
                multiNivelInicializado = true;

                document.getElementById('multiNivelControles').classList.remove('d-none');
                document.getElementById('tablaMultinivel').classList.remove('d-none');

                const tipoLabel = p.tipo === 'primario' ? 'Primario (no denso)' : 'Secundario (denso)';
                document.getElementById('descripcionMultinivel').innerHTML =
                    `<strong>Índice Multinivel ${tipoLabel}:</strong> Estructura cargada desde archivo.`;

                renderizarTablaMultinivel(p);
                renderizarVisualizacionMultinivel(p);
                mostrarMensajeMultinivel('Estructura cargada correctamente.', 'success');
            } catch (err) {
                mostrarMensajeMultinivel('Error al cargar el archivo: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
});