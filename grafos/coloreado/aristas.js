/**
 * aristas.js - Módulo de cálculo para el coloreado de aristas
 */
(function () {
    // Función auxiliar de barajado local para aleatoriedad del backtracking
    function shuffled(arr) {
        const out = arr.slice();
        for (let i = out.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = out[i];
            out[i] = out[j];
            out[j] = t;
        }
        return out;
    }

    // Algoritmo de backtracking para colorear el grafo de línea (aristas adyacentes)
    function randomValidEdgeColoring(vertices, edges, k) {
        const edgeAdj = edges.map(function () { return new Set(); });
        for (let i = 0; i < edges.length; i += 1) {
            for (let j = i + 1; j < edges.length; j += 1) {
                const a = edges[i];
                const b = edges[j];
                if (a.inicio === b.inicio || a.inicio === b.fin || a.fin === b.inicio || a.fin === b.fin) {
                    edgeAdj[i].add(j);
                    edgeAdj[j].add(i);
                }
            }
        }

        for (let attempt = 0; attempt < 100; attempt += 1) {
            const order = shuffled(Array.from({ length: edges.length }, function (_, i) { return i; }));
            const color = {};

            function bt(idx) {
                if (idx >= order.length) return true;
                const eIdx = order[idx];
                const colors = shuffled(Array.from({ length: k }, function (_, i) { return i; }));
                for (let ci = 0; ci < colors.length; ci += 1) {
                    const c = colors[ci];
                    let ok = true;
                    edgeAdj[eIdx].forEach(function (nb) {
                        if (color[nb] === c) ok = false;
                    });
                    if (!ok) continue;
                    color[eIdx] = c;
                    if (bt(idx + 1)) return true;
                    delete color[eIdx];
                }
                return false;
            }
            if (bt(0)) return color;
        }
        return null;
    }

    /**
     * Calcula el Índice Cromático X'(G) aplicando el Teorema de Vizing.
     * Retorna { chiPrime: número, assign: objeto de mapeo de color por índice de arista }
     */
    function computeChromaticIndex(vertices, edges) {
        if (!edges.length) return { chiPrime: 0, assign: {} };

        // 1. Encontrar el grado máximo Delta del grafo
        const degrees = {};
        vertices.forEach(function (id) { degrees[id] = 0; });
        edges.forEach(function (e) {
            if (degrees[e.inicio] !== undefined) degrees[e.inicio]++;
            if (degrees[e.fin] !== undefined) degrees[e.fin]++;
        });

        let delta = 0;
        Object.keys(degrees).forEach(function (id) {
            if (degrees[id] > delta) delta = degrees[id];
        });

        // 2. Por Teorema de Vizing X'(G) es Delta o Delta + 1. Probamos primero con Delta
        let assign = randomValidEdgeColoring(vertices, edges, delta);
        if (assign) {
            return { chiPrime: delta, assign: assign };
        }

        // 3. Si falla con Delta, obligatoriamente se requiere Delta + 1 colores
        assign = randomValidEdgeColoring(vertices, edges, delta + 1);
        return { chiPrime: delta + 1, assign: assign };
    }

    // Exponer la lógica al entorno global para que sea consumida por vertices.js
    window.GraphEdgeColoring = {
        computeChromaticIndex: computeChromaticIndex
    };
})();