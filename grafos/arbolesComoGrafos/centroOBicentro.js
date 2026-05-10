(function () {
	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKey(a, b) {
		return [norm(a), norm(b)].sort().join('::');
	}

	const posicionesRender = {};

	function nextVertexPosition(index) {
		const col = index % 5;
		const row = Math.floor(index / 5);
		return { x: 80 + col * 95, y: 80 + row * 78 };
	}

	function obtenerMapaPosiciones(containerId) {
		if (!posicionesRender[containerId]) posicionesRender[containerId] = new Map();
		return posicionesRender[containerId];
	}

	function showMsg(id, text, type) {
		const box = document.getElementById(id);
		if (!box) return;
		box.className = 'alert alert-' + type;
		box.textContent = text;
		box.classList.remove('d-none');
	}

	function hideMsg(id) {
		const box = document.getElementById(id);
		if (!box) return;
		box.classList.add('d-none');
	}

	function buildAdj(vertices, edges) {
		const adj = {};
		vertices.forEach(function (v) { adj[v] = []; });
		edges.forEach(function (e) {
			if (adj[e.inicio] && adj[e.fin]) {
				adj[e.inicio].push(e.fin);
				adj[e.fin].push(e.inicio);
			}
		});
		return adj;
	}

	function isConnected(vertices, edges) {
		if (!vertices.length) return false;
		const adj = buildAdj(vertices, edges);
		const visited = new Set();
		const stack = [vertices[0]];
		while (stack.length) {
			const u = stack.pop();
			if (visited.has(u)) continue;
			visited.add(u);
			(adj[u] || []).forEach(function (w) {
				if (!visited.has(w)) stack.push(w);
			});
		}
		return visited.size === vertices.length;
	}

	function createsCycle(vertices, edges, a, b) {
		if (a === b) return true;
		const adj = buildAdj(vertices, edges);
		const visited = new Set();
		const stack = [a];
		while (stack.length) {
			const u = stack.pop();
			if (u === b) return true;
			if (visited.has(u)) continue;
			visited.add(u);
			(adj[u] || []).forEach(function (w) {
				if (!visited.has(w)) stack.push(w);
			});
		}
		return false;
	}

	function isTree(vertices, edges) {
		return vertices.length > 0 && edges.length === vertices.length - 1 && isConnected(vertices, edges);
	}

	function makeNotation(vertices, edges, withWeight, opts) {
		opts = opts || {};
		const base = opts.base || 'T';
		const weightOnly = !!opts.weightOnly;
		const sSub = opts.sSub || base;
		const aSub = opts.aSub || base;
		function formatRepeated(items) {
			const seen = {};
			return items.map(function (it) {
				const key = String(it);
				seen[key] = (seen[key] || 0) + 1;
				return seen[key] === 1 ? key : (key + '<sup>(' + seen[key] + ')</sup>');
			}).join(', ');
		}
		const s = vertices.join(', ');
		const rawA = edges.map(function (e) {
			if (!withWeight) return e.inicio + '-' + e.fin;
			return weightOnly ? String(e.peso) : (e.inicio + '-' + e.fin + '#' + e.peso);
		});
		const a = formatRepeated(rawA);
		return base + '={S<sub>' + sSub + '</sub>,A<sub>' + aSub + '</sub>}<br>' +
			'S<sub>' + sSub + '</sub>={' + s + '}<br>' +
			'A<sub>' + aSub + '</sub>={' + a + '}';
	}

	function setNotation(id, html) {
		const el = document.getElementById(id);
		if (el) el.innerHTML = html;
	}

	function renderGraph(containerId, vertices, edges, opts) {
		const box = document.getElementById(containerId);
		if (!box) return;
		opts = opts || {};
		box.innerHTML = '';

		if (!vertices.length) {
			box.innerHTML = '<div class="grafo-empty">Agregue vertices y aristas para visualizar.</div>';
			return;
		}

		if (typeof d3 === 'undefined') {
			box.innerHTML = '<div class="grafo-empty">No se pudo cargar el motor de visualizacion (D3).</div>';
			return;
		}

		const width = Math.max(280, box.clientWidth || 520);
		const height = 320;
		const radioNodo = 16;
		const margen = 6;
		const minX = radioNodo + margen;
		const maxX = width - radioNodo - margen;
		const minY = radioNodo + margen;
		const maxY = height - radioNodo - margen;
		const limitar = function (valor, min, max) {
			return Math.max(min, Math.min(max, valor));
		};

		const hLeaf = new Set(opts.hojas || []);
		const hCenter = new Set(opts.centros || []);
		const mstSet = new Set((opts.mstEdges || []).map(function (e) { return edgeKey(e.inicio, e.fin); }));
		const compSet = new Set((opts.compEdges || []).map(function (e) { return edgeKey(e.inicio, e.fin); }));

		const svg = d3.select(box)
			.append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		const posMap = obtenerMapaPosiciones(containerId);
		const keep = new Set(vertices);
		posMap.forEach(function (_, key) {
			if (!keep.has(key)) posMap.delete(key);
		});

		const nodes = vertices.map(function (v, idx) {
			let pos = posMap.get(v);
			if (!pos) {
				pos = nextVertexPosition(idx);
				posMap.set(v, pos);
			}
			return { id: v, x: pos.x, y: pos.y };
		});

		const byId = {};
		nodes.forEach(function (n) { byId[n.id] = n; });

		const links = edges.map(function (a) {
			return {
				source: byId[a.inicio],
				target: byId[a.fin],
				peso: a.peso
			};
		}).filter(function (l) { return l.source && l.target; });

		const link = svg.append('g')
			.selectAll('line')
			.data(links)
			.enter()
			.append('line')
			.attr('class', function (d) {
				const k = edgeKey(d.source.id || d.source, d.target.id || d.target);
				return mstSet.has(k) ? 'link-line mst' : (compSet.has(k) ? 'link-line complemento' : 'link-line');
			});

		const edgeLabel = svg.append('g')
			.selectAll('text')
			.data(links)
			.enter()
			.append('text')
			.attr('class', 'edge-label')
			.text(function (d) {
				return d.peso !== undefined ? String(d.peso) : '';
			});

		const node = svg.append('g')
			.selectAll('circle')
			.data(nodes)
			.enter()
			.append('circle')
			.attr('class', function (d) {
				let cls = 'node-circle';
				if (hLeaf.has(d.id)) cls += ' hoja';
				if (hCenter.has(d.id)) cls += ' centro';
				return cls;
			})
			.attr('r', radioNodo)
			.call(d3.drag().on('drag', function (event, d) {
				d.x = limitar(event.x, minX, maxX);
				d.y = limitar(event.y, minY, maxY);
				const pos = posMap.get(d.id) || {};
				pos.x = d.x;
				pos.y = d.y;
				posMap.set(d.id, pos);
				update();
			}));

		const nodeLabel = svg.append('g')
			.selectAll('text')
			.data(nodes)
			.enter()
			.append('text')
			.attr('class', 'node-label')
			.attr('text-anchor', 'middle')
			.attr('dy', 5)
			.text(function (d) { return d.id; });

		function update() {
			nodes.forEach(function (d) {
				d.x = limitar(d.x || width / 2, minX, maxX);
				d.y = limitar(d.y || height / 2, minY, maxY);
			});

			link
				.attr('x1', function (d) { return limitar(d.source.x, minX, maxX); })
				.attr('y1', function (d) { return limitar(d.source.y, minY, maxY); })
				.attr('x2', function (d) { return limitar(d.target.x, minX, maxX); })
				.attr('y2', function (d) { return limitar(d.target.y, minY, maxY); });

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2 - 6; });

			node
				.attr('cx', function (d) { return d.x; })
				.attr('cy', function (d) { return d.y; });

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });
		}

		update();
	}

	function downloadJson(filename, payload) {
		const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function readJsonFile(file, onOk, onError) {
		const reader = new FileReader();
		reader.onload = function (ev) {
			try {
				onOk(JSON.parse(ev.target.result));
			} catch (err) {
				onError(err);
			}
		};
		reader.readAsText(file);
	}

	function copyEdges(edges) {
		return edges.map(function (e) {
			return { inicio: e.inicio, fin: e.fin, peso: e.peso };
		});
	}

	function pruningSnapshots(vertices, edges) {
		const aliveV = vertices.slice();
		let aliveE = copyEdges(edges);
		const steps = [];

		while (aliveV.length > 2) {
			const adj = buildAdj(aliveV, aliveE);
			const leaves = aliveV.filter(function (v) { return (adj[v] || []).length <= 1; });
			if (!leaves.length) break;
			const leafSet = new Set(leaves);
			const nextV = aliveV.filter(function (v) { return !leafSet.has(v); });
			const nextE = aliveE.filter(function (e) {
				return !leafSet.has(e.inicio) && !leafSet.has(e.fin);
			});
			steps.push({
				hojas: leaves,
				vertices: nextV.slice(),
				aristas: copyEdges(nextE)
			});
			aliveV.splice(0, aliveV.length);
			nextV.forEach(function (v) { aliveV.push(v); });
			aliveE = nextE;
		}

		return {
			steps: steps,
			centros: aliveV.slice(),
			finalEdges: aliveE
		};
	}

	const state = {
		vertices: [],
		aristas: [],
		timers: []
	};

	function clearTimers() {
		state.timers.forEach(function (t) { clearTimeout(t); });
		state.timers = [];
	}

	function refreshCentroView() {
		setNotation('cNotacionArbol', makeNotation(state.vertices, state.aristas, false));
		renderGraph('cGrafoInicial', state.vertices, state.aristas, {});
		if (!document.getElementById('cResultadoTexto').innerHTML) {
			setNotation('cResultadoTexto', 'Pulse <strong>Hallar centro o bicentro</strong> para ejecutar la poda.');
		}
	}

	function initCentroModule() {
		const ids = [
			'btnCAgregarVertice', 'btnCEliminarVertice', 'btnCAgregarArista', 'btnCEliminarArista', 'btnCOperar'
		];
		if (!document.getElementById(ids[0])) return;

		document.getElementById('btnCAgregarVertice').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			const v = norm(document.getElementById('cVerticeNombre').value);
			if (!v) return showMsg('mensajeCentro', 'Ingrese un vertice valido.', 'warning');
			if (state.vertices.indexOf(v) !== -1) return showMsg('mensajeCentro', 'El vertice ya existe.', 'warning');
			state.vertices.push(v);
			document.getElementById('cVerticeNombre').value = '';
			refreshCentroView();
		});

		document.getElementById('btnCEliminarVertice').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			const v = norm(document.getElementById('cVerticeNombre').value);
			const idx = state.vertices.indexOf(v);
			if (idx === -1) return showMsg('mensajeCentro', 'No existe el vertice a eliminar.', 'warning');
			state.vertices.splice(idx, 1);
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== v && e.fin !== v; });
			document.getElementById('cVerticeNombre').value = '';
			refreshCentroView();
		});

		document.getElementById('btnCAgregarArista').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			const a = norm(document.getElementById('cAristaInicio').value);
			const b = norm(document.getElementById('cAristaFin').value);
			if (!a || !b) return showMsg('mensajeCentro', 'Ingrese inicio y fin.', 'warning');
			if (a === b) return showMsg('mensajeCentro', 'No se permiten lazos.', 'warning');
			if (state.vertices.indexOf(a) === -1 || state.vertices.indexOf(b) === -1) {
				return showMsg('mensajeCentro', 'Ambos vertices deben existir.', 'warning');
			}
			const k = edgeKey(a, b);
			if (state.aristas.some(function (e) { return edgeKey(e.inicio, e.fin) === k; })) {
				return showMsg('mensajeCentro', 'La arista ya existe.', 'warning');
			}
			if (createsCycle(state.vertices, state.aristas, a, b)) {
				return showMsg('mensajeCentro', 'Restriccion de arbol: no se permiten ciclos.', 'danger');
			}
			state.aristas.push({ inicio: a, fin: b });
			document.getElementById('cAristaInicio').value = '';
			document.getElementById('cAristaFin').value = '';
			refreshCentroView();
		});

		document.getElementById('btnCEliminarArista').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			const a = norm(document.getElementById('cAristaInicio').value);
			const b = norm(document.getElementById('cAristaFin').value);
			const k = edgeKey(a, b);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return edgeKey(e.inicio, e.fin) !== k; });
			if (before === state.aristas.length) return showMsg('mensajeCentro', 'No se encontro la arista.', 'warning');
			document.getElementById('cAristaInicio').value = '';
			document.getElementById('cAristaFin').value = '';
			refreshCentroView();
		});

		document.getElementById('btnCOperar').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			clearTimers();
			if (!isTree(state.vertices, state.aristas)) {
				return showMsg('mensajeCentro', 'T1 debe ser un arbol valido (sin ciclos, conexo |S|=|A|-1)', 'danger');
			}

			const calc = pruningSnapshots(state.vertices, state.aristas);
			let t = 0;
			renderGraph('cGrafoResultado', state.vertices, state.aristas, {});
			setNotation('cResultadoTexto', 'Ejecutando poda de hojas...');

			calc.steps.forEach(function (step, i) {
				state.timers.push(setTimeout(function () {
					renderGraph('cGrafoResultado', step.vertices, step.aristas, { hojas: step.hojas });
					setNotation('cResultadoTexto', 'Paso ' + (i + 1) + ': se eliminan hojas {' + step.hojas.join(', ') + '}');
				}, t));
				t += 2000;
			});

			state.timers.push(setTimeout(function () {
				const centros = calc.centros;
				renderGraph('cGrafoResultado', centros, calc.finalEdges, { centros: centros });
				if (centros.length === 1) {
					setNotation('cResultadoTexto', 'Centro del arbol: <strong>' + centros[0] + '</strong>');
					showMsg('mensajeCentro', 'Centro encontrado: ' + centros[0], 'success');
				} else {
					setNotation('cResultadoTexto', 'Bicentro del arbol: <strong>{' + centros.join(', ') + '}</strong>');
					showMsg('mensajeCentro', 'Bicentro encontrado: {' + centros.join(', ') + '}', 'success');
				}
			}, t));
		});

		document.getElementById('btnCLimpiar').addEventListener('click', function () {
			hideMsg('mensajeCentro');
			clearTimers();
			state.vertices = [];
			state.aristas = [];
			setNotation('cResultadoTexto', 'Pulse <strong>Hallar centro o bicentro</strong> para ejecutar la poda.');
			renderGraph('cGrafoResultado', [], [], {});
			refreshCentroView();
		});

		document.getElementById('btnCGuardar').addEventListener('click', function () {
			downloadJson('centro_bicentro_arbol.json', {
				tipo: 'centro_bicentro_arbol',
				vertices: state.vertices,
				aristas: state.aristas
			});
			hideMsg('mensajeCentro');
			showMsg('mensajeCentro', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnCCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputCentro');
			if (input) input.click();
		});

		const fileInputCentro = document.getElementById('fileInputCentro');
		if (fileInputCentro) {
			fileInputCentro.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					if (data.tipo !== 'centro_bicentro_arbol') throw new Error('Archivo no compatible.');
					state.vertices = Array.isArray(data.vertices) ? data.vertices : [];
					state.aristas = Array.isArray(data.aristas) ? data.aristas : [];
					setNotation('cResultadoTexto', 'Datos cargados. Pulse <strong>Hallar centro o bicentro</strong>.');
					refreshCentroView();
					hideMsg('mensajeCentro');
					showMsg('mensajeCentro', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('mensajeCentro', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refreshCentroView();
	}

	document.addEventListener('DOMContentLoaded', function () {
		const tabs = ['tab-centro', 'tab-mst', 'tab-dist'];
		tabs.forEach(function (id) {
			const el = document.getElementById(id);
			if (!el) return;
			el.addEventListener('shown.bs.tab', function () {
				const welcome = document.getElementById('panel-bienvenida-arboles');
				if (welcome) welcome.style.display = 'none';
			});
		});
		initCentroModule();
	});

	window.ArbolesUtils = {
		norm: norm,
		edgeKey: edgeKey,
		showMsg: showMsg,
		hideMsg: hideMsg,
		isConnected: isConnected,
		createsCycle: createsCycle,
		isTree: isTree,
		makeNotation: makeNotation,
		setNotation: setNotation,
		renderGraph: renderGraph,
		downloadJson: downloadJson,
		readJsonFile: readJsonFile
	};
})();
