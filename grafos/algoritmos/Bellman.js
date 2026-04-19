(function () {
	const state = { vertices: [], aristas: [] };

	function refresh() {
		const U = window.AlgoritmosUtils;
		U.setHtml('bNotacion', U.graphNotation(state.vertices, state.aristas, true));
		U.renderGraph('bGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('bResultado').innerHTML) {
			U.setHtml('bResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		}
	}

	function incomingOf(id) {
		return state.aristas.filter(function (e) { return e.fin === id; });
	}

	function initBellman() {
		const U = window.AlgoritmosUtils;
		if (!U || !document.getElementById('btnBAgregarVertice')) return;

		document.getElementById('btnBAgregarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			const id = U.norm(document.getElementById('bVerticeNombre').value);
			if (!id) return U.showMsg('mensajeBellman', 'Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return U.showMsg('mensajeBellman', 'El vértice ya existe.', 'warning');
			const p = U.nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('bVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnBEliminarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			const id = U.norm(document.getElementById('bVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return U.showMsg('mensajeBellman', 'No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('bVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnBAgregarArista').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			const edge = U.getDirectedEdge(
				document.getElementById('bAristaInicio').value,
				document.getElementById('bAristaFin').value,
				document.getElementById('bAristaDireccion').value
			);
			const peso = Number(document.getElementById('bAristaPeso').value);
			if (!edge.inicio || !edge.fin) return U.showMsg('mensajeBellman', 'Ingrese inicio y fin.', 'warning');
			if (edge.inicio === edge.fin) return U.showMsg('mensajeBellman', 'No se permiten lazos.', 'warning');
			if (Number.isNaN(peso) || peso <= 0) return U.showMsg('mensajeBellman', 'El peso debe ser numérico y positivo.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === edge.inicio; }) || !state.vertices.some(function (v) { return v.id === edge.fin; })) {
				return U.showMsg('mensajeBellman', 'Ambos vértices deben existir.', 'warning');
			}
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			if (state.aristas.some(function (e) { return U.edgeKeyDir(e.inicio, e.fin) === key; })) {
				return U.showMsg('mensajeBellman', 'La arista dirigida ya existe.', 'warning');
			}
			state.aristas.push({ inicio: edge.inicio, fin: edge.fin, peso: peso });
			document.getElementById('bAristaInicio').value = '';
			document.getElementById('bAristaFin').value = '';
			document.getElementById('bAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnBEliminarArista').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			const edge = U.getDirectedEdge(
				document.getElementById('bAristaInicio').value,
				document.getElementById('bAristaFin').value,
				document.getElementById('bAristaDireccion').value
			);
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return U.edgeKeyDir(e.inicio, e.fin) !== key; });
			if (before === state.aristas.length) return U.showMsg('mensajeBellman', 'No se encontró la arista dirigida.', 'warning');
			document.getElementById('bAristaInicio').value = '';
			document.getElementById('bAristaFin').value = '';
			document.getElementById('bAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnBOperar').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			if (!state.vertices.length || !state.aristas.length) {
				return U.showMsg('mensajeBellman', 'Ingrese vértices y aristas dirigidas ponderadas.', 'warning');
			}
			if (!U.isWeaklyConnected(state.vertices, state.aristas)) {
				return U.showMsg('mensajeBellman', 'El grafo dirigido debe ser conexo.', 'danger');
			}

			const ord = U.computeOrdinal(state.vertices, state.aristas);
			if (!ord.order.length) {
				return U.showMsg('mensajeBellman', 'No hay vértices para procesar.', 'warning');
			}
			const fuente = ord.order[0].id;
			const destino = ord.order[ord.order.length - 1].id;

			const dist = {};
			const pred = {};
			state.vertices.forEach(function (v) {
				dist[v.id] = Number.POSITIVE_INFINITY;
				pred[v.id] = null;
			});
			dist[fuente] = 0;

			ord.order.forEach(function (item) {
				const v = item.id;
				if (v === fuente) return;
				const incoming = incomingOf(v);
				const candidates = [];
				incoming.forEach(function (e) {
					if (!Number.isFinite(dist[e.inicio])) return;
					const val = dist[e.inicio] + Number(e.peso);
					candidates.push({ from: e.inicio, value: val, peso: e.peso });
				});
				if (!candidates.length) return;
				candidates.sort(function (a, b) {
					if (a.value !== b.value) return a.value - b.value;
					return a.from.localeCompare(b.from);
				});
				dist[v] = candidates[0].value;
				pred[v] = candidates[0].from;
			});

			U.setHtml('bResultado', '<strong>Algoritmo aplicado correctamente.</strong>');

			const resultEdges = [];
			const pathNodes = new Set();
			let cursor = destino;
			if (Number.isFinite(dist[destino])) {
				pathNodes.add(cursor);
				while (cursor !== fuente && pred[cursor]) {
					const padre = pred[cursor];
					const e = state.aristas.find(function (a) { return a.inicio === padre && a.fin === cursor; });
					if (e) resultEdges.unshift(e);
					cursor = padre;
					pathNodes.add(cursor);
				}
			}
			const nodeTextMap = {};
			ord.order.forEach(function (o) {
				nodeTextMap[o.id] = String(o.ordinal);
			});
			const nodeSubTextMap = {};
			Object.keys(dist).forEach(function (id) {
				nodeSubTextMap[id] = 'λ=' + (Number.isFinite(dist[id]) ? dist[id] : 'inf');
			});
			U.renderGraph('bGrafoResultado', state.vertices, state.aristas, {
				resultEdges: resultEdges,
				nodeSubTextMap: nodeSubTextMap,
				nodeTextMap: nodeTextMap,
				activeNodes: Array.from(pathNodes)
			});
			U.showMsg('mensajeBellman', 'Bellman aplicado correctamente.', 'success');
		});

		document.getElementById('btnBLimpiar').addEventListener('click', function () {
			U.hideMsg('mensajeBellman');
			state.vertices = [];
			state.aristas = [];
			U.setHtml('bResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			U.renderGraph('bGrafoResultado', [], [], {});
			refresh();
		});

		document.getElementById('btnBGuardar').addEventListener('click', function () {
			U.downloadJson('bellman_grafo.json', {
				tipo: 'bellman_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			U.showMsg('mensajeBellman', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnBCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputBellman');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputBellman');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				U.readJsonFile(file, function (data) {
					const graph = U.loadGraphFromData(data, true);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					U.setHtml('bResultado', 'Datos cargados. Pulse <strong>Aplicar algoritmo</strong>.');
					refresh();
					U.showMsg('mensajeBellman', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					U.showMsg('mensajeBellman', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refresh();
	}

	document.addEventListener('DOMContentLoaded', initBellman);
})();


