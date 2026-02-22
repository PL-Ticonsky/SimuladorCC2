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
let huffmanLetras = {}; // {letra: frecuencia}
let huffmanPalabraOriginal = ''; // palabra original ingresada
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

// ==================== GESTOR DE MÉTODOS ====================

const descripcionesResiduo = {
    digital: '<strong>Árbol Digital:</strong> Inserta letras (A-Z) una por una. Cada letra se codifica a su número (A=1, B=2...) y luego a binario de 5 bits. La primera letra es la raíz. Las siguientes se insertan leyendo bit a bit: <code>0 → izquierda</code>, <code>1 → derecha</code>. Si hay colisión, se lee el siguiente bit.',
    tries: '<strong>Tries (Simple):</strong> Inserta letras (A-Z) una por una. Cada letra se convierte a binario de 5 bits. Los nodos internos siempre están vacíos y las letras se ubican en las hojas. <code>0 → izquierda</code>, <code>1 → derecha</code>. Si dos letras colisionan en una hoja, el árbol crece hasta que sus bits divergen.',
    multiple: '<strong>Árbol Múltiple (por Residuo):</strong> Cada nodo puede tener hasta <em>grado</em> hijos. La posición de inserción se calcula como <code>clave mod grado</code>. En colisión, se desciende por ese hijo y se repite.',
    huffman: '<strong>Huffman (Codificación por Frecuencia):</strong> Ingresa una palabra y el programa detecta automáticamente la frecuencia de cada letra. Las letras más frecuentes reciben códigos más cortos. <code>0 → izquierda</code>, <code>1 → derecha</code>.'
};

function cambiarMetodoResiduo() {
    const metodo = document.getElementById('metodoResiduo').value;
    const descripcionDiv = document.getElementById('descripcionResiduo');
    const paneles = document.querySelectorAll('.residuo-panel');

    if (!metodo) {
        descripcionDiv.innerHTML = '<span class="text-muted">Seleccione un método de búsqueda para ver su descripción.</span>';
        // Ocultar todos los paneles
        paneles.forEach(panel => panel.classList.add('d-none'));
        return;
    }

    // Mostrar descripción
    descripcionDiv.innerHTML = descripcionesResiduo[metodo] || '<span class="text-muted">Sin descripción disponible.</span>';

    // Ocultar todos los paneles y mostrar solo el seleccionado
    paneles.forEach(panel => {
        if (panel.getAttribute('data-metodo') === metodo) {
            panel.classList.remove('d-none');
        } else {
            panel.classList.add('d-none');
        }
    });

    // Re-renderizar el árbol si es necesario
    const tipo = {
        digital: 'Digital',
        tries: 'Tries',
        multiple: 'Multiple',
        huffman: 'Huffman'
    }[metodo];

    if (tipo === 'Digital') renderizarArbolD3('Digital', arbolDigital);
    else if (tipo === 'Tries') renderizarArbolD3('Tries', raizTries);
    else if (tipo === 'Multiple') {
        const grado = parseInt(document.getElementById('gradoMultiple').value) || 3;
        renderizarArbolD3('Multiple', arbolMultiple, grado);
    }
    else if (tipo === 'Huffman') renderizarArbolD3('Huffman', huffmanArbol);
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
        mostrarInfoDigital(letra, num, binario);
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
            mostrarMensajeResiduo('Digital', 'No hay espacio disponible para esta clave', 'danger');
            return;
        }

        const direccion = bit === '1' ? 'der' : 'izq';

        pasos.push({ bit, direccion, bitIdx, nodoActual: nodo.clave });

        if (nodo[direccion] === null) {
            nodo[direccion] = crearNodoDigital(letra);
            posicion = bit === '1' ? 'derecha' : 'izquierda';
            break;
        } else {
            nodo = nodo[direccion];
            bitIdx++;
        }
    }

    input.value = '';
    renderizarArbolD3('Digital', arbolDigital);
    mostrarInfoDigital(letra, num, binario);
    mostrarMensajeResiduo('Digital',
        `<strong>"${letra}"</strong> (${num} = ${binario}) insertada. Ruta: <code>${pasos.map(p => p.bit).join('')}</code>`, 'success');
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
    mostrarInfoDigital(letra, num, binario);

    // Raíz
    if (arbolDigital.clave === letra) {
        animacionDigitalEnCurso = true;
        timeoutsDigital.push(setTimeout(() => {
            resaltarNodoD3('Digital', letra, 'encontrado');
            mostrarMensajeResiduo('Digital',
                `<strong>"${letra}"</strong> encontrada en la <strong>raíz</strong>`, 'success');
            animacionDigitalEnCurso = false;
        }, 400));
        return;
    }

    // Recorrer según binario con animación
    const rutaNodos = [arbolDigital]; // nodos visitados
    const rutaBits = [];
    let nodo = arbolDigital;
    let bitIdx = 0;
    let encontrado = false;

    while (nodo && bitIdx < binario.length) {
        const bit = binario[bitIdx];
        const direccion = bit === '1' ? 'der' : 'izq';
        rutaBits.push(bit);

        nodo = nodo[direccion];
        if (nodo) {
            rutaNodos.push(nodo);
            if (nodo.clave === letra) {
                encontrado = true;
                break;
            }
        } else {
            break; // camino terminó (nodo null)
        }
        bitIdx++;
    }

    // Animar recorrido
    animacionDigitalEnCurso = true;
    const delay = 500;

    rutaNodos.forEach((n, i) => {
        timeoutsDigital.push(setTimeout(() => {
            const claveN = n.clave;
            if (claveN) resaltarNodoD3Temporal('Digital', claveN, '#FFC107', delay - 100);
        }, i * delay));
    });

    // Resultado final
    timeoutsDigital.push(setTimeout(() => {
        if (encontrado) {
            resaltarNodoD3('Digital', letra, 'encontrado');
            mostrarMensajeResiduo('Digital',
                `<strong>"${letra}"</strong> (${num} = ${binario}) encontrada. Ruta: <code>${rutaBits.join('')}</code>`, 'success');
        } else {
            // Resaltar último nodo visitado en rojo
            const ultimo = rutaNodos[rutaNodos.length - 1];
            if (ultimo && ultimo.clave) resaltarNodoD3('Digital', ultimo.clave, 'no-encontrado');
            mostrarMensajeResiduo('Digital',
                `<strong>"${letra}"</strong> (${num} = ${binario}) no encontrada. Ruta recorrida: <code>${rutaBits.join('')}</code>`, 'danger');
        }
        animacionDigitalEnCurso = false;
    }, rutaNodos.length * delay));
}

function eliminarDigital() {
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
    mostrarInfoDigital(letra, num, binario);

    if (!buscarEnArbolDigital(arbolDigital, letra)) {
        // Animar recorrido hasta la hoja más próxima según binario, luego indicar no encontrado
        const rutaNodos = [arbolDigital];
        const rutaBits = [];
        let nodo = arbolDigital;
        let bitIdx = 0;
        while (nodo && bitIdx < binario.length) {
            const bit = binario[bitIdx];
            const dir = bit === '1' ? 'der' : 'izq';
            rutaBits.push(bit);
            if (!nodo[dir]) break;
            nodo = nodo[dir];
            rutaNodos.push(nodo);
            bitIdx++;
        }
        animacionDigitalEnCurso = true;
        const delay = 500;
        rutaNodos.forEach((n, i) => {
            timeoutsDigital.push(setTimeout(() => {
                if (n.clave) resaltarNodoD3Temporal('Digital', n.clave, '#FFC107', delay - 100);
            }, i * delay));
        });
        timeoutsDigital.push(setTimeout(() => {
            const ultimo = rutaNodos[rutaNodos.length - 1];
            if (ultimo && ultimo.clave) resaltarNodoD3('Digital', ultimo.clave, 'no-encontrado');
            mostrarMensajeResiduo('Digital', `La letra "${letra}" no existe en el árbol. Ruta recorrida: <code>${rutaBits.join('')}</code>`, 'danger');
            animacionDigitalEnCurso = false;
        }, rutaNodos.length * delay));
        return;
    }

    // Si es la raíz, animar solo la raíz
    if (arbolDigital.clave === letra) {
        animacionDigitalEnCurso = true;
        timeoutsDigital.push(setTimeout(() => {
            resaltarNodoD3Temporal('Digital', letra, '#E74C3C', 600);
        }, 0));
        timeoutsDigital.push(setTimeout(() => {
            arbolDigital = eliminarNodoDigital(arbolDigital, letra);
            arbolDigital = podarArbolDigital(arbolDigital);
            document.getElementById('claveDigital').value = '';
            renderizarArbolD3('Digital', arbolDigital);
            mostrarMensajeResiduo('Digital', `Letra "${letra}" eliminada del árbol`, 'success');
            limpiarInfoDigital();
            animacionDigitalEnCurso = false;
        }, 700));
        return;
    }

    // Encontrar ruta hacia la letra
    const rutaNodos = [arbolDigital];
    const rutaBits = [];
    let nodo = arbolDigital;
    let bitIdx = 0;
    while (nodo && bitIdx < binario.length) {
        const bit = binario[bitIdx];
        const dir = bit === '1' ? 'der' : 'izq';
        rutaBits.push(bit);
        nodo = nodo[dir];
        if (nodo) {
            rutaNodos.push(nodo);
            if (nodo.clave === letra) break;
        }
        bitIdx++;
    }

    // Animar recorrido hasta la letra y luego eliminarla
    animacionDigitalEnCurso = true;
    const delay = 500;
    rutaNodos.forEach((n, i) => {
        timeoutsDigital.push(setTimeout(() => {
            if (n.clave) {
                const color = (n.clave === letra) ? '#E74C3C' : '#FFC107';
                resaltarNodoD3Temporal('Digital', n.clave, color, delay - 100);
            }
        }, i * delay));
    });

    timeoutsDigital.push(setTimeout(() => {
        arbolDigital = eliminarNodoDigital(arbolDigital, letra);
        arbolDigital = podarArbolDigital(arbolDigital);
        document.getElementById('claveDigital').value = '';
        renderizarArbolD3('Digital', arbolDigital);
        mostrarMensajeResiduo('Digital', `Letra "${letra}" eliminada del árbol. Ruta: <code>${rutaBits.join('')}</code>`, 'success');
        limpiarInfoDigital();
        animacionDigitalEnCurso = false;
    }, rutaNodos.length * delay + 200));
}

/**
 * Eliminación típica de árbol binario:
 * - Si el nodo es hoja → se elimina directamente
 * - Si tiene un solo hijo → se reemplaza por ese hijo
 * - Si tiene dos hijos → se reemplaza por el sucesor in-order (menor del subárbol derecho)
 */
function eliminarNodoDigital(nodo, letra) {
    if (!nodo) return null;

    if (nodo.clave === letra) {
        // Caso 1: Nodo hoja
        if (!nodo.izq && !nodo.der) return null;

        // Caso 2: Solo hijo izquierdo
        if (!nodo.der) return nodo.izq;

        // Caso 3: Solo hijo derecho
        if (!nodo.izq) return nodo.der;

        // Caso 4: Dos hijos → reemplazar con sucesor in-order
        const sucesor = encontrarMinimoDigital(nodo.der);
        nodo.clave = sucesor.clave;
        nodo.der = eliminarNodoDigital(nodo.der, sucesor.clave);
        return nodo;
    }

    // Buscar recursivamente en ambos subárboles
    if (buscarEnArbolDigital(nodo.izq, letra)) {
        nodo.izq = eliminarNodoDigital(nodo.izq, letra);
    } else {
        nodo.der = eliminarNodoDigital(nodo.der, letra);
    }
    return nodo;
}

function encontrarMinimoDigital(nodo) {
    // Buscar el nodo con clave más a la izquierda (más profundo a la izquierda)
    if (nodo.izq && nodo.izq.clave !== null) return encontrarMinimoDigital(nodo.izq);
    if (nodo.clave !== null) return nodo;
    if (nodo.der) return encontrarMinimoDigital(nodo.der);
    return nodo;
}

function podarArbolDigital(nodo) {
    if (!nodo) return null;
    nodo.izq = podarArbolDigital(nodo.izq);
    nodo.der = podarArbolDigital(nodo.der);
    // Si es un nodo sin clave y sin hijos, eliminarlo
    if (nodo.clave === null && !nodo.izq && !nodo.der) return null;
    return nodo;
}

function limpiarDigital() {
    if (!confirm('¿Limpiar todo el árbol digital?')) return;
    limpiarTimeoutsArr(timeoutsDigital);
    arbolDigital = null;
    document.getElementById('claveDigital').value = '';
    renderizarArbolD3('Digital', null);
    mostrarMensajeResiduo('Digital', 'Árbol limpiado', 'info');
    limpiarInfoDigital();
}

function guardarDigital() {
    const datos = JSON.stringify({ tipo: 'digital', arbol: arbolDigital });
    descargarJSON(datos, 'arbol_digital.json');
    mostrarMensajeResiduo('Digital', 'Árbol guardado correctamente', 'success');
}

function cargarDigital() {
    document.getElementById('fileInputDigital').click();
}

function mostrarInfoDigital(letra, num, binario) {
    const container = document.getElementById('infoDigital');
    const body = document.getElementById('infoDigitalBody');
    if (!container || !body) return;
    body.innerHTML = `<strong>Letra:</strong> ${letra} | <strong>Número:</strong> ${num} | <strong>Binario (5 bits):</strong> <code>${binario}</code>`;
    container.classList.remove('d-none');
}

function limpiarInfoDigital() {
    const container = document.getElementById('infoDigital');
    if (container) container.classList.add('d-none');
}

// ==================== TRIES (SIMPLE) ====================

/**
 * Trie Simple binario por residuo:
 * - Nodos internos siempre vacíos
 * - Las letras se almacenan SOLO en hojas
 * - Cada letra se convierte a binario de 5 bits (A=1=00001, ..., Z=26=11010)
 * - Se recorre bit a bit: 0→izq, 1→der
 * - Si al insertar se llega a una hoja ocupada (colisión), se expande el árbol
 *   creando nodos internos hasta que ambas letras divergen en sus bits
 */
function crearNodoTries(clave = null) {
    return { clave, izq: null, der: null };
}

function esHojaTries(nodo) {
    return nodo && !nodo.izq && !nodo.der;
}

function insertarTries() {
    if (animacionTriesEnCurso) limpiarTimeoutsArr(timeoutsTries);

    const input = document.getElementById('claveTries');
    const letra = input.value.trim().toUpperCase();

    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    const num = letraANumero(letra);
    const binario = letraBinario(letra, 5);
    mostrarInfoTries(letra, num, binario);

    // Verificar si ya existe
    if (raizTries && buscarLetraEnTries(raizTries, letra)) {
        mostrarMensajeResiduo('Tries', `La letra "${letra}" ya existe en el trie`, 'warning');
        return;
    }

    // Si el árbol está vacío, crear hoja directa
    if (!raizTries) {
        raizTries = crearNodoTries(letra);
        input.value = '';
        renderizarArbolD3('Tries', raizTries);
        mostrarMensajeResiduo('Tries',
            `<strong>"${letra}"</strong> (${num} = ${binario}) insertada como única hoja`, 'success');
        return;
    }

    // Detectar si habrá colisión y recopilar snapshots para animación
    const snapshots = construirSnapshotsInsercion(raizTries, letra, binario);

    input.value = '';

    if (snapshots.length > 1) {
        // Animar la colisión paso a paso: la letra existente "baja" de a poco
        animacionTriesEnCurso = true;
        const delay = 600;
        snapshots.forEach((snap, i) => {
            timeoutsTries.push(setTimeout(() => {
                raizTries = snap;
                renderizarArbolD3('Tries', raizTries);
            }, i * delay));
        });
        timeoutsTries.push(setTimeout(() => {
            renderizarArbolD3('Tries', raizTries);
            mostrarMensajeResiduo('Tries',
                `<strong>"${letra}"</strong> (${num} = ${binario}) insertada correctamente`, 'success');
            animacionTriesEnCurso = false;
        }, snapshots.length * delay));
    } else {
        // Sin colisión, insertar directo
        raizTries = insertarEnTriesSinPasos(raizTries, letra, binario, 0);
        renderizarArbolD3('Tries', raizTries);
        mostrarMensajeResiduo('Tries',
            `<strong>"${letra}"</strong> (${num} = ${binario}) insertada correctamente`, 'success');
    }
}

/**
 * Construye snapshots (copias del árbol) para animar la colisión paso a paso.
 * Cada snapshot muestra un nivel más de expansión hasta que las letras divergen.
 */
function construirSnapshotsInsercion(raiz, letra, binario) {
    // Primero encontrar dónde ocurre la colisión
    const colision = encontrarColision(raiz, binario, 0);
    if (!colision) {
        // No hay colisión, inserción directa
        return [insertarEnTriesSinPasos(clonarTries(raiz), letra, binario, 0)];
    }

    const { otraLetra, bitIdxColision } = colision;
    const binOtra = letraBinario(otraLetra, 5);
    const snapshots = [];

    // Encontrar dónde divergen
    let divergeIdx = bitIdxColision;
    while (divergeIdx < binario.length && divergeIdx < binOtra.length && binario[divergeIdx] === binOtra[divergeIdx]) {
        divergeIdx++;
    }

    // Crear snapshots: primero quitar la hoja vieja, luego ir bajando de a un nivel
    for (let nivel = bitIdxColision; nivel <= divergeIdx; nivel++) {
        const copia = clonarTries(raiz);
        // Remover la hoja vieja de su posición original
        removerHoja(copia, otraLetra);

        if (nivel < divergeIdx) {
            // Snapshot intermedio: la letra vieja está bajando, aún no se ha colocado la nueva
            const cadena = construirCadenaInternos(binOtra, bitIdxColision, nivel, otraLetra);
            colocarSubarbol(copia, binario, bitIdxColision, cadena);
        } else {
            // Snapshot final: ambas letras en su posición
            const cadena = construirCadenaConDosHojas(binario, binOtra, bitIdxColision, divergeIdx, letra, otraLetra);
            colocarSubarbol(copia, binario, bitIdxColision, cadena);
        }
        snapshots.push(copia);
    }

    // Actualizar raizTries al estado final
    raizTries = snapshots[snapshots.length - 1];
    return snapshots;
}

function encontrarColision(nodo, binario, bitIdx) {
    if (!nodo) return null;
    if (esHojaTries(nodo) && nodo.clave !== null) {
        return { otraLetra: nodo.clave, bitIdxColision: bitIdx };
    }
    if (bitIdx >= binario.length) return null;
    const bit = binario[bitIdx];
    const dir = bit === '0' ? 'izq' : 'der';
    return encontrarColision(nodo[dir], binario, bitIdx + 1);
}

function clonarTries(nodo) {
    if (!nodo) return null;
    return {
        clave: nodo.clave,
        izq: clonarTries(nodo.izq),
        der: clonarTries(nodo.der)
    };
}

function removerHoja(raiz, letra) {
    if (!raiz) return null;
    if (esHojaTries(raiz) && raiz.clave === letra) return null;
    if (raiz.izq) {
        if (esHojaTries(raiz.izq) && raiz.izq.clave === letra) {
            raiz.izq = null;
        } else {
            removerHoja(raiz.izq, letra);
        }
    }
    if (raiz.der) {
        if (esHojaTries(raiz.der) && raiz.der.clave === letra) {
            raiz.der = null;
        } else {
            removerHoja(raiz.der, letra);
        }
    }
    return raiz;
}

function construirCadenaInternos(binOtra, desde, hasta, otraLetra) {
    // Construye nodos internos desde 'desde' hasta 'hasta', con la otraLetra al final
    if (desde > hasta) return crearNodoTries(otraLetra);
    const nodo = crearNodoTries(null);
    const bit = binOtra[desde];
    const dir = bit === '0' ? 'izq' : 'der';
    if (desde === hasta) {
        nodo[dir] = crearNodoTries(otraLetra);
    } else {
        nodo[dir] = construirCadenaInternos(binOtra, desde + 1, hasta, otraLetra);
    }
    return nodo;
}

function construirCadenaConDosHojas(binA, binB, desde, divergeIdx, letraA, letraB) {
    // Construye cadena de internos hasta divergeIdx, luego coloca ambas hojas
    if (desde === divergeIdx) {
        const nodo = crearNodoTries(null);
        const dirA = binA[desde] === '0' ? 'izq' : 'der';
        const dirB = binB[desde] === '0' ? 'izq' : 'der';
        nodo[dirA] = crearNodoTries(letraA);
        nodo[dirB] = crearNodoTries(letraB);
        return nodo;
    }
    const nodo = crearNodoTries(null);
    const bit = binA[desde]; // ambos bits son iguales hasta divergeIdx
    const dir = bit === '0' ? 'izq' : 'der';
    nodo[dir] = construirCadenaConDosHojas(binA, binB, desde + 1, divergeIdx, letraA, letraB);
    return nodo;
}

function colocarSubarbol(raiz, binario, bitIdx, subarbol) {
    if (bitIdx === 0) {
        // Reemplazar la raíz: copiar propiedades del subárbol a raíz
        raiz.clave = subarbol.clave;
        raiz.izq = subarbol.izq;
        raiz.der = subarbol.der;
        return;
    }
    let nodo = raiz;
    for (let i = 0; i < bitIdx - 1; i++) {
        const dir = binario[i] === '0' ? 'izq' : 'der';
        if (!nodo[dir]) nodo[dir] = crearNodoTries(null);
        nodo = nodo[dir];
    }
    const dirFinal = binario[bitIdx - 1] === '0' ? 'izq' : 'der';
    nodo[dirFinal] = subarbol;
}

function insertarEnTriesSinPasos(nodo, letra, binario, bitIdx) {
    if (!nodo) {
        return crearNodoTries(letra);
    }
    if (esHojaTries(nodo) && nodo.clave !== null) {
        const otraLetra = nodo.clave;
        if (otraLetra === letra) return nodo;
        const binOtra = letraBinario(otraLetra, 5);
        const interno = crearNodoTries(null);
        return expandirColisionSimple(interno, letra, binario, otraLetra, binOtra, bitIdx);
    }
    if (bitIdx >= binario.length) return nodo;
    const bit = binario[bitIdx];
    const dir = bit === '0' ? 'izq' : 'der';
    nodo[dir] = insertarEnTriesSinPasos(nodo[dir], letra, binario, bitIdx + 1);
    return nodo;
}

function expandirColisionSimple(nodoRaiz, letraA, binA, letraB, binB, bitIdx) {
    let actual = nodoRaiz;
    let idx = bitIdx;
    while (idx < binA.length && idx < binB.length) {
        const bitA = binA[idx];
        const bitB = binB[idx];
        if (bitA === bitB) {
            const dir = bitA === '0' ? 'izq' : 'der';
            actual[dir] = crearNodoTries(null);
            actual = actual[dir];
            idx++;
        } else {
            actual[binA[idx] === '0' ? 'izq' : 'der'] = crearNodoTries(letraA);
            actual[binB[idx] === '0' ? 'izq' : 'der'] = crearNodoTries(letraB);
            return nodoRaiz;
        }
    }
    return nodoRaiz;
}

function buscarLetraEnTries(nodo, letra) {
    if (!nodo) return false;
    if (esHojaTries(nodo)) return nodo.clave === letra;
    return buscarLetraEnTries(nodo.izq, letra) || buscarLetraEnTries(nodo.der, letra);
}

function buscarLetraEnTriesConRuta(nodo, letra, binario, bitIdx, ruta) {
    if (!nodo) return false;
    if (esHojaTries(nodo)) {
        return nodo.clave === letra;
    }
    if (bitIdx >= binario.length) return false;
    const bit = binario[bitIdx];
    ruta.push(bit);
    const dir = bit === '0' ? 'izq' : 'der';
    return buscarLetraEnTriesConRuta(nodo[dir], letra, binario, bitIdx + 1, ruta);
}

function buscarTries() {
    if (animacionTriesEnCurso) limpiarTimeoutsArr(timeoutsTries);

    const letra = document.getElementById('claveTries').value.trim().toUpperCase();
    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    if (!raizTries) {
        mostrarMensajeResiduo('Tries', 'El trie está vacío', 'warning');
        return;
    }

    const num = letraANumero(letra);
    const binario = letraBinario(letra, 5);
    mostrarInfoTries(letra, num, binario);

    // Si la raíz es una hoja
    if (esHojaTries(raizTries)) {
        animacionTriesEnCurso = true;
        const found = raizTries.clave === letra;
        timeoutsTries.push(setTimeout(() => {
            if (found) {
                resaltarNodoD3('Tries', letra, 'encontrado');
                mostrarMensajeResiduo('Tries',
                    `<strong>"${letra}"</strong> encontrada en la raíz`, 'success');
            } else {
                resaltarNodoD3('Tries', raizTries.clave, 'no-encontrado');
                mostrarMensajeResiduo('Tries',
                    `<strong>"${letra}"</strong> no encontrada`, 'danger');
            }
            animacionTriesEnCurso = false;
        }, 400));
        return;
    }

    // Recorrer con animación usando D3 node indices
    const ruta = [];
    const encontrado = buscarLetraEnTriesConRuta(raizTries, letra, binario, 0, ruta);

    // Build D3 hierarchy to get node indices
    const datosD3 = arbolTriesAD3(raizTries);
    const rootH = d3.hierarchy(datosD3);
    const descs = rootH.descendants();
    const svgEl = document.getElementById('svgTries');
    if (!svgEl) return;
    const todosNodos = svgEl.querySelectorAll('.node');

    // Match path through D3 hierarchy
    const indicesEnD3 = [];
    let d3Nodo = rootH;
    indicesEnD3.push(descs.indexOf(d3Nodo));
    for (const bit of ruta) {
        if (d3Nodo.children) {
            d3Nodo = bit === '0' ? d3Nodo.children[0] : d3Nodo.children[1];
            indicesEnD3.push(descs.indexOf(d3Nodo));
        }
    }

    animacionTriesEnCurso = true;
    const delay = 500;

    indicesEnD3.forEach((idx, i) => {
        if (idx < 0 || idx >= todosNodos.length) return;
        timeoutsTries.push(setTimeout(() => {
            const circle = todosNodos[idx].querySelector('circle');
            if (circle) {
                const orig = circle.getAttribute('fill');
                circle.setAttribute('fill', '#FFC107');
                setTimeout(() => circle.setAttribute('fill', orig), delay - 100);
            }
        }, i * delay));
    });

    timeoutsTries.push(setTimeout(() => {
        if (encontrado) {
            resaltarNodoD3('Tries', letra, 'encontrado');
            mostrarMensajeResiduo('Tries',
                `<strong>"${letra}"</strong> (${num} = ${binario}) encontrada. Ruta: <code>${ruta.join('')}</code>`, 'success');
        } else {
            // Highlight last node red
            const lastIdx = indicesEnD3[indicesEnD3.length - 1];
            if (lastIdx >= 0 && lastIdx < todosNodos.length) {
                const circle = todosNodos[lastIdx].querySelector('circle');
                if (circle) {
                    const orig = circle.getAttribute('fill');
                    circle.setAttribute('fill', '#E74C3C');
                    setTimeout(() => circle.setAttribute('fill', orig), 2000);
                }
            }
            mostrarMensajeResiduo('Tries',
                `<strong>"${letra}"</strong> (${num} = ${binario}) no encontrada. Ruta recorrida: <code>${ruta.join('')}</code>`, 'danger');
        }
        animacionTriesEnCurso = false;
    }, indicesEnD3.length * delay));
}

function eliminarTries() {
    if (animacionTriesEnCurso) limpiarTimeoutsArr(timeoutsTries);

    const letra = document.getElementById('claveTries').value.trim().toUpperCase();
    if (!letra || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Tries', 'Ingrese una sola letra (A-Z)', 'warning');
        return;
    }

    if (!raizTries) {
        mostrarMensajeResiduo('Tries', 'El trie está vacío', 'warning');
        return;
    }

    const num = letraANumero(letra);
    const binario = letraBinario(letra, 5);
    mostrarInfoTries(letra, num, binario);

    if (!buscarLetraEnTries(raizTries, letra)) {
        // Not found animation: traverse path and show red at end
        const ruta = [];
        buscarLetraEnTriesConRuta(raizTries, letra, binario, 0, ruta);
        const datosD3 = arbolTriesAD3(raizTries);
        const rootH = d3.hierarchy(datosD3);
        const descs = rootH.descendants();
        const svgEl = document.getElementById('svgTries');
        if (!svgEl) return;
        const todosNodos = svgEl.querySelectorAll('.node');
        const indicesEnD3 = [];
        let d3Nodo = rootH;
        indicesEnD3.push(descs.indexOf(d3Nodo));
        for (const bit of ruta) {
            if (d3Nodo.children) {
                d3Nodo = bit === '0' ? d3Nodo.children[0] : d3Nodo.children[1];
                indicesEnD3.push(descs.indexOf(d3Nodo));
            }
        }
        animacionTriesEnCurso = true;
        const delay = 500;
        indicesEnD3.forEach((idx, i) => {
            if (idx < 0 || idx >= todosNodos.length) return;
            timeoutsTries.push(setTimeout(() => {
                const circle = todosNodos[idx].querySelector('circle');
                if (circle) {
                    const orig = circle.getAttribute('fill');
                    circle.setAttribute('fill', '#FFC107');
                    setTimeout(() => circle.setAttribute('fill', orig), delay - 100);
                }
            }, i * delay));
        });
        timeoutsTries.push(setTimeout(() => {
            const lastIdx = indicesEnD3[indicesEnD3.length - 1];
            if (lastIdx >= 0 && lastIdx < todosNodos.length) {
                const circle = todosNodos[lastIdx].querySelector('circle');
                if (circle) {
                    const orig = circle.getAttribute('fill');
                    circle.setAttribute('fill', '#E74C3C');
                    setTimeout(() => circle.setAttribute('fill', orig), 2000);
                }
            }
            mostrarMensajeResiduo('Tries', `La letra "${letra}" no existe en el trie. Ruta: <code>${ruta.join('')}</code>`, 'danger');
            animacionTriesEnCurso = false;
        }, indicesEnD3.length * delay));
        return;
    }

    // Found: animate path then delete
    const ruta = [];
    buscarLetraEnTriesConRuta(raizTries, letra, binario, 0, ruta);
    const datosD3 = arbolTriesAD3(raizTries);
    const rootH = d3.hierarchy(datosD3);
    const descs = rootH.descendants();
    const svgEl = document.getElementById('svgTries');
    if (!svgEl) return;
    const todosNodos = svgEl.querySelectorAll('.node');
    const indicesEnD3 = [];
    let d3Nodo = rootH;
    indicesEnD3.push(descs.indexOf(d3Nodo));
    for (const bit of ruta) {
        if (d3Nodo.children) {
            d3Nodo = bit === '0' ? d3Nodo.children[0] : d3Nodo.children[1];
            indicesEnD3.push(descs.indexOf(d3Nodo));
        }
    }

    animacionTriesEnCurso = true;
    const delay = 500;
    indicesEnD3.forEach((idx, i) => {
        if (idx < 0 || idx >= todosNodos.length) return;
        const isTarget = (i === indicesEnD3.length - 1);
        timeoutsTries.push(setTimeout(() => {
            const circle = todosNodos[idx].querySelector('circle');
            if (circle) {
                const orig = circle.getAttribute('fill');
                circle.setAttribute('fill', isTarget ? '#E74C3C' : '#FFC107');
                setTimeout(() => circle.setAttribute('fill', orig), delay - 100);
            }
        }, i * delay));
    });

    timeoutsTries.push(setTimeout(() => {
        raizTries = eliminarDeTries(raizTries, letra, binario, 0);
        raizTries = compactarTries(raizTries);
        document.getElementById('claveTries').value = '';
        renderizarArbolD3('Tries', raizTries);
        mostrarMensajeResiduo('Tries', `Letra "${letra}" eliminada. Ruta: <code>${ruta.join('')}</code>`, 'success');
        limpiarInfoTries();
        animacionTriesEnCurso = false;
    }, indicesEnD3.length * delay + 200));
}

function eliminarDeTries(nodo, letra, binario, bitIdx) {
    if (!nodo) return null;
    // Si es hoja
    if (esHojaTries(nodo)) {
        if (nodo.clave === letra) return null;
        return nodo;
    }
    // Nodo interno
    if (bitIdx >= binario.length) return nodo;
    const bit = binario[bitIdx];
    const dir = bit === '0' ? 'izq' : 'der';
    nodo[dir] = eliminarDeTries(nodo[dir], letra, binario, bitIdx + 1);
    // Si el nodo interno se quedó sin hijos, eliminarlo
    if (!nodo.izq && !nodo.der) return null;
    return nodo;
}

function compactarTries(nodo) {
    if (!nodo) return null;
    nodo.izq = compactarTries(nodo.izq);
    nodo.der = compactarTries(nodo.der);
    // Si un nodo interno tiene solo un hijo y ese hijo es hoja, subir la hoja
    if (nodo.clave === null) {
        if (nodo.izq && !nodo.der && esHojaTries(nodo.izq)) return nodo.izq;
        if (!nodo.izq && nodo.der && esHojaTries(nodo.der)) return nodo.der;
        if (!nodo.izq && !nodo.der) return null;
    }
    return nodo;
}

function limpiarTries() {
    if (!confirm('¿Limpiar todo el trie?')) return;
    limpiarTimeoutsArr(timeoutsTries);
    raizTries = null;
    document.getElementById('claveTries').value = '';
    renderizarArbolD3('Tries', null);
    mostrarMensajeResiduo('Tries', 'Trie limpiado', 'info');
    limpiarInfoTries();
}

function guardarTries() {
    const datos = JSON.stringify({ tipo: 'tries', arbol: raizTries });
    descargarJSON(datos, 'arbol_tries.json');
    mostrarMensajeResiduo('Tries', 'Trie guardado correctamente', 'success');
}

function cargarTries() {
    document.getElementById('fileInputTries').click();
}

function mostrarInfoTries(letra, num, binario) {
    const container = document.getElementById('infoTries');
    const body = document.getElementById('infoTriesBody');
    if (!container || !body) return;
    body.innerHTML = `<strong>Letra:</strong> ${letra} | <strong>Número:</strong> ${num} | <strong>Binario (5 bits):</strong> <code>${binario}</code>`;
    container.classList.remove('d-none');
}

function limpiarInfoTries() {
    const container = document.getElementById('infoTries');
    if (container) container.classList.add('d-none');
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
 * Árbol de Huffman basado en frecuencias de letras
 * El usuario ingresa una palabra y el programa detecta automáticamente
 * la frecuencia de cada letra
 */

function insertarHuffman() {
    const inputPalabra = document.getElementById('palabraHuffman');
    const palabra = inputPalabra.value.trim().toUpperCase();

    if (!palabra || !/^[A-Z]+$/.test(palabra)) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una palabra válida (solo letras)', 'warning');
        return;
    }

    // Detectar frecuencia de cada letra
    huffmanLetras = {};
    huffmanPalabraOriginal = palabra;
    for (let letra of palabra) {
        huffmanLetras[letra] = (huffmanLetras[letra] || 0) + 1;
    }

    inputPalabra.value = '';

    // Construir automáticamente si hay al menos 2 letras distintas
    if (Object.keys(huffmanLetras).length < 2) {
        mostrarMensajeResiduo('Huffman', 'Se necesitan al menos 2 letras distintas para construir el árbol', 'warning');
        huffmanArbol = null;
        huffmanCodigos = {};
        renderizarArbolD3('Huffman', null);
        return;
    }

    // Crear nodos hoja a partir de las letras detectadas
    let cola = Object.entries(huffmanLetras).map(([letra, frecuencia]) => ({
        letra: letra,
        frecuencia: frecuencia,
        izq: null,
        der: null,
        esHoja: true
    }));

    // Algoritmo de Huffman
    while (cola.length > 1) {
        cola.sort((a, b) => a.frecuencia - b.frecuencia);
        const izq = cola.shift();
        const der = cola.shift();
        const nuevo = {
            letra: null,
            frecuencia: izq.frecuencia + der.frecuencia,
            izq,
            der,
            esHoja: false
        };
        cola.push(nuevo);
    }

    huffmanArbol = cola[0];

    // Generar códigos
    huffmanCodigos = {};
    generarCodigosHuffman(huffmanArbol, '');

    renderizarArbolD3('Huffman', huffmanArbol);
    mostrarTablaHuffman();
    mostrarMensajeResiduo('Huffman',
        `Árbol de Huffman construido para <strong>"${palabra}"</strong> — ${Object.keys(huffmanLetras).length} letras distintas, ${palabra.length} caracteres totales`, 'success');
}

function eliminarHuffmanLetra() {
    const letra = prompt('Ingrese la letra (hoja) a eliminar del árbol:');
    if (!letra) return;
    const letraUpper = letra.trim().toUpperCase();

    if (!letraUpper || letraUpper.length !== 1 || !/^[A-Z]$/.test(letraUpper)) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una sola letra válida (A-Z)', 'warning');
        return;
    }

    if (!huffmanArbol) {
        mostrarMensajeResiduo('Huffman', 'No hay árbol construido', 'warning');
        return;
    }

    if (!huffmanLetras[letraUpper]) {
        mostrarMensajeResiduo('Huffman', `La letra "${letraUpper}" no existe en el árbol`, 'danger');
        return;
    }

    // Eliminar la letra de las frecuencias
    delete huffmanLetras[letraUpper];
    delete huffmanCodigos[letraUpper];

    // Recalcular la palabra original sin esa letra
    huffmanPalabraOriginal = huffmanPalabraOriginal.split('').filter(c => c !== letraUpper).join('');

    // Re-construir el árbol
    if (Object.keys(huffmanLetras).length < 2) {
        if (Object.keys(huffmanLetras).length === 0) {
            huffmanArbol = null;
            huffmanCodigos = {};
            huffmanPalabraOriginal = '';
            renderizarArbolD3('Huffman', null);
            mostrarMensajeResiduo('Huffman', `Letra "${letraUpper}" eliminada. El árbol está vacío.`, 'info');
        } else {
            huffmanArbol = null;
            huffmanCodigos = {};
            renderizarArbolD3('Huffman', null);
            mostrarMensajeResiduo('Huffman', `Letra "${letraUpper}" eliminada. Se necesitan al menos 2 letras distintas.`, 'warning');
        }
        const tabla = document.getElementById('tablaHuffman');
        if (tabla) tabla.classList.add('d-none');
        return;
    }

    // Reconstruir
    let cola = Object.entries(huffmanLetras).map(([l, f]) => ({
        letra: l, frecuencia: f, izq: null, der: null, esHoja: true
    }));
    while (cola.length > 1) {
        cola.sort((a, b) => a.frecuencia - b.frecuencia);
        const izqN = cola.shift();
        const derN = cola.shift();
        cola.push({ letra: null, frecuencia: izqN.frecuencia + derN.frecuencia, izq: izqN, der: derN, esHoja: false });
    }
    huffmanArbol = cola[0];
    huffmanCodigos = {};
    generarCodigosHuffman(huffmanArbol, '');

    renderizarArbolD3('Huffman', huffmanArbol);
    mostrarTablaHuffman();
    mostrarMensajeResiduo('Huffman', `Letra "${letraUpper}" eliminada y árbol reconstruido`, 'success');
}

function generarCodigosHuffman(nodo, codigo) {
    if (!nodo) return;
    if (nodo.esHoja) {
        huffmanCodigos[nodo.letra] = codigo || '0';
        return;
    }
    generarCodigosHuffman(nodo.izq, codigo + '0');
    generarCodigosHuffman(nodo.der, codigo + '1');
}

function buscarLetraHuffman() {
    if (animacionHuffmanEnCurso) limpiarTimeoutsArr(timeoutsHuffman);

    const input = prompt('Ingrese una letra para buscar su código Huffman:');
    if (!input) return;
    const letra = input.trim().toUpperCase();

    if (!letra || letra.length !== 1 || !/^[A-Z]$/.test(letra)) {
        mostrarMensajeResiduo('Huffman', 'Ingrese una sola letra válida (A-Z)', 'warning');
        return;
    }

    if (!huffmanArbol) {
        mostrarMensajeResiduo('Huffman', 'Primero construya el árbol de Huffman', 'warning');
        return;
    }

    const codigo = huffmanCodigos[letra];
    if (!codigo) {
        mostrarMensajeResiduo('Huffman', `Letra <strong>"${letra}"</strong> no encontrada en el árbol`, 'danger');
        return;
    }

    // Animar recorrido usando indices de nodos D3
    animacionHuffmanEnCurso = true;
    const delay = 500;
    const svgEl = document.getElementById('svgHuffman');

    if (svgEl) {
        const todosNodos = svgEl.querySelectorAll('.node');

        // For each node in path, find its index in descendants by matching position in D3 hierarchy
        // We'll animate sequentially by index
        const datosD3 = arbolHuffmanAD3(huffmanArbol);
        const rootH = d3.hierarchy(datosD3);
        const descs = rootH.descendants();

        // Match path nodes to D3 descendants by traversing the hierarchy the same way
        const indicesEnD3 = [];
        let d3Nodo = rootH;
        indicesEnD3.push(descs.indexOf(d3Nodo));
        for (const bit of codigo) {
            if (d3Nodo.children) {
                d3Nodo = bit === '0' ? d3Nodo.children[0] : d3Nodo.children[1];
                indicesEnD3.push(descs.indexOf(d3Nodo));
            }
        }

        indicesEnD3.forEach((idx, i) => {
            if (idx < 0 || idx >= todosNodos.length) return;
            timeoutsHuffman.push(setTimeout(() => {
                const circle = todosNodos[idx].querySelector('circle');
                if (circle) {
                    const orig = circle.getAttribute('fill');
                    circle.setAttribute('fill', '#FFC107');
                    setTimeout(() => circle.setAttribute('fill', orig), delay - 100);
                }
            }, i * delay));
        });

        // Resultado final
        const total = Object.values(huffmanLetras).reduce((s, v) => s + v, 0);
        const freq = huffmanLetras[letra];
        timeoutsHuffman.push(setTimeout(() => {
            resaltarNodoD3('Huffman', letra, 'encontrado');
            mostrarMensajeResiduo('Huffman',
                `Letra <strong>"${letra}"</strong> | Código: <code>${codigo}</code> | Frecuencia: <strong>${freq}/${total}</strong> | Longitud: <strong>${codigo.length}</strong>`, 'success');
            animacionHuffmanEnCurso = false;
        }, indicesEnD3.length * delay));
    } else {
        // Fallback if SVG not found
        const total = Object.values(huffmanLetras).reduce((s, v) => s + v, 0);
        const freq = huffmanLetras[letra];
        resaltarNodoD3('Huffman', letra, 'encontrado');
        mostrarMensajeResiduo('Huffman',
            `Letra <strong>"${letra}"</strong> | Código: <code>${codigo}</code> | Frecuencia: <strong>${freq}/${total}</strong> | Longitud: <strong>${codigo.length}</strong>`, 'success');
    }
}

function limpiarHuffman() {
    if (!confirm('¿Limpiar todo el árbol y las frecuencias detectadas?')) return;
    limpiarTimeoutsArr(timeoutsHuffman);
    huffmanLetras = {};
    huffmanPalabraOriginal = '';
    huffmanArbol = null;
    huffmanCodigos = {};
    document.getElementById('palabraHuffman').value = '';
    renderizarArbolD3('Huffman', null);
    mostrarMensajeResiduo('Huffman', 'Árbol y frecuencias limpiados', 'info');
    const tabla = document.getElementById('tablaHuffman');
    if (tabla) tabla.classList.add('d-none');
}

function guardarHuffman() {
    const datos = JSON.stringify({
        tipo: 'huffman',
        letras: huffmanLetras,
        codigos: huffmanCodigos,
        palabraOriginal: huffmanPalabraOriginal
    });
    descargarJSON(datos, 'arbol_huffman.json');
    mostrarMensajeResiduo('Huffman', 'Árbol guardado correctamente', 'success');
}

function cargarHuffman() {
    document.getElementById('fileInputHuffman').click();
}

function mostrarTablaHuffman() {
    const tbody = document.getElementById('tablaHuffmanBody');
    const tabla = document.getElementById('tablaHuffman');
    if (!tbody || !tabla) return;

    const total = Object.values(huffmanLetras).reduce((s, v) => s + v, 0);
    let html = '';

    Object.entries(huffmanCodigos)
        .sort((a, b) => {
            const lenDiff = a[1].length - b[1].length;
            if (lenDiff !== 0) return lenDiff;
            return huffmanLetras[b[0]] - huffmanLetras[a[0]];
        })
        .forEach(([letra, codigo]) => {
            const freq = huffmanLetras[letra] || 0;
            html += `<tr>
                <td><strong>${letra}</strong></td>
                <td>${freq}/${total}</td>
                <td><code>${codigo}</code></td>
                <td>${codigo.length}</td>
            </tr>`;
        });

    tbody.innerHTML = html;
    tabla.classList.remove('d-none');
}

// ==================== VISUALIZACIÓN D3.js ====================

function arbolDigitalAD3(nodo) {
    if (!nodo) return null;
    const name = nodo.clave ? nodo.clave : '•';
    const children = [];
    // Si tiene al menos un hijo, incluir ambos lados (placeholder null para el faltante)
    // Esto garantiza que 0 siempre va a la izquierda y 1 a la derecha visualmente
    if (nodo.izq || nodo.der) {
        if (nodo.izq) {
            children.push({ ...arbolDigitalAD3(nodo.izq), edgeLabel: '0' });
        } else {
            children.push({ name: '', originalClave: null, esPlaceholder: true, edgeLabel: '0' });
        }
        if (nodo.der) {
            children.push({ ...arbolDigitalAD3(nodo.der), edgeLabel: '1' });
        } else {
            children.push({ name: '', originalClave: null, esPlaceholder: true, edgeLabel: '1' });
        }
    }
    return { name, originalClave: nodo.clave, children: children.length ? children : undefined };
}

function arbolTriesAD3(nodo) {
    if (!nodo) return null;
    const esHoja = !nodo.izq && !nodo.der;
    const name = esHoja && nodo.clave ? nodo.clave : '';
    const children = [];
    if (nodo.izq || nodo.der) {
        if (nodo.izq) {
            children.push({ ...arbolTriesAD3(nodo.izq), edgeLabel: '0' });
        } else {
            children.push({ name: '', originalClave: null, esPlaceholder: true, edgeLabel: '0' });
        }
        if (nodo.der) {
            children.push({ ...arbolTriesAD3(nodo.der), edgeLabel: '1' });
        } else {
            children.push({ name: '', originalClave: null, esPlaceholder: true, edgeLabel: '1' });
        }
    }
    return {
        name,
        originalClave: nodo.clave,
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

function arbolHuffmanAD3(nodo, total) {
    if (!nodo) return null;
    if (total === undefined) total = Object.values(huffmanLetras).reduce((s, v) => s + v, 0);
    const name = nodo.esHoja ? nodo.letra : '';
    const freqLabel = !nodo.esHoja ? `${nodo.frecuencia}/${total}` : null;
    const children = [];
    if (nodo.izq) children.push({ ...arbolHuffmanAD3(nodo.izq, total), edgeLabel: '0' });
    if (nodo.der) children.push({ ...arbolHuffmanAD3(nodo.der, total), edgeLabel: '1' });
    return {
        name,
        esHoja: nodo.esHoja,
        originalClave: nodo.letra,
        freqLabel,
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
    const nodeW = (tipo === 'Digital' || tipo === 'Huffman' || tipo === 'Tries') ? 110 : 70;
    const nodeH = 80;
    const treeFn = d3.tree().nodeSize([nodeW, nodeH]);
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
        Digital: { nodo: '#5B9BD5', texto: 'white', borde: '#44546A', raiz: '#44546A', hoja: '#5B9BD5' },
        Tries: { nodo: '#5B9BD5', texto: 'white', borde: '#44546A', raiz: '#44546A', fin: '#5B9BD5' },
        Multiple: { nodo: '#ED7D31', texto: 'white', borde: '#843C0C', raiz: '#843C0C' },
        Huffman: { nodo: '#5B9BD5', texto: 'white', borde: '#44546A', raiz: '#44546A', hoja: '#5B9BD5' }
    };
    const col = colores[tipo] || colores.Digital;

    // Links
    g.selectAll('.link')
        .data(root.links())
        .enter()
        .append('g')
        .attr('class', 'link-group')
        .each(function(d) {
            // Skip links to placeholder nodes
            if (d.target.data.esPlaceholder) return;

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
        .attr('r', d => {
            if (d.data.esPlaceholder) return 0;
            return d.depth === 0 ? 24 : 20;
        })
        .attr('fill', d => {
            if (d.data.esPlaceholder) return 'none';
            if (d.depth === 0) return col.raiz;
            return col.nodo;
        })
        .attr('stroke', d => d.data.esPlaceholder ? 'none' : col.borde)
        .attr('stroke-width', d => d.depth === 0 ? 3 : 2)
        .attr('filter', 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))');

    // Texto del nodo
    nodeGrp.each(function(d) {
        if (d.data.esPlaceholder) return;
        const grp = d3.select(this);
        const label = d.data.name;

        grp.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', d.depth === 0 ? '13px' : '12px')
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(label);
    });

    // Etiqueta de frecuencia encima de nodos internos de Huffman
    if (tipo === 'Huffman') {
        nodeGrp.each(function(d) {
            if (d.data.freqLabel) {
                const grp = d3.select(this);
                grp.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', d.depth === 0 ? '-32px' : '-28px')
                    .attr('font-size', '10px')
                    .attr('font-weight', 'bold')
                    .attr('fill', '#44546A')
                    .text(d.data.freqLabel);
            }
        });
    }

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

function resaltarNodoD3Temporal(tipo, clave, color, duracion) {
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
                circle.setAttribute('fill', color);
                setTimeout(() => {
                    circle.setAttribute('fill', colorOriginal);
                }, duracion || 400);
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
                    huffmanLetras = datos.letras || {};
                    huffmanCodigos = datos.codigos || {};
                    huffmanPalabraOriginal = datos.palabraOriginal || '';
                    if (Object.keys(huffmanLetras).length >= 2) {
                        // Reconstruir el árbol
                        let cola = Object.entries(huffmanLetras).map(([l, f]) => ({
                            letra: l, frecuencia: f, izq: null, der: null, esHoja: true
                        }));
                        while (cola.length > 1) {
                            cola.sort((a, b) => a.frecuencia - b.frecuencia);
                            const izqN = cola.shift();
                            const derN = cola.shift();
                            cola.push({ letra: null, frecuencia: izqN.frecuencia + derN.frecuencia, izq: izqN, der: derN, esHoja: false });
                        }
                        huffmanArbol = cola[0];
                        huffmanCodigos = {};
                        generarCodigosHuffman(huffmanArbol, '');
                        renderizarArbolD3('Huffman', huffmanArbol);
                        mostrarTablaHuffman();
                    }
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
        { id: 'palabraHuffman', fn: insertarHuffman },
    ];

    entradas.forEach(({ id, fn }) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if (e.key === 'Enter') fn(); });
    });
});