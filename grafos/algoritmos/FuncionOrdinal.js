(function () {
	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKeyDir(a, b) {
		return norm(a) + '->' + norm(b);
	}

	function formatRepeatedValues(values) {
		const seen = {};
		return values.map(function (value) {
			const key = String(value);
			seen[key] = (seen[key] || 0) + 1;
			return seen[key] === 1 ? key : (key + '<sup>(' + seen[key] + ')</sup>');
		}).join(', ');
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

	function setHtml(id, html) {
		const el = document.getElementById(id);
		if (el) el.innerHTML = html;
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

	function parseVertex(raw) {
		if (typeof raw === 'string') {
			return { id: norm(raw), x: NaN, y: NaN };
		}
		if (!raw || typeof raw !== 'object') return { id: '', x: NaN, y: NaN };
		return {
			id: norm(raw.id || raw.nombre || raw.name || raw.vertice),
			x: Number(raw.x),
			y: Number(raw.y)
		};
	}

	function parseEdge(raw, weighted) {
		if (!raw) return null;
		let inicio = '';
		let fin = '';
		let pesoRaw;
		if (Array.isArray(raw)) {
			inicio = norm(raw[0]);
			fin = norm(raw[1]);
			pesoRaw = raw[2];
		} else if (typeof raw === 'object') {
			inicio = norm(raw.inicio || raw.origen || raw.source || raw.from || raw.desde);
			fin = norm(raw.fin || raw.destino || raw.target || raw.to || raw.hasta);
			pesoRaw = raw.peso;
			if (pesoRaw === undefined) pesoRaw = raw.weight;
			if (pesoRaw === undefined) pesoRaw = raw.nombre;
			if (pesoRaw === undefined) pesoRaw = raw.label;
		}
		if (!inicio || !fin) return null;
		if (!weighted) return { inicio: inicio, fin: fin };
		const peso = Number(pesoRaw);
		if (Number.isFinite(peso)) return { inicio: inicio, fin: fin, peso: peso };
		return { inicio: inicio, fin: fin, peso: 1 };
	}

	function loadGraphFromData(data, weighted) {
		const vertices = [];
		const rawVertices = Array.isArray(data.vertices) ? data.vertices : (Array.isArray(data.nodos) ? data.nodos : []);
		rawVertices.forEach(function (v) {
			const parsed = parseVertex(v);
			if (!parsed.id) return;
			if (vertices.some(function (x) { return x.id === parsed.id; })) return;
			const p = nextVertexPosition(vertices);
			vertices.push({
				id: parsed.id,
				x: Number.isFinite(parsed.x) ? parsed.x : p.x,
				y: Number.isFinite(parsed.y) ? parsed.y : p.y
			});
		});
		const idSet = new Set(vertices.map(function (v) { return v.id; }));
		const edges = [];
		const rawEdges = Array.isArray(data.aristas) ? data.aristas : (Array.isArray(data.edges) ? data.edges : []);
		rawEdges.forEach(function (a) {
			const edge = parseEdge(a, weighted);
			if (!edge) return;
			if (!idSet.has(edge.inicio) || !idSet.has(edge.fin)) return;
			if (edge.inicio === edge.fin) return;
			if (edges.some(function (e) { return edgeKeyDir(e.inicio, e.fin) === edgeKeyDir(edge.inicio, edge.fin); })) return;
			edges.push(edge);
		});
		return { vertices: vertices, aristas: edges };
	}

	function getDirectedEdge(inicio, fin, direccion) {
		let a = norm(inicio);
		let b = norm(fin);
		if (direccion === 'reverse') {
			const tmp = a;
			a = b;
			b = tmp;
		}
		return { inicio: a, fin: b };
	}

	function nextVertexPosition(vertices) {
		const idx = vertices.length;
		const col = idx % 5;
		const row = Math.floor(idx / 5);
		return {
			x: 80 + col * 95,
			y: 80 + row * 78
		};
	}

	function isWeaklyConnected(vertices, edges) {
		if (!vertices.length) return false;
		const adj = {};
		vertices.forEach(function (v) { adj[v.id] = []; });
		edges.forEach(function (e) {
			if (!adj[e.inicio] || !adj[e.fin]) return;
			adj[e.inicio].push(e.fin);
			adj[e.fin].push(e.inicio);
		});
		const visited = new Set();
		const stack = [vertices[0].id];
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

	function computeOrdinal(vertices, edges) {
		const byId = {};
		vertices.forEach(function (v) { byId[v.id] = v; });
		const inDegree = {};
		const adj = {};
		vertices.forEach(function (v) {
			inDegree[v.id] = 0;
			adj[v.id] = [];
		});

		edges.forEach(function (e) {
			if (!byId[e.inicio] || !byId[e.fin]) return;
			inDegree[e.fin] += 1;
			adj[e.inicio].push(e.fin);
		});

		const pending = [];
		Object.keys(inDegree).forEach(function (id) {
			if (inDegree[id] === 0) pending.push(id);
		});

		const unassigned = new Set(vertices.map(function (v) { return v.id; }));
		const order = [];
		let usedFallback = false;
		while (unassigned.size) {
			if (!pending.length) {
				usedFallback = true;
				const fallback = Array.from(unassigned).sort(function (a, b) {
					const va = byId[a];
					const vb = byId[b];
					if (va.y !== vb.y) return va.y - vb.y;
					if (va.x !== vb.x) return va.x - vb.x;
					return a.localeCompare(b);
				})[0];
				pending.push(fallback);
			}
			pending.sort(function (a, b) {
				const va = byId[a];
				const vb = byId[b];
				if (va.y !== vb.y) return va.y - vb.y;
				if (va.x !== vb.x) return va.x - vb.x;
				return a.localeCompare(b);
			});
			const u = pending.shift();
			if (!unassigned.has(u)) continue;
			unassigned.delete(u);
			order.push(u);
			adj[u].forEach(function (v) {
				if (!unassigned.has(v)) return;
				inDegree[v] -= 1;
				if (inDegree[v] === 0 && pending.indexOf(v) === -1) pending.push(v);
			});
		}

		const map = {};
		const detailed = order.map(function (id, idx) {
			const ordinal = idx + 1;
			map[id] = ordinal;
			return {
				id: id,
				x: byId[id].x,
				y: byId[id].y,
				ordinal: ordinal
			};
		});
		return { hasCycle: usedFallback, order: detailed, map: map };
	}

	function graphNotation(vertices, edges, weighted) {
		const s = vertices.map(function (v) { return v.id; }).join(', ');
		const rawA = edges.map(function (e) {
			if (!weighted) return e.inicio + '->' + e.fin;
			return String(e.peso);
		});
		const a = formatRepeatedValues(rawA);
		return 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}';
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
			box.innerHTML = '<div class="grafo-empty">No se pudo cargar D3.</div>';
			return;
		}

		const width = Math.max(300, box.clientWidth || 520);
		const height = 340;
		const r = 17;
		const minX = r + 6;
		const minY = r + 6;
		const maxX = width - r - 6;
		const maxY = height - r - 6;
		const clamp = function (value, min, max) {
			return Math.max(min, Math.min(max, value));
		};
		const markerId = 'arrow-' + containerId.replace(/[^a-zA-Z0-9_-]/g, '_');
		const byId = {};
		vertices.forEach(function (v) { byId[v.id] = v; });
		const edgeSet = new Set((opts.resultEdges || []).map(function (e) { return edgeKeyDir(e.inicio, e.fin); }));
		const activeNodes = new Set(opts.activeNodes || []);

		const svg = d3.select(box)
			.append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		svg.append('defs')
			.append('marker')
			.attr('id', markerId)
			.attr('viewBox', '0 0 10 10')
			.attr('refX', 9)
			.attr('refY', 5)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto-start-reverse')
			.append('path')
			.attr('d', 'M 0 0 L 10 5 L 0 10 z')
			.attr('fill', '#8497b0');

		const links = edges.map(function (e) {
			return { inicio: e.inicio, fin: e.fin, peso: e.peso, source: byId[e.inicio], target: byId[e.fin] };
		}).filter(function (e) {
			return !!e.source && !!e.target;
		});

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', function (d) {
				return edgeSet.has(edgeKeyDir(d.inicio, d.fin)) ? 'link-line result' : 'link-line';
			})
			.attr('marker-end', 'url(#' + markerId + ')');

		const edgeLabel = svg.append('g').selectAll('text').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text(function (d) {
				return d.peso !== undefined && d.peso !== null ? String(d.peso) : '';
			});

		const node = svg.append('g').selectAll('circle').data(vertices).enter().append('circle')
			.attr('class', function (d) {
				return activeNodes.has(d.id) ? 'node-circle active' : 'node-circle';
			})
			.attr('r', r)
			.call(d3.drag()
				.on('drag', function (event, d) {
					d.x = clamp(event.x, minX, maxX);
					d.y = clamp(event.y, minY, maxY);
					update();
				})
			);

		const nodeTextMap = opts.nodeTextMap || {};
		const nodeLabel = svg.append('g').selectAll('text.node-main').data(vertices).enter().append('text')
			.attr('class', 'node-label')
			.attr('text-anchor', 'middle')
			.attr('dy', 5)
			.text(function (d) { return nodeTextMap[d.id] || d.id; });

		const nodeSubTextMap = opts.nodeSubTextMap || {};
		const nodeSubText = svg.append('g').selectAll('text.node-subtext').data(vertices).enter().append('text')
			.attr('class', 'node-subtext')
			.attr('text-anchor', 'middle');

		function asLines(raw) {
			if (Array.isArray(raw)) return raw.map(function (x) { return String(x); }).filter(Boolean);
			if (raw === null || raw === undefined) return [];
			return String(raw).split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
		}

		function update() {
			line
				.attr('x1', function (d) {
					const dx = d.target.x - d.source.x;
					const dy = d.target.y - d.source.y;
					const len = Math.sqrt(dx * dx + dy * dy) || 1;
					return clamp(d.source.x + (dx / len) * (r - 1), minX, maxX);
				})
				.attr('y1', function (d) {
					const dx = d.target.x - d.source.x;
					const dy = d.target.y - d.source.y;
					const len = Math.sqrt(dx * dx + dy * dy) || 1;
					return clamp(d.source.y + (dy / len) * (r - 1), minY, maxY);
				})
				.attr('x2', function (d) {
					const dx = d.target.x - d.source.x;
					const dy = d.target.y - d.source.y;
					const len = Math.sqrt(dx * dx + dy * dy) || 1;
					return clamp(d.target.x - (dx / len) * (r + 1), minX, maxX);
				})
				.attr('y2', function (d) {
					const dx = d.target.x - d.source.x;
					const dy = d.target.y - d.source.y;
					const len = Math.sqrt(dx * dx + dy * dy) || 1;
					return clamp(d.target.y - (dy / len) * (r + 1), minY, maxY);
				});

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2 - 8; });

			node
				.attr('cx', function (d) { return d.x = clamp(d.x || width / 2, minX, maxX); })
				.attr('cy', function (d) { return d.y = clamp(d.y || height / 2, minY, maxY); });

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });

			nodeSubText.each(function (d) {
				const lines = asLines(nodeSubTextMap[d.id]);
				const text = d3.select(this);
				text.selectAll('tspan').remove();
				lines.forEach(function (line, idx) {
					text.append('tspan')
						.attr('x', d.x)
						.attr('y', d.y + r + 12 + (idx * 10))
						.text(line);
				});
			});
		}

		update();
	}

	function initTabsWelcome() {
		['tab-ordinal', 'tab-bellman', 'tab-dijkstra', 'tab-floyd'].forEach(function (id) {
			const tab = document.getElementById(id);
			if (!tab) return;
			tab.addEventListener('shown.bs.tab', function () {
				const welcome = document.getElementById('panel-bienvenida-algoritmos');
				if (welcome) welcome.style.display = 'none';
			});
		});
	}

	const state = { vertices: [], aristas: [] };

	function refreshOrdinal() {
		setHtml('oNotacion', graphNotation(state.vertices, state.aristas, false));
		renderGraph('oGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('oResultado').innerHTML) {
			setHtml('oResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		}
	}

	function initOrdinalModule() {
		if (!document.getElementById('btnOAgregarVertice')) return;

		document.getElementById('btnOAgregarVertice').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			const id = norm(document.getElementById('oVerticeNombre').value);
			if (!id) return showMsg('mensajeOrdinal', 'Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('mensajeOrdinal', 'El vértice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('oVerticeNombre').value = '';
			refreshOrdinal();
		});

		document.getElementById('btnOEliminarVertice').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			const id = norm(document.getElementById('oVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('mensajeOrdinal', 'No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('oVerticeNombre').value = '';
			refreshOrdinal();
		});

		document.getElementById('btnOAgregarArista').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			const rawInicio = document.getElementById('oAristaInicio').value;
			const rawFin = document.getElementById('oAristaFin').value;
			const direccion = document.getElementById('oAristaDireccion').value;
			const edge = getDirectedEdge(rawInicio, rawFin, direccion);
			if (!edge.inicio || !edge.fin) return showMsg('mensajeOrdinal', 'Ingrese inicio y fin.', 'warning');
			if (edge.inicio === edge.fin) return showMsg('mensajeOrdinal', 'No se permiten lazos.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === edge.inicio; }) || !state.vertices.some(function (v) { return v.id === edge.fin; })) {
				return showMsg('mensajeOrdinal', 'Ambos vértices deben existir.', 'warning');
			}
			const key = edgeKeyDir(edge.inicio, edge.fin);
			if (state.aristas.some(function (e) { return edgeKeyDir(e.inicio, e.fin) === key; })) {
				return showMsg('mensajeOrdinal', 'La arista dirigida ya existe.', 'warning');
			}
			state.aristas.push(edge);
			document.getElementById('oAristaInicio').value = '';
			document.getElementById('oAristaFin').value = '';
			refreshOrdinal();
		});

		document.getElementById('btnOEliminarArista').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			const rawInicio = document.getElementById('oAristaInicio').value;
			const rawFin = document.getElementById('oAristaFin').value;
			const direccion = document.getElementById('oAristaDireccion').value;
			const edge = getDirectedEdge(rawInicio, rawFin, direccion);
			const key = edgeKeyDir(edge.inicio, edge.fin);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return edgeKeyDir(e.inicio, e.fin) !== key; });
			if (before === state.aristas.length) return showMsg('mensajeOrdinal', 'No se encontró la arista dirigida.', 'warning');
			document.getElementById('oAristaInicio').value = '';
			document.getElementById('oAristaFin').value = '';
			refreshOrdinal();
		});

		document.getElementById('btnOOperar').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			if (!state.vertices.length || !state.aristas.length) {
				return showMsg('mensajeOrdinal', 'Ingrese vértices y aristas dirigidas.', 'warning');
			}
			if (!isWeaklyConnected(state.vertices, state.aristas)) {
				return showMsg('mensajeOrdinal', 'El grafo dirigido debe ser conexo.', 'danger');
			}
			const ord = computeOrdinal(state.vertices, state.aristas);
			const nodeTextMap = {};
			ord.order.forEach(function (o) { nodeTextMap[o.id] = String(o.ordinal); });
			setHtml('oResultado', '<strong>Algoritmo aplicado correctamente.</strong>');
			renderGraph('oGrafoResultado', state.vertices, state.aristas, { nodeTextMap: nodeTextMap, activeNodes: ord.order.map(function (x) { return x.id; }) });
			showMsg('mensajeOrdinal', 'Función Ordinal aplicada correctamente.', 'success');
		});

		document.getElementById('btnOLimpiar').addEventListener('click', function () {
			hideMsg('mensajeOrdinal');
			state.vertices = [];
			state.aristas = [];
			setHtml('oResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			renderGraph('oGrafoResultado', [], [], {});
			refreshOrdinal();
		});

		document.getElementById('btnOGuardar').addEventListener('click', function () {
			downloadJson('funcion_ordinal_grafo.json', {
				tipo: 'funcion_ordinal_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('mensajeOrdinal', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnOCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputOrdinal');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputOrdinal');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data, false);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					setHtml('oResultado', 'Datos cargados. Pulse <strong>Aplicar algoritmo</strong>.');
					refreshOrdinal();
					showMsg('mensajeOrdinal', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('mensajeOrdinal', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refreshOrdinal();
	}

	window.AlgoritmosUtils = {
		norm: norm,
		edgeKeyDir: edgeKeyDir,
		showMsg: showMsg,
		hideMsg: hideMsg,
		setHtml: setHtml,
		downloadJson: downloadJson,
		readJsonFile: readJsonFile,
		getDirectedEdge: getDirectedEdge,
		nextVertexPosition: nextVertexPosition,
		isWeaklyConnected: isWeaklyConnected,
		computeOrdinal: computeOrdinal,
		loadGraphFromData: loadGraphFromData,
		formatRepeatedValues: formatRepeatedValues,
		graphNotation: graphNotation,
		renderGraph: renderGraph
	};

	document.addEventListener('DOMContentLoaded', function () {
		initTabsWelcome();
		initOrdinalModule();
	});
})();



