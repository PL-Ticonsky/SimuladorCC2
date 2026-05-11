(function () {
	const state = { vertices: [], aristas: [] };

	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKeyUnd(a, b) {
		const x = norm(a);
		const y = norm(b);
		return x < y ? (x + '::' + y) : (y + '::' + x);
	}

	function showMsg(text, type) {
		const box = document.getElementById('mensajeDominancia');
		if (!box) return;
		box.className = 'alert alert-' + type;
		box.textContent = text;
		box.classList.remove('d-none');
	}

	function hideMsg() {
		const box = document.getElementById('mensajeDominancia');
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
		if (!raw || typeof raw !== 'object') return null;
		let inicio = '';
		let fin = '';
		let nombre = '';
		if (raw.inicio || raw.fin) {
			inicio = norm(raw.inicio);
			fin = norm(raw.fin);
		} else {
			inicio = norm(raw.source || raw.from || raw.origen || raw.v1);
			fin = norm(raw.target || raw.to || raw.destino || raw.v2);
		}
		nombre = norm(raw.nombre || raw.name || raw.id || raw.etiqueta || (inicio + fin));
		if (!inicio || !fin || inicio === fin) return null;
		return { nombre: nombre || (inicio + fin), inicio: inicio, fin: fin };
	}

	function normalizePayload(data) {
		let payload = data || {};
		if (payload.data && typeof payload.data === 'object') payload = payload.data;
		if (payload.grafo && typeof payload.grafo === 'object') payload = payload.grafo;
		if (payload.g1 && payload.g1.vertices) payload = payload.g1;
		return payload || {};
	}

	function loadGraphFromData(data) {
		const payload = normalizePayload(data);
		const vertices = [];
		const rawVertices = Array.isArray(payload.vertices) ? payload.vertices : (Array.isArray(payload.nodos) ? payload.nodos : []);
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
		const rawEdges = Array.isArray(payload.aristas) ? payload.aristas : (Array.isArray(payload.edges) ? payload.edges : []);
		rawEdges.forEach(function (a) {
			const edge = parseEdge(a);
			if (!edge) return;
			if (!vertices.some(function (v) { return v.id === edge.inicio; }) || !vertices.some(function (v) { return v.id === edge.fin; })) return;
			if (edges.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === edgeKeyUnd(edge.inicio, edge.fin); })) return;
			edges.push(edge);
		});
		return { vertices: vertices, aristas: edges };
	}

	function graphNotation(vertices, edges) {
		const s = vertices.map(function (v) { return v.id; }).join(', ');
		const a = edges.map(function (e) { return e.inicio + '-' + e.fin; }).join(', ');
		return 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}';
	}

	function renderGraph(containerId, vertices, edges) {
		const box = document.getElementById(containerId);
		if (!box) return;
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
			return { source: byId[e.inicio], target: byId[e.fin] };
		}).filter(function (e) { return !!e.source && !!e.target; });

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', 'link-line');

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

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });
		}

		update();
	}

	function enumerateAllVertexSubsets(vertices) {
		const ids = vertices.map(function (v) { return v.id; }).sort();
		const out = [];
		const current = [];
		function bt(idx) {
			if (idx >= ids.length) {
				out.push(current.slice());
				return;
			}
			bt(idx + 1);
			current.push(ids[idx]);
			bt(idx + 1);
			current.pop();
		}
		bt(0);
		return out;
	}

	function isIndependent(set, adj) {
		for (let i = 0; i < set.length; i += 1) {
			for (let j = i + 1; j < set.length; j += 1) {
				if ((adj[set[i]] || new Set()).has(set[j])) return false;
			}
		}
		return true;
	}

	function isDominating(set, vertices, adj) {
		const setMap = new Set(set);
		for (let i = 0; i < vertices.length; i += 1) {
			const id = vertices[i].id;
			if (setMap.has(id)) continue;
			let covered = false;
			set.forEach(function (v) {
				if ((adj[id] || new Set()).has(v)) covered = true;
			});
			if (!covered) return false;
		}
		return true;
	}

	function isConnectedSubset(set, adj) {
		if (!set.length) return false;
		if (set.length === 1) return true;
		const setMap = new Set(set);
		const stack = [set[0]];
		const visited = new Set();
		while (stack.length) {
			const u = stack.pop();
			if (visited.has(u)) continue;
			visited.add(u);
			(adj[u] || new Set()).forEach(function (v) {
				if (setMap.has(v) && !visited.has(v)) stack.push(v);
			});
		}
		return visited.size === set.length;
	}

	function formatSet(prefix, sets, formatter) {
		if (!sets.length) return '<span class="text-muted">Sin conjuntos.</span>';
		return sets.map(function (set, idx) {
			return prefix + (idx + 1) + ' = {' + formatter(set) + '}';
		}).join('<br>');
	}

	function refresh() {
		setHtml('domNotacion', graphNotation(state.vertices, state.aristas));
		renderGraph('domGrafo', state.vertices, state.aristas);
		if (!document.getElementById('domResultado').innerHTML) {
			setHtml('domResultado', 'Pulse <strong>Calcular</strong>.');
		}
	}

	function apply() {
		hideMsg();
		if (!state.vertices.length) {
			return showMsg('Ingrese al menos un vértice.', 'warning');
		}
		const adj = buildAdjacency(state.vertices, state.aristas);
		const subsets = enumerateAllVertexSubsets(state.vertices);
		const dominating = subsets.filter(function (s) { return isDominating(s, state.vertices, adj); });
		const minSize = dominating.reduce(function (acc, s) { return Math.min(acc, s.length); }, Infinity);
		const minSets = dominating.filter(function (s) { return s.length === minSize; });
		const independentDominating = dominating.filter(function (s) { return isIndependent(s, adj); });
		const connectedDominating = dominating.filter(function (s) { return isConnectedSubset(s, adj); });
		const maxSet = state.vertices.map(function (v) { return v.id; }).sort();

		const result = [
			'<strong>Conjuntos dominantes:</strong><br>' + formatSet('C<sub>d</sub>', dominating, function (s) { return s.join(', '); }),
			'<br><strong>Número de dominación:</strong> ' + (Number.isFinite(minSize) ? minSize : '0') +
			'<br><strong>Conjuntos dominantes mínimos:</strong><br>' + formatSet('C<sub>dmin</sub>', minSets, function (s) { return s.join(', '); }),
			'<br><strong>Conjuntos dominantes independientes:</strong><br>' + formatSet('C<sub>dind</sub>', independentDominating, function (s) { return s.join(', '); }),
			'<br><strong>Conjuntos dominantes conexos:</strong><br>' + formatSet('C<sub>dcon</sub>', connectedDominating, function (s) { return s.join(', '); }),
			'<br><strong>Conjunto dominante máximo:</strong><br>' + 'C<sub>dmax</sub> = {' + maxSet.join(', ') + '}'
		].join('');

		setHtml('domResultado', result);
		showMsg('Cálculo completado.', 'success');
	}

	function init() {
		if (!document.getElementById('btnDomAgregarVertice')) return;

		document.getElementById('btnDomAgregarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('domVerticeNombre').value);
			if (!id) return showMsg('Ingrese un vértice válido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('El vértice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('domVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnDomEliminarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('domVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('No existe el vértice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('domVerticeNombre').value = '';
			refresh();
		});

		document.getElementById('btnDomAgregarArista').addEventListener('click', function () {
			hideMsg();
			const nombre = norm(document.getElementById('domAristaNombre').value);
			const inicio = norm(document.getElementById('domAristaInicio').value);
			const fin = norm(document.getElementById('domAristaFin').value);
			if (!nombre) return showMsg('Ingrese el nombre de la arista.', 'warning');
			if (!inicio || !fin) return showMsg('Ingrese los dos vértices.', 'warning');
			if (inicio === fin) return showMsg('No se permiten lazos.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === inicio; }) || !state.vertices.some(function (v) { return v.id === fin; })) {
				return showMsg('Ambos vértices deben existir.', 'warning');
			}
			if (state.aristas.some(function (e) { return e.nombre === nombre; })) return showMsg('La arista ya existe.', 'warning');
			const key = edgeKeyUnd(inicio, fin);
			if (state.aristas.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === key; })) {
				return showMsg('Ya existe una arista entre esos vértices.', 'warning');
			}
			state.aristas.push({ nombre: nombre, inicio: inicio, fin: fin });
			document.getElementById('domAristaNombre').value = '';
			document.getElementById('domAristaInicio').value = '';
			document.getElementById('domAristaFin').value = '';
			refresh();
		});

		document.getElementById('btnDomEliminarArista').addEventListener('click', function () {
			hideMsg();
			const nombre = norm(document.getElementById('domAristaNombre').value);
			const inicio = norm(document.getElementById('domAristaInicio').value);
			const fin = norm(document.getElementById('domAristaFin').value);
			const before = state.aristas.length;
			if (nombre) {
				state.aristas = state.aristas.filter(function (e) { return e.nombre !== nombre; });
			} else {
				state.aristas = state.aristas.filter(function (e) { return edgeKeyUnd(e.inicio, e.fin) !== edgeKeyUnd(inicio, fin); });
			}
			if (before === state.aristas.length) return showMsg('No se encontró la arista.', 'warning');
			document.getElementById('domAristaNombre').value = '';
			document.getElementById('domAristaInicio').value = '';
			document.getElementById('domAristaFin').value = '';
			refresh();
		});

		document.getElementById('btnDomOperar').addEventListener('click', apply);

		document.getElementById('btnDomLimpiar').addEventListener('click', function () {
			hideMsg();
			state.vertices = [];
			state.aristas = [];
			setHtml('domResultado', 'Pulse <strong>Calcular</strong>.');
			renderGraph('domGrafo', [], []);
			refresh();
		});

		document.getElementById('btnDomGuardar').addEventListener('click', function () {
			downloadJson('conjuntos_grafo.json', {
				tipo: 'conjuntos_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnDomCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputDominancia');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputDominancia');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					setHtml('domResultado', 'Datos cargados. Pulse <strong>Calcular</strong>.');
					refresh();
					showMsg('Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		const tabs = ['tab-independencia', 'tab-dominancia', 'tab-pareamiento'];
		tabs.forEach(function (id) {
			const el = document.getElementById(id);
			if (!el) return;
			el.addEventListener('shown.bs.tab', function () {
				const welcome = document.getElementById('panel-bienvenida-conjuntos');
				if (welcome) welcome.style.display = 'none';
			});
		});

		refresh();
	}

	document.addEventListener('DOMContentLoaded', init);
})();
