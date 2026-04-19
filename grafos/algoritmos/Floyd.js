(function () {
	const state = { vertices: [], aristas: [] };

	function refresh() {
		const U = window.AlgoritmosUtils;
		U.setHtml('fNotacion', U.graphNotation(state.vertices, state.aristas, true));
		U.renderGraph('fGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('fResultado').innerHTML) {
			U.setHtml('fResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		}
		if (!document.getElementById('fMatrices').innerHTML) {
			U.setHtml('fMatrices', 'Matrices pendientes de cálculo.');
		}
	}

	function cloneMatrix(m) {
		return m.map(function (row) { return row.slice(); });
	}

	function matrixToHtml(label, matrix, ids) {
		const head = '<tr><th></th>' + ids.map(function (id) { return '<th>' + id + '</th>'; }).join('') + '</tr>';
		const body = matrix.map(function (row, i) {
			const cols = row.map(function (v) {
				return '<td>' + (Number.isFinite(v) ? v : '&infin;') + '</td>';
			}).join('');
			return '<tr><th>' + ids[i] + '</th>' + cols + '</tr>';
		}).join('');
		return '<div class="matrix-wrap"><div class="matrix-title">' + label + '</div><table class="matrix-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
	}

	function initFloyd() {
		const U = window.AlgoritmosUtils;
		if (!U || !document.getElementById('btnFAgregarVertice')) return;

		document.getElementById('btnFAgregarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			const id = U.norm(document.getElementById('fVerticeNombre').value);
			if (!id) return U.showMsg('mensajeFloyd', 'Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return U.showMsg('mensajeFloyd', 'El vértice ya existe.', 'warning');
			const p = U.nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('fVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnFEliminarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			const id = U.norm(document.getElementById('fVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return U.showMsg('mensajeFloyd', 'No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('fVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnFAgregarArista').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			const edge = U.getDirectedEdge(
				document.getElementById('fAristaInicio').value,
				document.getElementById('fAristaFin').value,
				document.getElementById('fAristaDireccion').value
			);
			const peso = Number(document.getElementById('fAristaPeso').value);
			if (!edge.inicio || !edge.fin) return U.showMsg('mensajeFloyd', 'Ingrese inicio y fin.', 'warning');
			if (edge.inicio === edge.fin) return U.showMsg('mensajeFloyd', 'No se permiten lazos.', 'warning');
			if (Number.isNaN(peso) || peso <= 0) return U.showMsg('mensajeFloyd', 'El peso debe ser numérico y positivo.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === edge.inicio; }) || !state.vertices.some(function (v) { return v.id === edge.fin; })) {
				return U.showMsg('mensajeFloyd', 'Ambos vértices deben existir.', 'warning');
			}
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			if (state.aristas.some(function (e) { return U.edgeKeyDir(e.inicio, e.fin) === key; })) {
				return U.showMsg('mensajeFloyd', 'La arista dirigida ya existe.', 'warning');
			}
			state.aristas.push({ inicio: edge.inicio, fin: edge.fin, peso: peso });
			document.getElementById('fAristaInicio').value = '';
			document.getElementById('fAristaFin').value = '';
			document.getElementById('fAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnFEliminarArista').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			const edge = U.getDirectedEdge(
				document.getElementById('fAristaInicio').value,
				document.getElementById('fAristaFin').value,
				document.getElementById('fAristaDireccion').value
			);
			const key = U.edgeKeyDir(edge.inicio, edge.fin);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return U.edgeKeyDir(e.inicio, e.fin) !== key; });
			if (before === state.aristas.length) return U.showMsg('mensajeFloyd', 'No se encontró la arista dirigida.', 'warning');
			document.getElementById('fAristaInicio').value = '';
			document.getElementById('fAristaFin').value = '';
			document.getElementById('fAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnFOperar').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			if (!state.vertices.length || !state.aristas.length) {
				return U.showMsg('mensajeFloyd', 'Ingrese vértices y aristas dirigidas ponderadas.', 'warning');
			}
			if (!U.isWeaklyConnected(state.vertices, state.aristas)) {
				return U.showMsg('mensajeFloyd', 'El grafo dirigido debe ser conexo.', 'danger');
			}

			const ord = U.computeOrdinal(state.vertices, state.aristas);

			const ids = ord.order.map(function (o) { return o.id; });
			const ordLabels = ord.order.map(function (o) { return String(o.ordinal); });
			const idx = {};
			ids.forEach(function (id, i) { idx[id] = i; });
			const n = ids.length;

			let d = [];
			for (let i = 0; i < n; i += 1) {
				d[i] = [];
				for (let k = 0; k < n; k += 1) d[i][k] = i === k ? 0 : Number.POSITIVE_INFINITY;
			}

			state.aristas.forEach(function (e) {
				const i = idx[e.inicio];
				const k = idx[e.fin];
				if (i === undefined || k === undefined) return;
				if (Number(e.peso) < d[i][k]) d[i][k] = Number(e.peso);
			});

			const matrices = [{ name: 'Matriz inicial', values: cloneMatrix(d) }];
			for (let j = 0; j < n; j += 1) {
				for (let i = 0; i < n; i += 1) {
					for (let k = 0; k < n; k += 1) {
						if (!Number.isFinite(d[i][j]) || !Number.isFinite(d[j][k])) continue;
						const candidate = d[i][j] + d[j][k];
						if (candidate < d[i][k]) d[i][k] = candidate;
					}
				}
				matrices.push({ name: 'J=' + (j + 1), values: cloneMatrix(d) });
			}

			U.setHtml('fResultado',
				'Encuentra los caminos más cortos entre todos los pares de vértices de un grafo ponderado usando la ecuación Dᵢⱼ + Dⱼₖ < Dᵢₖ.'
			);

			U.setHtml('fMatrices', matrices.map(function (m) {
				return matrixToHtml(m.name, m.values, ordLabels);
			}).join(''));
			U.showMsg('mensajeFloyd', 'Floyd aplicado correctamente.', 'success');
		});

		document.getElementById('btnFLimpiar').addEventListener('click', function () {
			U.hideMsg('mensajeFloyd');
			state.vertices = [];
			state.aristas = [];
			U.setHtml('fResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			U.setHtml('fMatrices', 'Matrices pendientes de cálculo.');
			refresh();
		});

		document.getElementById('btnFGuardar').addEventListener('click', function () {
			U.downloadJson('floyd_grafo.json', {
				tipo: 'floyd_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			U.showMsg('mensajeFloyd', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnFCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputFloyd');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputFloyd');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				U.readJsonFile(file, function (data) {
					const graph = U.loadGraphFromData(data, true);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					U.setHtml('fResultado', 'Datos cargados. Pulse <strong>Aplicar algoritmo</strong>.');
					U.setHtml('fMatrices', 'Matrices pendientes de cálculo.');
					refresh();
					U.showMsg('mensajeFloyd', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					U.showMsg('mensajeFloyd', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refresh();
	}

	document.addEventListener('DOMContentLoaded', initFloyd);
})();


