/**
 * Simulador CC2 - Módulo de Búsquedas por Residuos
 * Métodos: Digital, Tries (Simple), Múltiple, Huffman
 */

// ==================== VARIABLES GLOBALES ====================

// --- Árbol Digital ---
let arbolDigital = null; // Nodo raíz
let animacionDigitalEnCurso = false;
let timeoutsDigital = [];

// --- Tries ---
let raizTries = null;
let animacionTriesEnCurso = false;
let timeoutsTries = [];

// --- Múltiple ---
let arbolMultiple = null;
let animacionMultipleEnCurso = false;
let timeoutsMultiple = [];

// --- Huffman ---
let huffmanPalabras = []; // [{palabra, frecuencia}]
let huffmanArbol = null;
let huffmanCodigos = {};
let animacionHuffmanEnCurso = false;
let timeoutsHuffman = [];

// ==================== UTILS COMUNES ====================

function letraANumero(letra) {
    const c = letra.toUpperCase();
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 64; // A=1, B=2...
    return null;
}

function numeroBinario(n, bits) {
    return n.toString(2).padStart(bits, '0');
}

function letraBinario(letra, bits = 5) {
    const n = letraANumero(letra);
    if (n === null) return null;
    return numeroBinario(n, bits);
}

function mostrarMensajeResiduo(tipo, mensaje, claseAlerta) {
    // IDs en HTML: mensajeResiduoDigital, mensajeResiduoTries, mensajeResiduoMultiple, mensajeResiduoHuffman
    const id = `mensajeResiduo${tipo}`;
    const alertDiv = document.getElementById(id);
    if (!alertDiv) return;
    alertDiv.className = `alert alert-${claseAlerta}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function limpiarTimeoutsArr(arr) {
    arr.forEach(t => clearTimeout(t));
    arr.length = 0;
}

// ==================== ÁRBOL DIGITAL ====================

/**
 * Nodo del árbol digital
 * clave: letra almacenada (o null)
 * izq: hijo izquierdo (bit 0)
 * der: hijo derecho (bit 1)
 */
function crearNodoDigital(clave = null) {
    return { clave, izq: null, der: null };
}

function insertarDigital() {
    if (animacionDigitalEnCurso) limpiarTimeoutsArr(timeoutsDigital);

    const input = document.getElementById('claveDigital');
    const letra = input.value.trim().toUpperCase();

    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Digital', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    const num = letraANumero(letra);
    const binario = letraBinario(letra, 5);

    // Si el árbol está vacío, la letra es la raíz
    if (arbolDigital === null) {
        arbolDigital = crearNodoDigital(letra);
        input.value = '';
        renderizarArbolD3('Digital', arbolDigital);
        mostrarMensajeResiduo('Digital',
            `<strong>"${letra}"</strong> (${num} = ${binario}) insertada como <strong>raíz</strong>`, 'success');
        mostrarTablaDigital(letra, num, binario, 'raíz', []);
        return;
    }

    // Verificar si ya existe
    if (buscarEnArbolDigital(arbolDigital, letra)) {
        mostrarMensajeResiduo('Digital', `La letra "${letra}" ya existe en el árbol`, 'warning');
        return;
    }

    // Insertar leyendo bits
    const pasos = [];
    let nodo = arbolDigital;
    let bitIdx = 0;
    let posicion = '';

    while (true) {
        const bit = binario[bitIdx];

        if (bit === undefined) {
            // Sin más bits: colisión irresolvible (no debería pasar con 5 bits y 26 letras)
            mostrarMensajeResiduo('Digital', 'No hay espacio disponible para esta clave', 'danger');
            return;
        }

        const direccion = bit === '1' ? 'der' : 'izq';
        const dirLabel = bit === '1' ? 'derecha (1)' : 'izquierda (0)';

        pasos.push({ bit, direccion, bitIdx, nodoActual: nodo.clave });

        if (nodo[direccion] === null) {
            // Posición libre
            nodo[direccion] = crearNodoDigital(letra);
            posicion = bit === '1' ? 'derecha' : 'izquierda';
            break;
        } else {
            // Colisión: avanzar al siguiente bit
            nodo = nodo[direccion];
            bitIdx++;
        }
    }

    input.value = '';
    renderizarArbolD3('Digital', arbolDigital);
    mostrarTablaDigital(letra, num, binario, posicion, pasos);
    mostrarMensajeResiduo('Digital',
        `<strong>"${letra}"</strong> (${num} = ${binario}) insertada. Bits leídos: ${pasos.length + 1}`, 'success');
}

function buscarEnArbolDigital(nodo, letra) {
    if (!nodo) return false;
    if (nodo.clave === letra) return true;
    return buscarEnArbolDigital(nodo.izq, letra) || buscarEnArbolDigital(nodo.der, letra);
}

function buscarDigital() {
    if (animacionDigitalEnCurso) limpiarTimeoutsArr(timeoutsDigital);

    const letra = document.getElementById('claveDigital').value.trim().toUpperCase();
    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Digital', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    if (!arbolDigital) {
        mostrarMensajeResiduo('Digital', 'El árbol está vacío', 'warning');
        return;
    }

    const num = letraANumero(letra);
    const binario = letraBinario(letra, 5);
    const pasos = [];

    // Raíz
    if (arbolDigital.clave === letra) {
        mostrarMensajeResiduo('Digital',
            `<strong>"${letra}"</strong> encontrada en la <strong>raíz</strong>`, 'success');
        resaltarNodoD3('Digital', letra, 'encontrado');
        mostrarTablaDigital(letra, num, binario, 'raíz', []);
        return;
    }

    let nodo = arbolDigital;
    let bitIdx = 0;
    let encontrado = false;

    while (nodo && bitIdx < binario.length) {
        const bit = binario[bitIdx];
        const direccion = bit === '1' ? 'der' : 'izq';
        pasos.push({ bit, bitIdx, nodoActual: nodo.clave });

        nodo = nodo[direccion];
        if (nodo && nodo.clave === letra) {
            encontrado = true;
            break;
        }
        bitIdx++;
    }

    if (encontrado) {
        mostrarMensajeResiduo('Digital',
            `<strong>"${letra}"</strong> (${num} = ${binario}) encontrada. Pasos: ${pasos.length + 1}`, 'success');
        resaltarNodoD3('Digital', letra, 'encontrado');
        mostrarTablaDigital(letra, num, binario, 'encontrado', pasos);
    } else {
        mostrarMensajeResiduo('Digital',
            `<strong>"${letra}"</strong> no encontrada en el árbol`, 'danger');
        mostrarTablaDigital(letra, num, binario, 'no encontrado', pasos);
    }
}

function eliminarDigital() {
    const letra = document.getElementById('claveDigital').value.trim().toUpperCase();
    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Digital', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    if (!arbolDigital) {
        mostrarMensajeResiduo('Digital', 'El árbol está vacío', 'warning');
        return;
    }

    if (!buscarEnArbolDigital(arbolDigital, letra)) {
        mostrarMensajeResiduo('Digital', `La letra "${letra}" no existe en el árbol`, 'danger');
        return;
    }

    if (!confirm(`¿Eliminar la letra "${letra}" del árbol?`)) return;

    // Eliminar: si es la raíz, poner clave en null (mantener hijos) o null completo
    arbolDigital = eliminarNodoDigital(arbolDigital, letra);
    document.getElementById('claveDigital').value = '';
    renderizarArbolD3('Digital', arbolDigital);
    mostrarMensajeResiduo('Digital', `Letra "${letra}" eliminada del árbol`, 'success');
    limpiarTablaDigital();
}

function eliminarNodoDigital(nodo, letra) {
    if (!nodo) return null;
    if (nodo.clave === letra) {
        // Si no tiene hijos, eliminar nodo
        if (!nodo.izq && !nodo.der) return null;
        // Si tiene hijos, solo limpiar la clave (marcar como interno vacío)
        nodo.clave = null;
        return nodo;
    }
    nodo.izq = eliminarNodoDigital(nodo.izq, letra);
    nodo.der = eliminarNodoDigital(nodo.der, letra);
    return nodo;
}

function limpiarDigital() {
    if (!confirm('¿Limpiar todo el árbol digital?')) return;
    limpiarTimeoutsArr(timeoutsDigital);
    arbolDigital = null;
    document.getElementById('claveDigital').value = '';
    renderizarArbolD3('Digital', null);
    mostrarMensajeResiduo('Digital', 'Árbol limpiado', 'info');
    limpiarTablaDigital();
}

function guardarDigital() {
    const datos = JSON.stringify({ tipo: 'digital', arbol: arbolDigital });
    descargarJSON(datos, 'arbol_digital.json');
    mostrarMensajeResiduo('Digital', 'Árbol guardado correctamente', 'success');
}

function cargarDigital() {
    document.getElementById('fileInputDigital').click();
}

function mostrarTablaDigital(letra, num, binario, resultado, pasos) {
    const tbody = document.getElementById('tablaDigitalBody');
    if (!tbody) return;

    // Encabezado con info de la letra
    let html = `<tr class="table-primary">
        <td colspan="4"><strong>Letra:</strong> ${letra} | <strong>Número:</strong> ${num} | <strong>Binario (5 bits):</strong> <code>${binario}</code> | <strong>Resultado:</strong> ${resultado}</td>
    </tr>`;

    if (pasos.length === 0 && resultado === 'raíz') {
        html += `<tr><td colspan="4" class="text-center text-muted">Insertada directamente como raíz</td></tr>`;
    } else {
        pasos.forEach((p, i) => {
            const dir = p.bit === '1' ? '→ Derecha' : '← Izquierda';
            html += `<tr>
                <td>${i + 1}</td>
                <td>Bit[${p.bitIdx}] = <strong>${p.bit}</strong></td>
                <td>${dir}</td>
                <td>${p.nodoActual ? `Colisión con "${p.nodoActual}"` : 'Libre'}</td>
            </tr>`;
        });
    }

    tbody.innerHTML = html;
    document.getElementById('tablaDigital').classList.remove('d-none');
}

function limpiarTablaDigital() {
    const tabla = document.getElementById('tablaDigital');
    if (tabla) tabla.classList.add('d-none');
}

// ==================== TRIES (SIMPLE) ====================

/**
 * Nodo de Tries: por cada carácter
 * hijos: {'A': nodo, 'B': nodo, ...}
 * esFinDePalabra: boolean
 * clave: la palabra completa (solo si esFinDePalabra)
 */
function crearNodoTries() {
    return { hijos: {}, esFinDePalabra: false, clave: null };
}

function insertarTries() {
    if (animacionTriesEnCurso) limpiarTimeoutsArr(timeoutsTries);

    const input = document.getElementById('claveTries');
    const palabra = input.value.trim().toUpperCase();

    if (!palabra || !/^[A-Z]+$/.test(palabra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una palabra (solo letras A-Z)', 'warning');
        return;
    }

    if (!raizTries) raizTries = crearNodoTries();

    // Verificar si ya existe
    if (buscarEnTries(raizTries, palabra)) {
        mostrarMensajeResiduo('Tries', `La palabra "${palabra}" ya existe`, 'warning');
        return;
    }

    let nodo = raizTries;
    const ruta = [];

    for (const c of palabra) {
        if (!nodo.hijos[c]) {
            nodo.hijos[c] = crearNodoTries();
        }
        ruta.push({ char: c, esNuevo: !nodo.hijos[c]?.esFinDePalabra });
        nodo = nodo.hijos[c];
    }
    nodo.esFinDePalabra = true;
    nodo.clave = palabra;

    input.value = '';
    renderizarArbolD3('Tries', raizTries);
    mostrarMensajeResiduo('Tries',
        `Palabra <strong>"${palabra}"</strong> insertada. Profundidad: ${palabra.length}`, 'success');
}

function buscarEnTries(raiz, palabra) {
    if (!raiz) return false;
    let nodo = raiz;
    for (const c of palabra) {
        if (!nodo.hijos[c]) return false;
        nodo = nodo.hijos[c];
    }
    return nodo.esFinDePalabra;
}

function buscarTries() {
    const palabra = document.getElementById('claveTries').value.trim().toUpperCase();
    if (!palabra || !/^[A-Z]+$/.test(palabra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una palabra (solo letras A-Z)', 'warning');
        return;
    }

    if (!raizTries) {
        mostrarMensajeResiduo('Tries', 'El trie está vacío', 'warning');
        return;
    }

    const encontrado = buscarEnTries(raizTries, palabra);
    if (encontrado) {
        mostrarMensajeResiduo('Tries', `Palabra <strong>"${palabra}"</strong> encontrada en el trie`, 'success');
        resaltarRutaTries(palabra);
    } else {
        mostrarMensajeResiduo('Tries', `Palabra <strong>"${palabra}"</strong> no encontrada`, 'danger');
    }
}

function resaltarRutaTries(palabra) {
    // Resaltar visualmente la ruta en el SVG
    const svg = document.getElementById('svgTries');
    if (!svg) return;
    // Los nodos tienen data-label con el carácter
    const nodos = svg.querySelectorAll('.tree-node');
    // Simple: resaltar todos los nodos que forman el prefijo
    // La implementación de resaltado está en el renderizado D3
}

function eliminarTries() {
    const palabra = document.getElementById('claveTries').value.trim().toUpperCase();
    if (!palabra || !/^[A-Z]+$/.test(palabra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una palabra (solo letras A-Z)', 'warning');
        return;
    }

    if (!raizTries || !buscarEnTries(raizTries, palabra)) {
        mostrarMensajeResiduo('Tries', `La palabra "${palabra}" no existe`, 'danger');
        return;
    }

    if (!confirm(`¿Eliminar la palabra "${palabra}"?`)) return;

    raizTries = eliminarDeTries(raizTries, palabra, 0);
    document.getElementById('claveTries').value = '';
    renderizarArbolD3('Tries', raizTries);
    mostrarMensajeResiduo('Tries', `Palabra "${palabra}" eliminada`, 'success');
}

function eliminarDeTries(nodo, palabra, idx) {
    if (!nodo) return null;
    if (idx === palabra.length) {
        nodo.esFinDePalabra = false;
        nodo.clave = null;
        if (Object.keys(nodo.hijos).length === 0) return null;
        return nodo;
    }
    const c = palabra[idx];
    nodo.hijos[c] = eliminarDeTries(nodo.hijos[c], palabra, idx + 1);
    if (!nodo.hijos[c]) delete nodo.hijos[c];
    if (Object.keys(nodo.hijos).length === 0 && !nodo.esFinDePalabra) return null;
    return nodo;
}

function limpiarTries() {
    if (!confirm('¿Limpiar todo el trie?')) return;
    limpiarTimeoutsArr(timeoutsTries);
    raizTries = null;
    document.getElementById('claveTries').value = '';
    renderizarArbolD3('Tries', null);
    mostrarMensajeResiduo('Tries', 'Trie limpiado', 'info');
}

function guardarTries() {
    const datos = JSON.stringify({ tipo: 'tries', arbol: raizTries });
    descargarJSON(datos, 'arbol_tries.json');
    mostrarMensajeResiduo('Tries', 'Trie guardado correctamente', 'success');
}

function cargarTries() {
    document.getElementById('fileInputTries').click();
}

// ==================== ÁRBOL MÚLTIPLE ====================

/**
 * Árbol de búsqueda por residuo múltiple (B-ario)
 * Grado configurable (orden del árbol)
 * La clave se distribuye entre los hijos según: clave mod grado
 */
function crearNodoMultiple(clave = null) {
    return { clave, hijos: [] };
}

function insertarMultiple() {
    if (animacionMultipleEnCurso) limpiarTimeoutsArr(timeoutsMultiple);

    const input = document.getElementById('claveMultiple');
    const gradoEl = document.getElementById('gradoMultiple');
    const clave = input.value.trim();
    const grado = parseInt(gradoEl.value) || 3;

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeResiduo('Multiple', 'Ingrese una clave numérica', 'warning');
        return;
    }

    const num = parseInt(clave);

    if (!arbolMultiple) {
        arbolMultiple = crearNodoMultiple(num);
        input.value = '';
        renderizarArbolD3('Multiple', arbolMultiple, grado);
        mostrarMensajeResiduo('Multiple',
            `Clave <strong>${num}</strong> insertada como raíz`, 'success');
        mostrarTablaMultiple(num, grado, []);
        return;
    }

    if (buscarEnArbolMultiple(arbolMultiple, num, grado)) {
        mostrarMensajeResiduo('Multiple', `La clave ${num} ya existe`, 'warning');
        return;
    }

    const pasos = [];
    let nodo = arbolMultiple;

    while (true) {
        const residuo = num % grado;
        pasos.push({ nodo: nodo.clave, residuo, grado, idx: residuo });

        // Inicializar hijos si es necesario
        while (nodo.hijos.length <= residuo) {
            nodo.hijos.push(null);
        }

        if (nodo.hijos[residuo] === null || nodo.hijos[residuo] === undefined) {
            nodo.hijos[residuo] = crearNodoMultiple(num);
            break;
        } else {
            nodo = nodo.hijos[residuo];
        }
    }

    input.value = '';
    renderizarArbolD3('Multiple', arbolMultiple, grado);
    mostrarTablaMultiple(num, grado, pasos);
    mostrarMensajeResiduo('Multiple',
        `Clave <strong>${num}</strong> insertada. Residuo: ${num % grado}. Pasos: ${pasos.length}`, 'success');
}

function buscarEnArbolMultiple(nodo, num, grado) {
    if (!nodo) return false;
    if (nodo.clave === num) return true;
    const residuo = num % grado;
    if (residuo < nodo.hijos.length && nodo.hijos[residuo]) {
        return buscarEnArbolMultiple(nodo.hijos[residuo], num, grado);
    }
    return false;
}

function buscarMultiple() {
    const clave = document.getElementById('claveMultiple').value.trim();
    const grado = parseInt(document.getElementById('gradoMultiple').value) || 3;

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeResiduo('Multiple', 'Ingrese una clave numérica', 'warning');
        return;
    }

    if (!arbolMultiple) {
        mostrarMensajeResiduo('Multiple', 'El árbol está vacío', 'warning');
        return;
    }

    const num = parseInt(clave);
    const encontrado = buscarEnArbolMultiple(arbolMultiple, num, grado);

    if (encontrado) {
        mostrarMensajeResiduo('Multiple', `Clave <strong>${num}</strong> encontrada`, 'success');
        resaltarNodoD3('Multiple', num, 'encontrado');
    } else {
        mostrarMensajeResiduo('Multiple', `Clave <strong>${num}</strong> no encontrada`, 'danger');
    }
}

function eliminarMultiple() {
    const clave = document.getElementById('claveMultiple').value.trim();
    const grado = parseInt(document.getElementById('gradoMultiple').value) || 3;

    if (!clave || !/^[0-9]+$/.test(clave)) {
        mostrarMensajeResiduo('Multiple', 'Ingrese una clave numérica', 'warning');
        return;
    }

    const num = parseInt(clave);
    if (!arbolMultiple || !buscarEnArbolMultiple(arbolMultiple, num, grado)) {
        mostrarMensajeResiduo('Multiple', `Clave ${num} no encontrada`, 'danger');
        return;
    }

    if (!confirm(`¿Eliminar la clave ${num}?`)) return;

    arbolMultiple = eliminarDeArbolMultiple(arbolMultiple, num, grado);
    document.getElementById('claveMultiple').value = '';
    renderizarArbolD3('Multiple', arbolMultiple, grado);
    mostrarMensajeResiduo('Multiple', `Clave ${num} eliminada`, 'success');
}

function eliminarDeArbolMultiple(nodo, num, grado) {
    if (!nodo) return null;
    if (nodo.clave === num) {
        if (nodo.hijos.every(h => !h)) return null;
        nodo.clave = null;
        return nodo;
    }
    const residuo = num % grado;
    if (residuo < nodo.hijos.length) {
        nodo.hijos[residuo] = eliminarDeArbolMultiple(nodo.hijos[residuo], num, grado);
    }
    return nodo;
}

function limpiarMultiple() {
    if (!confirm('¿Limpiar todo el árbol múltiple?')) return;
    limpiarTimeoutsArr(timeoutsMultiple);
    arbolMultiple = null;
    document.getElementById('claveMultiple').value = '';
    renderizarArbolD3('Multiple', null);
    mostrarMensajeResiduo('Multiple', 'Árbol limpiado', 'info');
}

function guardarMultiple() {
    const grado = parseInt(document.getElementById('gradoMultiple').value) || 3;
    const datos = JSON.stringify({ tipo: 'multiple', grado, arbol: arbolMultiple });
    descargarJSON(datos, 'arbol_multiple.json');
    mostrarMensajeResiduo('Multiple', 'Árbol guardado correctamente', 'success');
}

function cargarMultiple() {
    document.getElementById('fileInputMultiple').click();
}

function mostrarTablaMultiple(num, grado, pasos) {
    const tbody = document.getElementById('tablaMultipleBody');
    if (!tbody) return;

    let html = `<tr class="table-primary">
        <td colspan="3"><strong>Clave:</strong> ${num} | <strong>Grado:</strong> ${grado} | <strong>Residuo base:</strong> ${num % grado}</td>
    </tr>`;

    if (pasos.length === 0) {
        html += `<tr><td colspan="3" class="text-center text-muted">Insertada como raíz</td></tr>`;
    } else {
        pasos.forEach((p, i) => {
            html += `<tr>
                <td>${i + 1}</td>
                <td>Nodo: <strong>${p.nodo}</strong> | ${p.num !== undefined ? p.num : num} mod ${p.grado} = <strong>${p.residuo}</strong></td>
                <td>→ Hijo[${p.residuo}]</td>
            </tr>`;
        });
    }

    tbody.innerHTML = html;
    document.getElementById('tablaMultiple').classList.remove('d-none');
}

// ==================== HUFFMAN ====================

/**
 * Árbol de Huffman basado en frecuencias de palabras/caracteres
 * El usuario agrega palabras con sus frecuencias, luego se construye el árbol
 */

function agregarPalabraHuffman() {
    const inputPalabra = document.getElementById('palabraHuffman');
    const inputFreq = document.getElementById('frecuenciaHuffman');

    const palabra = inputPalabra.value.trim().toUpperCase();
    const freq = parseInt(inputFreq.value);

    if (!palabra || !/^[A-Z]+$/.test(palabra)) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una palabra válida (solo letras)', 'warning');
        return;
    }

    if (isNaN(freq) || freq < 1) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una frecuencia válida (≥ 1)', 'warning');
        return;
    }

    const existe = huffmanPalabras.find(p => p.palabra === palabra);
    if (existe) {
        mostrarMensajeResiduo('Huffman', `La palabra "${palabra}" ya existe. Frecuencia: ${existe.frecuencia}`, 'warning');
        return;
    }

    huffmanPalabras.push({ palabra, frecuencia: freq });
    inputPalabra.value = '';
    inputFreq.value = '';

    renderizarListaHuffman();
    mostrarMensajeResiduo('Huffman', `Palabra <strong>"${palabra}"</strong> agregada con frecuencia ${freq}`, 'success');
}

function renderizarListaHuffman() {
    const lista = document.getElementById('listaHuffman');
    if (!lista) return;

    if (huffmanPalabras.length === 0) {
        lista.innerHTML = '<div class="text-muted text-center small">No hay palabras agregadas</div>';
        return;
    }

    // Ordenar por frecuencia desc
    const ordenadas = [...huffmanPalabras].sort((a, b) => b.frecuencia - a.frecuencia);

    lista.innerHTML = ordenadas.map(p => `
        <div class="d-flex justify-content-between align-items-center border rounded px-2 py-1 mb-1 bg-white">
            <span class="fw-semibold">${p.palabra}</span>
            <span class="badge bg-primary">f=${p.frecuencia}</span>
            <button class="btn btn-sm btn-outline-danger py-0" onclick="eliminarPalabraHuffmanLista('${p.palabra}')">×</button>
        </div>
    `).join('');
}

function eliminarPalabraHuffmanLista(palabra) {
    huffmanPalabras = huffmanPalabras.filter(p => p.palabra !== palabra);
    renderizarListaHuffman();
    huffmanArbol = null;
    huffmanCodigos = {};
    renderizarArbolD3('Huffman', null);
    mostrarMensajeResiduo('Huffman', `Palabra "${palabra}" eliminada de la lista`, 'info');
}

function construirHuffman() {
    if (huffmanPalabras.length < 2) {
        mostrarMensajeResiduo('Huffman', 'Se necesitan al menos 2 palabras para construir el árbol', 'warning');
        return;
    }

    // Crear nodos hoja
    let cola = huffmanPalabras.map(p => ({
        palabra: p.palabra,
        frecuencia: p.frecuencia,
        izq: null,
        der: null,
        esHoja: true
    }));

    // Algoritmo de Huffman
    const pasosConstruccion = [];

    while (cola.length > 1) {
        // Ordenar por frecuencia
        cola.sort((a, b) => a.frecuencia - b.frecuencia);

        const izq = cola.shift();
        const der = cola.shift();

        const nuevo = {
            palabra: null,
            frecuencia: izq.frecuencia + der.frecuencia,
            izq,
            der,
            esHoja: false
        };

        pasosConstruccion.push({
            izq: izq.palabra || `[${izq.frecuencia}]`,
            der: der.palabra || `[${der.frecuencia}]`,
            sumFreq: nuevo.frecuencia
        });

        cola.push(nuevo);
    }

    huffmanArbol = cola[0];

    // Generar códigos
    huffmanCodigos = {};
    generarCodigosHuffman(huffmanArbol, '');

    renderizarArbolD3('Huffman', huffmanArbol);
    mostrarTablaHuffman(pasosConstruccion);
    mostrarMensajeResiduo('Huffman',
        `Árbol de Huffman construido con ${huffmanPalabras.length} palabras`, 'success');
}

function generarCodigosHuffman(nodo, codigo) {
    if (!nodo) return;
    if (nodo.esHoja) {
        huffmanCodigos[nodo.palabra] = codigo || '0';
        return;
    }
    generarCodigosHuffman(nodo.izq, codigo + '0');
    generarCodigosHuffman(nodo.der, codigo + '1');
}

function buscarHuffman() {
    const inputPalabra = document.getElementById('palabraHuffman');
    const palabra = inputPalabra.value.trim().toUpperCase();

    if (!palabra) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una palabra para buscar', 'warning');
        return;
    }

    if (!huffmanArbol) {
        mostrarMensajeResiduo('Huffman', 'Primero construya el árbol de Huffman', 'warning');
        return;
    }

    if (huffmanCodigos[palabra]) {
        mostrarMensajeResiduo('Huffman',
            `Palabra <strong>"${palabra}"</strong> | Código Huffman: <code>${huffmanCodigos[palabra]}</code>`, 'success');
        resaltarNodoD3('Huffman', palabra, 'encontrado');
    } else {
        mostrarMensajeResiduo('Huffman', `Palabra <strong>"${palabra}"</strong> no encontrada en el árbol`, 'danger');
    }
}

function limpiarHuffman() {
    if (!confirm('¿Limpiar todo el árbol y la lista de palabras?')) return;
    limpiarTimeoutsArr(timeoutsHuffman);
    huffmanPalabras = [];
    huffmanArbol = null;
    huffmanCodigos = {};
    document.getElementById('palabraHuffman').value = '';
    document.getElementById('frecuenciaHuffman').value = '';
    renderizarListaHuffman();
    renderizarArbolD3('Huffman', null);
    mostrarMensajeResiduo('Huffman', 'Árbol y lista limpiados', 'info');
    const tabla = document.getElementById('tablaHuffman');
    if (tabla) tabla.classList.add('d-none');
}

function guardarHuffman() {
    const datos = JSON.stringify({
        tipo: 'huffman',
        palabras: huffmanPalabras,
        codigos: huffmanCodigos
    });
    descargarJSON(datos, 'arbol_huffman.json');
    mostrarMensajeResiduo('Huffman', 'Árbol guardado correctamente', 'success');
}

function cargarHuffman() {
    document.getElementById('fileInputHuffman').click();
}

function mostrarTablaHuffman(pasos) {
    const tbody = document.getElementById('tablaHuffmanBody');
    const tabla = document.getElementById('tablaHuffman');
    if (!tbody || !tabla) return;

    let html = `<tr class="table-primary">
        <td colspan="4"><strong>Pasos de construcción del árbol Huffman</strong></td>
    </tr>`;

    pasos.forEach((p, i) => {
        html += `<tr>
            <td>${i + 1}</td>
            <td>${p.izq}</td>
            <td>${p.der}</td>
            <td>${p.sumFreq}</td>
        </tr>`;
    });

    // Tabla de códigos
    html += `<tr class="table-info"><td colspan="4"><strong>Códigos generados</strong></td></tr>`;
    Object.entries(huffmanCodigos).sort((a, b) => a[1].length - b[1].length).forEach(([pal, cod]) => {
        const freq = huffmanPalabras.find(p => p.palabra === pal)?.frecuencia || '-';
        html += `<tr>
            <td><strong>${pal}</strong></td>
            <td>f=${freq}</td>
            <td colspan="2"><code>${cod}</code></td>
        </tr>`;
    });

    tbody.innerHTML = html;
    tabla.classList.remove('d-none');
}

// ==================== VISUALIZACIÓN D3.js ====================

function arbolDigitalAD3(nodo, padre = null, label = 'ROOT') {
    if (!nodo) return null;
    const name = nodo.clave
        ? `${nodo.clave}\n(${letraANumero(nodo.clave)}=${letraBinario(nodo.clave, 5)})`
        : '•';
    const children = [];
    if (nodo.izq) children.push({ ...arbolDigitalAD3(nodo.izq, nodo, '0'), edgeLabel: '0' });
    if (nodo.der) children.push({ ...arbolDigitalAD3(nodo.der, nodo, '1'), edgeLabel: '1' });
    return { name, originalClave: nodo.clave, children: children.length ? children : undefined };
}

function arbolTriesAD3(nodo, char = 'ROOT') {
    if (!nodo) return null;
    const name = char === 'ROOT' ? '∅' : char;
    const esFin = nodo.esFinDePalabra;
    const children = Object.entries(nodo.hijos)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([c, hijo]) => ({ ...arbolTriesAD3(hijo, c), edgeLabel: c }));
    return {
        name,
        esFin,
        clave: nodo.clave,
        children: children.length ? children : undefined
    };
}

function arbolMultipleAD3(nodo, grado) {
    if (!nodo) return null;
    const name = nodo.clave !== null ? `${nodo.clave}` : '∅';
    const children = [];
    for (let i = 0; i < Math.max(nodo.hijos.length, grado); i++) {
        if (nodo.hijos[i]) {
            children.push({ ...arbolMultipleAD3(nodo.hijos[i], grado), edgeLabel: `[${i}]` });
        }
    }
    return { name, originalClave: nodo.clave, children: children.length ? children : undefined };
}

function arbolHuffmanAD3(nodo) {
    if (!nodo) return null;
    const name = nodo.esHoja ? `${nodo.palabra}\nf=${nodo.frecuencia}` : `f=${nodo.frecuencia}`;
    const children = [];
    if (nodo.izq) children.push({ ...arbolHuffmanAD3(nodo.izq), edgeLabel: '0' });
    if (nodo.der) children.push({ ...arbolHuffmanAD3(nodo.der), edgeLabel: '1' });
    return {
        name,
        esHoja: nodo.esHoja,
        originalClave: nodo.palabra,
        children: children.length ? children : undefined
    };
}

function renderizarArbolD3(tipo, arbol, grado = 3) {
    const containerId = `svg${tipo}Container`;
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (!arbol) {
        container.innerHTML = '<div class="text-muted text-center py-4">El árbol está vacío</div>';
        return;
    }

    // Convertir a formato D3
    let datosD3;
    if (tipo === 'Digital') datosD3 = arbolDigitalAD3(arbol);
    else if (tipo === 'Tries') datosD3 = arbolTriesAD3(arbol);
    else if (tipo === 'Multiple') datosD3 = arbolMultipleAD3(arbol, grado);
    else if (tipo === 'Huffman') datosD3 = arbolHuffmanAD3(arbol);

    if (!datosD3) return;

    const ancho = container.clientWidth || 700;
    const altoMin = 350;

    const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('id', `svg${tipo}`)
        .attr('width', ancho)
        .attr('style', 'overflow: visible; font-family: monospace;');

    const g = svg.append('g');

    // Crear jerarquía D3
    const root = d3.hierarchy(datosD3);

    // Layout del árbol
    const treeFn = d3.tree().nodeSize([70, 80]);
    treeFn(root);

    // Calcular bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    root.descendants().forEach(d => {
        minX = Math.min(minX, d.x);
        maxX = Math.max(maxX, d.x);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y);
    });

    const margen = 60;
    const totalAncho = maxX - minX + margen * 2;
    const totalAlto = Math.max(altoMin, maxY - minY + margen * 2 + 40);

    svg.attr('height', totalAlto);

    const offsetX = -minX + margen;
    const offsetY = -minY + margen + 20;

    g.attr('transform', `translate(${offsetX},${offsetY})`);

    // Paleta de colores
    const colores = {
        Digital: { nodo: '#5B9BD5', texto: 'white', borde: '#44546A', raiz: '#44546A', hoja: '#BDD7EE' },
        Tries: { nodo: '#70AD47', texto: 'white', borde: '#375623', raiz: '#375623', fin: '#E2F0D9' },
        Multiple: { nodo: '#ED7D31', texto: 'white', borde: '#843C0C', raiz: '#843C0C' },
        Huffman: { nodo: '#9B59B6', texto: 'white', borde: '#6C3483', raiz: '#6C3483', hoja: '#D7BDE2' }
    };
    const col = colores[tipo] || colores.Digital;

    // Links
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('g')
        .attr('class', 'link-group')
        .each(function(d) {
            const grp = d3.select(this);

            // Línea curva
            grp.append('path')
                .attr('class', 'link')
                .attr('d', d3.linkVertical()
                    .x(n => n.x)
                    .y(n => n.y))
                .attr('fill', 'none')
                .attr('stroke', '#8497B0')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', d.target.data.children ? '' : '4,2')
                .attr('opacity', 0.7);

            // Etiqueta de la arista (bit o carácter)
            if (d.target.data.edgeLabel !== undefined) {
                const mx = (d.source.x + d.target.x) / 2;
                const my = (d.source.y + d.target.y) / 2;
                grp.append('rect')
                    .attr('x', mx - 10)
                    .attr('y', my - 9)
                    .attr('width', 20)
                    .attr('height', 18)
                    .attr('rx', 4)
                    .attr('fill', '#F2F2F2')
                    .attr('stroke', '#D6DCE5')
                    .attr('stroke-width', 1);
                grp.append('text')
                    .attr('x', mx)
                    .attr('y', my + 4)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', '11px')
                    .attr('font-weight', 'bold')
                    .attr('fill', col.borde)
                    .text(d.target.data.edgeLabel);
            }
        });

    // Nodos
    const nodeGrp = g.selectAll('.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .attr('data-clave', d => d.data.originalClave || d.data.clave || '');

    // Círculo del nodo
    nodeGrp.append('circle')
        .attr('r', d => d.depth === 0 ? 24 : 20)
        .attr('fill', d => {
            if (d.depth === 0) return col.raiz;
            if (tipo === 'Tries' && d.data.esFin) return col.fin || col.nodo;
            if (tipo === 'Huffman' && d.data.esHoja) return col.hoja || col.nodo;
            return col.nodo;
        })
        .attr('stroke', col.borde)
        .attr('stroke-width', d => d.depth === 0 ? 3 : 2)
        .attr('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))');

    // Texto del nodo (puede tener saltos de línea)
    nodeGrp.each(function(d) {
        const grp = d3.select(this);
        const lineas = d.data.name.split('\n');

        if (lineas.length === 1) {
            grp.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('font-size', d.depth === 0 ? '13px' : '11px')
                .attr('font-weight', 'bold')
                .attr('fill', d.depth === 0 ? 'white' : (tipo === 'Tries' && d.data.esFin ? col.borde : 'white'))
                .text(lineas[0]);
        } else {
            // Multi-línea (para Digital: "A\n(1=00001)")
            const offsetY = -(lineas.length - 1) * 6;
            lineas.forEach((linea, i) => {
                grp.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', `${offsetY + i * 12}px`)
                    .attr('font-size', i === 0 ? '12px' : '8px')
                    .attr('font-weight', i === 0 ? 'bold' : 'normal')
                    .attr('fill', 'white')
                    .text(linea);
            });
        }
    });

    // Ajustar SVG al contenido real
    svg.attr('width', Math.max(ancho, totalAncho));
    container.style.overflowX = 'auto';
}

function resaltarNodoD3(tipo, clave, estado) {
    const svgId = `svg${tipo}`;
    const svg = document.getElementById(svgId);
    if (!svg) return;

    const nodos = svg.querySelectorAll('.node');
    nodos.forEach(n => {
        const dc = n.getAttribute('data-clave');
        const claveStr = clave !== null ? clave.toString() : '';
        if (dc === claveStr) {
            const circle = n.querySelector('circle');
            if (circle) {
                const colorOriginal = circle.getAttribute('fill');
                circle.setAttribute('fill', estado === 'encontrado' ? '#70AD47' : '#E74C3C');
                setTimeout(() => {
                    circle.setAttribute('fill', colorOriginal);
                }, 2000);
            }
        }
    });
}

// ==================== UTILIDADES ====================

function descargarJSON(datos, nombre) {
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(url);
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function () {

    // ---- Pestaña residuo ----
    const tabResiduo = document.getElementById('tab-residuo');
    if (tabResiduo) {
        tabResiduo.addEventListener('shown.bs.tab', function () {
            const panelBienvenida = document.getElementById('panel-bienvenida');
            if (panelBienvenida) panelBienvenida.style.display = 'none';
        });
    }

    // ---- Sub-tabs residuo ----
    ['tab-digital', 'tab-tries', 'tab-multiple', 'tab-huffman'].forEach(tabId => {
        const tab = document.getElementById(tabId);
        if (tab) {
            tab.addEventListener('shown.bs.tab', function () {
                // Re-renderizar al cambiar de pestaña
                const tipo = tabId.replace('tab-', '');
                const tipoMap = { digital: 'Digital', tries: 'Tries', multiple: 'Multiple', huffman: 'Huffman' };
                const t = tipoMap[tipo];
                if (t === 'Digital') renderizarArbolD3('Digital', arbolDigital);
                else if (t === 'Tries') renderizarArbolD3('Tries', raizTries);
                else if (t === 'Multiple') {
                    const grado = parseInt(document.getElementById('gradoMultiple').value) || 3;
                    renderizarArbolD3('Multiple', arbolMultiple, grado);
                }
                else if (t === 'Huffman') renderizarArbolD3('Huffman', huffmanArbol);
            });
        }
    });

    // ---- Cargar Digital ----
    const fileDigital = document.getElementById('fileInputDigital');
    if (fileDigital) {
        fileDigital.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const datos = JSON.parse(ev.target.result);
                    arbolDigital = datos.arbol;
                    renderizarArbolD3('Digital', arbolDigital);
                    mostrarMensajeResiduo('Digital', 'Árbol cargado correctamente', 'success');
                } catch (err) {
                    mostrarMensajeResiduo('Digital', 'Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ---- Cargar Tries ----
    const fileTries = document.getElementById('fileInputTries');
    if (fileTries) {
        fileTries.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const datos = JSON.parse(ev.target.result);
                    raizTries = datos.arbol;
                    renderizarArbolD3('Tries', raizTries);
                    mostrarMensajeResiduo('Tries', 'Trie cargado correctamente', 'success');
                } catch (err) {
                    mostrarMensajeResiduo('Tries', 'Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ---- Cargar Múltiple ----
    const fileMultiple = document.getElementById('fileInputMultiple');
    if (fileMultiple) {
        fileMultiple.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const datos = JSON.parse(ev.target.result);
                    arbolMultiple = datos.arbol;
                    if (datos.grado) document.getElementById('gradoMultiple').value = datos.grado;
                    const grado = datos.grado || 3;
                    renderizarArbolD3('Multiple', arbolMultiple, grado);
                    mostrarMensajeResiduo('Multiple', 'Árbol cargado correctamente', 'success');
                } catch (err) {
                    mostrarMensajeResiduo('Multiple', 'Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // ---- Cargar Huffman ----
    const fileHuffman = document.getElementById('fileInputHuffman');
    if (fileHuffman) {
        fileHuffman.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const datos = JSON.parse(ev.target.result);
                    huffmanPalabras = datos.palabras || [];
                    huffmanCodigos = datos.codigos || {};
                    renderizarListaHuffman();
                    if (huffmanPalabras.length >= 2) construirHuffman();
                    mostrarMensajeResiduo('Huffman', 'Datos cargados correctamente', 'success');
                } catch (err) {
                    mostrarMensajeResiduo('Huffman', 'Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // Enter en inputs
    const entradas = [
        { id: 'claveDigital', fn: insertarDigital },
        { id: 'claveTries', fn: insertarTries },
        { id: 'claveMultiple', fn: insertarMultiple },
        { id: 'palabraHuffman', fn: agregarPalabraHuffman },
        { id: 'frecuenciaHuffman', fn: agregarPalabraHuffman },
    ];

    entradas.forEach(({ id, fn }) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
    });
});