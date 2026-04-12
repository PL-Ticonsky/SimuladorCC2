/**
 * Simulador CC2 - Hash Externa por Bloques
 * Reutiliza la logica de hash de internas con visualizacion en bloques.
 */

let hxeTabla = [];
let hxeMatriz = [];
let hxeLista = [];

let hxeTamano = 27;
let hxeTamanoBloque = 5;
let hxeCantidadBloques = 6;
let hxeInicializada = false;
let hxeAnimando = false;
let hxeTimeouts = [];

const hxeDescripcionesHash = {
    modulo: '<strong>Funcion:</strong> Calcula el hash como <code>H(k) = (k mod n) + 1</code>.',
    cuadrado: '<strong>Funcion:</strong> Eleva la clave al cuadrado y extrae digitos centrales + 1.',
    truncamiento: '<strong>Funcion:</strong> Toma digitos impares de la clave y calcula la posicion + 1.',
    plegamiento: '<strong>Funcion:</strong> Divide la clave en grupos y suma segmentos para obtener la posicion + 1.'
};

const hxeDescripcionesColision = {
    lineal: 'Si hay colision, avanza secuencialmente: <code>D + i, i = 1...n</code>.',
    cuadratica: 'Resuelve colisiones con incrementos cuadrados: <code>D + i^2, i = 1...n</code>.',
    dobleHash: 'Vuelve a aplicar la misma funcion hash para calcular el siguiente salto.',
    anidados: 'Cada posicion es un arreglo fijo (fila) para almacenar colisiones.',
    enlazada: 'Cada posicion es una lista dinamica de claves enlazadas logicamente.'
};

function limpiarTimeoutsHashExterna() {
    hxeTimeouts.forEach(function (t) { clearTimeout(t); });
    hxeTimeouts = [];
    hxeAnimando = false;
}

function mostrarMensajeHashExterna(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeHashExt');
    if (!alertDiv) return;
    alertDiv.className = 'alert alert-' + tipo;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function obtenerMetodoHashExterna() {
    const el = document.getElementById('metodoHashExt');
    return el ? el.value : '';
}

function obtenerMetodoColisionHashExterna() {
    const el = document.getElementById('metodoColisionExt');
    return el ? el.value : '';
}

function convertirClaveANumeroHashExterna(clave) {
    let resultado = '';
    for (let i = 0; i < clave.length; i++) {
        const c = clave[i].toUpperCase();
        if (/\d/.test(c)) resultado += c;
        else if (/[A-Z]/.test(c)) resultado += String(c.charCodeAt(0) - 64);
    }
    return parseInt(resultado, 10) || 0;
}

function validarClaveHashExterna(valor, tamanoCaracteres) {
    const claveStr = (valor || '').toString().trim();
    if (!claveStr) return { valido: false, mensaje: 'La clave no puede estar vacia' };
    if (!/^[0-9]+$/.test(claveStr)) return { valido: false, mensaje: 'La clave solo puede contener numeros' };
    if (claveStr.length !== tamanoCaracteres) {
        return { valido: false, mensaje: 'La clave debe tener exactamente ' + tamanoCaracteres + ' digitos' };
    }
    return { valido: true, clave: claveStr };
}

function calcularHashExterna(clave, metodo, tamano) {
    const k = convertirClaveANumeroHashExterna(clave);
    let hashBase0;

    switch (metodo) {
        case 'modulo':
            hashBase0 = k % tamano;
            break;
        case 'cuadrado': {
            const digitosNecesarios = (tamano - 1).toString().length;
            const cuadrado = BigInt(k) * BigInt(k);
            const cuadradoStr = cuadrado.toString();
            if (digitosNecesarios > cuadradoStr.length) {
                hashBase0 = parseInt(cuadradoStr, 10);
            } else {
                const inicio = Math.floor((cuadradoStr.length - digitosNecesarios) / 2);
                const centro = cuadradoStr.substring(inicio, inicio + digitosNecesarios);
                hashBase0 = parseInt(centro || '0', 10);
            }
            break;
        }
        case 'truncamiento': {
            const s = k.toString();
            const necesarios = tamano.toString().length;
            let impares = '';
            for (let i = 0; i < s.length && impares.length < necesarios; i += 2) impares += s[i];
            hashBase0 = parseInt(impares || '0', 10);
            break;
        }
        case 'plegamiento': {
            const s = k.toString();
            const grupo = Math.max(1, tamano.toString().length - 1);
            let suma = 0;
            for (let i = 0; i < s.length; i += grupo) suma += parseInt(s.substring(i, i + grupo), 10) || 0;
            hashBase0 = suma % tamano;
            break;
        }
        default:
            hashBase0 = k % tamano;
    }

    return hashBase0 + 1;
}

function actualizarDescripcionHashExterna() {
    const metodo = obtenerMetodoHashExterna();
    const colision = obtenerMetodoColisionHashExterna();
    const box = document.getElementById('descripcionHashExt');
    if (!box) return;

    if (!metodo && !colision) {
        box.innerHTML = '<span class="text-muted">Seleccione una funcion hash y un metodo de colision para ver su descripcion.</span>';
        return;
    }

    let html = '';
    html += metodo && hxeDescripcionesHash[metodo]
        ? hxeDescripcionesHash[metodo]
        : '<span class="text-muted">Seleccione una funcion hash.</span>';
    html += '<hr class="my-2">';
    html += colision && hxeDescripcionesColision[colision]
        ? '<small><strong>Colision:</strong> ' + hxeDescripcionesColision[colision] + '</small>'
        : '<small class="text-muted">Seleccione un metodo de colision.</small>';
    box.innerHTML = html;
}

function recalcularBloquesHashExterna() {
    hxeTamanoBloque = Math.max(1, Math.floor(Math.sqrt(hxeTamano)));
    hxeCantidadBloques = Math.ceil(hxeTamano / hxeTamanoBloque);
}

function inicializarEstructuraHashExterna() {
    limpiarTimeoutsHashExterna();

    const tamInput = document.getElementById('tamanoEstructuraHashExt');
    const tam = parseInt((tamInput && tamInput.value) || '27', 10) || 27;
    const metodoColision = obtenerMetodoColisionHashExterna();

    if (tam < 5 || tam > 500) {
        mostrarMensajeHashExterna('El tamaño debe estar entre 5 y 500', 'warning');
        return;
    }

    hxeTamano = tam;
    recalcularBloquesHashExterna();

    hxeTabla = new Array(hxeTamano).fill(null);
    hxeMatriz = [];
    for (let i = 0; i < hxeTamano; i++) hxeMatriz[i] = new Array(hxeTamano).fill(null);
    hxeLista = [];
    for (let j = 0; j < hxeTamano; j++) hxeLista[j] = [];

    hxeInicializada = true;
    renderizarHashExterna();

    const texto = metodoColision
        ? 'Estructura hash inicializada (' + hxeCantidadBloques + ' bloques de ' + hxeTamanoBloque + ')'
        : 'Estructura inicializada; seleccione un metodo de colision para operar';
    mostrarMensajeHashExterna(texto, 'success');
}

function contarElementosHashExterna(metodoColision) {
    if (metodoColision === 'anidados') {
        let total = 0;
        for (let i = 0; i < hxeMatriz.length; i++) {
            for (let j = 0; j < hxeCantidadBloques; j++) if (hxeMatriz[i][j] !== null) total++;
        }
        return total;
    }
    if (metodoColision === 'enlazada') {
        return hxeLista.reduce(function (acc, l) { return acc + l.length; }, 0);
    }
    return hxeTabla.filter(function (x) { return x !== null; }).length;
}

function renderizarHashExternaAbierta() {
    let html = '<div class="hashx-scroll-inner"><div class="hashx-bloques-grid">';

    for (let b = 0; b < hxeCantidadBloques; b++) {
        html += '<div class="bloque-card" data-bloque="' + b + '">';
        html += '<div class="bloque-header">Bloque ' + (b + 1) + '</div>';
        html += '<div class="bloque-body">';

        for (let i = 0; i < hxeTamanoBloque; i++) {
            const globalIdx = b * hxeTamanoBloque + i;
            const utilizable = globalIdx < hxeTamano;
            const val = utilizable ? hxeTabla[globalIdx] : null;
            const contenido = val === null ? '' : String(val);
            const vacio = !contenido;

            html += '<div class="bloque-celda hashx-celda ' + (vacio ? 'bloque-vacio ' : '') + (!utilizable ? 'bloque-no-utilizable' : '') + '" data-index="' + globalIdx + '">';
            html += '<span class="bloque-celda-index">' + (globalIdx + 1) + '</span>';
            html += '<span class="bloque-celda-valor hashx-valor">' + contenido + '</span>';
            html += '</div>';
        }

        html += '</div></div>';
    }

    html += '</div></div>';
    return html;
}

function renderizarHashExternaAnidados() {
    let html = '<div class="hashx-scroll-inner"><div class="hashx-matriz-bloques">';

    // Matriz visual NxN: cada columna replica exactamente la estructura base.
    for (let colBloque = 0; colBloque < hxeCantidadBloques; colBloque++) {
        html += '<div class="hashx-columna-bloques">';

        for (let b = 0; b < hxeCantidadBloques; b++) {
            html += '<div class="bloque-card hashx-bloque-pegado">';
            html += '<div class="bloque-header">Bloque ' + (b + 1) + '</div>';
            html += '<div class="bloque-body">';

            for (let i = 0; i < hxeTamanoBloque; i++) {
                const fila = b * hxeTamanoBloque + i;
                const utilizable = fila < hxeTamano;
                const val = utilizable ? hxeMatriz[fila][colBloque] : null;
                const contenido = val === null ? '' : String(val);
                const vacio = !contenido;
                const dataIdx = colBloque === 0 ? ' data-index="' + fila + '"' : '';

                html += '<div class="bloque-celda hashx-celda ' + (vacio ? 'bloque-vacio ' : '') + (!utilizable ? 'bloque-no-utilizable' : '') + '" data-estr="anidados" data-row="' + fila + '" data-col="' + colBloque + '"' + dataIdx + '>';
                html += '<span class="bloque-celda-index">' + (fila + 1) + '</span>';
                html += '<span class="bloque-celda-valor hashx-valor">' + contenido + '</span>';
                html += '</div>';
            }

            html += '</div></div>';
        }

        html += '</div>';
    }

    html += '</div></div>';
    return html;
}

function renderizarHashExternaEnlazada() {
    let html = '<div class="hashx-scroll-inner"><div class="hashx-matriz-bloques hashx-enlazada-v2">';

    let maxNivelColision = 0;
    for (let idx = 0; idx < hxeTamano; idx++) {
        const profundidad = Math.max(0, hxeLista[idx].length - 1);
        if (profundidad > maxNivelColision) maxNivelColision = profundidad;
    }

    // Nivel 0: bloque base. Niveles 1..k: bloques de colision, uno por cada nivel adicional.
    for (let nivel = 0; nivel <= maxNivelColision; nivel++) {
        const claseColumna = nivel === 0 ? 'hashx-columna-enlazada' : 'hashx-columna-enlazada hashx-columna-colision';
        html += '<div class="' + claseColumna + '">';

        for (let b = 0; b < hxeCantidadBloques; b++) {
            if (nivel > 0) {
                let hayNivelEnBloque = false;
                for (let i = 0; i < hxeTamanoBloque; i++) {
                    const globalIdx = b * hxeTamanoBloque + i;
                    if (globalIdx < hxeTamano && hxeLista[globalIdx].length > nivel) {
                        hayNivelEnBloque = true;
                        break;
                    }
                }
                if (!hayNivelEnBloque) {
                    html += '<div class="hashx-bloque-espacio">';
                    html += '<div class="hashx-bloque-espacio-header"></div>';
                    html += '<div class="hashx-bloque-espacio-body">';
                    for (let i = 0; i < hxeTamanoBloque; i++) html += '<div class="hashx-bloque-espacio-celda"></div>';
                    html += '</div></div>';
                    continue;
                }
            }

            const claseBloque = nivel === 0
                ? 'bloque-card hashx-bloque-enlazado'
                : 'bloque-card hashx-bloque-enlazado hashx-bloque-colision-lvl';
            html += '<div class="' + claseBloque + '">';
            html += '<div class="bloque-header">Bloque ' + (b + 1) + '</div>';
            html += '<div class="bloque-body">';

            for (let i = 0; i < hxeTamanoBloque; i++) {
                const globalIdx = b * hxeTamanoBloque + i;
                const utilizable = globalIdx < hxeTamano;
                const lista = utilizable ? hxeLista[globalIdx] : [];
                const valor = lista[nivel] || '';
                const vacio = !valor;
                const dataIdx = nivel === 0 ? ' data-index="' + globalIdx + '"' : '';

                html += '<div class="bloque-celda hashx-celda ' + (vacio ? 'bloque-vacio ' : '') + (!utilizable ? 'bloque-no-utilizable' : '') + '" data-estr="enlazada" data-row="' + globalIdx + '" data-level="' + nivel + '"' + dataIdx + '>';
                html += '<span class="bloque-celda-index">' + (globalIdx + 1) + '</span>';
                html += '<span class="bloque-celda-valor hashx-valor">' + valor + '</span>';
                html += '</div>';
            }

            html += '</div></div>';
        }

        html += '</div>';
    }

    html += '</div></div>';
    return html;
}

function renderizarHashExterna() {
    const container = document.getElementById('visualizacionHashExterna');
    if (!container) return;

    if (!hxeInicializada) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    const metodoColision = obtenerMetodoColisionHashExterna();
    let html;
    if (metodoColision === 'anidados') {
        html = renderizarHashExternaAnidados();
    } else if (metodoColision === 'enlazada') {
        html = renderizarHashExternaEnlazada();
    } else {
        html = renderizarHashExternaAbierta();
    }

    html += '<div class="mt-2 text-muted small">Tamaño: ' + hxeTamano + ' | Bloques: ' + hxeCantidadBloques + ' x ' + hxeTamanoBloque + ' | Elementos: ' + contarElementosHashExterna(metodoColision) + '</div>';
    container.innerHTML = html;
}

function cambiarMetodoColisionHashExterna() {
    actualizarDescripcionHashExterna();
    if (!hxeInicializada) return;

    // Re-renderiza sin alterar la data para mostrar el formato del metodo actual.
    renderizarHashExterna();
}

function obtenerClaveValidaHashExterna(accion) {
    const claveInput = document.getElementById('claveHashExt');
    const tamInput = document.getElementById('tamanoClaveHashExt');
    const metodoHash = obtenerMetodoHashExterna();
    const metodoColision = obtenerMetodoColisionHashExterna();

    if (!hxeInicializada) {
        mostrarMensajeHashExterna('Primero debe crear la estructura', 'warning');
        return null;
    }
    if (!metodoHash) {
        mostrarMensajeHashExterna('Seleccione una funcion hash', 'warning');
        return null;
    }
    if (!metodoColision) {
        mostrarMensajeHashExterna('Seleccione un metodo de colision', 'warning');
        return null;
    }

    const tamClave = parseInt((tamInput && tamInput.value) || '3', 10) || 3;
    const validacion = validarClaveHashExterna(claveInput ? claveInput.value : '', tamClave);
    if (!validacion.valido) {
        mostrarMensajeHashExterna(validacion.mensaje, 'warning');
        return null;
    }

    return {
        clave: validacion.clave,
        metodoHash: metodoHash,
        metodoColision: metodoColision,
        hashInicial: calcularHashExterna(validacion.clave, metodoHash, hxeTamano),
        accion: accion
    };
}

function existeClaveGlobalHashExterna(clave, metodoColision) {
    if (metodoColision === 'anidados') {
        for (let i = 0; i < hxeMatriz.length; i++) {
            for (let j = 0; j < hxeMatriz[i].length; j++) if (hxeMatriz[i][j] === clave) return true;
        }
        return false;
    }
    if (metodoColision === 'enlazada') {
        return hxeLista.some(function (l) { return l.indexOf(clave) !== -1; });
    }
    return hxeTabla.indexOf(clave) !== -1;
}

function limpiarResaltadosHashExterna() {
    const celdas = document.querySelectorAll('#visualizacionHashExterna .hashx-celda');
    celdas.forEach(function (c) {
        c.classList.remove('celda-buscando', 'celda-encontrada', 'celda-insertada', 'celda-eliminando');
    });
}

function obtenerNodoColisionHashExterna(metodoColision, fila, posicionNodo) {
    if (metodoColision === 'anidados') {
        return document.querySelector('#visualizacionHashExterna .hashx-celda[data-estr="anidados"][data-row="' + fila + '"][data-col="' + posicionNodo + '"]');
    }
    if (metodoColision === 'enlazada') {
        return document.querySelector('#visualizacionHashExterna .hashx-celda[data-estr="enlazada"][data-row="' + fila + '"][data-level="' + posicionNodo + '"]');
    }
    return document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + fila + '"]');
}

function animarRecorridoColisionHashExterna(metodoColision, fila, recorrido, clasePaso, callback) {
    if (!recorrido || !recorrido.length) {
        if (typeof callback === 'function') callback();
        return;
    }

    const delay = 280;
    let t = 0;

    recorrido.forEach(function (nodoPos, idx) {
        hxeTimeouts.push(setTimeout(function () {
            if (idx > 0) {
                const prev = obtenerNodoColisionHashExterna(metodoColision, fila, recorrido[idx - 1]);
                if (prev) prev.classList.remove(clasePaso);
            }
            const actual = obtenerNodoColisionHashExterna(metodoColision, fila, nodoPos);
            if (actual) actual.classList.add(clasePaso);
        }, t));
        t += delay;
    });

    hxeTimeouts.push(setTimeout(function () {
        const last = obtenerNodoColisionHashExterna(metodoColision, fila, recorrido[recorrido.length - 1]);
        if (last) last.classList.remove(clasePaso);
        if (typeof callback === 'function') callback();
    }, t));
}

function animarRutaHashExterna(indices, clasePaso, callback) {
    limpiarResaltadosHashExterna();
    if (!indices || !indices.length) {
        if (typeof callback === 'function') callback();
        return;
    }

    const delay = 350;
    let t = 0;

    indices.forEach(function (idx, pos) {
        hxeTimeouts.push(setTimeout(function () {
            if (pos > 0) {
                const prev = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + indices[pos - 1] + '"]');
                if (prev) prev.classList.remove(clasePaso);
            }
            const actual = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + idx + '"]');
            if (actual) actual.classList.add(clasePaso);
        }, t));
        t += delay;
    });

    hxeTimeouts.push(setTimeout(function () {
        const last = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + indices[indices.length - 1] + '"]');
        if (last) last.classList.remove(clasePaso);
        if (typeof callback === 'function') callback();
    }, t));
}

function siguientePosicionHashExterna(posicionArray, hashInicial, intentos, metodoColision, metodoHash) {
    if (metodoColision === 'lineal') {
        return ((hashInicial - 1) + intentos) % hxeTamano;
    }
    if (metodoColision === 'cuadratica') {
        return ((hashInicial - 1) + intentos * intentos) % hxeTamano;
    }
    const valorParaHash = String(posicionArray + 2);
    const nuevoHash = calcularHashExterna(valorParaHash, metodoHash, hxeTamano);
    return nuevoHash - 1;
}

function insertarHashExterna() {
    if (hxeAnimando) limpiarTimeoutsHashExterna();
    const ctx = obtenerClaveValidaHashExterna('insertar');
    if (!ctx) return;

    if (existeClaveGlobalHashExterna(ctx.clave, ctx.metodoColision)) {
        mostrarMensajeHashExterna('La clave "' + ctx.clave + '" ya existe en la estructura', 'warning');
        return;
    }

    hxeAnimando = true;
    renderizarHashExterna();

    const fila = ctx.hashInicial - 1;

    if (ctx.metodoColision === 'anidados') {
        let col = -1;
        for (let j = 0; j < hxeCantidadBloques; j++) {
            if (hxeMatriz[fila][j] === null) {
                col = j;
                break;
            }
        }
        if (col === -1) {
            mostrarMensajeHashExterna('Fila ' + ctx.hashInicial + ' llena, no se puede insertar', 'danger');
            hxeAnimando = false;
            return;
        }

        const recorridoInsercion = [];
        for (let j = 0; j < col; j++) recorridoInsercion.push(j);

        animarRutaHashExterna([fila], 'celda-buscando', function () {
            animarRecorridoColisionHashExterna('anidados', fila, recorridoInsercion, 'celda-buscando', function () {
                hxeMatriz[fila][col] = ctx.clave;
                renderizarHashExterna();
                const celda = obtenerNodoColisionHashExterna('anidados', fila, col);
                if (celda) celda.classList.add('celda-insertada');
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> insertada en posicion ' + ctx.hashInicial + ', nodo ' + (col + 1), 'success');
                hxeAnimando = false;
            });
        });
        return;
    }

    if (ctx.metodoColision === 'enlazada') {
        const recorridoInsercion = [];
        for (let j = 0; j < hxeLista[fila].length; j++) recorridoInsercion.push(j);

        animarRutaHashExterna([fila], 'celda-buscando', function () {
            animarRecorridoColisionHashExterna('enlazada', fila, recorridoInsercion, 'celda-buscando', function () {
                hxeLista[fila].push(ctx.clave);
                const nivelInsertado = hxeLista[fila].length - 1;
                renderizarHashExterna();
                const celda = obtenerNodoColisionHashExterna('enlazada', fila, nivelInsertado);
                if (celda) celda.classList.add('celda-insertada');
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> insertada en posicion ' + ctx.hashInicial + ', nodo ' + hxeLista[fila].length, 'success');
                hxeAnimando = false;
            });
        });
        return;
    }

    const ruta = [];
    let intentos = 0;
    let posicion = fila;
    while (intentos < hxeTamano) {
        ruta.push(posicion);
        if (hxeTabla[posicion] === null) break;
        intentos += 1;
        posicion = siguientePosicionHashExterna(posicion, ctx.hashInicial, intentos, ctx.metodoColision, ctx.metodoHash);
    }

    if (intentos >= hxeTamano && hxeTabla[posicion] !== null) {
        mostrarMensajeHashExterna('Estructura llena, no se puede insertar', 'danger');
        hxeAnimando = false;
        return;
    }

    animarRutaHashExterna(ruta, 'celda-buscando', function () {
        hxeTabla[posicion] = ctx.clave;
        renderizarHashExterna();
        const celda = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + posicion + '"]');
        if (celda) celda.classList.add('celda-insertada');
        const msgColision = intentos > 0 ? ' (' + intentos + ' colisiones resueltas)' : '';
        mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> insertada en posicion ' + (posicion + 1) + msgColision, 'success');
        hxeAnimando = false;
    });
}

function buscarHashExterna() {
    if (hxeAnimando) limpiarTimeoutsHashExterna();
    const ctx = obtenerClaveValidaHashExterna('buscar');
    if (!ctx) return;

    hxeAnimando = true;
    renderizarHashExterna();

    const fila = ctx.hashInicial - 1;

    if (ctx.metodoColision === 'anidados') {
        animarRutaHashExterna([fila], 'celda-buscando', function () {
            const row = hxeMatriz[fila];
            let pos = -1;
            let pasos = 0;
            let ultimoOcupado = -1;
            for (let j = 0; j < hxeCantidadBloques; j++) {
                if (row[j] !== null) {
                    pasos += 1;
                    ultimoOcupado = j;
                }
                if (row[j] === ctx.clave) {
                    pos = j;
                    break;
                }
            }

            const recorrido = [];
            const limite = pos !== -1 ? pos : ultimoOcupado;
            for (let j = 0; j <= limite && limite >= 0; j++) recorrido.push(j);

            animarRecorridoColisionHashExterna('anidados', fila, recorrido, 'celda-buscando', function () {
                if (pos !== -1) {
                    const celda = obtenerNodoColisionHashExterna('anidados', fila, pos);
                    if (celda) celda.classList.add('celda-encontrada');
                    mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> encontrada en posicion ' + ctx.hashInicial + ', nodo ' + (pos + 1) + ' (' + pasos + ' pasos)', 'success');
                } else {
                    mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada', 'danger');
                }
                hxeAnimando = false;
            });
        });
        return;
    }

    if (ctx.metodoColision === 'enlazada') {
        animarRutaHashExterna([fila], 'celda-buscando', function () {
            const lista = hxeLista[fila];
            const pos = lista.indexOf(ctx.clave);
            const recorrido = [];
            const tope = pos !== -1 ? pos : Math.max(0, lista.length - 1);
            for (let j = 0; j <= tope && lista.length > 0; j++) recorrido.push(j);

            animarRecorridoColisionHashExterna('enlazada', fila, recorrido, 'celda-buscando', function () {
                if (pos !== -1) {
                    const celda = obtenerNodoColisionHashExterna('enlazada', fila, pos);
                    if (celda) celda.classList.add('celda-encontrada');
                    mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> encontrada en posicion ' + ctx.hashInicial + ', nodo ' + (pos + 1) + ' (' + (pos + 1) + ' pasos)', 'success');
                } else {
                    mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada', 'danger');
                }
                hxeAnimando = false;
            });
        });
        return;
    }

    const ruta = [];
    let pasos = 0;
    let intentos = 0;
    let posicion = fila;
    let encontrada = -1;

    while (intentos < hxeTamano) {
        ruta.push(posicion);
        pasos += 1;
        if (hxeTabla[posicion] === null) break;
        if (hxeTabla[posicion] === ctx.clave) {
            encontrada = posicion;
            break;
        }
        intentos += 1;
        posicion = siguientePosicionHashExterna(posicion, ctx.hashInicial, intentos, ctx.metodoColision, ctx.metodoHash);
    }

    animarRutaHashExterna(ruta, 'celda-buscando', function () {
        if (encontrada !== -1) {
            const celda = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + encontrada + '"]');
            if (celda) celda.classList.add('celda-encontrada');
            mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> encontrada en posicion ' + (encontrada + 1) + ' (' + pasos + ' pasos)', 'success');
        } else {
            mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada (' + pasos + ' pasos)', 'danger');
        }
        hxeAnimando = false;
    });
}

function eliminarHashExterna() {
    if (hxeAnimando) limpiarTimeoutsHashExterna();
    const ctx = obtenerClaveValidaHashExterna('eliminar');
    if (!ctx) return;

    if (!confirm('Esta seguro de eliminar la clave "' + ctx.clave + '"?')) return;

    hxeAnimando = true;
    renderizarHashExterna();

    const fila = ctx.hashInicial - 1;

    if (ctx.metodoColision === 'anidados') {
        animarRutaHashExterna([fila], 'celda-buscando', function () {
            let col = -1;
            let pasos = 0;
            let ultimoOcupado = -1;
            for (let j = 0; j < hxeCantidadBloques; j++) {
                if (hxeMatriz[fila][j] !== null) {
                    pasos += 1;
                    ultimoOcupado = j;
                }
                if (hxeMatriz[fila][j] === ctx.clave) {
                    col = j;
                    break;
                }
            }

            const recorrido = [];
            const limite = col !== -1 ? col : ultimoOcupado;
            for (let j = 0; j <= limite && limite >= 0; j++) recorrido.push(j);

            animarRecorridoColisionHashExterna('anidados', fila, recorrido, 'celda-buscando', function () {
            if (col === -1) {
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada', 'danger');
                hxeAnimando = false;
                return;
            }
            const celda = obtenerNodoColisionHashExterna('anidados', fila, col);
            if (celda) celda.classList.add('celda-eliminando');
            hxeTimeouts.push(setTimeout(function () {
                // En arreglos anidados la estructura es estatica: se libera la celda sin compactar.
                hxeMatriz[fila][col] = null;
                renderizarHashExterna();
                const input = document.getElementById('claveHashExt');
                if (input) input.value = '';
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> eliminada de posicion ' + ctx.hashInicial + ', nodo ' + (col + 1), 'success');
                hxeAnimando = false;
            }, 450));
            });
        });
        return;
    }

    if (ctx.metodoColision === 'enlazada') {
        animarRutaHashExterna([fila], 'celda-buscando', function () {
            const idx = hxeLista[fila].indexOf(ctx.clave);
            const recorrido = [];
            const tope = idx !== -1 ? idx : Math.max(0, hxeLista[fila].length - 1);
            for (let j = 0; j <= tope && hxeLista[fila].length > 0; j++) recorrido.push(j);

            animarRecorridoColisionHashExterna('enlazada', fila, recorrido, 'celda-buscando', function () {
            if (idx === -1) {
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada', 'danger');
                hxeAnimando = false;
                return;
            }
            const celda = obtenerNodoColisionHashExterna('enlazada', fila, idx);
            if (celda) celda.classList.add('celda-eliminando');
            hxeTimeouts.push(setTimeout(function () {
                hxeLista[fila].splice(idx, 1);
                renderizarHashExterna();
                const input = document.getElementById('claveHashExt');
                if (input) input.value = '';
                mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> eliminada de posicion ' + ctx.hashInicial + ', nodo ' + (idx + 1), 'success');
                hxeAnimando = false;
            }, 450));
            });
        });
        return;
    }

    const ruta = [];
    let intentos = 0;
    let posicion = fila;
    let encontrada = -1;
    while (intentos < hxeTamano) {
        ruta.push(posicion);
        if (hxeTabla[posicion] === null) break;
        if (hxeTabla[posicion] === ctx.clave) {
            encontrada = posicion;
            break;
        }
        intentos += 1;
        posicion = siguientePosicionHashExterna(posicion, ctx.hashInicial, intentos, ctx.metodoColision, ctx.metodoHash);
    }

    animarRutaHashExterna(ruta, 'celda-buscando', function () {
        if (encontrada === -1) {
            mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> no encontrada', 'danger');
            hxeAnimando = false;
            return;
        }
        const celda = document.querySelector('#visualizacionHashExterna .hashx-celda[data-index="' + encontrada + '"]');
        if (celda) celda.classList.add('celda-eliminando');
        hxeTimeouts.push(setTimeout(function () {
            hxeTabla[encontrada] = null;
            renderizarHashExterna();
            const input = document.getElementById('claveHashExt');
            if (input) input.value = '';
            mostrarMensajeHashExterna('Clave <strong>"' + ctx.clave + '"</strong> eliminada de posicion ' + (encontrada + 1), 'success');
            hxeAnimando = false;
        }, 450));
    });
}

function limpiarHashExterna() {
    if (!hxeInicializada) {
        mostrarMensajeHashExterna('Primero debe crear la estructura', 'warning');
        return;
    }
    if (!confirm('Esta seguro de limpiar toda la estructura?')) return;

    limpiarTimeoutsHashExterna();
    hxeTabla = new Array(hxeTamano).fill(null);
    hxeMatriz = [];
    for (let i = 0; i < hxeTamano; i++) hxeMatriz[i] = new Array(hxeTamano).fill(null);
    hxeLista = [];
    for (let j = 0; j < hxeTamano; j++) hxeLista[j] = [];
    renderizarHashExterna();
    const claveInput = document.getElementById('claveHashExt');
    if (claveInput) claveInput.value = '';
    mostrarMensajeHashExterna('Estructura limpiada correctamente', 'success');
}

function guardarHashExterna() {
    if (!hxeInicializada) {
        mostrarMensajeHashExterna('No hay estructura para guardar', 'warning');
        return;
    }

    const payload = {
        tipo: 'hash_externa_bloques',
        tamano: hxeTamano,
        tamanoBloque: hxeTamanoBloque,
        cantidadBloques: hxeCantidadBloques,
        tamanoClave: parseInt((document.getElementById('tamanoClaveHashExt') || {}).value || '3', 10) || 3,
        metodoHash: obtenerMetodoHashExterna(),
        metodoColision: obtenerMetodoColisionHashExterna(),
        tabla: hxeTabla,
        matriz: hxeMatriz,
        lista: hxeLista
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hash_externa_bloques.json';
    a.click();
    URL.revokeObjectURL(url);

    mostrarMensajeHashExterna('Estructura guardada correctamente', 'success');
}

function cargarHashExterna() {
    const input = document.getElementById('fileInputHashExt');
    if (input) input.click();
}

function procesarCargaHashExterna(texto) {
    const data = JSON.parse(texto);
    if (data.tipo !== 'hash_externa_bloques') throw new Error('Formato no compatible para hash externa');

    hxeTamano = data.tamano;
    hxeTamanoBloque = data.tamanoBloque || Math.max(1, Math.floor(Math.sqrt(hxeTamano)));
    hxeCantidadBloques = data.cantidadBloques || Math.ceil(hxeTamano / hxeTamanoBloque);
    hxeTabla = Array.isArray(data.tabla) ? data.tabla : new Array(hxeTamano).fill(null);
    hxeMatriz = Array.isArray(data.matriz) ? data.matriz : [];
    hxeLista = Array.isArray(data.lista) ? data.lista : [];

    if (!hxeMatriz.length) {
        for (let i = 0; i < hxeTamano; i++) hxeMatriz[i] = new Array(hxeTamano).fill(null);
    }
    if (!hxeLista.length) {
        for (let j = 0; j < hxeTamano; j++) hxeLista[j] = [];
    }

    const tamInput = document.getElementById('tamanoEstructuraHashExt');
    const tamClaveInput = document.getElementById('tamanoClaveHashExt');
    const metodoHash = document.getElementById('metodoHashExt');
    const metodoColision = document.getElementById('metodoColisionExt');

    if (tamInput) tamInput.value = hxeTamano;
    if (tamClaveInput) tamClaveInput.value = data.tamanoClave || 3;
    if (metodoHash) metodoHash.value = data.metodoHash || '';
    if (metodoColision) metodoColision.value = data.metodoColision || '';

    hxeInicializada = true;
    actualizarDescripcionHashExterna();
    renderizarHashExterna();
    mostrarMensajeHashExterna('Estructura cargada correctamente', 'success');
}

document.addEventListener('DOMContentLoaded', function () {
    actualizarDescripcionHashExterna();

    const tabHashExt = document.getElementById('tab-hash-ext');
    if (tabHashExt) {
        tabHashExt.addEventListener('shown.bs.tab', function () {
            const panelBienvenida = document.getElementById('panel-bienvenida-ext');
            if (panelBienvenida) panelBienvenida.style.display = 'none';
        });
    }

    const fileInput = document.getElementById('fileInputHashExt');
    if (fileInput) {
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    procesarCargaHashExterna(ev.target.result);
                } catch (err) {
                    mostrarMensajeHashExterna('Error al cargar archivo: ' + err.message, 'danger');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    }
});

