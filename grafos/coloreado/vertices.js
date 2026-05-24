/**
 * vertices.js - Orquestador principal de UI, renderizado D3 y coloreado de vértices
 */
(function () {
	const state = {
		vertices: [],
		aristas: [],
		mode: 'vertices'
	};

	const COLOR_PALETTE = [
		'#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4',
		'#f032e6', '#bfef45', '#fabed4', '#469990', '#9a6324', '#800000'
	];
	const COLOR_INITIALS = ['R', 'V', 'A', 'Az', 'N', 'P', 'M', 'O', 'Rs', 'T', 'Mr', 'C'];

	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKeyUnd(a, b) {
		const x = norm(a);
		const y = norm(b);
		return x < y ? (x + '::' + y) : (y + '::' + x);
	}

	function showMsg(text, type) {
		const box = document.getElementById('mensajeColoreado');
		if (!box) return;
		box.className = 'alert alert-' + type;
		box.textContent = text;
		box.classList.remove('d-none');
	}

	function hideMsg() {
		const box = document.getElementById('mensajeColoreado');
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

	function nextVertexPosition(vertices) {
		const idx = vertices.length;
		const col = idx % 5;
		const row = Math.floor(idx / 5);
		return { x: 80 + col * 95, y: 80 + row * 78 };
	}

	function parseVertex(raw) {
		if (typeof raw === 'string') return { id: norm(raw), x: NaN, y: NaN };
		if (!raw || typeof raw !== 'object') return { id: '', x: NaN, y: NaN };
		return {
			id: norm(raw.id || raw.nombre || raw.name || raw.vertice),
			x: Number(raw.x),
			y: Number(raw.y)
		};
	}

	function parseEdge(raw) {
		if (!raw) return null;
		let inicio;
		let fin;
		if (Array.isArray(raw)) {
			inicio = norm(raw[0]);
			fin = norm(raw[1]);
		} else {
			inicio = norm(raw.inicio || raw.origen || raw.source || raw.from || raw.desde);
			fin = norm(raw.fin || raw.destino || raw.target || raw.to || raw.hasta);
		}
		if (!inicio || !fin || inicio === fin) return null;
		return { inicio: inicio, fin: fin };
	}

	function loadGraphFromData(data) {
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

		const edges = [];
		const rawEdges = Array.isArray(data.aristas) ? data.aristas : (Array.isArray(data.edges) ? data.edges : []);
		rawEdges.forEach(function (a) {
			const edge = parseEdge(a);
			if (!edge) return;
			if (!vertices.some(function (v) { return v.id === edge.inicio; }) || !vertices.some(function (v) { return v.id === edge.fin; })) return;
			if (edges.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(edge.inicio, edge.fin); })) return;
			edges.push(edge);
		});
		return { vertices: vertices, aristas: edges };
	}

	function getConnectedComponents(vertices, edges) {
		const ids = vertices.map(function (v) { return v.id; });
		const adj = {};
		ids.forEach(function (id) { adj[id] = []; });
		edges.forEach(function (e) {
			if (!adj[e.inicio] || !adj[e.fin]) return;
			adj[e.inicio].push(e.fin);
			adj[e.fin].push(e.inicio);
		});

		const visited = new Set();
		const comps = [];
		ids.forEach(function (start) {
			if (visited.has(start)) return;
			const stack = [start];
			const comp = [];
			while (stack.length) {
				const u = stack.pop();
				if (visited.has(u)) continue;
				visited.add(u);
				comp.push(u);
				(adj[u] || []).forEach(function (w) {
					if (!visited.has(w)) stack.push(w);
				});
			}
			comp.sort();
			comps.push(comp);
		});
		return comps;
	}

	function graphNotation(vertices, edges) {
		const s = vertices.map(function (v) { return v.id; }).join(', ');
		const a = edges.map(function (e) { return e.inicio + '-' + e.fin; }).join(', ');
		return 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}';
	}

	function buildAdjacency(vertices, edges) {
		const adj = {};
		vertices.forEach(function (v) { adj[v.id] = new Set(); });
		edges.forEach(function (e) {
			if (!adj[e.inicio] || !adj[e.fin]) return;
			adj[e.inicio].add(e.fin);
			adj[e.fin].add(e.inicio);
		});
		return adj;
	}

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

	function canColorWithK(vertices, adj, k) {
		const order = vertices.slice().sort(function (a, b) {
			const da = (adj[a] ? adj[a].size : 0);
			const db = (adj[b] ? adj[b].size : 0);
			if (da !== db) return db - da;
			return a.localeCompare(b);
		});
		const assign = {};

		function bt(idx) {
			if (idx >= order.length) return true;
			const v = order[idx];
			for (let c = 0; c < k; c += 1) {
				let ok = true;
				(adj[v] || []).forEach(function (nb) {
					if (assign[nb] === c) ok = false;
				});
				if (!ok) continue;
				assign[v] = c;
				if (bt(idx + 1)) return true;
				delete assign[v];
			}
			return false;
		}
		return bt(0);
	}

	function computeChromaticNumber(vertices, adj) {
		if (!vertices.length) return 0;
		for (let k = 1; k <= vertices.length; k += 1) {
			if (canColorWithK(vertices, adj, k)) return k;
		}
		return vertices.length;
	}

	function randomValidVertexColoring(vertices, adj, k) {
		const orderBase = vertices.slice().sort(function (a, b) {
			const da = (adj[a] ? adj[a].size : 0);
			const db = (adj[b] ? adj[b].size : 0);
			if (da !== db) return db - da;
			return a.localeCompare(b);
		});

		for (let attempt = 0; attempt < 100; attempt += 1) {
			const order = shuffled(orderBase);
			const assign = {};

			function bt(idx) {
				if (idx >= order.length) return true;
				const v = order[idx];
				const colors = shuffled(Array.from({ length: k }, function (_, i) { return i; }));
				for (let ci = 0; ci < colors.length; ci += 1) {
					const c = colors[ci];
					let ok = true;
					(adj[v] || []).forEach(function (nb) {
						if (assign[nb] === c) ok = false;
					});
					if (!ok) continue;
					assign[v] = c;
					if (bt(idx + 1)) return true;
					delete assign[v];
				}
				return false;
			}
			if (bt(0)) return assign;
		}
		return null;
	}

	function normalizePolyGraph(vertices, edges) {
		const v = Array.from(new Set(vertices.map(norm))).filter(Boolean).sort();
		const eSet = new Set();
		edges.forEach(function (ed) {
			const a = norm(ed.u || ed.inicio || ed[0]);
			const b = norm(ed.v || ed.fin || ed[1]);
			if (!a || !b || a === b) return;
			const key = a < b ? (a + '|' + b) : (b + '|' + a);
			eSet.add(key);
		});
		const e = Array.from(eSet).sort().map(function (k) {
			const p = k.split('|');
			return { u: p[0], v: p[1] };
		});
		return { vertices: v, edges: e };
	}

	function graphPolyKey(vertices, edges) {
		const v = vertices.slice().sort().join(',');
		const e = edges.map(function (x) {
			return x.u < x.v ? (x.u + '|' + x.v) : (x.v + '|' + x.u);
		}).sort().join(',');
		return v + '::' + e;
	}

	function polyMonomial(deg) {
		const p = {};
		p[deg] = 1n;
		return p;
	}

	function polySub(a, b) {
		const out = {};
		Object.keys(a).forEach(function (k) { out[k] = (out[k] || 0n) + a[k]; });
		Object.keys(b).forEach(function (k) { out[k] = (out[k] || 0n) - b[k]; });
		Object.keys(out).forEach(function (k) {
			if (out[k] === 0n) delete out[k];
		});
		return out;
	}

	function contractEdge(vertices, edges, edge) {
		const keep = edge.u;
		const remove = edge.v;
		const nVertices = vertices.filter(function (x) { return x !== remove; });
		const nSet = new Set(nVertices);
		const set = new Set();
		edges.forEach(function (e) {
			if ((e.u === edge.u && e.v === edge.v) || (e.u === edge.v && e.v === edge.u)) return;
			let a = e.u === remove ? keep : e.u;
			let b = e.v === remove ? keep : e.v;
			if (a === b) return;
			if (!nSet.has(a) || !nSet.has(b)) return;
			const key = a < b ? (a + '|' + b) : (b + '|' + a);
			set.add(key);
		});
		const nEdges = Array.from(set).sort().map(function (k) {
			const p = k.split('|');
			return { u: p[0], v: p[1] };
		});
		return { vertices: nVertices, edges: nEdges };
	}

	function chromaticPolynomial(vertices, edges) {
		const g = normalizePolyGraph(vertices, edges);
		const memo = new Map();

		function solve(v, e) {
			const key = graphPolyKey(v, e);
			if (memo.has(key)) return memo.get(key);
			let out;
			if (!e.length) {
				out = polyMonomial(v.length);
			} else {
				const picked = e[0];
				const del = solve(v, e.slice(1));
				const conGraph = contractEdge(v, e, picked);
				const con = solve(conGraph.vertices, conGraph.edges);
				out = polySub(del, con);
			}
			memo.set(key, out);
			return out;
		}
		return solve(g.vertices, g.edges);
	}

	function polyDegree(poly) {
		const degs = Object.keys(poly)
			.filter(function (k) { return poly[k] !== 0n; })
			.map(Number)
			.sort(function (a, b) { return b - a; });
		return degs.length ? degs[0] : -1;
	}

	function polyDenseDesc(poly) {
		const deg = polyDegree(poly);
		if (deg < 0) return [0n];
		const desc = [];
		for (let d = deg; d >= 0; d -= 1) desc.push(poly[d] || 0n);
		return desc;
	}

	function polyEvalAt(poly, xBig) {
		const desc = polyDenseDesc(poly);
		let acc = 0n;
		for (let i = 0; i < desc.length; i += 1) {
			acc = (acc * xBig) + desc[i];
		}
		return acc;
	}

	function renderGraph(containerId, vertices, edges, opts) {
		const box = document.getElementById(containerId);
		if (!box) return;
		opts = opts || {};
		box.innerHTML = '';
		if (!vertices.length) {
			box.innerHTML = '<div class="grafo-empty">Agregue vértices y aristas para visualizar.</div>';
			return;
		}
		if (typeof d3 === 'undefined') {
			box.innerHTML = '<div class="grafo-empty">No se pudo cargar D3.</div>';
			return;
		}

		const width = Math.max(320, box.clientWidth || 520);
		const height = 340;
		const r = 17;
		const clamp = function (v, min, max) { return Math.max(min, Math.min(max, v)); };
		const minX = r + 6;
		const minY = r + 6;
		const maxX = width - r - 6;
		const maxY = height - r - 6;
		const byId = {};
		vertices.forEach(function (v) { byId[v.id] = v; });

		const svg = d3.select(box).append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		const links = edges.map(function (e) {
			return { inicio: e.inicio, fin: e.fin, source: byId[e.inicio], target: byId[e.fin] };
		}).filter(function (e) { return !!e.source && !!e.target; });

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', 'link-line');

		const edgeLabel = svg.append('g').selectAll('text').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text('');

		const colorMap = opts.nodeColorMap || {};
		const edgeColorMap = opts.edgeColorMap || {};

		const node = svg.append('g').selectAll('circle').data(vertices).enter().append('circle')
			.attr('class', 'node-circle')
			.attr('r', r)
			.style('fill', function (d) { return colorMap[d.id] || '#5b9bd5'; })
			.call(d3.drag().on('drag', function (event, d) {
				d.x = clamp(event.x, minX, maxX);
				d.y = clamp(event.y, minY, maxY);
				update();
			}));

		const nodeLabel = svg.append('g').selectAll('text.node-main').data(vertices).enter().append('text')
			.attr('class', 'node-label')
			.attr('text-anchor', 'middle')
			.attr('dy', 5)
			.text(function (d) { return d.id; });

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
				})
				.style('stroke', function (d, i) {
					return edgeColorMap[i] || '#8497b0';
				})
				.style('stroke-width', function (d, i) {
					return edgeColorMap[i] ? 4 : 2;
				});

			node
				.attr('cx', function (d) { return d.x = clamp(d.x || width / 2, minX, maxX); })
				.attr('cy', function (d) { return d.y = clamp(d.y || height / 2, minY, maxY); })
				.style('fill', function (d) { return colorMap[d.id] || '#5b9bd5'; });

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2 - 8; });

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });
		}
		update();
	}

	function refresh() {
		setHtml('cNotacion', graphNotation(state.vertices, state.aristas));
		renderGraph('cGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('cResultado').innerHTML) {
			setHtml('cResultado', 'Pulse <strong>Calcular</strong>.');
		}
	}

	function applyColoring() {
		hideMsg();
		if (!state.vertices.length) {
			return showMsg('Ingrese al menos un vértice para calcular.', 'warning');
		}

		if (state.mode === 'vertices') {
			const ids = state.vertices.map(function (v) { return v.id; });
			const adj = buildAdjacency(state.vertices, state.aristas);
			const chi = computeChromaticNumber(ids, adj);
			let assign = randomValidVertexColoring(ids, adj, chi);
			if (!assign) {
				return showMsg('No fue posible generar una coloración válida.', 'danger');
			}

			const nodeColorMap = {};
			Object.keys(assign).forEach(function (id) {
				nodeColorMap[id] = COLOR_PALETTE[assign[id] % COLOR_PALETTE.length];
			});

			const components = getConnectedComponents(state.vertices, state.aristas);
			const polyFactors = components.map(function (comp) {
				const cSet = new Set(comp);
				const cEdges = state.aristas.filter(function (e) {
					return cSet.has(e.inicio) && cSet.has(e.fin);
				}).map(function (e) {
					return { u: e.inicio, v: e.fin };
				});
				return chromaticPolynomial(comp, cEdges);
			});

			let combinations = 1n;
			polyFactors.forEach(function (p) {
				combinations *= polyEvalAt(p, BigInt(chi));
			});

			const usedColors = new Set(Object.keys(assign).map(function (k) { return assign[k]; })).size;
			const classByColor = {};
			Object.keys(assign).forEach(function (id) {
				const c = assign[id];
				if (!classByColor[c]) classByColor[c] = [];
				classByColor[c].push(id);
			});
			const colorKeys = Object.keys(classByColor).map(Number).sort(function (a, b) { return a - b; });
			function classLabel(idx) {
				return COLOR_INITIALS[idx] || ('C' + (idx + 1));
			}
			const clasesHtml = colorKeys.map(function (k, i) {
				const label = classLabel(i);
				const items = classByColor[k].slice().sort().join(', ');
				return label + ' = {' + items + '}';
			}).join('<br>');

			setHtml('cResultado',
				'<strong>Polinomio cromático:</strong> ' + combinations + ' combinación(es).' +
				'<br><strong>Número cromático X(G):</strong> ' + chi +
				'<br><strong>Coloración aplicada (mínima):</strong> ' + usedColors + ' color(es).' +
				'<br><strong>Particiones cromáticas (Vértices):</strong><br>' + (clasesHtml || '')
			);

			renderGraph('cGrafoResultado', state.vertices, state.aristas, { nodeColorMap: nodeColorMap });
			showMsg('Coloreado de vértices aplicado.', 'success');
		} else {
			// MODO ARISTAS: Consumimos la lógica externa de aristas.js de forma segura
			if (!window.GraphEdgeColoring || !window.GraphEdgeColoring.computeChromaticIndex) {
				return showMsg('Error: El motor de coloreado de aristas no se ha encontrado cargado.', 'danger');
			}

			const ids = state.vertices.map(function (v) { return v.id; });
			const edgeResult = window.GraphEdgeColoring.computeChromaticIndex(ids, state.aristas);
			const chiPrime = edgeResult.chiPrime;
			const assign = edgeResult.assign;

			if (!assign && state.aristas.length > 0) {
				return showMsg('No fue posible generar una coloración válida para aristas.', 'danger');
			}

			const edgeColorMap = {};
			const usedColorsSet = new Set();
			if (assign) {
				Object.keys(assign).forEach(function (eIdx) {
					edgeColorMap[eIdx] = COLOR_PALETTE[assign[eIdx] % COLOR_PALETTE.length];
					usedColorsSet.add(assign[eIdx]);
				});
			}

			const usedColors = usedColorsSet.size;
			const classByColor = {};
			if (assign) {
				Object.keys(assign).forEach(function (eIdx) {
					const c = assign[eIdx];
					if (!classByColor[c]) classByColor[c] = [];
					const edge = state.aristas[eIdx];
					classByColor[c].push('(' + edge.inicio + '-' + edge.fin + ')');
				});
			}

			function classLabel(idx) {
				return COLOR_INITIALS[idx] || ('C' + (idx + 1));
			}

			const colorKeys = Object.keys(classByColor).map(Number).sort(function (a, b) { return a - b; });
			const clasesHtml = colorKeys.map(function (k, i) {
				const label = classLabel(i);
				const items = classByColor[k].join(', ');
				return label + ' = {' + items + '}';
			}).join('<br>');

			setHtml('cResultado',
				'<strong>Índice cromático X\'(G):</strong> ' + chiPrime +
				'<br><strong>Coloración aplicada (mínima):</strong> ' + usedColors + ' color(es).' +
				'<br><strong>Particiones cromáticas (Aristas):</strong><br>' + (clasesHtml || '')
			);

			renderGraph('cGrafoResultado', state.vertices, state.aristas, { edgeColorMap: edgeColorMap });
			showMsg('Coloreado de aristas aplicado.', 'success');
		}
	}

	function init() {
		if (document.getElementById('coloreadoTabs')) {
			const tabs = document.querySelectorAll('#coloreadoTabs .nav-link');
			tabs.forEach(function (tab) {
				tab.addEventListener('click', function (e) {
					tabs.forEach(function (t) { t.classList.remove('active'); });
					e.target.classList.add('active');
					state.mode = e.target.getAttribute('data-target-mode');

					document.getElementById('panel-bienvenida-coloreado').classList.add('d-none');
					document.getElementById('panel-coloreado-principal').classList.remove('d-none');

					if (state.mode === 'vertices') {
						setHtml('subtitle-coloreado', 'Colorea vértices con el mínimo de colores.');
					} else {
						setHtml('subtitle-coloreado', 'Colorea aristas con el mínimo de colores.');
					}

					setHtml('cResultado', 'Modo cambiado. Pulse <strong>Calcular</strong>.');
					renderGraph('cGrafoResultado', state.vertices, state.aristas, {});
				});
			});
		}

		if (!document.getElementById('btnCAgregarVertice')) return;

		document.getElementById('btnCAgregarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('cVerticeNombre').value);
			if (!id) return showMsg('Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('El vértice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('cVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnCEliminarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('cVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('cVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnCAgregarArista').addEventListener('click', function () {
			hideMsg();
			const inicio = norm(document.getElementById('cAristaInicio').value);
			const fin = norm(document.getElementById('cAristaFin').value);
			if (!inicio || !fin) return showMsg('Ingrese inicio y fin.', 'warning');
			if (inicio === fin) return showMsg('No se permiten lazos.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === inicio; }) || !state.vertices.some(function (v) { return v.id === fin; })) {
				return showMsg('Ambos vértices deben existir.', 'warning');
			}
			if (state.aristas.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(inicio, fin); })) {
				return showMsg('La arista ya existe.', 'warning');
			}
			state.aristas.push({ inicio: inicio, fin: fin });
			document.getElementById('cAristaInicio').value = '';
			document.getElementById('cAristaFin').value = '';
			refresh();
		});

		document.getElementById('btnCEliminarArista').addEventListener('click', function () {
			hideMsg();
			const inicio = norm(document.getElementById('cAristaInicio').value);
			const fin = norm(document.getElementById('cAristaFin').value);
			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) {
				return edgeKeyUnd(e.inicio, e.fin) !== edgeKeyUnd(inicio, fin);
			});
			if (before === state.aristas.length) return showMsg('No se encontró la arista.', 'warning');
			document.getElementById('cAristaInicio').value = '';
			document.getElementById('cAristaFin').value = '';
			refresh();
		});

		document.getElementById('btnCOperar').addEventListener('click', applyColoring);

		document.getElementById('btnCLimpiar').addEventListener('click', function () {
			hideMsg();
			state.vertices = [];
			state.aristas = [];
			setHtml('cResultado', 'Pulse <strong>Calcular</strong>.');
			renderGraph('cGrafoResultado', [], [], {});
			refresh();
		});

		document.getElementById('btnCGuardar').addEventListener('click', function () {
			downloadJson('coloreado_grafo.json', {
				tipo: 'coloreado_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnCCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputColoreado');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputColoreado');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					setHtml('cResultado', 'Datos cargados. Pulse <strong>Calcular</strong>.');
					refresh();
					showMsg('Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		setHtml('cResultado', 'Pulse <strong>Calcular</strong>.');
		refresh();
	}

	document.addEventListener('DOMContentLoaded', init);
})();