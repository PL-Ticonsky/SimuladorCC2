(function () {
	const s = {
		t1: { vertices: [], aristas: [] },
		t2: { vertices: [], aristas: [] }
	};

	function sumWeight(edges) {
		return edges.reduce(function (acc, e) { return acc + Number(e.peso || 0); }, 0);
	}

	function uniqueUnionWeighted(e1, e2, U) {
		const map = new Map();
		e1.concat(e2).forEach(function (e) {
			const k = U.edgeKey(e.inicio, e.fin);
			if (!map.has(k)) map.set(k, { inicio: e.inicio, fin: e.fin, peso: Number(e.peso) });
		});
		return Array.from(map.values());
	}

	function intersectionWeighted(e1, e2, U) {
		const map2 = new Map();
		e2.forEach(function (e) { map2.set(U.edgeKey(e.inicio, e.fin), Number(e.peso)); });
		const out = [];
		e1.forEach(function (e) {
			const k = U.edgeKey(e.inicio, e.fin);
			if (map2.has(k)) out.push({ inicio: e.inicio, fin: e.fin, peso: Number(e.peso) });
		});
		return out;
	}

	function bindTreeButtons(prefix, tree) {
		const U = window.ArbolesUtils;

		document.getElementById('btnDAgregarV' + prefix).addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			const v = U.norm(document.getElementById('dV' + prefix + 'Nombre').value);
			if (!v) return U.showMsg('mensajeDist', 'Ingrese un vertice valido.', 'warning');
			if (tree.vertices.indexOf(v) !== -1) return U.showMsg('mensajeDist', 'El vertice ya existe.', 'warning');
			tree.vertices.push(v);
			document.getElementById('dV' + prefix + 'Nombre').value = '';
			refresh();
		});

		document.getElementById('btnDEliminarV' + prefix).addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			const v = U.norm(document.getElementById('dV' + prefix + 'Nombre').value);
			const idx = tree.vertices.indexOf(v);
			if (idx === -1) return U.showMsg('mensajeDist', 'No existe el vertice a eliminar.', 'warning');
			tree.vertices.splice(idx, 1);
			tree.aristas = tree.aristas.filter(function (e) { return e.inicio !== v && e.fin !== v; });
			document.getElementById('dV' + prefix + 'Nombre').value = '';
			refresh();
		});

		document.getElementById('btnDAgregarA' + prefix).addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			const a = U.norm(document.getElementById('dA' + prefix + 'Inicio').value);
			const b = U.norm(document.getElementById('dA' + prefix + 'Fin').value);
			const peso = Number(document.getElementById('dA' + prefix + 'Peso').value);
			if (!a || !b) return U.showMsg('mensajeDist', 'Ingrese inicio y fin.', 'warning');
			if (a === b) return U.showMsg('mensajeDist', 'No se permiten lazos.', 'warning');
			if (Number.isNaN(peso)) return U.showMsg('mensajeDist', 'El peso debe ser numerico.', 'warning');
			if (tree.vertices.indexOf(a) === -1 || tree.vertices.indexOf(b) === -1) {
				return U.showMsg('mensajeDist', 'Ambos vertices deben existir.', 'warning');
			}
			const k = U.edgeKey(a, b);
			if (tree.aristas.some(function (e) { return U.edgeKey(e.inicio, e.fin) === k; })) {
				return U.showMsg('mensajeDist', 'La arista ya existe.', 'warning');
			}
			if (U.createsCycle(tree.vertices, tree.aristas, a, b)) {
				return U.showMsg('mensajeDist', 'Restriccion de arbol: no se permiten ciclos.', 'danger');
			}
			tree.aristas.push({ inicio: a, fin: b, peso: peso });
			document.getElementById('dA' + prefix + 'Inicio').value = '';
			document.getElementById('dA' + prefix + 'Fin').value = '';
			document.getElementById('dA' + prefix + 'Peso').value = '';
			refresh();
		});

		document.getElementById('btnDEliminarA' + prefix).addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			const a = U.norm(document.getElementById('dA' + prefix + 'Inicio').value);
			const b = U.norm(document.getElementById('dA' + prefix + 'Fin').value);
			const k = U.edgeKey(a, b);
			const before = tree.aristas.length;
			tree.aristas = tree.aristas.filter(function (e) { return U.edgeKey(e.inicio, e.fin) !== k; });
			if (before === tree.aristas.length) return U.showMsg('mensajeDist', 'No se encontro la arista.', 'warning');
			refresh();
		});
	}

	function refresh() {
		const U = window.ArbolesUtils;
		U.setNotation('dNotacionT1', U.makeNotation(s.t1.vertices, s.t1.aristas, true, {
			base: 'T1',
			sSub: 'T1',
			aSub: 'T1',
			weightOnly: true
		}));
		U.setNotation('dNotacionT2', U.makeNotation(s.t2.vertices, s.t2.aristas, true, {
			base: 'T2',
			sSub: 'T2',
			aSub: 'T2',
			weightOnly: true
		}));
		U.renderGraph('dGrafoT1', s.t1.vertices, s.t1.aristas, {});
		U.renderGraph('dGrafoT2', s.t2.vertices, s.t2.aristas, {});
		if (!document.getElementById('dResultado').innerHTML) {
			U.setNotation('dResultado', 'Pulse <strong>Operar</strong> para calcular distancia.');
		}
	}

	function initDistModule() {
		const U = window.ArbolesUtils;
		if (!U || !document.getElementById('btnDOperar')) return;

		bindTreeButtons('1', s.t1);
		bindTreeButtons('2', s.t2);

		document.getElementById('btnDOperar').addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			if (!U.isTree(s.t1.vertices, s.t1.aristas)) {
				return U.showMsg('mensajeDist', 'T1 debe ser un arbol valido (sin ciclos, conexo |S|=|A|-1)', 'danger');
			}
			if (!U.isTree(s.t2.vertices, s.t2.aristas)) {
				return U.showMsg('mensajeDist', 'T1 debe ser un arbol valido (sin ciclos, conexo |S|=|A|-1)', 'danger');
			}
			const uni = uniqueUnionWeighted(s.t1.aristas, s.t2.aristas, U);
			const inter = intersectionWeighted(s.t1.aristas, s.t2.aristas, U);
			const wU = sumWeight(uni);
			const wI = sumWeight(inter);
			const d = (wU - wI) / 2;

			U.setNotation('dResultado',
				'<strong>Unión:</strong> ' +
				(uni.length ? uni.map(function (e) { return String(e.peso); }).join(', ') : 'vacia') +
				'<br><strong>Peso(Unión):</strong> ' + wU +
				'<br><strong>Intersección:</strong> ' +
				(inter.length ? inter.map(function (e) { return String(e.peso); }).join(', ') : 'vacia') +
				'<br><strong>Peso(Intersección):</strong> ' + wI +
				'<br><strong>Distancia:</strong> d(T1,T2)=(' + wU + '-' + wI + ')/2=' + d
			);

			U.showMsg('mensajeDist', 'Distancia calculada correctamente.', 'success');
		});

		document.getElementById('btnDLimpiar').addEventListener('click', function () {
			U.hideMsg('mensajeDist');
			s.t1.vertices = [];
			s.t1.aristas = [];
			s.t2.vertices = [];
			s.t2.aristas = [];
			U.setNotation('dResultado', 'Pulse <strong>Hallar distancia</strong> para calcular.');
			refresh();
		});

		document.getElementById('btnDGuardar').addEventListener('click', function () {
			U.downloadJson('distancia_arboles.json', {
				tipo: 'distancia_arboles',
				t1: s.t1,
				t2: s.t2
			});
			U.showMsg('mensajeDist', 'Estructuras guardadas correctamente.', 'success');
		});

		document.getElementById('btnDCargar').addEventListener('click', function () {
			const input = document.getElementById('fileInputDist');
			if (input) input.click();
		});

		const fileInputDist = document.getElementById('fileInputDist');
		if (fileInputDist) {
			fileInputDist.addEventListener('change', function (e) {
				const file = e.target.files[0];
				if (!file) return;
				U.readJsonFile(file, function (data) {
					if (data.tipo !== 'distancia_arboles') throw new Error('Archivo no compatible.');
					s.t1 = data.t1 || { vertices: [], aristas: [] };
					s.t2 = data.t2 || { vertices: [], aristas: [] };
					U.setNotation('dResultado', 'Datos cargados. Pulse <strong>Hallar distancia</strong>.');
					refresh();
					U.showMsg('mensajeDist', 'Estructuras cargadas correctamente.', 'success');
				}, function (err) {
					U.showMsg('mensajeDist', 'Error al cargar archivo: ' + err.message, 'danger');
				});
				e.target.value = '';
			});
		}

		refresh();
	}

	document.addEventListener('DOMContentLoaded', initDistModule);
})();

