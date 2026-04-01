// Simulador CC2 - Grafos / Operaciones

const state = {
    un: {
        grafo: { vertices: [], aristas: [] },
        resultado: { vertices: [], aristas: [] }
    },
    dos: {
        g1: { vertices: [], aristas: [] },
        g2: { vertices: [], aristas: [] },
        resultado: { vertices: [], aristas: [] }
    }
};

function normalizarTexto(v) {
    return (v || '').trim();
}

function claveArista(u, v) {
    return [u, v].sort().join('||');
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
    if (!n) throw new Error('Ingrese el nombre del vertice.');
    if (existeVertice(g, n)) throw new Error('El vertice ya existe.');
    g.vertices.push(n);
}

function eliminarVertice(g, nombre) {
    const n = normalizarTexto(nombre);
    if (!n) throw new Error('Ingrese el vertice a eliminar.');
    if (!existeVertice(g, n)) throw new Error('El vertice no existe.');
    g.vertices = g.vertices.filter((v) => v !== n);
    g.aristas = g.aristas.filter((a) => a.inicio !== n && a.fin !== n);
}

function agregarArista(g, nombre, inicio, fin) {
    const n = normalizarTexto(nombre);
    const u = normalizarTexto(inicio);
    const v = normalizarTexto(fin);

    if (!n || !u || !v) throw new Error('Complete nombre, inicio y fin de la arista.');
    if (!existeVertice(g, u) || !existeVertice(g, v)) throw new Error('Los vertices de la arista deben existir.');
    if (u === v) throw new Error('No se permiten bucles en esta simulacion.');
    if (existeAristaNombre(g, n)) throw new Error('Ya existe una arista con ese nombre.');
    if (existeAristaPar(g, u, v)) throw new Error('Ya existe una arista entre esos vertices.');

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
        aristas.push({ nombre: `${prefijo}${idx++}`, inicio: a.inicio, fin: a.fin });
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

function fusionarVertices(g, v1, v2, nuevo) {
    const a = normalizarTexto(v1);
    const b = normalizarTexto(v2);
    const n = normalizarTexto(nuevo);

    if (!a || !b || !n) throw new Error('Complete v1, v2 y el nuevo vertice.');
    if (a === b) throw new Error('v1 y v2 deben ser diferentes.');
    if (!existeVertice(g, a) || !existeVertice(g, b)) throw new Error('Los vertices a fusionar deben existir.');
    if (n !== a && n !== b && existeVertice(g, n)) throw new Error('El nombre nuevo ya existe.');

    const verticesNuevos = g.vertices.filter((v) => v !== a && v !== b);
    verticesNuevos.push(n);
    g.vertices = verticesNuevos;

    g.aristas = g.aristas.map((ar) => {
        const inicio = (ar.inicio === a || ar.inicio === b) ? n : ar.inicio;
        const fin = (ar.fin === a || ar.fin === b) ? n : ar.fin;
        return { ...ar, inicio, fin };
    });

    deduplicarAristasPorPar(g, 'f');
}

function contraccionVertice(g, origen, destino) {
    const o = normalizarTexto(origen);
    const d = normalizarTexto(destino);

    if (!o || !d) throw new Error('Complete vertice a contraer y vertice destino.');
    if (o === d) throw new Error('Origen y destino deben ser diferentes.');
    if (!existeVertice(g, o) || !existeVertice(g, d)) throw new Error('Los vertices deben existir.');

    g.vertices = g.vertices.filter((v) => v !== o);
    g.aristas = g.aristas.map((ar) => {
        const inicio = ar.inicio === o ? d : ar.inicio;
        const fin = ar.fin === o ? d : ar.fin;
        return { ...ar, inicio, fin };
    });

    deduplicarAristasPorPar(g, 'k');
}

function operarUnGrafo(grafo, operacion, params) {
    const r = clonarGrafo(grafo);

    switch (operacion) {
        case 'fusion_vertices':
            fusionarVertices(r, params.v1, params.v2, params.nuevo);
            return r;
        case 'adicion_vertices':
            agregarVertice(r, params.vertice);
            return r;
        case 'eliminacion_vertice':
            eliminarVertice(r, params.vertice);
            return r;
        case 'contraccion_vertice':
            contraccionVertice(r, params.origen, params.destino);
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

function reconstruirAristasDesdeClaves(claves, prefijo = 'r') {
    let idx = 1;
    return [...claves].map((k) => {
        const [u, v] = k.split('||');
        return { nombre: `${prefijo}${idx++}`, inicio: u, fin: v };
    });
}

function unionGrafos(g1, g2) {
    const vertices = [...new Set([...g1.vertices, ...g2.vertices])];
    const claves = new Set([...obtenerConjuntoAristas(g1), ...obtenerConjuntoAristas(g2)]);
    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'u') };
}

function interseccionGrafos(g1, g2) {
    const v2 = new Set(g2.vertices);
    const vertices = g1.vertices.filter((v) => v2.has(v));
    const vr = new Set(vertices);

    const c1 = obtenerConjuntoAristas(g1);
    const c2 = obtenerConjuntoAristas(g2);
    const claves = new Set();
    c1.forEach((k) => {
        if (!c2.has(k)) return;
        const [u, v] = k.split('||');
        if (vr.has(u) && vr.has(v)) claves.add(k);
    });

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'i') };
}

function sumaAnilloGrafos(g1, g2) {
    const vertices = [...new Set([...g1.vertices, ...g2.vertices])];
    const c1 = obtenerConjuntoAristas(g1);
    const c2 = obtenerConjuntoAristas(g2);
    const claves = new Set();

    c1.forEach((k) => { if (!c2.has(k)) claves.add(k); });
    c2.forEach((k) => { if (!c1.has(k)) claves.add(k); });

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'sr') };
}

function sumaGrafos(g1, g2) {
    const base = unionGrafos(g1, g2);
    const inG1 = new Set(g1.vertices);
    const inG2 = new Set(g2.vertices);
    const claves = new Set(base.aristas.map((a) => claveArista(a.inicio, a.fin)));

    for (const u of base.vertices) {
        for (const v of base.vertices) {
            if (u >= v) continue;
            const unoG1 = inG1.has(u);
            const otroG1 = inG1.has(v);
            const unoG2 = inG2.has(u);
            const otroG2 = inG2.has(v);
            if ((unoG1 && otroG2) || (unoG2 && otroG1)) {
                claves.add(claveArista(u, v));
            }
        }
    }

    return { vertices: base.vertices, aristas: reconstruirAristasDesdeClaves(claves, 's') };
}

function productoCartesiano(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(`${u}|${v}`);
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
                        claves.add(claveArista(`${u1}|${v1}`, `${u2}|${v2}`));
                    }
                    if (v1 === v2 && e1.has(claveArista(u1, u2))) {
                        claves.add(claveArista(`${u1}|${v1}`, `${u2}|${v2}`));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'pc') };
}

function productoTensorial(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(`${u}|${v}`);
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
                        claves.add(claveArista(`${u1}|${v1}`, `${u2}|${v2}`));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'pt') };
}

function composicionGrafos(g1, g2) {
    const vertices = [];
    for (const u of g1.vertices) {
        for (const v of g2.vertices) {
            vertices.push(`${u}|${v}`);
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
                        claves.add(claveArista(`${u1}|${v1}`, `${u2}|${v2}`));
                    }
                }
            }
        }
    }

    return { vertices, aristas: reconstruirAristasDesdeClaves(claves, 'co') };
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

function notacion(g, nombre) {
    const s = `{${g.vertices.join(', ')}}`;
    const a = `{${g.aristas.map((e) => `${e.nombre}:(${e.inicio},${e.fin})`).join(', ')}}`;
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

function renderGrafoD3(containerId, grafo) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    if (!grafo.vertices.length) {
        container.innerHTML = '<div class="grafo-empty">Sin vertices para visualizar</div>';
        return;
    }

    const width = Math.max(260, container.clientWidth || 260);
    const height = 320;

    const svg = d3.select(container)
        .append('svg')
        .attr('class', 'grafo-svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

    const nodes = grafo.vertices.map((v) => ({ id: v }));
    const links = grafo.aristas.map((a) => ({ source: a.inicio, target: a.fin, nombre: a.nombre }));

    const sim = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id((d) => d.id).distance(90))
        .force('charge', d3.forceManyBody().strength(-220))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius(24));

    const link = svg.append('g')
        .selectAll('line')
        .data(links)
        .enter()
        .append('line')
        .attr('class', 'link-line');

    const edgeLabel = svg.append('g')
        .selectAll('text')
        .data(links)
        .enter()
        .append('text')
        .attr('class', 'edge-label')
        .text((d) => d.nombre);

    const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .enter()
        .append('circle')
        .attr('class', 'node-circle')
        .attr('r', 16)
        .call(d3.drag()
            .on('start', (event, d) => {
                if (!event.active) sim.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
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

    sim.on('tick', () => {
        link
            .attr('x1', (d) => d.source.x)
            .attr('y1', (d) => d.source.y)
            .attr('x2', (d) => d.target.x)
            .attr('y2', (d) => d.target.y);

        node
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y);

        nodeLabel
            .attr('x', (d) => d.x)
            .attr('y', (d) => d.y);

        edgeLabel
            .attr('x', (d) => (d.source.x + d.target.x) / 2)
            .attr('y', (d) => (d.source.y + d.target.y) / 2 - 4);
    });
}

function renderUnGrafo() {
    const g = state.un.grafo;
    const r = state.un.resultado;

    renderLista('unVerticesLista', g.vertices, (v) => `Reg ${v}`);
    renderLista('unAristasLista', g.aristas, (a) => `${a.nombre}: (${a.inicio}, ${a.fin})`);

    document.getElementById('unNotacionInicial').innerHTML = notacion(g, 'G inicial');
    document.getElementById('unNotacionResultado').innerHTML = notacion(r, 'G resultado');

    renderGrafoD3('unGrafoInicial', g);
    renderGrafoD3('unGrafoResultado', r);
}

function renderDosGrafos() {
    const g1 = state.dos.g1;
    const g2 = state.dos.g2;
    const r = state.dos.resultado;

    renderLista('dosVertices1Lista', g1.vertices, (v) => `Reg ${v}`);
    renderLista('dosVertices2Lista', g2.vertices, (v) => `Reg ${v}`);
    renderLista('dosAristas1Lista', g1.aristas, (a) => `${a.nombre}: (${a.inicio}, ${a.fin})`);
    renderLista('dosAristas2Lista', g2.aristas, (a) => `${a.nombre}: (${a.inicio}, ${a.fin})`);

    document.getElementById('dosNotacionG1').innerHTML = notacion(g1, 'G1');
    document.getElementById('dosNotacionG2').innerHTML = notacion(g2, 'G2');
    document.getElementById('dosNotacionResultado').innerHTML = notacion(r, 'G resultado');

    renderGrafoD3('dosGrafo1', g1);
    renderGrafoD3('dosGrafo2', g2);
    renderGrafoD3('dosGrafoResultado', r);
}

function plantillaCamposUnGrafo(operacion) {
    const base = document.getElementById('unOperacionParams');
    if (!base) return;

    const campo = (id, ph) => `<input type="text" class="form-control mb-2" id="${id}" placeholder="${ph}">`;

    switch (operacion) {
        case 'fusion_vertices':
            base.innerHTML = `${campo('paramFusionV1', 'Vertice 1')}${campo('paramFusionV2', 'Vertice 2')}${campo('paramFusionNuevo', 'Nuevo vertice')}`;
            break;
        case 'adicion_vertices':
            base.innerHTML = campo('paramAddVertice', 'Vertice a agregar');
            break;
        case 'eliminacion_vertice':
            base.innerHTML = campo('paramDelVertice', 'Vertice a eliminar');
            break;
        case 'contraccion_vertice':
            base.innerHTML = `${campo('paramContraccionOrigen', 'Vertice a contraer')}${campo('paramContraccionDestino', 'Vertice destino')}`;
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
            return { v1: val('paramFusionV1'), v2: val('paramFusionV2'), nuevo: val('paramFusionNuevo') };
        case 'adicion_vertices':
            return { vertice: val('paramAddVertice') };
        case 'eliminacion_vertice':
            return { vertice: val('paramDelVertice') };
        case 'contraccion_vertice':
            return { origen: val('paramContraccionOrigen'), destino: val('paramContraccionDestino') };
        case 'adicion_arista':
            return { nombre: val('paramAddAristaNombre'), inicio: val('paramAddAristaInicio'), fin: val('paramAddAristaFin') };
        case 'eliminacion_arista':
            return { nombre: val('paramDelAristaNombre') };
        default:
            return {};
    }
}

function bindEventosUnGrafo() {
    document.getElementById('btnUnAgregarVertice').addEventListener('click', () => {
        try {
            agregarVertice(state.un.grafo, document.getElementById('unVerticeNombre').value);
            document.getElementById('unVerticeNombre').value = '';
            state.un.resultado = clonarGrafo(state.un.grafo);
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    document.getElementById('btnUnEliminarVertice').addEventListener('click', () => {
        try {
            eliminarVertice(state.un.grafo, document.getElementById('unVerticeEliminar').value);
            document.getElementById('unVerticeEliminar').value = '';
            state.un.resultado = clonarGrafo(state.un.grafo);
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
            state.un.resultado = clonarGrafo(state.un.grafo);
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    document.getElementById('btnUnEliminarArista').addEventListener('click', () => {
        try {
            eliminarArista(state.un.grafo, document.getElementById('unAristaEliminar').value);
            document.getElementById('unAristaEliminar').value = '';
            state.un.resultado = clonarGrafo(state.un.grafo);
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
            renderUnGrafo();
            ocultarMensaje('mensajeUnGrafo');
        } catch (e) {
            mostrarMensaje('mensajeUnGrafo', e.message, 'warning');
        }
    });

    plantillaCamposUnGrafo(selectOp.value);
}

function bindEventosDosGrafos() {
    const vincular = (btnAddV, inputV, btnDelV, inputVD, btnAddA, aNom, aIni, aFin, btnDelA, aDel, grafo, alertaId) => {
        document.getElementById(btnAddV).addEventListener('click', () => {
            try {
                agregarVertice(grafo, document.getElementById(inputV).value);
                document.getElementById(inputV).value = '';
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });

        document.getElementById(btnDelV).addEventListener('click', () => {
            try {
                eliminarVertice(grafo, document.getElementById(inputVD).value);
                document.getElementById(inputVD).value = '';
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
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });

        document.getElementById(btnDelA).addEventListener('click', () => {
            try {
                eliminarArista(grafo, document.getElementById(aDel).value);
                document.getElementById(aDel).value = '';
                renderDosGrafos();
                ocultarMensaje(alertaId);
            } catch (e) {
                mostrarMensaje(alertaId, e.message, 'warning');
            }
        });
    };

    vincular('btnDosAgregarV1', 'dosV1Nombre', 'btnDosEliminarV1', 'dosV1Eliminar', 'btnDosAgregarA1', 'dosA1Nombre', 'dosA1Inicio', 'dosA1Fin', 'btnDosEliminarA1', 'dosA1Eliminar', state.dos.g1, 'mensajeDosGrafos');
    vincular('btnDosAgregarV2', 'dosV2Nombre', 'btnDosEliminarV2', 'dosV2Eliminar', 'btnDosAgregarA2', 'dosA2Nombre', 'dosA2Inicio', 'dosA2Fin', 'btnDosEliminarA2', 'dosA2Eliminar', state.dos.g2, 'mensajeDosGrafos');

    document.getElementById('btnDosOperar').addEventListener('click', () => {
        try {
            state.dos.resultado = operarDosGrafos(state.dos.g1, state.dos.g2, document.getElementById('dosOperacion').value);
            renderDosGrafos();
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
    state.un.resultado = clonarGrafo(state.un.grafo);
    state.dos.resultado = clonarGrafo(state.dos.g1);

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
