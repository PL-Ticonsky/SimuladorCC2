(function () {
	const state = {
		vertices: [],
		aristas: [],
		mode: 'distancias'
	};

	const MODE_DESCRIPTION = {
		distancias: 'Calcula Floyd-Warshall, tabla de caminos mínimos y propiedades métricas (diámetro, radio, centro/bicentro, mediana y cintura).',
		circuitos: 'Enumera circuitos simples, elimina duplicados/contenidos y construye la matriz binaria de circuitos por arista.',
		circuitosFundamentales: 'Obtiene árbol de expansión, cuerdas, nulidad y genera la matriz de circuitos fundamentales.',
		cortes: 'Enumera conjuntos de corte minimales y construye la matriz binaria de conjuntos de corte.',
		cortesFundamentales: 'A partir de ramas y cuerdas genera conjuntos de corte fundamentales y su matriz binaria.'
	};

	function formatRepeated(values) {
		const seen = {};
		return values.map(function (v) {
			const key = String(v);
			seen[key] = (seen[key] || 0) + 1;
			return seen[key] === 1 ? key : (key + '<sup>(' + seen[key] + ')</sup>');
		}).join(', ');
	}

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
		let pesoRaw;
		let etiquetaRaw;
		if (Array.isArray(raw)) {
			inicio = norm(raw[0]);
			fin = norm(raw[1]);
			pesoRaw = raw[2];
			etiquetaRaw = raw[3];
		} else if (typeof raw === 'object') {
			inicio = norm(raw.inicio || raw.origen || raw.source || raw.from || raw.desde);
			fin = norm(raw.fin || raw.destino || raw.target || raw.to || raw.hasta);
			pesoRaw = raw.peso;
			if (pesoRaw === undefined) pesoRaw = raw.weight;
			if (pesoRaw === undefined) pesoRaw = 1;
			etiquetaRaw = raw.etiqueta;
			if (etiquetaRaw === undefined) etiquetaRaw = raw.label;
			if (etiquetaRaw === undefined) etiquetaRaw = raw.nombre;
		}
		if (!inicio || !fin || inicio === fin) return null;
		const peso = Number(pesoRaw);
		return {
			inicio: inicio,
			fin: fin,
			peso: Number.isFinite(peso) ? peso : 1,
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
		rawEdges.forEach(function (a) {
			const e = parseEdge(a);
			if (!e) return;
			if (!vertices.some(function (v) { return v.id === e.inicio; }) || !vertices.some(function (v) { return v.id === e.fin; })) return;
			if (edges.some(function (x) { return edgeKeyUnd(x.inicio, x.fin) === edgeKeyUnd(e.inicio, e.fin); })) return;
			edges.push(e);
		});
		edges.forEach(function (e, idx) {
			if (!e.etiqueta || edges.some(function (x, j) { return j !== idx && x.etiqueta === e.etiqueta; })) {
				e.etiqueta = autoEdgeLabel(edges.slice(0, idx));
			}
		});
		return { vertices: vertices, aristas: edges };
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

		const order = [];
		const unassigned = new Set(vertices.map(function (v) { return v.id; }));
		while (unassigned.size) {
			if (!pending.length) {
				const fb = Array.from(unassigned).sort(function (a, b) {
					const va = byId[a];
					const vb = byId[b];
					if (va.y !== vb.y) return va.y - vb.y;
					if (va.x !== vb.x) return va.x - vb.x;
					return a.localeCompare(b);
				})[0];
				pending.push(fb);
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
			(adj[u] || []).forEach(function (v) {
				if (!unassigned.has(v)) return;
				inDegree[v] -= 1;
				if (inDegree[v] === 0 && pending.indexOf(v) === -1) pending.push(v);
			});
		}

		const map = {};
		const detailed = order.map(function (id, idx) {
			map[id] = idx + 1;
			return { id: id, ordinal: idx + 1 };
		});
		return { order: detailed, map: map };
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
		const markerId = 'arrow-m-' + containerId.replace(/[^a-zA-Z0-9_-]/g, '_');

		const byId = {};
		vertices.forEach(function (v) { byId[v.id] = v; });
		const edgeSet = new Set((opts.resultEdges || []).map(function (e) { return edgeKeyUnd(e.inicio, e.fin); }));
		const activeNodes = new Set(opts.activeNodes || []);

		const svg = d3.select(box).append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		// Visualizacion no dirigida: sin marcadores de flecha.

		const links = edges.map(function (e) {
			return { inicio: e.inicio, fin: e.fin, etiqueta: e.etiqueta, peso: e.peso, source: byId[e.inicio], target: byId[e.fin] };
		}).filter(function (e) {
			return !!e.source && !!e.target;
		});

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', function (d) { return edgeSet.has(edgeKeyUnd(d.inicio, d.fin)) ? 'link-line result' : 'link-line'; });

		const edgeLabel = svg.append('g').selectAll('text').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.text(function (d) {
				if (d.peso !== undefined && d.etiqueta) return d.etiqueta;
				if (d.etiqueta) return d.etiqueta;
				return String(d.peso || '');
			});

		const node = svg.append('g').selectAll('circle').data(vertices).enter().append('circle')
			.attr('class', function (d) { return activeNodes.has(d.id) ? 'node-circle active' : 'node-circle'; })
			.attr('r', r)
			.call(d3.drag().on('drag', function (event, d) {
				d.x = clamp(event.x, minX, maxX);
				d.y = clamp(event.y, minY, maxY);
				update();
			}));

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
			if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
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

			node
				.attr('cx', function (d) { return d.x = clamp(d.x || width / 2, minX, maxX); })
				.attr('cy', function (d) { return d.y = clamp(d.y || height / 2, minY, maxY); });

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2 - 8; });

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

	function formatInf(v) {
		return Number.isFinite(v) ? String(v) : '&infin;';
	}

	function makeNotation() {
		const s = state.vertices.map(function (v) { return v.id; }).join(', ');
		const a = formatRepeated(state.aristas.map(function (e) { return e.etiqueta; }));
		const where = state.aristas.length ? state.aristas.map(function (e) {
			return e.etiqueta + '=' + e.peso;
		}).join(', ') : '';
		setHtml('mNotacion', 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}' + (where ? '<br>Donde: {' + where + '}' : ''));
	}

	function refresh() {
		makeNotation();
		setHtml('mModeDescription', MODE_DESCRIPTION[state.mode] || '');
		renderGraph('mGrafoOriginal', state.vertices, state.aristas, {});
		if (!document.getElementById('mResultado').innerHTML) setHtml('mResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		if (!document.getElementById('mTablaResultado').innerHTML) setHtml('mTablaResultado', 'Resultado pendiente de cálculo.');
	}

	function floydAllPairs(ids, indexMap) {
		const n = ids.length;
		const d = [];
		const next = [];
		for (let i = 0; i < n; i += 1) {
			d[i] = [];
			next[i] = [];
			for (let j = 0; j < n; j += 1) {
				d[i][j] = i === j ? 0 : Number.POSITIVE_INFINITY;
				next[i][j] = null;
			}
		}
		state.aristas.forEach(function (e) {
			const i = indexMap[e.inicio];
			const j = indexMap[e.fin];
			if (i === undefined || j === undefined) return;
			if (e.peso < d[i][j]) {
				d[i][j] = Number(e.peso);
				next[i][j] = j;
			}
			if (e.peso < d[j][i]) {
				d[j][i] = Number(e.peso);
				next[j][i] = i;
			}
		});
		for (let k = 0; k < n; k += 1) {
			for (let i = 0; i < n; i += 1) {
				for (let j = 0; j < n; j += 1) {
					if (!Number.isFinite(d[i][k]) || !Number.isFinite(d[k][j])) continue;
					const cand = d[i][k] + d[k][j];
					if (cand < d[i][j]) {
						d[i][j] = cand;
						next[i][j] = next[i][k];
					}
				}
			}
		}
		return { dist: d, next: next };
	}

	function reconstructPath(i, j, next, ids) {
		if (next[i][j] === null) return null;
		const path = [ids[i]];
		let u = i;
		while (u !== j) {
			u = next[u][j];
			if (u === null) return null;
			path.push(ids[u]);
			if (path.length > ids.length + 2) return null;
		}
		return path;
	}

	function shortestCycleLengthUndirected() {
		const cycles = enumerateSimpleCycles();
		if (!cycles.length) return null;
		return cycles.reduce(function (minLen, c) {
			return Math.min(minLen, c.length);
		}, Number.POSITIVE_INFINITY);
	}

	function distanciasEntreVertices() {
		const ids = state.vertices.map(function (v) { return v.id; });
		const idxLabel = {};
		ids.forEach(function (id, i) { idxLabel[id] = i + 1; });
		function subscriptNumber(n) {
			const map = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
			return String(n).split('').map(function (d) { return map[d] || d; }).join('');
		}
		function vSub(n) {
			return 'V' + subscriptNumber(n);
		}
		const indexMap = {};
		ids.forEach(function (id, i) { indexMap[id] = i; });
		const fw = floydAllPairs(ids, indexMap);
		const headTop = '<tr>' + ids.map(function (id) {
			return '<th colspan="2">' + vSub(idxLabel[id]) + '</th>';
		}).join('') + '</tr>';
		const headSub = '<tr>' + ids.map(function () {
			return '<th>Vij</th><th>camino mínimo</th>';
		}).join('') + '</tr>';

		const totals = [];
		const ecc = [];
		for (let i = 0; i < ids.length; i += 1) {
			let sum = 0;
			let mx = -1;
			for (let j = 0; j < ids.length; j += 1) {
				if (i === j) continue;
				const v = fw.dist[i][j];
				if (Number.isFinite(v)) {
					sum += v;
					if (v > mx) mx = v;
				}
			}
			totals[i] = sum;
			ecc[i] = mx < 0 ? Number.POSITIVE_INFINITY : mx;
		}

		const finiteEcc = ecc.filter(Number.isFinite);
		const diametro = finiteEcc.length ? Math.max.apply(null, finiteEcc) : Number.POSITIVE_INFINITY;
		const radio = finiteEcc.length ? Math.min.apply(null, finiteEcc) : Number.POSITIVE_INFINITY;
		const centroIdx = [];
		ecc.forEach(function (v, i) { if (v === radio) centroIdx.push(i); });
		let medianaIdx = 0;
		for (let i = 1; i < totals.length; i += 1) if (totals[i] < totals[medianaIdx]) medianaIdx = i;
		const cintura = shortestCycleLengthUndirected();

		const rows = [];
		for (let j = 0; j < ids.length; j += 1) {
			let row = '<tr>';
			for (let i = 0; i < ids.length; i += 1) {
				if (i === j) {
					row += '<td></td><td></td>';
					continue;
				}
				row += '<td>V' + idxLabel[ids[i]] + idxLabel[ids[j]] + '</td>';
				row += '<td>' + (Number.isFinite(fw.dist[i][j]) ? fw.dist[i][j] : '') + '</td>';
			}
			row += '</tr>';
			rows.push(row);
		}

		const totalRow = '<tr>' + ids.map(function (id) {
			const j = indexMap[id];
			return '<td>Dist mín</td><td>' + totals[j] + '</td>';
		}).join('') + '</tr>';
		const eccRow = '<tr>' + ids.map(function (id) {
			const j = indexMap[id];
			return '<td>Exentricidad</td><td>' + (Number.isFinite(ecc[j]) ? ecc[j] : '') + '</td>';
		}).join('') + '</tr>';

		const resultado =
			'<ul class="metric-list">' +
			'<li><strong>Diámetro:</strong> ' + formatInf(diametro) + '</li>' +
			'<li><strong>Radio:</strong> ' + formatInf(radio) + '</li>' +
			'<li><strong>Centro/Bicentro:</strong> {' + centroIdx.map(function (i) { return ids[i]; }).join(', ') + '}</li>' +
			'<li><strong>Mediana:</strong> ' + ids[medianaIdx] + '</li>' +
			'<li><strong>Cintura:</strong> ' + (cintura === null ? 'No existe circuito' : cintura + ' aristas') + '</li>' +
			'</ul>';

		return {
			resultadoHtml: resultado,
			tablaHtml: '<div class="matrix-wrap"><table class="result-table"><thead>' + headTop + headSub + '</thead><tbody>' + rows.join('') + totalRow + eccRow + '</tbody></table></div>',
			nodeTextMap: {},
			activeNodes: centroIdx.map(function (i) { return ids[i]; })
		};
	}

	function rotations(arr) {
		const out = [];
		for (let i = 0; i < arr.length; i += 1) out.push(arr.slice(i).concat(arr.slice(0, i)));
		return out;
	}

	function canonicalCycle(labels) {
		const rotsA = rotations(labels);
		const rotsB = rotations(labels.slice().reverse());
		const all = rotsA.concat(rotsB).map(function (x) { return x.join('|'); }).sort();
		return all[0];
	}

	function enumerateSimpleCycles() {
		const adj = {};
		state.vertices.forEach(function (v) { adj[v.id] = []; });
		state.aristas.forEach(function (e) {
			if (adj[e.inicio]) adj[e.inicio].push({ to: e.fin, edge: e });
			if (adj[e.fin]) adj[e.fin].push({ to: e.inicio, edge: e });
		});

		const byCanon = new Map();
		state.vertices.forEach(function (startV) {
			const start = startV.id;
			const pathV = [start];
			const pathE = [];
			const usedE = new Set();

			function dfs(u) {
				(adj[u] || []).forEach(function (step) {
					const e = step.edge;
					if (usedE.has(e.etiqueta)) return;
					if (step.to === start && pathE.length > 1) {
						const labels = pathE.concat([e.etiqueta]);
						const k = canonicalCycle(labels);
						if (!byCanon.has(k)) byCanon.set(k, labels.slice());
						return;
					}
					if (pathV.indexOf(step.to) !== -1) return;
					pathV.push(step.to);
					pathE.push(e.etiqueta);
					usedE.add(e.etiqueta);
					dfs(step.to);
					usedE.delete(e.etiqueta);
					pathE.pop();
					pathV.pop();
				});
			}

			dfs(start);
		});

		const cycles = Array.from(byCanon.values()).map(function (c) { return c.slice(); });
		const keep = cycles.filter(function (ci, i) {
			const si = new Set(ci);
			return !cycles.some(function (cj, j) {
				if (i === j || cj.length <= ci.length) return false;
				const sj = new Set(cj);
				return ci.every(function (x) { return sj.has(x); });
			});
		});
		keep.sort(function (a, b) { return a.length - b.length; });
		return keep;
	}

	function binaryMatrixTable(rows, edgeLabels, prefix) {
		const head = '<tr><th></th>' + edgeLabels.map(function (l) { return '<th>' + l + '</th>'; }).join('') + '</tr>';
		const body = rows.map(function (row, idx) {
			const rowSet = new Set(row);
			const cells = edgeLabels.map(function (l) { return '<td>' + (rowSet.has(l) ? '1' : '0') + '</td>'; }).join('');
			return '<tr><th>' + prefix + (idx + 1) + '</th>' + cells + '</tr>';
		}).join('');
		return '<div class="matrix-wrap"><table class="matrix-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
	}

	function matrizCircuitos() {
		const cycles = enumerateSimpleCycles();
		const labels = state.aristas.map(function (e) { return e.etiqueta; }).sort();
		const listado = cycles.length ? cycles.map(function (c, i) {
			return 'C' + (i + 1) + '={' + c.join(', ') + '}';
		}).join('<br>') : 'No se encontraron circuitos simples.';
		return {
			resultadoHtml: '<strong>Circuitos:</strong><br>' + listado,
			tablaHtml: binaryMatrixTable(cycles, labels, 'C')
		};
	}

	function kruskalTree() {
		const parent = {};
		const rank = {};
		state.vertices.forEach(function (v) {
			parent[v.id] = v.id;
			rank[v.id] = 0;
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
		const sorted = state.aristas.slice().sort(function (a, b) {
			if (a.peso !== b.peso) return a.peso - b.peso;
			return a.etiqueta.localeCompare(b.etiqueta);
		});
		const branches = [];
		sorted.forEach(function (e) {
			if (unite(e.inicio, e.fin)) branches.push(e);
		});
		if (branches.length !== state.vertices.length - 1) throw new Error('No fue posible construir árbol de expansión válido.');
		const branchLabels = new Set(branches.map(function (e) { return e.etiqueta; }));
		const chords = state.aristas.filter(function (e) { return !branchLabels.has(e.etiqueta); });
		const treeAdj = {};
		state.vertices.forEach(function (v) { treeAdj[v.id] = []; });
		branches.forEach(function (e) {
			treeAdj[e.inicio].push({ to: e.fin, edge: e });
			treeAdj[e.fin].push({ to: e.inicio, edge: e });
		});
		return { branches: branches, chords: chords, treeAdj: treeAdj };
	}

	function pathInTree(treeAdj, a, b) {
		const visited = new Set();
		function dfs(u, target, path) {
			if (u === target) return path;
			visited.add(u);
			const next = treeAdj[u] || [];
			for (let i = 0; i < next.length; i += 1) {
				if (visited.has(next[i].to)) continue;
				const out = dfs(next[i].to, target, path.concat([next[i].edge]));
				if (out) return out;
			}
			return null;
		}
		return dfs(a, b, []);
	}

	function matrizCircuitosFundamentales() {
		const t = kruskalTree();
		const labels = state.aristas.map(function (e) { return e.etiqueta; }).sort();
		const rows = t.chords.map(function (c) {
			const path = pathInTree(t.treeAdj, c.inicio, c.fin) || [];
			return [c.etiqueta].concat(path.map(function (e) { return e.etiqueta; }));
		});
		const listCf = rows.map(function (r, i) { return 'CF' + (i + 1) + '={' + r.join(', ') + '}'; }).join('<br>');
		return {
			resultadoHtml:
				'<strong>Cuerdas:</strong> {' + t.chords.map(function (e) { return e.etiqueta; }).join(', ') + '}' +
				'<br><strong>Nulidad:</strong> ' + t.chords.length +
				'<br><strong>Circuitos fundamentales:</strong><br>' + (listCf || 'No existen'),
			tablaHtml: binaryMatrixTable(rows, labels, 'CF'),
			resultEdges: t.chords
		};
	}

	function componentsCountUndirected(vertices, edges) {
		if (!vertices.length) return 0;
		const adj = {};
		vertices.forEach(function (v) { adj[v.id] = []; });
		edges.forEach(function (e) {
			if (!adj[e.inicio] || !adj[e.fin]) return;
			adj[e.inicio].push(e.fin);
			adj[e.fin].push(e.inicio);
		});
		const visited = new Set();
		let c = 0;
		vertices.forEach(function (v) {
			if (visited.has(v.id)) return;
			c += 1;
			const st = [v.id];
			while (st.length) {
				const u = st.pop();
				if (visited.has(u)) continue;
				visited.add(u);
				(adj[u] || []).forEach(function (w) { if (!visited.has(w)) st.push(w); });
			}
		});
		return c;
	}

	function subsetOf(a, b) {
		const sb = new Set(b);
		return a.every(function (x) { return sb.has(x); });
	}

	function combinations(items, k, start, acc, out) {
		if (acc.length === k) {
			out.push(acc.slice());
			return;
		}
		for (let i = start; i < items.length; i += 1) {
			acc.push(items[i]);
			combinations(items, k, i + 1, acc, out);
			acc.pop();
		}
	}

	function enumerateMinimalCutSets() {
		if (!isWeaklyConnected(state.vertices, state.aristas)) throw new Error('El grafo original debe ser conexo para calcular cortes.');
		if (state.aristas.length > 15) throw new Error('Demasiadas aristas para búsqueda exhaustiva (máximo recomendado: 15).');
		const allIdx = state.aristas.map(function (_, i) { return i; });
		const cuts = [];
		for (let k = 1; k <= state.aristas.length; k += 1) {
			const comb = [];
			combinations(allIdx, k, 0, [], comb);
			for (let ci = 0; ci < comb.length; ci += 1) {
				const removed = new Set(comb[ci]);
				const remEdges = state.aristas.filter(function (_, i) { return !removed.has(i); });
				if (componentsCountUndirected(state.vertices, remEdges) <= 1) continue;
				const labels = comb[ci].map(function (i) { return state.aristas[i].etiqueta; }).sort();
				if (cuts.some(function (c) { return subsetOf(c, labels); })) continue;
				cuts.push(labels);
			}
		}
		cuts.sort(function (a, b) {
			if (a.length !== b.length) return a.length - b.length;
			return a.join('|').localeCompare(b.join('|'));
		});
		return cuts;
	}

	function matrizConjuntosCorte() {
		const cuts = enumerateMinimalCutSets();
		const labels = state.aristas.map(function (e) { return e.etiqueta; }).sort();
		const listado = cuts.length ? cuts.map(function (c, i) { return 'CC' + (i + 1) + '={' + c.join(', ') + '}'; }).join('<br>') : 'No se encontraron conjuntos de corte minimales.';
		return {
			resultadoHtml: '<strong>Conjuntos de corte:</strong><br>' + listado,
			tablaHtml: binaryMatrixTable(cuts, labels, 'CC')
		};
	}

	function compAfterRemovingBranch(vertices, branches, branchToRemove) {
		const adj = {};
		vertices.forEach(function (v) { adj[v.id] = []; });
		branches.forEach(function (e) {
			if (e.etiqueta === branchToRemove.etiqueta) return;
			adj[e.inicio].push(e.fin);
			adj[e.fin].push(e.inicio);
		});
		const compA = new Set();
		const stack = [branchToRemove.inicio];
		while (stack.length) {
			const u = stack.pop();
			if (compA.has(u)) continue;
			compA.add(u);
			(adj[u] || []).forEach(function (w) { if (!compA.has(w)) stack.push(w); });
		}
		return compA;
	}

	function matrizConjuntosCorteFundamentales() {
		const t = kruskalTree();
		const labels = state.aristas.map(function (e) { return e.etiqueta; }).sort();
		const rows = t.branches.map(function (b) {
			const compA = compAfterRemovingBranch(state.vertices, t.branches, b);
			const row = [b.etiqueta];
			t.chords.forEach(function (c) {
				const aIn = compA.has(c.inicio);
				const bIn = compA.has(c.fin);
				if (aIn !== bIn) row.push(c.etiqueta);
			});
			return row;
		});
		const listCcf = rows.map(function (r, i) { return 'CCF' + (i + 1) + '={' + r.join(', ') + '}'; }).join('<br>');
		return {
			resultadoHtml:
				'<strong>Ramas:</strong> {' + t.branches.map(function (e) { return e.etiqueta; }).join(', ') + '}' +
				'<br><strong>Rango:</strong> ' + t.branches.length +
				'<br><strong>CCF:</strong><br>' + (listCcf || 'No existen'),
			tablaHtml: binaryMatrixTable(rows, labels, 'CCF'),
			resultEdges: t.branches
		};
	}

	function applySelectedMode() {
		hideMsg('mensajeMatrices');
		if (!state.vertices.length || !state.aristas.length) {
			return showMsg('mensajeMatrices', 'Ingrese vértices y aristas para operar.', 'warning');
		}
		if (!isWeaklyConnected(state.vertices, state.aristas)) {
			return showMsg('mensajeMatrices', 'El grafo debe ser conexo para esta operación.', 'danger');
		}

		try {
			let out;
			switch (state.mode) {
				case 'distancias':
					out = distanciasEntreVertices();
					break;
				case 'circuitos':
					out = matrizCircuitos();
					break;
				case 'circuitosFundamentales':
					out = matrizCircuitosFundamentales();
					break;
				case 'cortes':
					out = matrizConjuntosCorte();
					break;
				case 'cortesFundamentales':
					out = matrizConjuntosCorteFundamentales();
					break;
				default:
					out = { resultadoHtml: 'Modo no implementado.', tablaHtml: '' };
			}

			setHtml('mResultado', out.resultadoHtml || 'Algoritmo aplicado correctamente.');
			setHtml('mTablaResultado', out.tablaHtml || 'Sin tabla para mostrar.');
			renderGraph('mGrafoResultado', state.vertices, state.aristas, {
				resultEdges: out.resultEdges || [],
				nodeTextMap: out.nodeTextMap || {},
				nodeSubTextMap: out.nodeSubTextMap || {},
				activeNodes: out.activeNodes || []
			});
			showMsg('mensajeMatrices', 'Operación aplicada correctamente.', 'success');
		} catch (err) {
			showMsg('mensajeMatrices', err.message || 'Error al aplicar la operación.', 'danger');
		}
	}

	function init() {
		if (!document.getElementById('btnMAgregarVertice')) return;

		['tab-mdc', 'tab-mia'].forEach(function (id) {
			const tab = document.getElementById(id);
			if (!tab) return;
			tab.addEventListener('shown.bs.tab', function () {
				const welcome = document.getElementById('panel-bienvenida-matrices');
				if (welcome) welcome.style.display = 'none';
			});
		});

		document.getElementById('matrixMode').addEventListener('change', function (e) {
			state.mode = e.target.value;
			setHtml('mResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			setHtml('mTablaResultado', 'Resultado pendiente de cálculo.');
			refresh();
		});

		document.getElementById('btnMAgregarVertice').addEventListener('click', function () {
			hideMsg('mensajeMatrices');
			const id = norm(document.getElementById('mVerticeNombre').value);
			if (!id) return showMsg('mensajeMatrices', 'Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('mensajeMatrices', 'El vértice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('mVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMEliminarVertice').addEventListener('click', function () {
			hideMsg('mensajeMatrices');
			const id = norm(document.getElementById('mVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('mensajeMatrices', 'No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('mVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnMAgregarArista').addEventListener('click', function () {
			hideMsg('mensajeMatrices');
			const inicio = norm(document.getElementById('mAristaInicio').value);
			const fin = norm(document.getElementById('mAristaFin').value);
			const peso = Number(document.getElementById('mAristaPeso').value);
			let etiqueta = norm(document.getElementById('mAristaNombre').value);

			if (!inicio || !fin) return showMsg('mensajeMatrices', 'Ingrese inicio y fin.', 'warning');
			if (inicio === fin) return showMsg('mensajeMatrices', 'No se permiten lazos.', 'warning');
			if (!Number.isFinite(peso)) return showMsg('mensajeMatrices', 'El peso debe ser numérico.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === inicio; }) || !state.vertices.some(function (v) { return v.id === fin; })) {
				return showMsg('mensajeMatrices', 'Ambos vértices deben existir.', 'warning');
			}
			if (state.aristas.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(inicio, fin); })) {
				return showMsg('mensajeMatrices', 'La arista ya existe.', 'warning');
			}
			if (!etiqueta) etiqueta = autoEdgeLabel(state.aristas);
			if (state.aristas.some(function (e) { return e.etiqueta === etiqueta; })) {
				return showMsg('mensajeMatrices', 'La etiqueta de arista ya existe.', 'warning');
			}

			state.aristas.push({ inicio: inicio, fin: fin, peso: peso, etiqueta: etiqueta });
			document.getElementById('mAristaInicio').value = '';
			document.getElementById('mAristaFin').value = '';
			document.getElementById('mAristaPeso').value = '';
			document.getElementById('mAristaNombre').value = '';
			refresh();
		});

		document.getElementById('btnMEliminarArista').addEventListener('click', function () {
			hideMsg('mensajeMatrices');
			const inicio = norm(document.getElementById('mAristaInicio').value);
			const fin = norm(document.getElementById('mAristaFin').value);

			const before = state.aristas.length;
			state.aristas = state.aristas.filter(function (e) { return edgeKeyUnd(e.inicio, e.fin) !== edgeKeyUnd(inicio, fin); });
			if (before === state.aristas.length) return showMsg('mensajeMatrices', 'No se encontró la arista.', 'warning');
			document.getElementById('mAristaInicio').value = '';
			document.getElementById('mAristaFin').value = '';
			document.getElementById('mAristaPeso').value = '';
			document.getElementById('mAristaNombre').value = '';
			refresh();
		});

		document.getElementById('btnMAplicar').addEventListener('click', applySelectedMode);

		document.getElementById('btnMLimpiar').addEventListener('click', function () {
			hideMsg('mensajeMatrices');
			state.vertices = [];
			state.aristas = [];
			setHtml('mResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
			setHtml('mTablaResultado', 'Resultado pendiente de cálculo.');
			renderGraph('mGrafoResultado', [], [], {});
			refresh();
		});

		document.getElementById('btnMGuardar').addEventListener('click', function () {
			downloadJson('matrices_grafo.json', {
				tipo: 'matrices_grafo',
				mode: state.mode,
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('mensajeMatrices', 'Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnMCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputMatrices');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputMatrices');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					if (MODE_DESCRIPTION[data.mode]) {
						state.mode = data.mode;
						document.getElementById('matrixMode').value = data.mode;
					}
					setHtml('mResultado', 'Datos cargados. Pulse <strong>Aplicar algoritmo</strong>.');
					setHtml('mTablaResultado', 'Resultado pendiente de cálculo.');
					refresh();
					showMsg('mensajeMatrices', 'Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('mensajeMatrices', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		setHtml('mResultado', 'Pulse <strong>Aplicar algoritmo</strong>.');
		setHtml('mTablaResultado', 'Resultado pendiente de cálculo.');
		refresh();
	}

	document.addEventListener('DOMContentLoaded', init);
})();


