(function () {
	const state = {
		vertices: [],
		aristas: [],
		matchings: [],
		optimalMatching: []
	};

	function norm(v) {
		return (v || '').toString().trim();
	}

	function edgeKeyUnd(a, b) {
		const x = norm(a);
		const y = norm(b);
		return x < y ? (x + '::' + y) : (y + '::' + x);
	}

	function showMsg(text, type) {
		const box = document.getElementById('mensajePareamiento');
		if (!box) return;
		box.className = 'alert alert-' + type;
		box.textContent = text;
		box.classList.remove('d-none');
	}

	function hideMsg() {
		const box = document.getElementById('mensajePareamiento');
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

	function nextVertexPosition(vertices) {
		const idx = vertices.length;
		const col = idx % 5;
		const row = Math.floor(idx / 5);
		return { x: 80 + col * 95, y: 80 + row * 78 };
	}

	function graphNotation(vertices, edges) {
		const s = vertices.map(function (v) { return v.id; }).join(', ');
		const a = edges.map(function (e) { return e.nombre; }).join(', ');
		return 'G={S,A}<br>S={' + s + '}<br>A={' + a + '}';
	}

	function formatEdgeCompact(edge) {
		return edge.nombre;
	}

	function formatSet(prefix, sets, formatter) {
		if (!sets.length) return '<span class="text-muted">Sin conjuntos.</span>';
		return sets.map(function (set, idx) {
			return prefix + (idx + 1) + ' = {' + formatter(set) + '}';
		}).join('<br>');
	}

	function sharesVertex(a, b) {
		return a.inicio === b.inicio || a.inicio === b.fin || a.fin === b.inicio || a.fin === b.fin;
	}

	function enumerateMatchings(edges) {
		const out = [];
		const current = [];
		function canAdd(edge) {
			for (let i = 0; i < current.length; i += 1) {
				if (sharesVertex(current[i], edge)) return false;
			}
			return true;
		}
		function bt(idx) {
			if (idx >= edges.length) {
				if (current.length > 0) out.push(current.slice());
				return;
			}
			bt(idx + 1);
			const edge = edges[idx];
			if (canAdd(edge)) {
				current.push(edge);
				bt(idx + 1);
				current.pop();
			}
		}
		bt(0);
		return out;
	}

	function isMaximalMatching(set, edges) {
		const setIds = new Set(set.map(function (e) { return edgeKeyUnd(e.inicio, e.fin); }));
		for (let i = 0; i < edges.length; i += 1) {
			const edge = edges[i];
			const key = edgeKeyUnd(edge.inicio, edge.fin);
			if (setIds.has(key)) continue;
			let ok = true;
			for (let j = 0; j < set.length; j += 1) {
				if (sharesVertex(set[j], edge)) {
					ok = false;
					break;
				}
			}
			if (ok) return false;
		}
		return true;
	}

	function saturatedVerticesFor(matching) {
		const out = new Set();
		matching.forEach(function (e) {
			out.add(e.inicio);
			out.add(e.fin);
		});
		return out;
	}

	function buildBlockedEdges(edges, selectedEdges) {
		const blocked = new Set();
		edges.forEach(function (edge) {
			for (let i = 0; i < selectedEdges.length; i += 1) {
				const sel = selectedEdges[i];
				if (edgeKeyUnd(sel.inicio, sel.fin) === edgeKeyUnd(edge.inicio, edge.fin)) return;
				if (sharesVertex(edge, sel)) {
					blocked.add(edgeKeyUnd(edge.inicio, edge.fin));
					return;
				}
			}
		});
		return blocked;
	}

	function buildSteps(matching, edges) {
		const ordered = matching.slice().sort(function (a, b) {
			return edgeKeyUnd(a.inicio, a.fin).localeCompare(edgeKeyUnd(b.inicio, b.fin));
		});
		const steps = [];
		steps.push({
			selected: new Set(),
			blocked: new Set(),
			invert: false,
			text: 'Paso 0: estado inicial sin pareamientos resaltados.'
		});
		for (let i = 0; i < ordered.length; i += 1) {
			const edge = ordered[i];
			const selected = new Set([edgeKeyUnd(edge.inicio, edge.fin)]);
			const blocked = buildBlockedEdges(edges, [edge]);
			const selectedText = formatEdgeCompact(edge);
			const blockedText = edges.filter(function (e) {
				return blocked.has(edgeKeyUnd(e.inicio, e.fin));
			}).map(formatEdgeCompact).join(', ');
			steps.push({
				selected: selected,
				blocked: blocked,
				invert: i % 2 === 1,
				text: 'Paso ' + (i + 1) + ': pareamiento seleccionado {' + selectedText + '}. Aristas adyacentes bloqueadas {' + (blockedText || 'ninguna') + '}. ' + (i % 2 === 1 ? 'Colores invertidos.' : 'Colores normales.')
			});
		}
		return steps;
	}

	function renderGraph(containerId, vertices, edges, viewState) {
		const box = document.getElementById(containerId);
		if (!box) return;
		box.innerHTML = '';
		if (!vertices.length) {
			box.innerHTML = '<div class="grafo-empty">Agregue vertices y aristas para visualizar.</div>';
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

		const selected = (viewState && viewState.selected) ? viewState.selected : new Set();
		const saturated = (viewState && viewState.saturated) ? viewState.saturated : new Set();

		const svg = d3.select(box).append('svg')
			.attr('class', 'grafo-svg')
			.attr('viewBox', '0 0 ' + width + ' ' + height)
			.attr('preserveAspectRatio', 'xMidYMid meet');

		const links = edges.map(function (e) {
			return { source: byId[e.inicio], target: byId[e.fin], key: edgeKeyUnd(e.inicio, e.fin), nombre: e.nombre };
		}).filter(function (e) { return !!e.source && !!e.target; });

		const line = svg.append('g').selectAll('line').data(links).enter().append('line')
			.attr('class', function (d) {
				let classes = 'link-line';
				if (selected.has(d.key)) classes += ' matching';
				return classes;
			});

		const edgeLabel = svg.append('g').selectAll('text.edge-label').data(links).enter().append('text')
			.attr('class', 'edge-label')
			.attr('text-anchor', 'middle')
			.attr('dy', -3)
			.attr('font-size', '12px')
			.attr('fill', '#666')
			.text(function(d) { return d.nombre; });

		const node = svg.append('g').selectAll('circle').data(vertices).enter().append('circle')
			.attr('class', function (d) {
				let classes = 'node-circle';
				if (saturated.has(d.id)) classes += ' saturated';
				return classes;
			})
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

			edgeLabel
				.attr('x', function (d) { return (d.source.x + d.target.x) / 2; })
				.attr('y', function (d) { return (d.source.y + d.target.y) / 2; });

			node
				.attr('cx', function (d) { return d.x = clamp(d.x || width / 2, minX, maxX); })
				.attr('cy', function (d) { return d.y = clamp(d.y || height / 2, minY, maxY); });

			nodeLabel
				.attr('x', function (d) { return d.x; })
				.attr('y', function (d) { return d.y; });
		}

		update();
	}

	function updateSelector() {
		// Función simplificada - solo muestra óptimo
		return;
	}

	function renderCurrentStep() {
		// Función simplificada - solo muestra el óptimo
	}

	function refresh() {
		setHtml('pNotacion', graphNotation(state.vertices, state.aristas));
		if (!document.getElementById('pResultado').innerHTML) {
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
		}
		const matching = state.optimalMatching || [];
		const saturated = saturatedVerticesFor(matching);
		renderGraph('pGrafo', state.vertices, state.aristas, {
			selected: new Set(matching.map(function (e) { return edgeKeyUnd(e.inicio, e.fin); })),
			saturated: saturated
		});
	}

	function apply() {
		hideMsg();
		if (!state.vertices.length) {
			return showMsg('Ingrese al menos un vertice.', 'warning');
		}
		state.matchings = enumerateMatchings(state.aristas);
		const maxSize = state.matchings.reduce(function (acc, s) { return Math.max(acc, s.length); }, 0);
		const maxMatchings = state.matchings.filter(function (s) { return s.length === maxSize; });
		const maximalMatchings = state.matchings.filter(function (s) { return isMaximalMatching(s, state.aristas); });

		let optimalIndex = 0;
		let isPerfect = false;
		for (let i = 0; i < maxMatchings.length; i += 1) {
			const saturated = saturatedVerticesFor(maxMatchings[i]);
			if (saturated.size === state.vertices.length && state.vertices.length > 0) {
				optimalIndex = i;
				isPerfect = true;
				break;
			}
		}
		state.optimalMatching = maxMatchings[optimalIndex] || [];

		const optimalMatching = state.optimalMatching;
		const saturatedOptimal = Array.from(saturatedVerticesFor(optimalMatching));
		const result = [
			'<strong>Pareamientos posibles:</strong><br>' + formatSet('M', state.matchings, function (s) {
				return s.map(formatEdgeCompact).join(', ');
			}),
			'<br><strong>Tamaño máximo de pareamiento:</strong> ' + maxSize +
			'<br><strong>Pareamientos máximos:</strong><br>' + formatSet('M<sub>max</sub>', maxMatchings, function (s) {
				return s.map(formatEdgeCompact).join(', ');
			}),
			'<br><strong>Pareamientos maximales:</strong><br>' + formatSet('M<sub>maxi</sub>', maximalMatchings, function (s) {
				return s.map(formatEdgeCompact).join(', ');
			}),
			'<br><strong>Pareamiento óptimo:</strong> {' + optimalMatching.map(formatEdgeCompact).join(', ') + '}' + (isPerfect ? ' <strong>(perfecto)</strong>' : ''),
			'<br><strong>Vértices saturados:</strong> {' + saturatedOptimal.join(', ') + '}'
		].join('');
		setHtml('pResultado', result);

		refresh();
		showMsg('Cálculo completado.', 'success');
	}

	function init() {
		if (!document.getElementById('btnPAgregarVertice')) return;

		document.getElementById('btnPAgregarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('pVerticeNombre').value);
			if (!id) return showMsg('Ingrese un vertice valido.', 'warning');
			if (state.vertices.some(function (v) { return v.id === id; })) return showMsg('El vertice ya existe.', 'warning');
			const p = nextVertexPosition(state.vertices);
			state.vertices.push({ id: id, x: p.x, y: p.y });
			document.getElementById('pVerticeNombre').value = '';
			state.optimalMatching = [];
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
			refresh();
		});

		document.getElementById('btnPEliminarVertice').addEventListener('click', function () {
			hideMsg();
			const id = norm(document.getElementById('pVerticeNombre').value);
			const before = state.vertices.length;
			state.vertices = state.vertices.filter(function (v) { return v.id !== id; });
			if (before === state.vertices.length) return showMsg('No existe el vertice a eliminar.', 'warning');
			state.aristas = state.aristas.filter(function (e) { return e.inicio !== id && e.fin !== id; });
			document.getElementById('pVerticeNombre').value = '';
			state.optimalMatching = [];
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
			refresh();
		});

		document.getElementById('btnPAgregarArista').addEventListener('click', function () {
			hideMsg();
			const nombre = norm(document.getElementById('pAristaNombre').value);
			const inicio = norm(document.getElementById('pAristaInicio').value);
			const fin = norm(document.getElementById('pAristaFin').value);
			if (!nombre) return showMsg('Ingrese el nombre de la arista.', 'warning');
			if (!inicio || !fin) return showMsg('Ingrese los dos vertices.', 'warning');
			if (inicio === fin) return showMsg('No se permiten lazos.', 'warning');
			if (!state.vertices.some(function (v) { return v.id === inicio; }) || !state.vertices.some(function (v) { return v.id === fin; })) {
				return showMsg('Ambos vertices deben existir.', 'warning');
			}
			if (state.aristas.some(function (e) { return e.nombre === nombre; })) return showMsg('La arista ya existe.', 'warning');
			const key = edgeKeyUnd(inicio, fin);
			if (state.aristas.some(function (e) { return edgeKeyUnd(e.inicio, e.fin) === key; })) {
				return showMsg('Ya existe una arista entre esos vertices.', 'warning');
			}
			state.aristas.push({ nombre: nombre, inicio: inicio, fin: fin });
			document.getElementById('pAristaNombre').value = '';
			document.getElementById('pAristaInicio').value = '';
			document.getElementById('pAristaFin').value = '';
			state.optimalMatching = [];
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
			refresh();
		});

		document.getElementById('btnPEliminarArista').addEventListener('click', function () {
			hideMsg();
			const nombre = norm(document.getElementById('pAristaNombre').value);
			const inicio = norm(document.getElementById('pAristaInicio').value);
			const fin = norm(document.getElementById('pAristaFin').value);
			const before = state.aristas.length;
			if (nombre) {
				state.aristas = state.aristas.filter(function (e) { return e.nombre !== nombre; });
			} else {
				state.aristas = state.aristas.filter(function (e) { return edgeKeyUnd(e.inicio, e.fin) !== edgeKeyUnd(inicio, fin); });
			}
			if (before === state.aristas.length) return showMsg('No se encontro la arista.', 'warning');
			document.getElementById('pAristaNombre').value = '';
			document.getElementById('pAristaInicio').value = '';
			document.getElementById('pAristaFin').value = '';
			state.optimalMatching = [];
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
			refresh();
		});

		document.getElementById('btnPOperar').addEventListener('click', apply);

		document.getElementById('btnPLimpiar').addEventListener('click', function () {
			hideMsg();
			state.vertices = [];
			state.aristas = [];
			state.matchings = [];
			state.optimalMatching = [];
			setHtml('pResultado', 'Pulse <strong>Calcular</strong>.');
			refresh();
		});

		document.getElementById('btnPGuardar').addEventListener('click', function () {
			downloadJson('conjuntos_grafo.json', {
				tipo: 'conjuntos_grafo',
				vertices: state.vertices,
				aristas: state.aristas
			});
			showMsg('Estructura guardada correctamente.', 'success');
		});

		document.getElementById('btnPCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputPareamiento');
			if (input) input.click();
		});

		const fileInput = document.getElementById('fileInputPareamiento');
		if (fileInput) {
			fileInput.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				readJsonFile(file, function (data) {
					const graph = loadGraphFromData(data);
					state.vertices = graph.vertices;
					state.aristas = graph.aristas;
					state.matchings = [];
					state.optimalMatching = [];
					setHtml('pResultado', 'Datos cargados. Pulse <strong>Calcular</strong>.');
					refresh();
					showMsg('Estructura cargada correctamente.', 'success');
				}, function (err) {
					showMsg('Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		const prevBtn = document.getElementById('btnPPrev');
		if (prevBtn) {
			prevBtn.addEventListener('click', function () {
				// Botón de paso anterior deshabilitado
			});
		}

		const nextBtn = document.getElementById('btnPNext');
		if (nextBtn) {
			nextBtn.addEventListener('click', function () {
				// Botón de paso siguiente deshabilitado
			});
		}

		const resetBtn = document.getElementById('btnPReset');
		if (resetBtn) {
			resetBtn.addEventListener('click', function () {
				// Botón de reinicio deshabilitado
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

