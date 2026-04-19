(function () {
	function uf(vertices) {
		const parent = {};
		const rank = {};
		vertices.forEach(function (v) {
			parent[v] = v;
			rank[v] = 0;
		});
		function find(x) {
			if (parent[x] !== x) parent[x] = find(parent[x]);
			return parent[x];
		}
		function unite(a, b) {
			const ra = find(a);
			const rb = find(b);
			if (ra === rb) return false;
			if (rank[ra] < rank[rb]) parent[ra] = rb;
			else if (rank[ra] > rank[rb]) parent[rb] = ra;
			else {
				parent[rb] = ra;
				rank[ra] += 1;
			}
			return true;
		}
		return { find: find, unite: unite };
	}

	const s = {
		vertices: [],
		aristas: []
	};

	function refresh() {
		const U = window.ArbolesUtils;
		function formatRepeated(items) {
			const seen = {};
			return items.map(function (it) {
				const key = String(it);
				seen[key] = (seen[key] || 0) + 1;
				return seen[key] === 1 ? key : (key + '<sup>(' + seen[key] + ')</sup>');
			}).join(', ');
		}
		const sSet = s.vertices.join(', ');
		const aSet = formatRepeated(s.aristas.map(function (e) { return e.peso; }));
		U.setNotation('mNotacionOriginal',
			'G={S,A}<br>' +
			'S={' + sSet + '}<br>' +
			'A={' + aSet + '}'
		);
		U.renderGraph('mGrafoOriginal', s.vertices, s.aristas, {});
		if (!document.getElementById('mNotacionMST').innerHTML) {
			U.setNotation('mNotacionMST', 'Pulse <strong>Hallar arbol de expansion min.</strong> para calcular T.');
		}
		if (!document.getElementById('mNotacionComplemento').innerHTML) {
			U.setNotation('mNotacionComplemento', '<strong><span class="overline">T</span></strong> pendiente de calcular.');
		}
	}

	function isWeightedConnected(vertices, edges) {
		return window.ArbolesUtils.isConnected(vertices, edges);
	}

	function runAEM(vertices, edges) {
		const sorted = edges.slice().sort(function (a, b) { return a.peso - b.peso; });
		const dsu = uf(vertices);
		const mst = [];
		const skipped = [];
		sorted.forEach(function (e) {
			if (dsu.unite(e.inicio, e.fin)) mst.push(e);
			else skipped.push(e);
		});
		return { mst: mst, skipped: skipped };
	}

	function sumWeight(edges) {
		return edges.reduce(function (acc, e) { return acc + Number(e.peso || 0); }, 0);
	}

	function initMSTModule() {
		const U = window.ArbolesUtils;
		if (!U || !document.getElementById('btnMAgregarVertice')) return;

		document.getElementById('btnMAgregarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			const v = U.norm(document.getElementById('mVerticeNombre').value);
			if (!v) return U.showMsg('mensajeMST', 'Ingrese un vertice valido.', 'warning');
			if (s.vertices.indexOf(v) !== -1) return U.showMsg('mensajeMST', 'El vertice ya existe.', 'warning');
			s.vertices.push(v);
			document.getElementById('mVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMEliminarVertice').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			const v = U.norm(document.getElementById('mVerticeNombre').value);
			const idx = s.vertices.indexOf(v);
			if (idx === -1) return U.showMsg('mensajeMST', 'No existe el vertice a eliminar.', 'warning');
			s.vertices.splice(idx, 1);
			s.aristas = s.aristas.filter(function (e) { return e.inicio !== v && e.fin !== v; });
			document.getElementById('mVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMAgregarArista').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			const a = U.norm(document.getElementById('mAristaInicio').value);
			const b = U.norm(document.getElementById('mAristaFin').value);
			const peso = Number(document.getElementById('mAristaPeso').value);
			if (!a || !b) return U.showMsg('mensajeMST', 'Ingrese inicio y fin.', 'warning');
			if (a === b) return U.showMsg('mensajeMST', 'No se permiten lazos.', 'warning');
			if (Number.isNaN(peso)) return U.showMsg('mensajeMST', 'El peso debe ser numerico.', 'warning');
			if (s.vertices.indexOf(a) === -1 || s.vertices.indexOf(b) === -1) {
				return U.showMsg('mensajeMST', 'Ambos vertices deben existir.', 'warning');
			}
			const k = U.edgeKey(a, b);
			if (s.aristas.some(function (e) { return U.edgeKey(e.inicio, e.fin) === k; })) {
				return U.showMsg('mensajeMST', 'La arista ya existe.', 'warning');
			}
			s.aristas.push({ inicio: a, fin: b, peso: peso });
			document.getElementById('mAristaInicio').value = '';
			document.getElementById('mAristaFin').value = '';
			document.getElementById('mAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnMEliminarArista').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			const a = U.norm(document.getElementById('mAristaInicio').value);
			const b = U.norm(document.getElementById('mAristaFin').value);
			const k = U.edgeKey(a, b);
			const before = s.aristas.length;
			s.aristas = s.aristas.filter(function (e) { return U.edgeKey(e.inicio, e.fin) !== k; });
			if (before === s.aristas.length) return U.showMsg('mensajeMST', 'No se encontro la arista.', 'warning');
			document.getElementById('mAristaInicio').value = '';
			document.getElementById('mAristaFin').value = '';
			document.getElementById('mAristaPeso').value = '';
			refresh();
		});

		document.getElementById('btnMOperar').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			if (!s.vertices.length || !s.aristas.length) {
				return U.showMsg('mensajeMST', 'Ingrese vertices y aristas ponderadas.', 'warning');
			}
			if (!isWeightedConnected(s.vertices, s.aristas)) {
				return U.showMsg('mensajeMST', 'El grafo debe ser conexo para obtener un arbol de expansion minima.', 'danger');
			}

			const res = runAEM(s.vertices, s.aristas);
			if (res.mst.length !== s.vertices.length - 1) {
				return U.showMsg('mensajeMST', 'No fue posible construir un arbol de expansion minima valido.', 'danger');
			}

			const mstKey = new Set(res.mst.map(function (e) { return U.edgeKey(e.inicio, e.fin); }));
			const comp = s.aristas.filter(function (e) { return !mstKey.has(U.edgeKey(e.inicio, e.fin)); });

			const rango = res.mst.length;
			const nulidad = comp.length;

			U.setNotation('mNotacionMST',
				U.makeNotation(s.vertices, res.mst, true, {
					base: 'T',
					sSub: 'T',
					aSub: 'T',
					weightOnly: true
				}) +
				'<br><strong>Rango (# ramas):</strong> ' + rango +
				'<br><strong>Peso(T):</strong> ' + sumWeight(res.mst)
			);

			U.setNotation('mNotacionComplemento',
				'<span class="overline">T</span>={S<sub>T</sub>,A<sub><span class="overline">T</span></sub>}' +
				'<br>S<sub>T</sub>={' + s.vertices.join(', ') + '}' +
				'<br>A<sub><span class="overline">T</span></sub>={' + (comp.length ? (function () {
					const seen = {};
					return comp.map(function (e) {
						const key = String(e.peso);
						seen[key] = (seen[key] || 0) + 1;
						return seen[key] === 1 ? key : (key + '<sup>(' + seen[key] + ')</sup>');
					}).join(', ');
				})() : '') + '}' +
				'<br><strong>Nulidad (# cuerdas):</strong> ' + nulidad
			);

			U.renderGraph('mGrafoMST', s.vertices, res.mst, { mstEdges: res.mst });
			U.renderGraph('mGrafoComplemento', s.vertices, comp, { compEdges: comp });
			U.showMsg('mensajeMST', 'AEM calculado correctamente.', 'success');
		});

		document.getElementById('btnMLimpiar').addEventListener('click', function () {
			U.hideMsg('mensajeMST');
			s.vertices = [];
			s.aristas = [];
			U.setNotation('mNotacionMST', 'Pulse <strong>Hallar arbol de expansion min.</strong> para calcular T.');
			U.setNotation('mNotacionComplemento', '<strong><span class="overline">T</span></strong> pendiente de calcular.');
			U.renderGraph('mGrafoMST', [], [], {});
			U.renderGraph('mGrafoComplemento', [], [], {});
			refresh();
		});

		document.getElementById('btnMGuardar').addEventListener('click', function () {
			U.downloadJson('aem_grafo.json', {
				tipo: 'aem_grafo',
				vertices: s.vertices,
				aristas: s.aristas
			});
			U.showMsg('mensajeMST', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnMCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputMST');
			if (input) input.click();
		});

		const fileInputMST = document.getElementById('fileInputMST');
		if (fileInputMST) {
			fileInputMST.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				U.readJsonFile(file, function (data) {
					if (data.tipo !== 'aem_grafo') throw new Error('Archivo no compatible.');
					s.vertices = Array.isArray(data.vertices) ? data.vertices : [];
					s.aristas = Array.isArray(data.aristas) ? data.aristas : [];
					U.setNotation('mNotacionMST', 'Datos cargados. Pulse <strong>Hallar arbol de expansion min.</strong>.');
					U.setNotation('mNotacionComplemento', '<strong><span class="overline">T</span></strong> pendiente de calcular.');
					refresh();
					U.showMsg('mensajeMST', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					U.showMsg('mensajeMST', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refresh();
	}

	document.addEventListener('DOMContentLoaded', initMSTModule);
})();

