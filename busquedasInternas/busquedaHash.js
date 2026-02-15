/**
 * Simulador CC2 - Módulo de Búsquedas Hash
 * Implementa: Módulo, Cuadrado, Truncamiento, Plegamiento
 * Colisiones: Lineal, Cuadrática, Doble Hash, Arreglos Anidados, Lista Enlazada
 */

// ==================== ESTRUCTURAS DE DATOS ====================

// Estructura para prueba lineal, cuadrática y doble hash
let tablaHash = [];
let tamanoTablaHash = 10;

// Estructura para arreglos anidados (matriz)
let matrizHash = [];

// Estructura para lista enlazada
let listaEnlazadaHash = [];

// Variables de control
let animacionHashEnCurso = false;
let timeoutsHash = [];
let estructuraHashInicializada = false;

// ==================== DESCRIPCIONES DE MÉTODOS ====================

const descripcionesHash = {
    modulo: '<strong>Función:</strong> Calcula el hash como <code>H(k) = (k mod n) + 1</code>, donde <code>n</code> y <code>k</code> es el tamaño de la tabla y la clave respectivamente.',
    cuadrado: '<strong>Función:</strong> Eleva la clave al cuadrado <code>k²</code> y extrae los dígitos centrales + 1 como índice.',
    truncamiento: '<strong>Función:</strong> Ignora caracteres de la clave y usa los restantes + 1 como índice. Para este caso, usa solo los caracteres impares de la clave.',
    plegamiento: '<strong>Función:</strong> Divide la clave en partes iguales y las suma dependiendo del tamaño de la estructura. El resultado + 1 es el índice. Bueno para claves largas.'
};

const descripcionesColision = {
    lineal: 'Si hay colisión, busca la siguiente posición libre de forma secuencial: <code>D + i, i = 1...n</code>',
    cuadratica: 'Busca posiciones usando incrementos cuadráticos: <code>D + i^2, i = 1...n</code>',
    dobleHash: 'Usa de manera recursiva la función hash seleccionada para el incremento, por ejemplo con hash módulo: <code>H(D) = ((D + 1) mod n) + 1</code>',
    anidados: 'Cada posición de la tabla es un arreglo que puede almacenar múltiples elementos, es estático',
    enlazada: 'Cada posición de la tabla es una lista enlazada que crece horizontalmente, es dinámico'
};

// ==================== FUNCIONES AUXILIARES ====================

function limpiarTimeoutsHash() {
    timeoutsHash.forEach(t => clearTimeout(t));
    timeoutsHash = [];
    animacionHashEnCurso = false;
}

function mostrarMensajeHash(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeHash');
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function actualizarDescripcionHash() {
    const metodo = document.getElementById('metodoHash').value;
    const colision = document.getElementById('metodoColision').value;
    const descripcionDiv = document.getElementById('descripcionHash');

    let html = descripcionesHash[metodo];
    html += '<hr class="my-2">';
    html += '<small><strong>Colisión:</strong> ' + descripcionesColision[colision] + '</small>';

    descripcionDiv.innerHTML = html;
}

function cambiarMetodoColision() {
    actualizarDescripcionHash();

    if (estructuraHashInicializada) {
        const tamano = parseInt(document.getElementById('tamanoEstructuraHash').value) || 10;
        const metodoColision = document.getElementById('metodoColision').value;

        // Solo inicializar la estructura si no existe o el tamaño cambió
        if (tamanoTablaHash !== tamano) {
            inicializarEstructuraHash();
        } else {
            // Asegurar que la estructura del método actual exista
            if (metodoColision === 'anidados' && matrizHash.length === 0) {
                matrizHash = [];
                for (let i = 0; i < tamano; i++) {
                    matrizHash[i] = new Array(tamano).fill(null);
                }
            } else if (metodoColision === 'enlazada' && listaEnlazadaHash.length === 0) {
                listaEnlazadaHash = [];
                for (let i = 0; i < tamano; i++) {
                    listaEnlazadaHash[i] = [];
                }
            } else if ((metodoColision === 'lineal' || metodoColision === 'cuadratica' || metodoColision === 'dobleHash') && tablaHash.length === 0) {
                tablaHash = new Array(tamano).fill(null);
            }

            // Solo renderizar sin reinicializar
            renderizarEstructuraHash();
        }
    }
}

function convertirClaveANumero(clave) {
    // Convierte clave alfanumérica a número
    // Números se mantienen como están
    // Letras: A=1, B=2, C=3, ..., Z=26
    let resultado = '';

    for (let i = 0; i < clave.length; i++) {
        const char = clave[i].toUpperCase();

        if (/\d/.test(char)) {
            // Es un número, mantener como está
            resultado += char;
        } else if (/[A-Z]/.test(char)) {
            // Es una letra, convertir A=1, B=2, ..., Z=26
            const valorLetra = char.charCodeAt(0) - 64; // A=65, entonces A-64=1
            resultado += valorLetra;
        }
    }

    return parseInt(resultado, 10) || 0;
}

function validarClaveHash(valor, tamanoCaracteres) {
    const claveStr = valor.toString().trim();

    if (claveStr.length === 0) {
        return { valido: false, mensaje: 'La clave no puede estar vacía' };
    }

    if (!/^[a-zA-Z0-9]+$/.test(claveStr)) {
        return { valido: false, mensaje: 'La clave solo puede contener letras y números' };
    }

    if (claveStr.length !== tamanoCaracteres) {
        return { valido: false, mensaje: `La clave debe tener exactamente ${tamanoCaracteres} caracteres` };
    }

    return { valido: true, clave: claveStr.toUpperCase() };
}

// ==================== FUNCIONES HASH ====================

// NOTA: Los índices de la estructura empiezan en 1, por lo que se suma 1 al resultado del hash

function calcularHash(clave, metodo, tamano) {
    const k = convertirClaveANumero(clave);
    let hashBase0;

    switch (metodo) {
        case 'modulo':
            hashBase0 = k % tamano;
            break;

        case 'cuadrado':
            // Elevar al cuadrado
            const cuadrado = (k * k).toString();
            // Determinar cuántos dígitos centrales tomar según el tamaño de la estructura
            const digitosNecesarios = tamano.toString().length;
            const longitudCuadrado = cuadrado.length;

            // Calcular posición inicial para extraer dígitos centrales
            const inicio = Math.floor((longitudCuadrado - digitosNecesarios) / 2);
            const fin = inicio + digitosNecesarios;

            // Extraer dígitos centrales
            let digitosCentrales;
            if (inicio >= 0 && fin <= longitudCuadrado) {
                digitosCentrales = cuadrado.substring(inicio, fin);
            } else {
                // Si el cuadrado tiene menos dígitos que los necesarios, usar todo
                digitosCentrales = cuadrado;
            }

            hashBase0 = parseInt(digitosCentrales || '0') % tamano;
            break;

        case 'truncamiento':
            // Tomar dígitos en posiciones impares (1°, 3°, 5°, etc.) de izquierda a derecha
            const kStrTrunc = k.toString();
            const digitosNecesariosTrunc = tamano.toString().length; // Cantidad de dígitos según tamaño
            let digitosImpares = '';

            // Recorrer posiciones impares (índices 0, 2, 4, ... que corresponden a 1°, 3°, 5°, ...)
            for (let i = 0; i < kStrTrunc.length && digitosImpares.length < digitosNecesariosTrunc; i += 2) {
                digitosImpares += kStrTrunc[i];
            }

            hashBase0 = parseInt(digitosImpares || '0');
            break;

        case 'plegamiento':
            // Convertimos la clave a string para poder dividirla
            const kStrPleg = k.toString();

            // Calculamos cuántos dígitos debe tener cada grupo (tamaño - 1)
            const tamanoGrupo = tamano.toString().length - 1;

            let suma = 0;

            // Dividimos la clave en segmentos
            for (let i = 0; i < kStrPleg.length; i += tamanoGrupo) {
                let segmento = kStrPleg.substring(i, i + tamanoGrupo);
                suma += parseInt(segmento) || 0;
            }

            // Aplicamos módulo para obtener el índice
            hashBase0 = suma % tamano;
            break;

        default:
            hashBase0 = k % tamano;
    }

    // Sumar 1 para que los índices empiecen en 1
    return hashBase0 + 1;
}


// ==================== INICIALIZACIÓN ====================

function inicializarEstructuraHash() {
    limpiarTimeoutsHash();

    const tamano = parseInt(document.getElementById('tamanoEstructuraHash').value) || 10;
    const metodoColision = document.getElementById('metodoColision').value;

    // Si el tamaño cambió, reiniciar todas las estructuras
    if (tamanoTablaHash !== tamano) {
        tamanoTablaHash = tamano;
        // Reiniciar todas las estructuras con el nuevo tamaño
        tablaHash = new Array(tamano).fill(null);

        matrizHash = [];
        for (let i = 0; i < tamano; i++) {
            matrizHash[i] = new Array(tamano).fill(null);
        }

        listaEnlazadaHash = [];
        for (let i = 0; i < tamano; i++) {
            listaEnlazadaHash[i] = [];
        }
    } else {
        // Mismo tamaño, solo inicializar la estructura actual si está vacía
        if (metodoColision === 'anidados') {
            if (matrizHash.length === 0) {
                matrizHash = [];
                for (let i = 0; i < tamano; i++) {
                    matrizHash[i] = new Array(tamano).fill(null);
                }
            }
        } else if (metodoColision === 'enlazada') {
            if (listaEnlazadaHash.length === 0) {
                listaEnlazadaHash = [];
                for (let i = 0; i < tamano; i++) {
                    listaEnlazadaHash[i] = [];
                }
            }
        } else {
            // Prueba lineal, cuadrática o doble hash
            if (tablaHash.length === 0) {
                tablaHash = new Array(tamano).fill(null);
            }
        }
    }

    estructuraHashInicializada = true;
    renderizarEstructuraHash();
    mostrarMensajeHash(`Estructura inicializada con tamaño ${tamano}`, 'success');
}

// ==================== RENDERIZADO ====================

function renderizarEstructuraHash() {
    const container = document.getElementById('visualizacionHash');
    const metodoColision = document.getElementById('metodoColision').value;

    if (!estructuraHashInicializada) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Reiniciar Estructura" para inicializar</div>';
        return;
    }

    if (metodoColision === 'anidados') {
        renderizarMatrizHash(container);
    } else if (metodoColision === 'enlazada') {
        renderizarListaEnlazadaHash(container);
    } else {
        renderizarTablaHashSimple(container);
    }
}

function renderizarTablaHashSimple(container) {
    if (tablaHash.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="estructura-vertical">';

    for (let i = 0; i < tablaHash.length; i++) {
        const valor = tablaHash[i];
        const vacia = valor === null;
        // Mostrar índice base 1 (i + 1)
        html += `<div class="clave-row hash-row" data-index="${i}">
                    <span class="clave-index-left">${i + 1}</span>
                    <span class="clave-valor-vertical ${vacia ? 'text-muted' : ''}">${vacia ? '' : valor}</span>
                 </div>`;
    }

    html += '</div>';
    html += `<div class="mt-2 text-muted small">Tamaño: ${tablaHash.length} | Ocupados: ${tablaHash.filter(x => x !== null).length}</div>`;
    container.innerHTML = html;
}

function renderizarMatrizHash(container) {
    let html = '<div class="matriz-hash-container">';
    html += '<table class="tabla-matriz-hash">';

    // Encabezado con índices de columna (base 1)
    html += '<thead><tr><th></th>';
    for (let j = 0; j < tamanoTablaHash; j++) {
        html += `<th class="matriz-header">${j + 1}</th>`;
    }
    html += '</tr></thead>';

    // Cuerpo de la matriz
    html += '<tbody>';
    for (let i = 0; i < tamanoTablaHash; i++) {
        // Índice de fila base 1
        html += `<tr><td class="matriz-index">${i + 1}</td>`;
        for (let j = 0; j < tamanoTablaHash; j++) {
            const valor = matrizHash[i][j];
            const vacia = valor === null;
            html += `<td class="matriz-celda ${vacia ? 'matriz-vacia' : 'matriz-ocupada'}" data-row="${i}" data-col="${j}">
                        ${vacia ? '' : valor}
                     </td>`;
        }
        html += '</tr>';
    }
    html += '</tbody></table>';

    const totalOcupados = matrizHash.flat().filter(x => x !== null).length;
    html += `<div class="mt-2 text-muted small">Matriz ${tamanoTablaHash}x${tamanoTablaHash} | Ocupados: ${totalOcupados}</div>`;
    html += '</div>';

    container.innerHTML = html;
}

function renderizarListaEnlazadaHash(container) {
    if (listaEnlazadaHash.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="lista-enlazada-vertical">';

    for (let i = 0; i < listaEnlazadaHash.length; i++) {
        const lista = listaEnlazadaHash[i];
        // Índice base 1
        html += `<div class="lista-fila-vertical" data-index="${i}">`;

        // Celda principal de la estructura (índice + primer valor o vacío)
        html += `<div class="lista-celda-principal">
                    <span class="clave-index-left">${i + 1}</span>
                    <span class="lista-valor-principal">${lista.length > 0 ? lista[0] : ''}</span>
                 </div>`;

        // Nodos enlazados (del segundo en adelante) - por fuera de la estructura
        if (lista.length > 1) {
            html += '<div class="lista-nodos-enlazados">';
            for (let idx = 1; idx < lista.length; idx++) {
                html += `<div class="lista-flecha-externa">→</div>`;
                html += `<div class="lista-nodo-externo" data-pos="${idx}">${lista[idx]}</div>`;
            }
            html += '</div>';
        }

        html += '</div>';
    }

    html += '</div>';

    const totalElementos = listaEnlazadaHash.reduce((acc, lista) => acc + lista.length, 0);
    html += `<div class="mt-2 text-muted small">Posiciones: ${listaEnlazadaHash.length} | Total elementos: ${totalElementos}</div>`;

    container.innerHTML = html;
}

// ==================== OPERACIONES DE INSERCIÓN ====================

function insertarHash() {
    if (animacionHashEnCurso) {
        limpiarTimeoutsHash();
    }

    if (!estructuraHashInicializada) {
        mostrarMensajeHash('Primero debe inicializar la estructura', 'warning');
        return;
    }

    const claveInput = document.getElementById('claveHash');
    const claveValor = claveInput.value.trim();
    const tamanoCaracteres = parseInt(document.getElementById('tamanoClaveHash').value) || 3;

    const validacion = validarClaveHash(claveValor, tamanoCaracteres);
    if (!validacion.valido) {
        mostrarMensajeHash(validacion.mensaje, 'warning');
        return;
    }

    const clave = validacion.clave;
    const metodoHash = document.getElementById('metodoHash').value;
    const metodoColision = document.getElementById('metodoColision').value;

    const hashInicial = calcularHash(clave, metodoHash, tamanoTablaHash);

    claveInput.value = '';

    if (metodoColision === 'anidados') {
        insertarEnMatriz(clave, hashInicial, metodoHash);
    } else if (metodoColision === 'enlazada') {
        insertarEnListaEnlazada(clave, hashInicial);
    } else {
        insertarConColision(clave, hashInicial, metodoColision, metodoHash);
    }
}

function insertarConColision(clave, hashInicial, metodoColision, metodoHash) {
    animacionHashEnCurso = true;

    // Verificar si ya existe
    if (tablaHash.includes(clave)) {
        mostrarMensajeHash(`La clave "${clave}" ya existe en la tabla`, 'warning');
        animacionHashEnCurso = false;
        return;
    }

    // hashInicial viene en base 1, convertir a índice de array (base 0)
    let posicionArray = hashInicial - 1;
    let intentos = 0;
    const maxIntentos = tablaHash.length;

    // Animación de búsqueda de posición
    const buscarPosicion = () => {
        if (intentos >= maxIntentos) {
            mostrarMensajeHash('Tabla llena, no se puede insertar', 'danger');
            renderizarEstructuraHash();
            animacionHashEnCurso = false;
            return;
        }

        renderizarEstructuraHash();
        const rows = document.querySelectorAll('#visualizacionHash .hash-row');

        // Resaltar posición actual (usando índice de array)
        if (rows[posicionArray]) {
            rows[posicionArray].classList.add('clave-buscando');
        }

        const timeout = setTimeout(() => {
            if (tablaHash[posicionArray] === null) {
                // Posición libre encontrada
                tablaHash[posicionArray] = clave;
                renderizarEstructuraHash();

                const rows2 = document.querySelectorAll('#visualizacionHash .hash-row');
                if (rows2[posicionArray]) {
                    rows2[posicionArray].classList.add('clave-insertada');
                    setTimeout(() => {
                        rows2[posicionArray].classList.remove('clave-insertada');
                    }, 1000);
                }

                // Mostrar posición en base 1 al usuario
                const posicionMostrar = posicionArray + 1;
                const colisionMsg = intentos > 0 ? ` (${intentos} colisiones resueltas)` : '';
                mostrarMensajeHash(`Clave "${clave}" insertada en posición ${posicionMostrar}${colisionMsg}<br><small>Hash inicial: ${hashInicial}</small>`, 'success');
                animacionHashEnCurso = false;
            } else {
                // Colisión, calcular siguiente posición
                intentos++;

                // Calcular nueva posición en base 0
                switch (metodoColision) {
                    case 'lineal':
                        // (hashInicial - 1 + intentos) mod tamano
                        posicionArray = ((hashInicial - 1) + intentos) % tamanoTablaHash;
                        break;
                    case 'cuadratica':
                        posicionArray = ((hashInicial - 1) + intentos * intentos) % tamanoTablaHash;
                        break;
                    case 'dobleHash':
                        // Doble hash: aplicar la misma función hash a (posición donde hubo colisión + 1)
                        // posicionArray es base 0, sumamos 1 para base 1, luego +1 para el siguiente
                        const valorParaHash = (posicionArray + 2).toString(); // Convertir a string para calcularHash
                        const nuevoHash = calcularHash(valorParaHash, metodoHash, tamanoTablaHash);
                        posicionArray = nuevoHash - 1; // Convertir a base 0
                        break;
                }

                buscarPosicion();
            }
        }, 400);

        timeoutsHash.push(timeout);
    };

    buscarPosicion();
}

function insertarEnMatriz(clave, hashFila) {
    animacionHashEnCurso = true;

    // hashFila viene en base 1, convertir a índice de array (base 0)
    const filaArray = hashFila - 1;

    // Buscar si ya existe
    for (let i = 0; i < tamanoTablaHash; i++) {
        for (let j = 0; j < tamanoTablaHash; j++) {
            if (matrizHash[i][j] === clave) {
                mostrarMensajeHash(`La clave "${clave}" ya existe en la matriz`, 'warning');
                animacionHashEnCurso = false;
                return;
            }
        }
    }

    // Buscar posición libre en la fila
    let columna = -1;
    for (let j = 0; j < tamanoTablaHash; j++) {
        if (matrizHash[filaArray][j] === null) {
            columna = j;
            break;
        }
    }

    if (columna === -1) {
        mostrarMensajeHash(`Fila ${hashFila} llena, no se puede insertar`, 'danger');
        animacionHashEnCurso = false;
        return;
    }

    // Animación
    renderizarEstructuraHash();

    setTimeout(() => {
        // Resaltar fila
        const celdas = document.querySelectorAll(`#visualizacionHash .matriz-celda[data-row="${filaArray}"]`);
        celdas.forEach(c => c.classList.add('matriz-buscando'));

        setTimeout(() => {
            matrizHash[filaArray][columna] = clave;
            renderizarEstructuraHash();

            const celda = document.querySelector(`#visualizacionHash .matriz-celda[data-row="${filaArray}"][data-col="${columna}"]`);
            if (celda) {
                celda.classList.add('matriz-insertada');
                setTimeout(() => celda.classList.remove('matriz-insertada'), 1000);
            }

            // Mostrar posición en base 1
            mostrarMensajeHash(`Clave "${clave}" insertada en posición [${hashFila}][${columna + 1}]<br><small>Hash: ${hashFila}</small>`, 'success');
            animacionHashEnCurso = false;
        }, 500);
    }, 200);
}

function insertarEnListaEnlazada(clave, hashPosicion) {
    animacionHashEnCurso = true;

    // hashPosicion viene en base 1, convertir a índice de array (base 0)
    const posicionArray = hashPosicion - 1;

    // Verificar si ya existe
    if (listaEnlazadaHash[posicionArray].includes(clave)) {
        mostrarMensajeHash(`La clave "${clave}" ya existe en la posición ${hashPosicion}`, 'warning');
        animacionHashEnCurso = false;
        return;
    }

    // Animación
    renderizarEstructuraHash();

    setTimeout(() => {
        const fila = document.querySelector(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"]`);
        const celdaPrincipal = fila ? fila.querySelector('.lista-celda-principal') : null;
        if (celdaPrincipal) celdaPrincipal.classList.add('lista-buscando');

        setTimeout(() => {
            listaEnlazadaHash[posicionArray].push(clave);
            renderizarEstructuraHash();

            const posEnLista = listaEnlazadaHash[posicionArray].length;

            // Seleccionar el elemento insertado (primer nodo o nodo externo)
            if (posEnLista === 1) {
                const celdaInsertada = document.querySelector(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-celda-principal`);
                if (celdaInsertada) {
                    celdaInsertada.classList.add('lista-insertada');
                    setTimeout(() => celdaInsertada.classList.remove('lista-insertada'), 1000);
                }
            } else {
                const nodosExternos = document.querySelectorAll(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-nodo-externo`);
                const ultimoNodo = nodosExternos[nodosExternos.length - 1];
                if (ultimoNodo) {
                    ultimoNodo.classList.add('lista-insertada');
                    setTimeout(() => ultimoNodo.classList.remove('lista-insertada'), 1000);
                }
            }

            // Mostrar posición en base 1
            mostrarMensajeHash(`Clave "${clave}" insertada en posición ${hashPosicion}, nodo ${posEnLista}<br><small>Hash: ${hashPosicion}</small>`, 'success');
            animacionHashEnCurso = false;
        }, 500);
    }, 200);
}

// ==================== OPERACIONES DE BÚSQUEDA ====================

function buscarHash() {
    if (animacionHashEnCurso) {
        limpiarTimeoutsHash();
    }

    if (!estructuraHashInicializada) {
        mostrarMensajeHash('Primero debe inicializar la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveHash').value.trim().toUpperCase();

    if (!claveValor) {
        mostrarMensajeHash('Ingrese una clave para buscar', 'warning');
        return;
    }

    const metodoHash = document.getElementById('metodoHash').value;
    const metodoColision = document.getElementById('metodoColision').value;
    const hashInicial = calcularHash(claveValor, metodoHash, tamanoTablaHash);

    if (metodoColision === 'anidados') {
        buscarEnMatriz(claveValor, hashInicial);
    } else if (metodoColision === 'enlazada') {
        buscarEnListaEnlazada(claveValor, hashInicial);
    } else {
        buscarConColision(claveValor, hashInicial, metodoColision, metodoHash);
    }
}

function buscarConColision(clave, hashInicial, metodoColision, metodoHash) {
    animacionHashEnCurso = true;

    // hashInicial viene en base 1, convertir a índice de array (base 0)
    let posicionArray = hashInicial - 1;
    let intentos = 0;
    let pasos = 0;
    const maxIntentos = tablaHash.length;

    // Limpiar resaltados anteriores
    document.querySelectorAll('#visualizacionHash .hash-row').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando');
    });

    const buscar = () => {
        if (intentos >= maxIntentos || tablaHash[posicionArray] === null) {
            mostrarMensajeHash(`Clave "${clave}" no encontrada (${pasos} pasos)`, 'danger');
            animacionHashEnCurso = false;
            return;
        }

        pasos++;
        const rows = document.querySelectorAll('#visualizacionHash .hash-row');

        // Quitar resaltado anterior
        rows.forEach(r => r.classList.remove('clave-buscando'));

        if (rows[posicionArray]) {
            rows[posicionArray].classList.add('clave-buscando');
        }

        const timeout = setTimeout(() => {
            if (tablaHash[posicionArray] === clave) {
                rows[posicionArray].classList.remove('clave-buscando');
                rows[posicionArray].classList.add('clave-encontrada');
                // Mostrar posición en base 1
                const posicionMostrar = posicionArray + 1;
                mostrarMensajeHash(`Clave "${clave}" encontrada en posición ${posicionMostrar} (${pasos} pasos)<br><small>Hash inicial: ${hashInicial}</small>`, 'success');
                animacionHashEnCurso = false;
            } else {
                intentos++;

                // Calcular nueva posición en base 0
                switch (metodoColision) {
                    case 'lineal':
                        posicionArray = ((hashInicial - 1) + intentos) % tamanoTablaHash;
                        break;
                    case 'cuadratica':
                        posicionArray = ((hashInicial - 1) + intentos * intentos) % tamanoTablaHash;
                        break;
                    case 'dobleHash':
                        // Doble hash: aplicar la misma función hash a (posición donde hubo colisión + 1)
                        const valorParaHashBuscar = (posicionArray + 2).toString(); // Convertir a string
                        const nuevoHashBuscar = calcularHash(valorParaHashBuscar, metodoHash, tamanoTablaHash);
                        posicionArray = nuevoHashBuscar - 1; // Convertir a base 0
                        break;
                }

                buscar();
            }
        }, 400);

        timeoutsHash.push(timeout);
    };

    buscar();
}

function buscarEnMatriz(clave, hashFila) {
    animacionHashEnCurso = true;
    let pasos = 0;

    // hashFila viene en base 1, convertir a índice de array (base 0)
    const filaArray = hashFila - 1;

    // Animación de búsqueda en la fila
    const celdas = document.querySelectorAll(`#visualizacionHash .matriz-celda[data-row="${filaArray}"]`);
    let encontrado = false;

    const buscarEnFila = (col) => {
        if (col >= tamanoTablaHash || matrizHash[filaArray][col] === null) {
            if (!encontrado) {
                mostrarMensajeHash(`Clave "${clave}" no encontrada (${pasos} pasos)`, 'danger');
            }
            animacionHashEnCurso = false;
            return;
        }

        pasos++;

        // Quitar resaltado anterior
        celdas.forEach(c => c.classList.remove('matriz-buscando'));
        celdas[col].classList.add('matriz-buscando');

        const timeout = setTimeout(() => {
            if (matrizHash[filaArray][col] === clave) {
                encontrado = true;
                celdas[col].classList.remove('matriz-buscando');
                celdas[col].classList.add('matriz-encontrada');
                // Mostrar posición en base 1
                mostrarMensajeHash(`Clave "${clave}" encontrada en [${hashFila}][${col + 1}] (${pasos} pasos)`, 'success');
                animacionHashEnCurso = false;
            } else {
                buscarEnFila(col + 1);
            }
        }, 400);

        timeoutsHash.push(timeout);
    };

    buscarEnFila(0);
}

function buscarEnListaEnlazada(clave, hashPosicion) {
    animacionHashEnCurso = true;

    // hashPosicion viene en base 1, convertir a índice de array (base 0)
    const posicionArray = hashPosicion - 1;

    const lista = listaEnlazadaHash[posicionArray];
    let pasos = 0;

    if (lista.length === 0) {
        mostrarMensajeHash(`Clave "${clave}" no encontrada (posición ${hashPosicion} vacía)`, 'danger');
        animacionHashEnCurso = false;
        return;
    }

    // Obtener celda principal y nodos externos
    const celdaPrincipal = document.querySelector(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-celda-principal`);
    const nodosExternos = document.querySelectorAll(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-nodo-externo`);

    const buscarEnLista = (idx) => {
        if (idx >= lista.length) {
            mostrarMensajeHash(`Clave "${clave}" no encontrada (${pasos} pasos)`, 'danger');
            animacionHashEnCurso = false;
            return;
        }

        pasos++;

        // Quitar resaltado anterior
        if (celdaPrincipal) celdaPrincipal.classList.remove('lista-buscando');
        nodosExternos.forEach(n => n.classList.remove('lista-buscando'));

        // Resaltar elemento actual
        if (idx === 0) {
            if (celdaPrincipal) celdaPrincipal.classList.add('lista-buscando');
        } else {
            if (nodosExternos[idx - 1]) nodosExternos[idx - 1].classList.add('lista-buscando');
        }

        const timeout = setTimeout(() => {
            if (lista[idx] === clave) {
                // Quitar buscando y agregar encontrada
                if (idx === 0) {
                    if (celdaPrincipal) {
                        celdaPrincipal.classList.remove('lista-buscando');
                        celdaPrincipal.classList.add('lista-encontrada');
                    }
                } else {
                    if (nodosExternos[idx - 1]) {
                        nodosExternos[idx - 1].classList.remove('lista-buscando');
                        nodosExternos[idx - 1].classList.add('lista-encontrada');
                    }
                }
                // Mostrar posición en base 1
                mostrarMensajeHash(`Clave "${clave}" encontrada en posición ${hashPosicion}, nodo ${idx + 1} (${pasos} pasos)`, 'success');
                animacionHashEnCurso = false;
            } else {
                buscarEnLista(idx + 1);
            }
        }, 400);

        timeoutsHash.push(timeout);
    };

    buscarEnLista(0);
}

// ==================== OPERACIONES DE ELIMINACIÓN ====================

function eliminarHash() {
    if (animacionHashEnCurso) {
        limpiarTimeoutsHash();
    }

    if (!estructuraHashInicializada) {
        mostrarMensajeHash('Primero debe inicializar la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveHash').value.trim().toUpperCase();

    if (!claveValor) {
        mostrarMensajeHash('Ingrese una clave para eliminar', 'warning');
        return;
    }

    if (!confirm(`¿Está seguro de eliminar la clave "${claveValor}"?`)) {
        return;
    }

    const metodoHash = document.getElementById('metodoHash').value;
    const metodoColision = document.getElementById('metodoColision').value;
    const hashInicial = calcularHash(claveValor, metodoHash, tamanoTablaHash);

    if (metodoColision === 'anidados') {
        eliminarDeMatriz(claveValor, hashInicial);
    } else if (metodoColision === 'enlazada') {
        eliminarDeListaEnlazada(claveValor, hashInicial);
    } else {
        eliminarConColision(claveValor, hashInicial, metodoColision, metodoHash);
    }
}

function eliminarConColision(clave, hashInicial, metodoColision, metodoHash) {
    animacionHashEnCurso = true;

    // hashInicial viene en base 1, convertir a índice de array (base 0)
    let posicionArray = hashInicial - 1;
    let intentos = 0;
    const maxIntentos = tablaHash.length;

    const buscarYEliminar = () => {
        if (intentos >= maxIntentos || tablaHash[posicionArray] === null) {
            mostrarMensajeHash(`Clave "${clave}" no encontrada`, 'danger');
            animacionHashEnCurso = false;
            return;
        }

        const rows = document.querySelectorAll('#visualizacionHash .hash-row');
        rows.forEach(r => r.classList.remove('clave-buscando'));

        if (rows[posicionArray]) {
            rows[posicionArray].classList.add('clave-buscando');
        }

        const timeout = setTimeout(() => {
            if (tablaHash[posicionArray] === clave) {
                rows[posicionArray].classList.remove('clave-buscando');
                rows[posicionArray].classList.add('clave-eliminando');

                setTimeout(() => {
                    tablaHash[posicionArray] = null;
                    renderizarEstructuraHash();
                    document.getElementById('claveHash').value = '';
                    // Mostrar posición en base 1
                    const posicionMostrar = posicionArray + 1;
                    mostrarMensajeHash(`Clave "${clave}" eliminada de posición ${posicionMostrar}`, 'success');
                    animacionHashEnCurso = false;
                }, 500);
            } else {
                intentos++;

                // Calcular nueva posición en base 0
                switch (metodoColision) {
                    case 'lineal':
                        posicionArray = ((hashInicial - 1) + intentos) % tamanoTablaHash;
                        break;
                    case 'cuadratica':
                        posicionArray = ((hashInicial - 1) + intentos * intentos) % tamanoTablaHash;
                        break;
                    case 'dobleHash':
                        // Doble hash: aplicar la misma función hash a (posición donde hubo colisión + 1)
                        const valorParaHashEliminar = (posicionArray + 2).toString(); // Convertir a string
                        const nuevoHashEliminar = calcularHash(valorParaHashEliminar, metodoHash, tamanoTablaHash);
                        posicionArray = nuevoHashEliminar - 1; // Convertir a base 0
                        break;
                }

                buscarYEliminar();
            }
        }, 400);

        timeoutsHash.push(timeout);
    };

    buscarYEliminar();
}

function eliminarDeMatriz(clave, hashFila) {
    animacionHashEnCurso = true;

    // hashFila viene en base 1, convertir a índice de array (base 0)
    const filaArray = hashFila - 1;

    // Buscar en la fila
    let columna = -1;
    for (let j = 0; j < tamanoTablaHash; j++) {
        if (matrizHash[filaArray][j] === clave) {
            columna = j;
            break;
        }
    }

    if (columna === -1) {
        mostrarMensajeHash(`Clave "${clave}" no encontrada`, 'danger');
        animacionHashEnCurso = false;
        return;
    }

    const celda = document.querySelector(`#visualizacionHash .matriz-celda[data-row="${filaArray}"][data-col="${columna}"]`);
    if (celda) {
        celda.classList.add('matriz-eliminando');

        setTimeout(() => {
            matrizHash[filaArray][columna] = null;
            renderizarEstructuraHash();
            document.getElementById('claveHash').value = '';
            // Mostrar posición en base 1
            mostrarMensajeHash(`Clave "${clave}" eliminada de [${hashFila}][${columna + 1}]`, 'success');
            animacionHashEnCurso = false;
        }, 500);
    }
}

function eliminarDeListaEnlazada(clave, hashPosicion) {
    animacionHashEnCurso = true;

    // hashPosicion viene en base 1, convertir a índice de array (base 0)
    const posicionArray = hashPosicion - 1;

    const lista = listaEnlazadaHash[posicionArray];
    const idx = lista.indexOf(clave);

    if (idx === -1) {
        mostrarMensajeHash(`Clave "${clave}" no encontrada`, 'danger');
        animacionHashEnCurso = false;
        return;
    }

    // Seleccionar el elemento a eliminar
    let elemento;
    if (idx === 0) {
        elemento = document.querySelector(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-celda-principal`);
    } else {
        elemento = document.querySelectorAll(`#visualizacionHash .lista-fila-vertical[data-index="${posicionArray}"] .lista-nodo-externo`)[idx - 1];
    }

    if (elemento) {
        elemento.classList.add('lista-eliminando');

        setTimeout(() => {
            listaEnlazadaHash[posicionArray].splice(idx, 1);
            renderizarEstructuraHash();
            document.getElementById('claveHash').value = '';
            // Mostrar posición en base 1
            mostrarMensajeHash(`Clave "${clave}" eliminada de posición ${hashPosicion}`, 'success');
            animacionHashEnCurso = false;
        }, 500);
    } else {
        // Si no se encuentra el elemento visual, eliminar directamente
        listaEnlazadaHash[posicionArray].splice(idx, 1);
        renderizarEstructuraHash();
        document.getElementById('claveHash').value = '';
        mostrarMensajeHash(`Clave "${clave}" eliminada de posición ${hashPosicion}`, 'success');
        animacionHashEnCurso = false;
    }
}

// ==================== LIMPIAR ====================

function limpiarHash() {
    if (!confirm('¿Está seguro de limpiar toda la estructura?')) {
        return;
    }

    limpiarTimeoutsHash();

    const tamano = parseInt(document.getElementById('tamanoEstructuraHash').value) || 10;
    tamanoTablaHash = tamano;

    // Reiniciar todas las estructuras
    tablaHash = new Array(tamano).fill(null);

    matrizHash = [];
    for (let i = 0; i < tamano; i++) {
        matrizHash[i] = new Array(tamano).fill(null);
    }

    listaEnlazadaHash = [];
    for (let i = 0; i < tamano; i++) {
        listaEnlazadaHash[i] = [];
    }

    estructuraHashInicializada = true;
    renderizarEstructuraHash();
    mostrarMensajeHash('Estructura limpiada', 'info');
}

// ==================== GUARDAR Y CARGAR ====================

function guardarHash() {
    if (!estructuraHashInicializada) {
        mostrarMensajeHash('No hay estructura para guardar', 'warning');
        return;
    }

    const metodoColision = document.getElementById('metodoColision').value;

    let datos;
    if (metodoColision === 'anidados') {
        datos = { tipo: 'anidados', tamano: tamanoTablaHash, datos: matrizHash };
    } else if (metodoColision === 'enlazada') {
        datos = { tipo: 'enlazada', tamano: tamanoTablaHash, datos: listaEnlazadaHash };
    } else {
        datos = { tipo: 'simple', tamano: tamanoTablaHash, datos: tablaHash, colision: metodoColision };
    }

    datos.metodoHash = document.getElementById('metodoHash').value;
    datos.tamanoClaves = document.getElementById('tamanoClaveHash').value;

    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estructura_hash.json';
    a.click();
    URL.revokeObjectURL(url);

    mostrarMensajeHash('Estructura guardada correctamente', 'success');
}

function cargarHash() {
    document.getElementById('fileInputHash').click();
}

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInputHash');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const datos = JSON.parse(event.target.result);

                    tamanoTablaHash = datos.tamano;
                    document.getElementById('tamanoEstructuraHash').value = datos.tamano;
                    document.getElementById('metodoHash').value = datos.metodoHash || 'modulo';
                    document.getElementById('tamanoClaveHash').value = datos.tamanoClaves || 3;

                    if (datos.tipo === 'anidados') {
                        document.getElementById('metodoColision').value = 'anidados';
                        matrizHash = datos.datos;
                        tablaHash = [];
                        listaEnlazadaHash = [];
                    } else if (datos.tipo === 'enlazada') {
                        document.getElementById('metodoColision').value = 'enlazada';
                        listaEnlazadaHash = datos.datos;
                        tablaHash = [];
                        matrizHash = [];
                    } else {
                        document.getElementById('metodoColision').value = datos.colision || 'lineal';
                        tablaHash = datos.datos;
                        matrizHash = [];
                        listaEnlazadaHash = [];
                    }

                    estructuraHashInicializada = true;
                    actualizarDescripcionHash();
                    renderizarEstructuraHash();
                    mostrarMensajeHash('Estructura cargada correctamente', 'success');
                } catch (error) {
                    mostrarMensajeHash('Error al cargar el archivo: ' + error.message, 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }

    // Inicializar descripción
    actualizarDescripcionHash();
});

