(function () {
	const state = { vertices: [], aristas: [] };

	function refresh() {
		const U = window.AlgoritmosUtils;
		U.setHtml('dNotacion', U.graphNotation(state.vertices, state.aristas, true));
		U.renderGraph('dGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('dResultado').innerHTML) {
			U.setHtml('dResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		}
	}

	function outgoingOf(id) {
		return state.aristas.filter(function (e) { return e.inicio === id; });
	}

	function formatLabel(d, p, fixed, ordMap) {
		if (!Number.isFinite(d)) return '-';
		const pred = p ? (ordMap[p] || p) : '-';
		const txt = '[' + d + ', ' + pred + ']';
		return fixed ? txt + '*' : txt;
	}

	function initDijkstra() {
		const U = window.AlgoritmosUtils;
		if (!U || !document.getElementById('btnDAgregarVertice')) return;

		document.getElementById('btnDAgregarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			const id = U.norm(document.getElementById('dVerticeNombre').value);
			if (!id) return U.showMsg('mensajeDijkstra', 'Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return U.showMsg('mensajeDijkstra', 'El vértice ya existe.', 'warning');
			const p = U.nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('dVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnDEliminarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			const id = U.norm(document.getElementById('dVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return U.showMsg('mensajeDijkstra', 'No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('dVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnDAgregarArista').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			const edge = U.getDirectedEdge(
				document.getElementById('dAristaInicio').value,
				document.getElementById('dAristaFin').value,
				document.getElementById('dAristaDireccion').value
			);
			const peso = Number(document.getElementById('dAristaPeso').value);
			if (!edge.inicio || !edge.fin) return U.showMsg('mensajeDijkstra', 'Ingrese inicio y fin.', 'warning');
			if (edge.inicio === edge.fin) return U.showMsg('mensajeDijkstra', 'No se permiten lazos.', 'warning');
			if (Number.isNaN(peso) || peso <= 0) return U.showMsg('mensajeDijkstra', 'El peso debe ser numérico y positivo.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === edge.inicio; }) || !state.vertices.some(function (v) { return v.id === edge.fin; })) {
				return U.showMsg('mensajeDijkstra', 'Ambos vértices deben existir.', 'warning');
			}
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			if (state.aristas.some(function (e) { return U.edgeKeyDir(e.inicio, e.fin) === key; })) {
				return U.showMsg('mensajeDijkstra', 'La arista dirigida ya existe.', 'warning');
			}
			state.aristas.push({ inicio: edge.inicio, fin: edge.fin, peso: peso });
			document.getElementById('dAristaInicio').value = '';
			document.getElementById('dAristaFin').value = '';
			document.getElementById('dAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnDEliminarArista').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			const edge = U.getDirectedEdge(
				document.getElementById('dAristaInicio').value,
				document.getElementById('dAristaFin').value,
				document.getElementById('dAristaDireccion').value
			);
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return U.edgeKeyDir(e.inicio, e.fin) !== key; });
			if (before === state.aristas.length) return U.showMsg('mensajeDijkstra', 'No se encontró la arista dirigida.', 'warning');
			document.getElementById('dAristaInicio').value = '';
			document.getElementById('dAristaFin').value = '';
			document.getElementById('dAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnDOperar').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			if (!state.vertices.length || !state.aristas.length) {
				return U.showMsg('mensajeDijkstra', 'Ingrese vértices y aristas dirigidas ponderadas.', 'warning');
			}
			if (!U.isWeaklyConnected(state.vertices, state.aristas)) {
				return U.showMsg('mensajeDijkstra', 'El grafo dirigido debe ser conexo.', 'danger');
			}

			const ord = U.computeOrdinal(state.vertices, state.aristas);
			if (!ord.order.length) {
				return U.showMsg('mensajeDijkstra', 'No hay vértices para procesar.', 'warning');
			}
			const fuente = ord.order[0].id;
			const destino = ord.order[ord.order.length - 1].id;
			const ordMap = ord.map;

			const dist = {};
			const pred = {};
			const fixed = {};
			const tempLabels = {};
			state.vertices.forEach(function (v) {
				dist[v.id] = Number.POSITIVE_INFINITY;
				pred[v.id] = null;
				fixed[v.id] = false;
				tempLabels[v.id] = [];
			});
			dist[fuente] = 0;
			fixed[fuente] = true;

			let active = fuente;
			while (active) {
				outgoingOf(active).forEach(function (e) {
					if (fixed[e.fin]) return;
					const candidate = dist[active] + Number(e.peso);
					tempLabels[e.fin].push('[' + candidate + ', ' + (ordMap[active] || active) + ']');
					if (candidate < dist[e.fin]) {
						dist[e.fin] = candidate;
						pred[e.fin] = active;
					}
				});

				let next = null;
				state.vertices.forEach(function (v) {
					if (fixed[v.id] || !Number.isFinite(dist[v.id])) return;
					if (!next || dist[v.id] < dist[next] || (dist[v.id] === dist[next] && v.id.localeCompare(next) < 0)) {
						next = v.id;
					}
				});

				if (!next) break;
				fixed[next] = true;
				active = next;
			}

			U.setHtml('dResultado', '<strong>Algoritmo aplicado correctamente.</strong>');

			const resultEdges = [];
			const pathNodes = new Set();
			let cursor = destino;
			if (Number.isFinite(dist[destino])) {
				pathNodes.add(cursor);
				while (cursor !== fuente && pred[cursor]) {
					const padre = pred[cursor];
					const edge = state.aristas.find(function (e) { return e.inicio === padre && e.fin === cursor; });
					if (edge) resultEdges.unshift(edge);
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
				const permanent = formatLabel(dist[id], pred[id], fixed[id], ordMap);
				const permanentBase = permanent.endsWith('*') ? permanent.slice(0, -1) : permanent;
				const lines = tempLabels[id].filter(function (t) {
					return t !== permanentBase;
				});
				if (permanent !== '-') lines.push(permanent);
				nodeSubTextMap[id] = lines;
			});
			U.renderGraph('dGrafoResultado', state.vertices, state.aristas, {
				resultEdges: resultEdges,
				activeNodes: Array.from(pathNodes),
				nodeSubTextMap: nodeSubTextMap,
				nodeTextMap: nodeTextMap
			});
			U.showMsg('mensajeDijkstra', 'Dijkstra aplicado correctamente.', 'success');
		});

		document.getElementById('btnDLimpiar').addEventListener('click', function () {
			U.hideMsg('mensajeDijkstra');
			state.vertices = [];
			state.aristas = [];
			U.setHtml('dResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			U.renderGraph('dGrafoResultado', [], [], {});
			refresh();
		});

		document.getElementById('btnDGuardar').addEventListener('click', function () {
			U.downloadJson('dijkstra_grafo.json', {
				tipo: 'dijkstra_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			U.showMsg('mensajeDijkstra', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnDCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputDijkstra');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputDijkstra');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				U.readJsonFile(file, function (data) {
					const graph = U.loadGraphFromData(data, true);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					U.setHtml('dResultado', 'Datos cargados. Pulse <strong>Aplicar algoritmo</strong>.');
					refresh();
					U.showMsg('mensajeDijkstra', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					U.showMsg('mensajeDijkstra', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refresh();
	}

	document.addEventListener('DOMContentLoaded', initDijkstra);
})();


