/**
 * Simulador CC2 - Módulo de Operaciones entre grafos
 * Implementa:
 * Operaciones en un grafo (fusión de vértices, adición/eliminación de vértices y aristas, contracción de aristas, complemento)
 * Operaciones entre dos grafos (unión, intersección, suma, producto cartesiano, producto tensorial, composición)
 */

const state = {
    un: {
        grafo: { vertices: [], aristas: [] },
        resultado: { vertices: [], aristas: [] }
    },
    dos: {
        g1: { vertices: [], aristas: [] },
        g2: { vertices: [], aristas: [] },
        resultado: { vertices: [], aristas: [] },
        operacionActual: ''
    }
};

function normalizarTexto(v) {
    return (v || '').trim();
}

function claveArista(u, v) {
    return [u, v].sort().join('||');
}

function verticeProducto(u, v) {
    return `${u}${v}`;
}

function clonarGrafo(g) {
    return {
        vertices: [...g.vertices],
        aristas: g.aristas.map((a) => ({ ...a }))
    };
}

function mostrarMensaje(id, mensaje, tipo) {
    const alert = document.getElementById(id);
    if (!alert) return;
    alert.className = `alert alert-${tipo}`;
    alert.textContent = mensaje;
    alert.classList.remove('d-none');
}

function ocultarMensaje(id) {
    const alert = document.getElementById(id);
    if (alert) alert.classList.add('d-none');
}

function descargarJSON(nombreArchivo, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
}

function limpiarInputsUnGrafo() {
    ['unVerticeNombre', 'unAristaNombre', 'unAristaInicio', 'unAristaFin'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function limpiarInputsDosGrafos() {
    [
        'dosV1Nombre', 'dosV2Nombre',
        'dosA1Nombre', 'dosA1Inicio', 'dosA1Fin',
        'dosA2Nombre', 'dosA2Inicio', 'dosA2Fin'
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
}

function limpiarUnGrafo() {
    if (!confirm('¿Limpiar el grafo actual y su resultado?')) return;
    state.un.grafo = { vertices: [], aristas: [] };
    limpiarResultadoUnGrafo();
    limpiarInputsUnGrafo();
    renderUnGrafo();
    mostrarMensaje('mensajeUnGrafo', 'Se limpió el grafo y el resultado.', 'success');
}

function limpiarDosGrafos() {
    if (!confirm('¿Limpiar G1, G2 y el resultado?')) return;
    state.dos.g1 = { vertices: [], aristas: [] };
    state.dos.g2 = { vertices: [], aristas: [] };
    limpiarResultadoDosGrafos();
    limpiarInputsDosGrafos();
    renderDosGrafos();
    mostrarMensaje('mensajeDosGrafos', 'Se limpiaron G1, G2 y el resultado.', 'success');
}

function guardarUnGrafo() {
    descargarJSON('operaciones_un_grafo.json', {
        tipo_archivo: 'operaciones_un_grafo',
        data: {
            grafo: state.un.grafo,
            resultado: state.un.resultado
        }
    });
    mostrarMensaje('mensajeUnGrafo', 'Archivo guardado correctamente.', 'success');
}

function guardarDosGrafos() {
    descargarJSON('operaciones_dos_grafos.json', {
        tipo_archivo: 'operaciones_dos_grafos',
        data: {
            g1: state.dos.g1,
            g2: state.dos.g2,
            resultado: state.dos.resultado,
            operacionActual: state.dos.operacionActual || ''
        }
    });
    mostrarMensaje('mensajeDosGrafos', 'Archivo guardado correctamente.', 'success');
}

function cargarUnGrafo() {
    const input = document.getElementById('fileInputUnGrafo');
    if (input) input.click();
}

function cargarDosGrafos() {
    const input = document.getElementById('fileInputDosGrafos');
    if (input) input.click();
}

function bindCargarUnGrafo() {
    const input = document.getElementById('fileInputUnGrafo');
    if (!input) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (parsed.tipo_archivo !== 'operaciones_un_grafo') throw new Error('Formato inválido para Un grafo');
                const d = parsed.data || {};
                state.un.grafo = clonarGrafo(d.grafo || { vertices: [], aristas: [] });
                state.un.resultado = clonarGrafo(d.resultado || { vertices: [], aristas: [] });
                limpiarInputsUnGrafo();
                renderUnGrafo();
                mostrarMensaje('mensajeUnGrafo', 'Archivo cargado correctamente.', 'success');
            } catch (err) {
                mostrarMensaje('mensajeUnGrafo', err.message, 'warning');
            }
        };
        reader.readAsText(file);
        input.value = '';
    });
}

function bindCargarDosGrafos() {
    const input = document.getElementById('fileInputDosGrafos');
    if (!input) return;
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const parsed = JSON.parse(ev.target.result);
                if (parsed.tipo_archivo !== 'operaciones_dos_grafos') throw new Error('Formato inválido para Dos grafos');
                const d = parsed.data || {};
                state.dos.g1 = clonarGrafo(d.g1 || { vertices: [], aristas: [] });
                state.dos.g2 = clonarGrafo(d.g2 || { vertices: [], aristas: [] });
                state.dos.resultado = clonarGrafo(d.resultado || { vertices: [], aristas: [] });
                state.dos.operacionActual = d.operacionActual || '';
                const select = document.getElementById('dosOperacion');
                if (select && state.dos.operacionActual) select.value = state.dos.operacionActual;
                limpiarInputsDosGrafos();
                renderDosGrafos();
                mostrarMensaje('mensajeDosGrafos', 'Archivo cargado correctamente.', 'success');
            } catch (err) {
                mostrarMensaje('mensajeDosGrafos', err.message, 'warning');
            }
        };
        reader.readAsText(file);
        input.value = '';
    });
}

function existeVertice(g, v) {
    return g.vertices.includes(v);
}

function existeAristaNombre(g, nombre) {
    return g.aristas.some((a) => a.nombre === nombre);
}

function existeAristaPar(g, u, v) {
    const k = claveArista(u, v);
    return g.aristas.some((a) => claveArista(a.inicio, a.fin) === k);
}

function agregarVertice(g, nombre) {
    const n = normalizarTexto(nombre);
    if (!n) throw new Error('Ingrese el nombre del vértice.');
    if (existeVertice(g, n)) throw new Error('El vértice ya existe.');
    g.vertices.push(n);
}

function eliminarVertice(g, nombre) {
    const n = normalizarTexto(nombre);
    if (!n) throw new Error('Ingrese el vértice a eliminar.');
    if (!existeVertice(g, n)) throw new Error('El vértice no existe.');
    g.vertices = g.vertices.filter((v) => v !== n);
    g.aristas = g.aristas.filter((a) => a.inicio !== n && a.fin !== n);
}

function agregarArista(g, nombre, inicio, fin) {
    const n = normalizarTexto(nombre);
    const u = normalizarTexto(inicio);
    const v = normalizarTexto(fin);

    if (!n || !u || !v) throw new Error('Complete nombre, inicio y fin de la arista.');
    if (!existeVertice(g, u) || !existeVertice(g, v)) throw new Error('Los vertices de la arista deben existir.');
    if (u === v) throw new Error('No se permiten bucles en esta simulación.');
    if (existeAristaNombre(g, n)) throw new Error('Ya existe una arista con ese nombre.');

    g.aristas.push({ nombre: n, inicio: u, fin: v });
}

function eliminarArista(g, nombre) {
    const n = normalizarTexto(nombre);
    if (!n) throw new Error('Ingrese el nombre de la arista a eliminar.');
    const antes = g.aristas.length;
    g.aristas = g.aristas.filter((a) => a.nombre !== n);
    if (antes === g.aristas.length) throw new Error('La arista no existe.');
}

function deduplicarAristasPorPar(g, prefijo = 'a') {
    const usadas = new Set();
    const aristas = [];
    let idx = 1;
    for (const a of g.aristas) {
        if (!existeVertice(g, a.inicio) || !existeVertice(g, a.fin)) continue;
        if (a.inicio === a.fin) continue;
        const k = claveArista(a.inicio, a.fin);
        if (usadas.has(k)) continue;
        usadas.add(k);
        const nombre = normalizarTexto(a.nombre) || `${prefijo}${idx++}`;
        aristas.push({ nombre, inicio: a.inicio, fin: a.fin });
    }
    g.aristas = aristas;
}

function grafoComplemento(g) {
    const r = { vertices: [...g.vertices], aristas: [] };
    const existentes = new Set(g.aristas.map((a) => claveArista(a.inicio, a.fin)));
    let i = 1;
    for (let x = 0; x < r.vertices.length; x += 1) {
        for (let y = x + 1; y < r.vertices.length; y += 1) {
            const u = r.vertices[x];
            const v = r.vertices[y];
            const k = claveArista(u, v);
            if (!existentes.has(k)) {
                r.aristas.push({ nombre: `c${i++}`, inicio: u, fin: v });
            }
        }
    }
    return r;
}

function fusionarVertices(g, v1, v2) {
    const a = normalizarTexto(v1);
    const b = normalizarTexto(v2);
    const n = `${a},${b}`;

    if (!a || !b) throw new Error('Complete los vértices.');
    if (a === b) throw new Error('Los vértices deben ser diferentes.');
    if (!existeVertice(g, a) || !existeVertice(g, b)) throw new Error('Los vértices a fusionar deben existir.');
    if (existeVertice(g, n) && n !== a && n !== b) throw new Error('El nombre resultante ya existe.');

    const verticesNuevos = g.vertices.filter((v) => v !== a && v !== b);
    verticesNuevos.push(n);
    g.vertices = verticesNuevos;

    g.aristas = g.aristas.map((ar) => {
        const inicio = (ar.inicio === a || ar.inicio === b) ? n : ar.inicio;
        const fin = (ar.fin === a || ar.fin === b) ? n : ar.fin;
        return { ...ar, inicio, fin };
    });
}

function contraccionArista(g, nombreArista) {
    const nAr = normalizarTexto(nombreArista);
    if (!nAr) throw new Error('Ingrese el nombre de la arista a contraer.');

    const arista = g.aristas.find((a) => a.nombre === nAr);
    if (!arista) throw new Error('La arista a contraer no existe.');

    const o = normalizarTexto(arista.inicio);
    const d = normalizarTexto(arista.fin);
    const n = `${o},${d}`;

    if (!o || !d) throw new Error('La arista seleccionada no es valida.');
    if (o === d) throw new Error('Origen y destino deben ser diferentes.');
    if (!existeVertice(g, o) || !existeVertice(g, d)) throw new Error('Los vértices deben existir.');
    if (existeVertice(g, n) && n !== o && n !== d) throw new Error('El nombre resultante ya existe.');

    // La arista contraida desaparece; las demas se reubican al nuevo vertice.
    g.aristas = g.aristas.filter((a) => a.nombre !== nAr);

    g.vertices = g.vertices.filter((v) => v !== o && v !== d);
    g.vertices.push(n);
    g.aristas = g.aristas.map((ar) => {
        const inicio = (ar.inicio === o || ar.inicio === d) ? n : ar.inicio;
        const fin = (ar.fin === o || ar.fin === d) ? n : ar.fin;
        return { ...ar, inicio, fin };
    });
}

function operarUnGrafo(grafo, operacion, params) {
    const r = clonarGrafo(grafo);

    switch (operacion) {
        case 'fusion_vertices':
            fusionarVertices(r, params.v1, params.v2);
            return r;
        case 'adicion_vertices':
            agregarVertice(r, params.vertice);
            return r;
        case 'eliminacion_vertice':
            eliminarVertice(r, params.vertice);
            return r;
        case 'contraccion_arista':
            contraccionArista(r, params.nombreArista);
            return r;
        case 'adicion_arista':
            agregarArista(r, params.nombre, params.inicio, params.fin);
            return r;
        case 'eliminacion_arista':
            eliminarArista(r, params.nombre);
            return r;
        case 'complemento':
            return grafoComplemento(r);
        default:
            throw new Error('Operacion no valida.');
    }
}

function obtenerConjuntoAristas(g) {
    return new Set(g.aristas.map((a) => claveArista(a.inicio, a.fin)));
}

function obtenerMapaAristasPorPar(g) {
    const mapa = new Map();
    g.aristas.forEach((a) => {
        const k = claveArista(a.inicio, a.fin);
        // Para operaciones por conjuntos, tomamos una representante por par.
        if (!mapa.has(k)) mapa.set(k, { ...a });
    });
    return mapa;
}

function nombreUnico(base, usados, prefijo = 'e') {
    const limpio = normalizarTexto(base) || prefijo;
    if (!usados.has(limpio)) {
        usados.add(limpio);
        return limpio;
    }
    let i = 2;
    while (usados.has(`${limpio}_${i}`)) i++;
    const final = `${limpio}_${i}`;
    usados.add(final);
    return final;
}

function reconstruirAristasDesdeClaves(claves, nombrarArista = (idx) => `r${idx}`) {
    let idx = 1;
    return [...claves].sort().map((k) => {
        const [u, v] = k.split('||');
        const nombre = nombrarArista(idx, u, v);
        idx += 1;
        return { nombre, inicio: u, fin: v };
    });
}

function unionGrafos(g1, g2) {
    const vertices = [...new Set([...g1.vertices, ...g2.vertices])];
    const m1 = obtenerMapaAristasPorPar(g1);
    const m2 = obtenerMapaAristasPorPar(g2);
    const usados = new Set();
    const aristas = [];

    const claves = [...new Set([...m1.keys(), ...m2.keys()])];
    claves.forEach((k) => {
        const a = m1.get(k) || m2.get(k);
        aristas.push({ ...a, nombre: nombreUnico(a.nombre, usados, 'u') });
    });

    return { vertices, aristas };
}

function interseccionGrafos(g1, g2) {
    const v2 = new Set(g2.vertices);
    const vertices = g1.vertices.filter((v) => v2.has(v));
    const vr = new Set(vertices);

    const m1 = obtenerMapaAristasPorPar(g1);
    const m2 = obtenerMapaAristasPorPar(g2);
    const usados = new Set();
    const aristas = [];

    m1.forEach((a1, k) => {
        if (!m2.has(k)) return;
        const [u, v] = k.split('||');
        if (!vr.has(u) || !vr.has(v)) return;
        aristas.push({ ...a1, nombre: nombreUnico(a1.nombre, usados, 'i') });
    });

    return { vertices, aristas };
}

function sumaAnilloGrafos(g1, g2) {
    const vertices = [...new Set([...g1.vertices, ...g2.vertices])];
    const m1 = obtenerMapaAristasPorPar(g1);
    const m2 = obtenerMapaAristasPorPar(g2);
    const usados = new Set();
    const aristas = [];

    m1.forEach((a1, k) => {
        if (m2.has(k)) return;
        aristas.push({ ...a1, nombre: nombreUnico(a1.nombre, usados, 'sr') });
    });
    m2.forEach((a2, k) => {
        if (m1.has(k)) return;
        aristas.push({ ...a2, nombre: nombreUnico(a2.nombre, usados, 'sr') });
    });

    return { vertices, aristas };
}

function sumaGrafos(g1, g2) {
    const repetidos = new Set(g1.vertices.filter((v) => g2.vertices.includes(v)));

    const usadosVertices = new Set();
    const mapV1 = new Map();
    const mapV2 = new Map();

    g1.vertices.forEach((v) => {
        const base = repetidos.has(v) ? `${v}_g1` : v;
        mapV1.set(v, nombreUnico(base, usadosVertices, 'v'));
    });
    g2.vertices.forEach((v) => {
        const base = repetidos.has(v) ? `${v}_g2` : v;
        mapV2.set(v, nombreUnico(base, usadosVertices, 'v'));
    });

    const vertices = [...mapV1.values(), ...mapV2.values()];
    const usadosAristas = new Set();
    const aristas = [];
    const pares = new Set();

    const nombresG1 = new Set(g1.aristas.map((a) => normalizarTexto(a.nombre)).filter(Boolean));
    const repetidosAristas = new Set(
        g2.aristas
            .map((a) => normalizarTexto(a.nombre))
            .filter((n) => n && nombresG1.has(n))
    );

    const nombreAristaConOrigen = (nombreBase, origen) => {
        const base = normalizarTexto(nombreBase) || 's';
        if (repetidosAristas.has(base)) {
            return nombreUnico(`${base}_${origen}`, usadosAristas, 's');
        }
        if (!usadosAristas.has(base)) {
            usadosAristas.add(base);
            return base;
        }
        const conOrigen = `${base}_${origen}`;
        return nombreUnico(conOrigen, usadosAristas, 's');
    };

    g1.aristas.forEach((a) => {
        const inicio = mapV1.get(a.inicio);
        const fin = mapV1.get(a.fin);
        if (!inicio || !fin) return;
        aristas.push({ nombre: nombreAristaConOrigen(a.nombre, 'g1'), inicio, fin });
        pares.add(claveArista(inicio, fin));
    });

    g2.aristas.forEach((a) => {
        const inicio = mapV2.get(a.inicio);
        const fin = mapV2.get(a.fin);
        if (!inicio || !fin) return;
        aristas.push({ nombre: nombreAristaConOrigen(a.nombre, 'g2'), inicio, fin });
        pares.add(claveArista(inicio, fin));
    });

    // Suma: agregar conexiones faltantes entre todos los vertices de G1 y G2.
    let idx = 1;
    mapV1.forEach((u) => {
        mapV2.forEach((v) => {
            const k = claveArista(u, v);
            if (pares.has(k)) return;
            pares.add(k);
            aristas.push({
                nombre: nombreUnico(`s${idx++}`, usadosAristas, 's'),
                inicio: u,
                fin: v,
                esConexionSuma: true,
                grupoSuma: u
            });
        });
    });

    return { vertices, aristas };
}

function productoCartesiano(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(verticeProducto(u, v));
        }
    }

    const e1 = obtenerConjuntoAristas(g1);
    const e2 = obtenerConjuntoAristas(g2);
    const claves = new Set();

    for (const u1 of g1.vertices) {
        for (const v1 of g2.vertices) {
            for (const u2 of g1.vertices) {
                for (const v2 of g2.vertices) {
                    if (u1 === u2 && e2.has(claveArista(v1, v2))) {
                        claves.add(claveArista(verticeProducto(u1, v1), verticeProducto(u2, v2)));
                    }
                    if (v1 === v2 && e1.has(claveArista(u1, u2))) {
                        claves.add(claveArista(verticeProducto(u1, v1), verticeProducto(u2, v2)));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, (_, u, v) => `${u}-${v}`) };
}

function productoTensorial(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(verticeProducto(u, v));
        }
    }

    const e1 = obtenerConjuntoAristas(g1);
    const e2 = obtenerConjuntoAristas(g2);
    const claves = new Set();

    for (const u1 of g1.vertices) {
        for (const v1 of g2.vertices) {
            for (const u2 of g1.vertices) {
                for (const v2 of g2.vertices) {
                    if (e1.has(claveArista(u1, u2)) && e2.has(claveArista(v1, v2))) {
                        claves.add(claveArista(verticeProducto(u1, v1), verticeProducto(u2, v2)));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, (_, u, v) => `${u}-${v}`) };
}

function composicionGrafos(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(verticeProducto(u, v));
        }
    }

    const e1 = obtenerConjuntoAristas(g1);
    const e2 = obtenerConjuntoAristas(g2);
    const claves = new Set();

    for (const u1 of g1.vertices) {
        for (const v1 of g2.vertices) {
            for (const u2 of g1.vertices) {
                for (const v2 of g2.vertices) {
                    const cond1 = e1.has(claveArista(u1, u2));
                    const cond2 = (u1 === u2) && e2.has(claveArista(v1, v2));
                    if (cond1 || cond2) {
                        claves.add(claveArista(verticeProducto(u1, v1), verticeProducto(u2, v2)));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, (idx) => String(idx)) };
}

function operarDosGrafos(g1, g2, operacion) {
    switch (operacion) {
        case 'union':
            return unionGrafos(g1, g2);
        case 'interseccion':
            return interseccionGrafos(g1, g2);
        case 'suma_anillo':
            return sumaAnilloGrafos(g1, g2);
        case 'suma':
            return sumaGrafos(g1, g2);
        case 'producto_cartesiano':
            return productoCartesiano(g1, g2);
        case 'producto_tensorial':
            return productoTensorial(g1, g2);
        case 'composicion':
            return composicionGrafos(g1, g2);
        default:
            throw new Error('Operacion no valida para dos grafos.');
    }
}

function formatearVerticeNotacion(v, marcarFusionado) {
    if (!marcarFusionado || !v.includes(',')) return v;
    return `<span class="vertice-fusionado">${v}</span>`;
}

function notacion(g, nombre, marcarFusionados = false) {
    const s = `{${g.vertices.map((v) => formatearVerticeNotacion(v, marcarFusionados)).join(', ')}}`;
    const a = `{${g.aristas.map((e) => e.nombre).join(', ')}}`;
    return `<strong>${nombre}</strong> = (S, A)<br>S = ${s}<br>A = ${a}`;
}

function renderLista(id, elementos, formatear) {
    const box = document.getElementById(id);
    if (!box) return;

    if (!elementos.length) {
        box.innerHTML = '<span class="text-muted">Sin registros.</span>';
        return;
    }

    const items = elementos.map((e) => `<li>${formatear(e)}</li>`).join('');
    box.innerHTML = `<ul>${items}</ul>`;
}

function renderGrafoD3(containerId, grafo, opciones = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!grafo.vertices.length) {
        container.innerHTML = '<div class="grafo-empty">Sin vertices para visualizar</div>';
        return;
    }

    const width = Math.max(260, container.clientWidth || 260);
    const height = 320;
    const radioNodo = 16;
    const margen = 6;
    const minX = radioNodo + margen;
    const maxX = width - radioNodo - margen;
    const minY = radioNodo + margen;
    const maxY = height - radioNodo - margen;
    const limitar = (valor, min, max) => Math.max(min, Math.min(max, valor));

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'grafo-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodes = grafo.vertices.map((v) => ({ id: v }));
    const links = grafo.aristas.map((a) => ({
        source: a.inicio,
        target: a.fin,
        nombre: a.nombre,
        esConexionSuma: !!a.esConexionSuma,
        grupoSuma: a.grupoSuma || ''
    }));

    const PALETA_SUMA = [
        '#1F4E79', '#8E24AA', '#0B8043', '#C62828', '#EF6C00',
        '#1565C0', '#6A1B9A', '#2E7D32', '#AD1457', '#283593'
    ];
    const mapaColoresSuma = new Map();
    function colorConexionSuma(d) {
        if (!opciones.colorearSumaConexiones || !d.esConexionSuma) return null;
        const key = d.grupoSuma || 's';
        if (!mapaColoresSuma.has(key)) {
            mapaColoresSuma.set(key, PALETA_SUMA[mapaColoresSuma.size % PALETA_SUMA.length]);
        }
        return mapaColoresSuma.get(key);
    }

    // Agrupa aristas paralelas por par no dirigido para separarlas visualmente.
    const gruposParalelos = new Map();
    links.forEach((l) => {
        const k = claveArista(String(l.source), String(l.target));
        if (!gruposParalelos.has(k)) gruposParalelos.set(k, []);
        gruposParalelos.get(k).push(l);
    });
    gruposParalelos.forEach((grupo) => {
        const n = grupo.length;
        if (n % 2 === 1) {
            const centro = (n - 1) / 2;
            grupo.forEach((l, idx) => {
                l.parallelIndex = idx - centro; // ..., -1, 0, 1, ...
                l.parallelCount = n;
            });
        } else {
            // Para pares evita índices ±0.5; usa ..., -2, -1, 1, 2, ...
            grupo.forEach((l, idx) => {
                const paso = idx < n / 2 ? idx - n / 2 : idx - n / 2 + 1;
                l.parallelIndex = paso;
                l.parallelCount = n;
            });
        }
    });

    const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d) => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(24));

    const link = svg.append('g')
        .selectAll('path')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link-line')
        .style('stroke', (d) => colorConexionSuma(d) || null)
        .style('stroke-width', (d) => colorConexionSuma(d) ? '2.8px' : null);

    const edgeLabel = svg.append('g')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('class', 'edge-label')
        .style('fill', (d) => colorConexionSuma(d) || null)
        .text((d) => d.nombre);

    const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node-circle')
        .attr('r', radioNodo)
        .call(d3.drag()
            .on('start', (event, d) => {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = limitar(d.x ?? width / 2, minX, maxX);
                d.fy = limitar(d.y ?? height / 2, minY, maxY);
            })
            .on('drag', (event, d) => {
                d.fx = limitar(event.x, minX, maxX);
                d.fy = limitar(event.y, minY, maxY);
            })
            .on('end', (event, d) => {
                if (!event.active) sim.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            })
        );

    const nodeLabel = svg.append('g')
        .selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle')
        .attr('dy', 5)
        .text((d) => d.id);

    function obtenerGeometriaArista(d) {
        let s = d.source;
        let t = d.target;
        // Normaliza orientación para que aristas paralelas del mismo par
        // no se dibujen invertidas una sobre otra cuando cambia source/target.
        if (String(s.id) > String(t.id)) {
            const tmp = s;
            s = t;
            t = tmp;
        }

        const x1 = s.x;
        const y1 = s.y;
        const x2 = t.x;
        const y2 = t.y;

        // Lazo: se dibuja como una curva sobre el mismo vertice.
        if (s.id === t.id) {
            const idxAbs = Math.abs(d.parallelIndex);
            const radioBase = 20;
            const incremento = Math.min(12, 4 + (d.parallelCount * 0.8));
            const radioLazo = radioBase + (idxAbs * incremento);
            const signo = d.parallelIndex === 0 ? 1 : Math.sign(d.parallelIndex);
            const spreadX = 8 + Math.min(18, d.parallelCount * 2);
            const cx = x1 + (signo * spreadX * Math.max(1, idxAbs));
            const cy = y1 - radioLazo;
            const path = `M ${x1} ${y1 - 12} C ${cx - radioLazo} ${cy - radioLazo}, ${cx + radioLazo} ${cy - radioLazo}, ${x1} ${y1 - 12}`;
            return { path, lx: cx, ly: cy - radioLazo + 4 };
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;
        const separacionBase = Math.max(18, Math.min(34, dist * 0.12));
        const factorCantidad = 1 + Math.min(0.8, (d.parallelCount - 1) * 0.08);
        const separacion = separacionBase * factorCantidad;
        const offset = d.parallelIndex * separacion;
        const cx = (x1 + x2) / 2 + nx * offset;
        const cy = (y1 + y2) / 2 + ny * offset;
        const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;

        // Punto medio de curva cuadratica (t=0.5) para ubicar etiqueta.
        const lx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
        const ly = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
        return { path, lx, ly };
    }

    sim.on('tick', () => {
        nodes.forEach((d) => {
            d.x = limitar(d.x ?? width / 2, minX, maxX);
            d.y = limitar(d.y ?? height / 2, minY, maxY);
        });

        link
            .attr('d', (d) => obtenerGeometriaArista(d).path);

        node
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y);

        nodeLabel
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y);

        edgeLabel
            .attr('x', (d) => obtenerGeometriaArista(d).lx)
            .attr('y', (d) => obtenerGeometriaArista(d).ly - 4);
    });
}

function limpiarResultadoUnGrafo() {
    state.un.resultado = { vertices: [], aristas: [] };
}

function limpiarResultadoDosGrafos() {
    state.dos.resultado = { vertices: [], aristas: [] };
    state.dos.operacionActual = '';
}

function renderUnGrafo() {
    const g = state.un.grafo;
    const r = state.un.resultado;

    document.getElementById('unNotacionInicial').innerHTML = notacion(g, 'G inicial');
    document.getElementById('unNotacionResultado').innerHTML = notacion(r, 'G resultado', true);

    renderGrafoD3('unGrafoInicial', g);
    renderGrafoD3('unGrafoResultado', r);
}

function renderUnResultado() {
    const r = state.un.resultado;
    document.getElementById('unNotacionResultado').innerHTML = notacion(r, 'G resultado', true);
    renderGrafoD3('unGrafoResultado', r);
}

function renderDosGrafos() {
    const g1 = state.dos.g1;
    const g2 = state.dos.g2;
    const r = state.dos.resultado;

    document.getElementById('dosNotacionG1').innerHTML = notacion(g1, 'G1');
    document.getElementById('dosNotacionG2').innerHTML = notacion(g2, 'G2');
    document.getElementById('dosNotacionResultado').innerHTML = notacion(r, 'G resultado');

    renderGrafoD3('dosGrafo1', g1);
    renderGrafoD3('dosGrafo2', g2);
    renderGrafoD3('dosGrafoResultado', r, { colorearSumaConexiones: state.dos.operacionActual === 'suma' });
}

function renderDosResultado() {
    const r = state.dos.resultado;
    document.getElementById('dosNotacionResultado').innerHTML = notacion(r, 'G resultado', true);
    renderGrafoD3('dosGrafoResultado', r, { colorearSumaConexiones: state.dos.operacionActual === 'suma' });
}

function plantillaCamposUnGrafo(operacion) {
    const base = document.getElementById('unOperacionParams');
    if (!base) return;

    const campo = (id, ph) => `<input type="text" class="form-control mb-2" id="${id}" placeholder="${ph}">`;

    switch (operacion) {
        case 'fusion_vertices':
            base.innerHTML = `${campo('paramFusionV1', 'Vertice 1')}${campo('paramFusionV2', 'Vertice 2')}`;
            break;
        case 'adicion_vertices':
            base.innerHTML = campo('paramAddVertice', 'Vertice a agregar');
            break;
        case 'eliminacion_vertice':
            base.innerHTML = campo('paramDelVertice', 'Vertice a eliminar');
            break;
        case 'contraccion_arista':
            base.innerHTML = campo('paramContraccionArista', 'Nombre de la arista a contraer');
            break;
        case 'adicion_arista':
            base.innerHTML = `${campo('paramAddAristaNombre', 'Nombre arista')}${campo('paramAddAristaInicio', 'Vertice inicio')}${campo('paramAddAristaFin', 'Vertice fin')}`;
            break;
        case 'eliminacion_arista':
            base.innerHTML = campo('paramDelAristaNombre', 'Nombre arista');
            break;
        default:
            base.innerHTML = '<span class="text-muted">Esta operacion no requiere parametros adicionales.</span>';
    }
}

function leerParamsUnGrafo(operacion) {
    const val = (id) => normalizarTexto((document.getElementById(id) || {}).value);

    switch (operacion) {
        case 'fusion_vertices':
            return { v1: val('paramFusionV1'), v2: val('paramFusionV2') };
        case 'adicion_vertices':
            return { vertice: val('paramAddVertice') };
        case 'eliminacion_vertice':
            return { vertice: val('paramDelVertice') };
        case 'contraccion_arista':
            return { nombreArista: val('paramContraccionArista') };
        case 'adicion_arista':
            return { nombre: val('paramAddAristaNombre'), inicio: val('paramAddAristaInicio'), fin: val('paramAddAristaFin') };
        case 'eliminacion_arista':
            return { nombre: val('paramDelAristaNombre') };
        default:
            return {};
    }
}

function bindEventosUnGrafo() {
    document.getElementById('btnUnLimpiar').addEventListener('click', limpiarUnGrafo);
    document.getElementById('btnUnGuardar').addEventListener('click', guardarUnGrafo);
    document.getElementById('btnUnCargar').addEventListener('click', cargarUnGrafo);

    document.getElementById('btnUnAgregarVertice').addEventListener('click', () => {
        try {
            agregarVertice(state.un.grafo, document.getElementById('unVerticeNombre').value);
            document.getElementById('unVerticeNombre').value = '';
            limpiarResultadoUnGrafo();
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    document.getElementById('btnUnEliminarVertice').addEventListener('click', () => {
        try {
            eliminarVertice(state.un.grafo, document.getElementById('unVerticeNombre').value);
            document.getElementById('unVerticeNombre').value = '';
            limpiarResultadoUnGrafo();
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    document.getElementById('btnUnAgregarArista').addEventListener('click', () => {
        try {
            agregarArista(
                state.un.grafo,
                document.getElementById('unAristaNombre').value,
                document.getElementById('unAristaInicio').value,
                document.getElementById('unAristaFin').value
            );
            document.getElementById('unAristaNombre').value = '';
            document.getElementById('unAristaInicio').value = '';
            document.getElementById('unAristaFin').value = '';
            limpiarResultadoUnGrafo();
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    document.getElementById('btnUnEliminarArista').addEventListener('click', () => {
        try {
            eliminarArista(state.un.grafo, document.getElementById('unAristaNombre').value);
            document.getElementById('unAristaNombre').value = '';
            document.getElementById('unAristaInicio').value = '';
            document.getElementById('unAristaFin').value = '';
            limpiarResultadoUnGrafo();
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    const selectOp = document.getElementById('unOperacion');
    selectOp.addEventListener('change', () => plantillaCamposUnGrafo(selectOp.value));

    document.getElementById('btnUnOperar').addEventListener('click', () => {
        try {
            const op = selectOp.value;
            const params = leerParamsUnGrafo(op);
            state.un.resultado = operarUnGrafo(state.un.grafo, op, params);
            renderUnResultado();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    plantillaCamposUnGrafo(selectOp.value);
}

function bindEventosDosGrafos() {
    document.getElementById('btnDosLimpiar').addEventListener('click', limpiarDosGrafos);
    document.getElementById('btnDosGuardar').addEventListener('click', guardarDosGrafos);
    document.getElementById('btnDosCargar').addEventListener('click', cargarDosGrafos);

    const vincular = (btnAddV, inputV, btnDelV, btnAddA, aNom, aIni, aFin, btnDelA, grafo, alertaId) => {
        document.getElementById(btnAddV).addEventListener('click', () => {
            try {
                agregarVertice(grafo, document.getElementById(inputV).value);
                document.getElementById(inputV).value = '';
                limpiarResultadoDosGrafos();
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });

        document.getElementById(btnDelV).addEventListener('click', () => {
            try {
                eliminarVertice(grafo, document.getElementById(inputV).value);
                document.getElementById(inputV).value = '';
                limpiarResultadoDosGrafos();
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });

        document.getElementById(btnAddA).addEventListener('click', () => {
            try {
                agregarArista(
                    grafo,
                    document.getElementById(aNom).value,
                    document.getElementById(aIni).value,
                    document.getElementById(aFin).value
                );
                document.getElementById(aNom).value = '';
                document.getElementById(aIni).value = '';
                document.getElementById(aFin).value = '';
                limpiarResultadoDosGrafos();
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });

        document.getElementById(btnDelA).addEventListener('click', () => {
            try {
                eliminarArista(grafo, document.getElementById(aNom).value);
                document.getElementById(aNom).value = '';
                document.getElementById(aIni).value = '';
                document.getElementById(aFin).value = '';
                limpiarResultadoDosGrafos();
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });
    };

    vincular('btnDosAgregarV1', 'dosV1Nombre', 'btnDosEliminarV1', 'btnDosAgregarA1', 'dosA1Nombre', 'dosA1Inicio', 'dosA1Fin', 'btnDosEliminarA1', state.dos.g1, 'mensajeDosGrafos');
    vincular('btnDosAgregarV2', 'dosV2Nombre', 'btnDosEliminarV2', 'btnDosAgregarA2', 'dosA2Nombre', 'dosA2Inicio', 'dosA2Fin', 'btnDosEliminarA2', state.dos.g2, 'mensajeDosGrafos');

    document.getElementById('btnDosOperar').addEventListener('click', () => {
        try {
            const op = document.getElementById('dosOperacion').value;
            state.dos.operacionActual = op;
            state.dos.resultado = operarDosGrafos(state.dos.g1, state.dos.g2, op);
            renderDosResultado();
            ocultarMensaje('mensajeDosGrafos');
        } catch (e) {
            mostrarMensaje('mensajeDosGrafos', e.message, 'warning');
        }
    });
}

function inicializarTabs() {
    const tabs = document.querySelectorAll('#grafosTabs button[data-bs-toggle="pill"]');
    tabs.forEach((tab) => {
        tab.addEventListener('shown.bs.tab', () => {
            const bien = document.getElementById('panel-bienvenida-grafos');
            if (bien) bien.style.display = 'none';
            renderUnGrafo();
            renderDosGrafos();
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    limpiarResultadoUnGrafo();
    limpiarResultadoDosGrafos();

    bindCargarUnGrafo();
    bindCargarDosGrafos();
    bindEventosUnGrafo();
    bindEventosDosGrafos();
    inicializarTabs();

    renderUnGrafo();
    renderDosGrafos();

    window.addEventListener('resize', () => {
        renderUnGrafo();
        renderDosGrafos();
    });
});
