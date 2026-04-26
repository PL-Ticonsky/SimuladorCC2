(function () {
	const state = {
		vertices: [],
		aristas: [],
		mode: 'incidencia',
		isDirected: true
	};

	const MODE_DESCRIPTION = {
		incidencia: 'Relaciona vértices (filas) contra aristas (columnas).',
		adyacencia: 'Genera matriz de adyacencia de vértices y matriz de adyacencia de aristas.'
	};

	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKeyDir(a, b) {
		return norm(a) + '->' + norm(b);
	}

	function edgeKeyUnd(a, b) {
		const x = norm(a);
		const y = norm(b);
		return x < y ? (x + '::' + y) : (y + '::' + x);
	}

	function nextVertexPosition(vertices) {
		const idx = vertices.length;
		const col = idx % 5;
		const row = Math.floor(idx / 5);
		return { x: 80 + col * 95, y: 80 + row * 78 };
	}

	function indexToLabel(index) {
		let n = index + 1;
		let out = '';
		while (n > 0) {
			n -= 1;
			out = String.fromCharCode(97 + (n % 26)) + out;
			n = Math.floor(n / 26);
		}
		return out;
	}

	function autoEdgeLabel(edges) {
		const used = new Set(edges.map(function (e) { return e.etiqueta; }));
		let i = 0;
		while (used.has(indexToLabel(i))) i += 1;
		return indexToLabel(i);
	}

	function showMsg(text, type) {
		const box = document.getElementById('mensajeMIA');
		if (!box) return;
		box.className = 'alert alert-' + type;
		box.textContent = text;
		box.classList.remove('d-none');
	}

	function hideMsg() {
		const box = document.getElementById('mensajeMIA');
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
		let inicio = '';
		let fin = '';
		let etiquetaRaw;
		if (Array.isArray(raw)) {
			inicio = norm(raw[0]);
			fin = norm(raw[1]);
			etiquetaRaw = raw[2];
		} else if (typeof raw === 'object') {
			inicio = norm(raw.inicio || raw.origen || raw.source || raw.from || raw.desde);
			fin = norm(raw.fin || raw.destino || raw.target || raw.to || raw.hasta);
			etiquetaRaw = raw.etiqueta;
			if (etiquetaRaw === undefined) etiquetaRaw = raw.label;
			if (etiquetaRaw === undefined) etiquetaRaw = raw.nombre;
		}
		if (!inicio || !fin || inicio === fin) return null;
		return {
			inicio: inicio,
			fin: fin,
			etiqueta: norm(etiquetaRaw)
		};
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
		rawEdges.forEach(function (a, idx) {
			const e = parseEdge(a);
			if (!e) return;
			if (!vertices.some(function (v) { return v.id === e.inicio; }) || !vertices.some(function (v) { return v.id === e.fin; })) return;
			if (!e.etiqueta || edges.some(function (x) { return x.etiqueta === e.etiqueta; })) {
				e.etiqueta = autoEdgeLabel(edges.slice(0, idx));
			}
			edges.push(e);
		});

		return {
			vertices: vertices,
			aristas: edges,
			mode: MODE_DESCRIPTION[data.mode] ? data.mode : 'incidencia',
			isDirected: data.isDirected !== false
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
		const markerId = 'arrow-msp-' + containerId.replace(/[^a-zA-Z0-9_-]/g, '_');
		const directed = !!opts.directed;

		if (directed) {
			const defs = d3.select(box).append('svg').attr('width', 0).attr('height', 0).append('defs');
			defs.append('marker')
				.attr('id', markerId)
				.attr('viewBox', '0 0 10 10')
				.attr('refX', 8)
				.attr('refY', 5)
				.attr('markerWidth', 6)
				.attr('markerHeight', 6)
				.attr('orient', 'auto-start-reverse')
				.append('path')
				.attr('d', 'M0,0 L10,5 L0,10 z')
				.attr('fill', '#8497b0');
			d3.select(box).select('svg').remove();
		}

		const byId = {};
		vertices.forEach(function (v) { byId[v.id] = v; });
		const activeEdgeSet = new Set((opts.activeEdges || []).map(function (e) { return edgeKeyDir(e.inicio, e.fin) + '|' + e.etiqueta; }));

		const svg = d3.select(box).append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		if (directed) {
			const defs = svg.append('defs');
			defs.append('marker')
				.attr('id', markerId)
				.attr('viewBox', '0 0 10 10')
				.attr('refX', 8)
				.attr('refY', 5)
				.attr('markerWidth', 6)
				.attr('markerHeight', 6)
				.attr('orient', 'auto-start-reverse')
				.append('path')
				.attr('d', 'M0,0 L10,5 L0,10 z')
				.attr('fill', '#8497b0');
		}

		const links = edges.map(function (e) {
			return { inicio: e.inicio, fin: e.fin, etiqueta: e.etiqueta, source: byId[e.inicio], target: byId[e.fin] };
		}).filter(function (e) { return !!e.source && !!e.target; });

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', function (d) {
				const k = edgeKeyDir(d.inicio, d.fin) + '|' + d.etiqueta;
				return activeEdgeSet.has(k) ? 'link-line result' : 'link-line';
			})
			.attr('marker-end', directed ? ('url(#' + markerId + ')') : null);

		const edgeLabel = svg.append('g').selectAll('text').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text(function (d) { return d.etiqueta; });

		const edgeStartTextMap = opts.edgeStartTextMap || {};
		const edgeEndTextMap = opts.edgeEndTextMap || {};
		const edgeStartLabel = svg.append('g').selectAll('text.edge-sign-start').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text(function (d) {
				const k = edgeKeyDir(d.inicio, d.fin) + '|' + d.etiqueta;
				return edgeStartTextMap[k] || '';
			});
		const edgeEndLabel = svg.append('g').selectAll('text.edge-sign-end').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text(function (d) {
				const k = edgeKeyDir(d.inicio, d.fin) + '|' + d.etiqueta;
				return edgeEndTextMap[k] || '';
			});

		const node = svg.append('g').selectAll('circle').data(vertices).enter().append('circle')
			.attr('class', 'node-circle')
			.attr('r', r)
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

		const nodeSubTextMap = opts.nodeSubTextMap || {};
		const nodeSubText = svg.append('g').selectAll('text.node-subtext').data(vertices).enter().append('text')
			.attr('class', 'node-subtext')
			.attr('text-anchor', 'middle');

		function asLines(raw) {
			if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
			if (raw === null || raw === undefined) return [];
			return String(raw).split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
		}

		function update() {
			function edgeInfo(d) {
				const dx = d.target.x - d.source.x;
				const dy = d.target.y - d.source.y;
				const len = Math.sqrt(dx * dx + dy * dy) || 1;
				const ux = dx / len;
				const uy = dy / len;
				const nx = -uy;
				const ny = ux;
				const startX = clamp(d.source.x + ux * (r - 1), minX, maxX);
				const startY = clamp(d.source.y + uy * (r - 1), minY, maxY);
				const endX = clamp(d.target.x - ux * (r + (directed ? 8 : 1)), minX, maxX);
				const endY = clamp(d.target.y - uy * (r + (directed ? 8 : 1)), minY, maxY);
				return { startX: startX, startY: startY, endX: endX, endY: endY, nx: nx, ny: ny };
			}

			line
				.attr('x1', function (d) {
					return edgeInfo(d).startX;
				})
				.attr('y1', function (d) {
					return edgeInfo(d).startY;
				})
				.attr('x2', function (d) {
					return edgeInfo(d).endX;
				})
				.attr('y2', function (d) {
					return edgeInfo(d).endY;
				});

			node
				.attr('cx', function (d) { return d.x = clamp(d.x || width / 2, minX, maxX); })
				.attr('cy', function (d) { return d.y = clamp(d.y || height / 2, minY, maxY); });

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2 - 8; });

			edgeStartLabel
				.attr('x', function (d) {
					const info = edgeInfo(d);
					return info.startX + (info.nx * 10);
				})
				.attr('y', function (d) {
					const info = edgeInfo(d);
					return info.startY + (info.ny * 10) + 3;
				});

			edgeEndLabel
				.attr('x', function (d) {
					const info = edgeInfo(d);
					return info.endX + (info.nx * 10);
				})
				.attr('y', function (d) {
					const info = edgeInfo(d);
					return info.endY + (info.ny * 10) + 3;
				});

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });

			nodeSubText.each(function (d) {
				const lines = asLines(nodeSubTextMap[d.id]);
				const text = d3.select(this);
				text.selectAll('tspan').remove();
				lines.forEach(function (lineTxt, idx) {
					text.append('tspan')
						.attr('x', d.x)
						.attr('y', d.y + r + 12 + (idx * 10))
						.text(lineTxt);
				});
			});
		}

		update();
	}

	function makeNotation() {
		const s = state.vertices.map(function (v) { return v.id; }).join(', ');
		const a = state.aristas.map(function (e) { return e.etiqueta; }).join(', ');
		const where = state.aristas.length ? state.aristas.map(function (e) {
			return e.etiqueta + '=' + e.inicio + (state.isDirected ? '→' : '—') + e.fin;
		}).join(', ') : '';
		setHtml('miaNotacion', 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}' + (where ? '<br>Donde: {' + where + '}' : ''));
	}

	function refreshDirectionUi() {
		const dirTab = document.getElementById('miaTabDirigidas');
		const undTab = document.getElementById('miaTabNoDirigidas');
		const wrap = document.getElementById('miaDireccionWrap');
		if (dirTab) dirTab.classList.toggle('active', state.isDirected);
		if (undTab) undTab.classList.toggle('active', !state.isDirected);
		if (wrap) wrap.style.display = state.isDirected ? '' : 'none';
	}

	function refresh() {
		makeNotation();
		refreshDirectionUi();
		setHtml('miaModeDescription', MODE_DESCRIPTION[state.mode] || '');
		renderGraph('miaGrafoOriginal', state.vertices, state.aristas, { directed: state.isDirected });
		if (!document.getElementById('miaResultado').innerHTML) setHtml('miaResultado', 'Pulse <strong>Calcular</strong>.');
		if (!document.getElementById('miaTablaResultado').innerHTML) setHtml('miaTablaResultado', 'Resultado pendiente de cálculo.');
	}

	function encodeSign(hasPositive, hasNegative) {
		if (hasPositive && hasNegative) return '&plusmn;1';
		if (hasPositive) return '1';
		if (hasNegative) return '-1';
		return '0';
	}

	function incidenceSign(edge, vertexId) {
		if (edge.inicio === vertexId) return 1;
		if (edge.fin === vertexId) return -1;
		return 0;
	}

	function adjacencyEdgeEndpointSigns() {
		const startMap = {};
		const endMap = {};
		state.aristas.forEach(function (e) {
			const k = edgeKeyDir(e.inicio, e.fin) + '|' + e.etiqueta;
			startMap[k] = '1';
			endMap[k] = '-1';
		});
		return { startMap: startMap, endMap: endMap };
	}

	function matrixTable(title, rowLabels, colLabels, getCell) {
		const head = '<tr><th></th>' + colLabels.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>';
		const body = rowLabels.map(function (r, i) {
			const cells = colLabels.map(function (c, j) { return '<td>' + getCell(i, j, r, c) + '</td>'; }).join('');
			return '<tr><th>' + r + '</th>' + cells + '</tr>';
		}).join('');
		return '<div class="matrix-title">' + title + '</div><div class="matrix-wrap"><table class="matrix-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
	}

	function buildIncidenceMatrix() {
		const rowLabels = state.vertices.map(function (v) { return v.id; });
		const colLabels = state.aristas.map(function (e) { return e.etiqueta; });
		const html = matrixTable('Matriz de incidencia', rowLabels, colLabels, function (i, j) {
			const vid = state.vertices[i].id;
			const e = state.aristas[j];
			if (!state.isDirected) return (e.inicio === vid || e.fin === vid) ? '1' : '0';
			if (e.inicio === vid) return '1';
			if (e.fin === vid) return '-1';
			return '0';
		});
		return {
			resultadoHtml: 'Algoritmo aplicado correctamente.',
			tablaHtml: html,
			activeEdges: state.aristas
		};
	}

	function buildVertexAdjMatrix() {
		const rowLabels = state.vertices.map(function (v) { return v.id; });
		const colLabels = rowLabels.slice();
		if (!state.isDirected) {
			return matrixTable('Matriz de adyacencia de vértices', rowLabels, colLabels, function (i, j) {
				if (i === j) return '0';
				const a = rowLabels[i];
				const b = colLabels[j];
				return state.aristas.some(function (e) {
					return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(a, b);
				}) ? '1' : '0';
			});
		}

		return matrixTable('Matriz de adyacencia de vértices', rowLabels, colLabels, function (i, j) {
			if (i === j) return '0';
			const a = rowLabels[i];
			const b = colLabels[j];
			const hasOut = state.aristas.some(function (e) { return e.inicio === a && e.fin === b; });
			const hasIn = state.aristas.some(function (e) { return e.inicio === b && e.fin === a; });
			return encodeSign(hasOut, hasIn);
		});
	}

	function buildEdgeAdjMatrix() {
		const labels = state.aristas.map(function (e) { return e.etiqueta; });
		if (!state.isDirected) {
			return matrixTable('Matriz de adyacencia de aristas', labels, labels, function (i, j) {
				if (i === j) return '0';
				const a = state.aristas[i];
				const b = state.aristas[j];
				const share = a.inicio === b.inicio || a.inicio === b.fin || a.fin === b.inicio || a.fin === b.fin;
				return share ? '1' : '0';
			});
		}

		return matrixTable('Matriz de adyacencia de aristas', labels, labels, function (i, j) {
			if (i === j) return '0';
			const a = state.aristas[i];
			const b = state.aristas[j];
			const shared = [];
			if (a.inicio === b.inicio || a.inicio === b.fin) shared.push(a.inicio);
			if (a.fin === b.inicio || a.fin === b.fin) shared.push(a.fin);
			if (!shared.length) return '0';

			let hasPositive = false;
			let hasNegative = false;
			let hasMixed = false;

			shared.forEach(function (vId) {
				const signA = incidenceSign(a, vId);
				const signB = incidenceSign(b, vId);
				if (signA === 1 && signB === 1) hasPositive = true;
				else if (signA === -1 && signB === -1) hasNegative = true;
				else if ((signA === 1 && signB === -1) || (signA === -1 && signB === 1)) hasMixed = true;
			});

			if (hasMixed) return '&plusmn;1';
			return encodeSign(hasPositive, hasNegative);
		});
	}

	function buildAdjacencyMatrices() {
		const vertexMatrix = buildVertexAdjMatrix();
		const edgeMatrix = buildEdgeAdjMatrix();
		const edgeSigns = state.isDirected ? adjacencyEdgeEndpointSigns() : { startMap: {}, endMap: {} };
		return {
			resultadoHtml: 'Algoritmo aplicado correctamente.',
			tablaHtml: vertexMatrix + edgeMatrix,
			activeEdges: state.aristas,
			edgeStartTextMap: edgeSigns.startMap,
			edgeEndTextMap: edgeSigns.endMap
		};
	}

	function applySelectedMode() {
		hideMsg();
		if (!state.vertices.length || !state.aristas.length) {
			return showMsg('Ingrese vértices y aristas para operar.', 'warning');
		}
		if (!isWeaklyConnected(state.vertices, state.aristas)) {
			return showMsg('El grafo debe ser conexo para esta operación.', 'danger');
		}

		let out;
		if (state.mode === 'incidencia') out = buildIncidenceMatrix();
		else out = buildAdjacencyMatrices();

		setHtml('miaResultado', out.resultadoHtml || 'Algoritmo aplicado correctamente.');
		setHtml('miaTablaResultado', out.tablaHtml || 'Sin tabla para mostrar.');
		renderGraph('miaGrafoResultado', state.vertices, state.aristas, {
			directed: state.isDirected,
			activeEdges: out.activeEdges || [],
			nodeSubTextMap: out.nodeSubTextMap || {},
			edgeStartTextMap: out.edgeStartTextMap || {},
			edgeEndTextMap: out.edgeEndTextMap || {}
		});
		showMsg('Operación aplicada correctamente.', 'success');
	}

	function initMatricesSinPeso() {
		if (!document.getElementById('btnMIAAgregarVertice')) return;

		document.getElementById('miaMatrixMode').addEventListener('change', function (e) {
			state.mode = e.target.value;
			setHtml('miaResultado', 'Pulse <strong>Calcular</strong>.');
			setHtml('miaTablaResultado', 'Resultado pendiente de cálculo.');
			refresh();
		});

		document.getElementById('miaTabDirigidas').addEventListener('click', function () {
			state.isDirected = true;
			refresh();
		});

		document.getElementById('miaTabNoDirigidas').addEventListener('click', function () {
			state.isDirected = false;
			refresh();
		});

		document.getElementById('btnMIAAgregarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('miaVerticeNombre').value);
			if (!id) return showMsg('Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('El vértice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('miaVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMIAEliminarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('miaVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('miaVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMIAAgregarArista').addEventListener('click', function () {
			hideMsg();
			const a = norm(document.getElementById('miaAristaInicio').value);
			const b = norm(document.getElementById('miaAristaFin').value);
			const dir = document.getElementById('miaAristaDireccion').value;
			const inicio = state.isDirected && dir === 'ba' ? b : a;
			const fin = state.isDirected && dir === 'ba' ? a : b;
			let etiqueta = norm(document.getElementById('miaAristaNombre').value);

			if (!inicio || !fin) return showMsg('Ingrese ambos vértices de la arista.', 'warning');
			if (inicio === fin) return showMsg('No se permiten lazos.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === inicio; }) || !state.vertices.some(function (v) { return v.id === fin; })) {
				return showMsg('Ambos vértices deben existir.', 'warning');
			}

			if (state.isDirected) {
				if (state.aristas.some(function (e) { return edgeKeyDir(e.inicio, e.fin) === edgeKeyDir(inicio, fin); })) {
					return showMsg('La arista dirigida ya existe.', 'warning');
				}
			} else if (state.aristas.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(inicio, fin); })) {
				return showMsg('La arista no dirigida ya existe.', 'warning');
			}

			if (!etiqueta) etiqueta = autoEdgeLabel(state.aristas);
			if (state.aristas.some(function (e) { return e.etiqueta === etiqueta; })) {
				return showMsg('La etiqueta de arista ya existe.', 'warning');
			}

			state.aristas.push({ inicio: inicio, fin: fin, etiqueta: etiqueta });
			document.getElementById('miaAristaInicio').value = '';
			document.getElementById('miaAristaFin').value = '';
			document.getElementById('miaAristaNombre').value = '';
			refresh();
		});

		document.getElementById('btnMIAEliminarArista').addEventListener('click', function () {
			hideMsg();
			const a = norm(document.getElementById('miaAristaInicio').value);
			const b = norm(document.getElementById('miaAristaFin').value);
			const dir = document.getElementById('miaAristaDireccion').value;
			const inicio = state.isDirected && dir === 'ba' ? b : a;
			const fin = state.isDirected && dir === 'ba' ? a : b;

			const before = state.aristas.length;
			if (state.isDirected) {
				state.aristas = state.aristas.filter(function (e) {
					return edgeKeyDir(e.inicio, e.fin) !== edgeKeyDir(inicio, fin);
				});
			} else {
				state.aristas = state.aristas.filter(function (e) {
					return edgeKeyUnd(e.inicio, e.fin) !== edgeKeyUnd(inicio, fin);
				});
			}
			if (before === state.aristas.length) return showMsg('No se encontró la arista.', 'warning');
			document.getElementById('miaAristaInicio').value = '';
			document.getElementById('miaAristaFin').value = '';
			document.getElementById('miaAristaNombre').value = '';
			refresh();
		});

		document.getElementById('btnMIAAplicar').addEventListener('click', applySelectedMode);

		document.getElementById('btnMIALimpiar').addEventListener('click', function () {
			hideMsg();
			state.vertices = [];
			state.aristas = [];
			setHtml('miaResultado', 'Pulse <strong>Calcular</strong>.');
			setHtml('miaTablaResultado', 'Resultado pendiente de cálculo.');
			renderGraph('miaGrafoResultado', [], [], { directed: state.isDirected });
			refresh();
		});

		document.getElementById('btnMIAGuardar').addEventListener('click', function () {
			downloadJson('matrices_sin_peso.json', {
				tipo: 'matrices_sin_peso',
				mode: state.mode,
				isDirected: state.isDirected,
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnMIACargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputMIA');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputMIA');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					state.mode = graph.mode;
					state.isDirected = graph.isDirected;
					document.getElementById('miaMatrixMode').value = state.mode;
					setHtml('miaResultado', 'Datos cargados. Pulse <strong>Calcular</strong>.');
					setHtml('miaTablaResultado', 'Resultado pendiente de cálculo.');
					refresh();
					showMsg('Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		setHtml('miaResultado', 'Pulse <strong>Calcular</strong>.');
		setHtml('miaTablaResultado', 'Resultado pendiente de cálculo.');
		refresh();
	}

	document.addEventListener('DOMContentLoaded', initMatricesSinPeso);
})();


