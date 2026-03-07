/**
 * Simulador CC2 - Módulo de Búsquedas
 * Búsqueda Secuencial y Binaria
 * Estructura estática con tamaño fijo
 */

// Estructura de datos compartida
let estructuraDatos = [];
let sbInicializado = false;
let sbTamanoEstructura = 10;
let sbTamanoDigitos = 2;

// Variable para controlar la animación
let animacionEnCurso = false;
let timeouts = [];

// ==================== FUNCIONES COMUNES ====================

function limpiarTimeouts() {
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
    animacionEnCurso = false;
}

// Función de comparación para ordenar alfanuméricamente
function compararAlfanumerico(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ==================== CREAR ESTRUCTURA ====================

function crearEstructuraSecuencial() {
    limpiarTimeouts();
    const tam = parseInt(document.getElementById('tamanoEstructuraSecuencial').value) || 10;
    const dig = parseInt(document.getElementById('tamanoSecuencial').value) || 2;

    if (tam < 1 || tam > 100) {
        mostrarMensajeSecuencial('El tamaño debe estar entre 1 y 100', 'warning');
        return;
    }
    if (dig < 1) {
        mostrarMensajeSecuencial('La cantidad de dígitos debe ser al menos 1', 'warning');
        return;
    }

    sbTamanoEstructura = tam;
    sbTamanoDigitos = dig;
    estructuraDatos = [];
    sbInicializado = true;

    // Sync binaria fields
    document.getElementById('tamanoEstructuraBinaria').value = tam;
    document.getElementById('tamanoBinaria').value = dig;

    sincronizarVisualizaciones();
    mostrarMensajeSecuencial(`Estructura creada: ${tam} posiciones, claves de ${dig} dígitos`, 'success');
}

function crearEstructuraBinaria() {
    limpiarTimeouts();
    const tam = parseInt(document.getElementById('tamanoEstructuraBinaria').value) || 10;
    const dig = parseInt(document.getElementById('tamanoBinaria').value) || 2;

    if (tam < 1 || tam > 100) {
        mostrarMensajeBinaria('El tamaño debe estar entre 1 y 100', 'warning');
        return;
    }
    if (dig < 1) {
        mostrarMensajeBinaria('La cantidad de dígitos debe ser al menos 1', 'warning');
        return;
    }

    sbTamanoEstructura = tam;
    sbTamanoDigitos = dig;
    estructuraDatos = [];
    sbInicializado = true;

    // Sync secuencial fields
    document.getElementById('tamanoEstructuraSecuencial').value = tam;
    document.getElementById('tamanoSecuencial').value = dig;

    sincronizarVisualizaciones();
    mostrarMensajeBinaria(`Estructura creada: ${tam} posiciones, claves de ${dig} dígitos`, 'success');
}

function renderizarEstructura(tipo) {
    const container = document.getElementById(`visualizacion${tipo}`);

    if (!sbInicializado) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    // Construir arreglo estático completo (ordenado, con nulls en vacíos)
    let datosRender = [...estructuraDatos].sort(compararAlfanumerico);
    const arreglo = new Array(sbTamanoEstructura).fill(null);
    for (let i = 0; i < datosRender.length; i++) {
        arreglo[i] = datosRender[i];
    }

    // Índices a mostrar: primero, último, y los que tienen datos
    const primerIndice = 0;
    const ultimoIndice = sbTamanoEstructura - 1;
    const indicesConDatos = [];
    for (let i = 0; i < sbTamanoEstructura; i++) {
        if (arreglo[i] !== null) indicesConDatos.push(i);
    }
    const indicesMostrar = new Set([primerIndice, ultimoIndice, ...indicesConDatos]);
    const indicesOrdenados = Array.from(indicesMostrar).sort((a, b) => a - b);
    const hayDatos = indicesConDatos.length > 0;

    if (tipo === 'Secuencial') {
        // Mismo diseño que renderizarTablaHashSimple (prueba lineal)
        let html = '<div class="estructura-vertical">';

        for (let j = 0; j < indicesOrdenados.length; j++) {
            const i = indicesOrdenados[j];
            const valor = arreglo[i];
            const vacia = valor === null;

            // Mostrar puntos suspensivos si hay un hueco entre el índice anterior y el actual
            // Solo mostrar puntos suspensivos si NO hay datos insertados aún
            if (j > 0) {
                const indiceAnterior = indicesOrdenados[j - 1];
                if (i - indiceAnterior > 1) {
                    if (!hayDatos) {
                        html += `<div class="clave-row hash-row hash-ellipsis">
                                    <span class="clave-valor-vertical text-muted">...</span>
                                 </div>`;
                    }
                }
            }

            // Mostrar índice base 1 (i + 1) — mismo diseño que hash prueba lineal (sin clases especiales para vacíos)
            html += `<div class="clave-row hash-row" data-index="${i}"${vacia ? ' data-empty="true"' : ''}>
                        <span class="clave-index-left">${i + 1}</span>
                        <span class="clave-valor-vertical ${vacia ? 'text-muted' : ''}">${vacia ? '' : valor}</span>
                     </div>`;
        }

        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length}/${sbTamanoEstructura} | Tamaño: ${sbTamanoEstructura} (Estructura estática, ordenada)</div>`;
        container.innerHTML = html;
    } else {
        // Diseño horizontal para binaria, con el mismo patrón de puntos suspensivos
        let html = '<div class="estructura-horizontal">';

        for (let j = 0; j < indicesOrdenados.length; j++) {
            const i = indicesOrdenados[j];
            const valor = arreglo[i];
            const vacia = valor === null;

            // Mostrar puntos suspensivos si hay un hueco entre el índice anterior y el actual
            // Solo mostrar puntos suspensivos si NO hay datos insertados aún
            if (j > 0) {
                const indiceAnterior = indicesOrdenados[j - 1];
                if (i - indiceAnterior > 1) {
                    if (!hayDatos) {
                        html += `<div class="clave-box clave-box-ellipsis">
                                    <span class="clave-index">&nbsp;</span>
                                    <span class="clave-valor text-muted">…</span>
                                 </div>`;
                    }
                }
            }

            html += `<div class="clave-box" data-index="${i}"${vacia ? ' data-empty="true"' : ''}>
                        <span class="clave-index">${i + 1}</span>
                        <span class="clave-valor ${vacia ? 'text-muted' : ''}">${vacia ? '' : valor}</span>
                     </div>`;
        }

        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length}/${sbTamanoEstructura} | Tamaño: ${sbTamanoEstructura} (Estructura estática, ordenada)</div>`;
        container.innerHTML = html;
    }
}

function renderizarConAnimacion(tipo, claveNueva, esInsercion) {
    const container = document.getElementById(`visualizacion${tipo}`);

    let datosRender = [...estructuraDatos].sort(compararAlfanumerico);
    let posicionClave = datosRender.indexOf(claveNueva);

    // Construir arreglo estático completo
    const arreglo = new Array(sbTamanoEstructura).fill(null);
    for (let i = 0; i < datosRender.length; i++) {
        arreglo[i] = datosRender[i];
    }

    // Índices a mostrar: primero, último, y los que tienen datos
    const primerIndice = 0;
    const ultimoIndice = sbTamanoEstructura - 1;
    const indicesConDatos = [];
    for (let i = 0; i < sbTamanoEstructura; i++) {
        if (arreglo[i] !== null) indicesConDatos.push(i);
    }
    const indicesMostrar = new Set([primerIndice, ultimoIndice, ...indicesConDatos]);
    const indicesOrdenados = Array.from(indicesMostrar).sort((a, b) => a - b);

    if (tipo === 'Secuencial') {
        // Mismo diseño que renderizarTablaHashSimple (prueba lineal)
        let html = '<div class="estructura-vertical">';
        for (let j = 0; j < indicesOrdenados.length; j++) {
            const i = indicesOrdenados[j];
            const valor = arreglo[i];
            const vacia = valor === null;
            const esNuevo = esInsercion && valor === claveNueva;

            html += `<div class="clave-row hash-row ${esNuevo ? 'clave-insertando' : ''}" data-index="${i}"${vacia ? ' data-empty="true"' : ''}>
                        <span class="clave-index-left">${i + 1}</span>
                        <span class="clave-valor-vertical ${vacia ? 'text-muted' : ''}">${vacia ? '' : valor}</span>
                     </div>`;
        }
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length}/${sbTamanoEstructura} | Tamaño: ${sbTamanoEstructura} (Estructura estática, ordenada)</div>`;
        container.innerHTML = html;
    } else {
        let html = '<div class="estructura-horizontal">';
        for (let j = 0; j < indicesOrdenados.length; j++) {
            const i = indicesOrdenados[j];
            const valor = arreglo[i];
            const vacia = valor === null;
            const esNuevo = esInsercion && valor === claveNueva;

            html += `<div class="clave-box ${esNuevo ? 'clave-insertando' : ''}" data-index="${i}"${vacia ? ' data-empty="true"' : ''}>
                        <span class="clave-index">${i + 1}</span>
                        <span class="clave-valor ${vacia ? 'text-muted' : ''}">${vacia ? '' : valor}</span>
                     </div>`;
        }
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length}/${sbTamanoEstructura} | Tamaño: ${sbTamanoEstructura} (Estructura estática, ordenada)</div>`;
        container.innerHTML = html;
    }

    if (esInsercion) {
        const selector = tipo === 'Secuencial' ? '.clave-row:not(.hash-ellipsis)' : '.clave-box:not(.clave-box-ellipsis)';
        const boxes = container.querySelectorAll(selector);
        // Find the rendered box that has the new key
        boxes.forEach((box) => {
            const idx = parseInt(box.getAttribute('data-index'));
            if (idx >= posicionClave && idx < estructuraDatos.length) {
                box.classList.add('clave-moviendo');
                setTimeout(() => {
                    box.classList.remove('clave-moviendo');
                }, 500);
            }
        });

        setTimeout(() => {
            const insertado = container.querySelector('.clave-insertando');
            if (insertado) {
                insertado.classList.remove('clave-insertando');
                insertado.classList.add('clave-insertada');
                setTimeout(() => {
                    insertado.classList.remove('clave-insertada');
                }, 1000);
            }
        }, 300);
    }
}

function sincronizarVisualizaciones() {
    renderizarEstructura('Secuencial');
    renderizarEstructura('Binaria');
}

function mostrarMensaje(tipo, mensaje, claseAlerta) {
    const alertDiv = document.getElementById(`mensaje${tipo}`);
    alertDiv.className = `alert alert-${claseAlerta}`;
    alertDiv.textContent = mensaje;
    alertDiv.classList.remove('d-none');
    // Ya no desaparece automáticamente
}

function ocultarMensaje(tipo) {
    const alertDiv = document.getElementById(`mensaje${tipo}`);
    alertDiv.classList.add('d-none');
}

function validarClave(valor, tamanoCaracteres) {
    const claveStr = valor.toString().trim();

    // Validar que no esté vacía
    if (claveStr.length === 0) {
        return { valido: false, mensaje: 'La clave no puede estar vacía' };
    }

    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(claveStr)) {
        return { valido: false, mensaje: 'La clave solo puede contener números' };
    }

    // Validar el tamaño exacto de dígitos
    if (claveStr.length !== tamanoCaracteres) {
        return { valido: false, mensaje: `La clave debe tener exactamente ${tamanoCaracteres} dígitos` };
    }

    return { valido: true, clave: claveStr };
}

// ==================== BÚSQUEDA SECUENCIAL ====================

function renderizarSecuencial() {
    renderizarEstructura('Secuencial');
}

function mostrarMensajeSecuencial(mensaje, tipo) {
    mostrarMensaje('Secuencial', mensaje, tipo);
}

function limpiarResaltadosSecuencial() {
    document.querySelectorAll('#visualizacionSecuencial .clave-row').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-eliminando', 'clave-insertando', 'clave-insertada', 'clave-moviendo');
    });
}

function insertarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }
    limpiarResaltadosSecuencial();

    if (!sbInicializado) {
        mostrarMensajeSecuencial('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveInput = document.getElementById('claveSecuencial');
    const claveValor = claveInput.value.trim();

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(claveValor, sbTamanoDigitos);
    if (!validacion.valido) {
        mostrarMensajeSecuencial(validacion.mensaje, 'warning');
        return;
    }

    const clave = validacion.clave;

    if (estructuraDatos.includes(clave)) {
        mostrarMensajeSecuencial('La clave ya existe en la estructura', 'warning');
        return;
    }

    if (estructuraDatos.length >= sbTamanoEstructura) {
        mostrarMensajeSecuencial(`La estructura está llena (${sbTamanoEstructura}/${sbTamanoEstructura})`, 'danger');
        return;
    }

    estructuraDatos.push(clave);
    claveInput.value = '';

    renderizarConAnimacion('Secuencial', clave, true);
    renderizarEstructura('Binaria');

    const posicion = [...estructuraDatos].sort(compararAlfanumerico).indexOf(clave) + 1;
    mostrarMensajeSecuencial(`Clave "${clave}" insertada en posición ${posicion} (${estructuraDatos.length}/${sbTamanoEstructura})`, 'success');
}

function buscarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    if (!sbInicializado) {
        mostrarMensajeSecuencial('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveSecuencial').value.trim();

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeSecuencial('La clave solo puede contener números', 'warning');
        return;
    }

    document.querySelectorAll('#visualizacionSecuencial .clave-row').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando');
    });

    // Only scan occupied rows
    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-row:not([data-empty]):not(.hash-ellipsis)');

    if (boxes.length === 0) {
        mostrarMensajeSecuencial('La estructura está vacía', 'warning');
        return;
    }

    animacionEnCurso = true;
    let encontrado = false;
    let terminado = false;
    let pasos = 0;

    // Animación de búsqueda secuencial (con parada anticipada en estructura ordenada)
    for (let index = 0; index < boxes.length; index++) {
        const timeout = setTimeout(() => {
            if (encontrado || terminado) return;

            pasos++;
            const box = boxes[index];

            if (index > 0) {
                boxes[index - 1].classList.remove('clave-buscando');
            }

            box.classList.add('clave-buscando');

            const valorBox = box.querySelector('.clave-valor-vertical').textContent;
            const comparacion = compararAlfanumerico(valorBox, claveValor);

            if (comparacion === 0) {
                // Encontrada
                encontrado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    box.classList.add('clave-encontrada');
                    mostrarMensajeSecuencial(`Clave "${claveValor}" encontrada en posición ${index + 1} (${pasos} pasos)`, 'success');
                    animacionEnCurso = false;
                }, 200);
            } else if (comparacion > 0) {
                // El valor actual es mayor → no puede estar más adelante (estructura ordenada)
                terminado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    mostrarMensajeSecuencial(`Clave "${claveValor}" no encontrada (${pasos} pasos)`, 'danger');
                    animacionEnCurso = false;
                }, 200);
            } else if (index === boxes.length - 1) {
                // Última posición sin encontrar
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    mostrarMensajeSecuencial(`Clave "${claveValor}" no encontrada (${pasos} pasos)`, 'danger');
                    animacionEnCurso = false;
                }, 200);
            }
        }, index * 300);

        timeouts.push(timeout);
    }
}

function eliminarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }
    limpiarResaltadosSecuencial();

    if (!sbInicializado) {
        mostrarMensajeSecuencial('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveSecuencial').value.trim();

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeSecuencial('La clave solo puede contener números', 'warning');
        return;
    }

    const indexEnDatos = estructuraDatos.indexOf(claveValor);
    const existeEnEstructura = indexEnDatos !== -1;

    if (existeEnEstructura) {
        if (!confirm(`¿Está seguro de eliminar la clave "${claveValor}"?`)) {
            return;
        }
    }

    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-row:not([data-empty]):not(.hash-ellipsis)');

    if (boxes.length === 0) {
        mostrarMensajeSecuencial('La estructura está vacía', 'warning');
        return;
    }

    const posicion = existeEnEstructura
        ? [...estructuraDatos].sort(compararAlfanumerico).indexOf(claveValor) + 1
        : -1;

    animacionEnCurso = true;
    let encontrado = false;
    let terminado = false;
    let pasos = 0;

    // Animación de búsqueda secuencial con parada anticipada (igual que buscar)
    for (let i = 0; i < boxes.length; i++) {
        const timeout = setTimeout(() => {
            if (encontrado || terminado) return;

            pasos++;
            const box = boxes[i];

            if (i > 0) {
                boxes[i - 1].classList.remove('clave-buscando');
            }
            box.classList.add('clave-buscando');

            const valorBox = box.querySelector('.clave-valor-vertical').textContent;
            const comparacion = compararAlfanumerico(valorBox, claveValor);

            if (comparacion === 0) {
                // Encontrada → eliminar
                encontrado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    box.classList.add('clave-eliminando');

                    setTimeout(() => {
                        estructuraDatos.splice(indexEnDatos, 1);
                        sincronizarVisualizaciones();
                        document.getElementById('claveSecuencial').value = '';
                        mostrarMensajeSecuencial(`Clave "${claveValor}" eliminada de posición ${posicion} (${pasos} pasos). ${estructuraDatos.length}/${sbTamanoEstructura}`, 'success');
                        animacionEnCurso = false;
                    }, 500);
                }, 200);
            } else if (comparacion > 0) {
                // El valor actual es mayor → no puede estar más adelante
                terminado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    mostrarMensajeSecuencial(`Clave "${claveValor}" no encontrada (${pasos} pasos)`, 'danger');
                    animacionEnCurso = false;
                }, 200);
            } else if (i === boxes.length - 1) {
                // Última posición sin encontrar
                terminado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    mostrarMensajeSecuencial(`Clave "${claveValor}" no encontrada (${pasos} pasos)`, 'danger');
                    animacionEnCurso = false;
                }, 200);
            }
        }, i * 300);

        timeouts.push(timeout);
    }
}

function limpiarSecuencial() {
    if (!sbInicializado) {
        mostrarMensajeSecuencial('Primero debe crear la estructura', 'warning');
        return;
    }
    if (!confirm('¿Está seguro de limpiar toda la estructura?')) {
        return;
    }

    limpiarTimeouts();
    estructuraDatos = [];
    sincronizarVisualizaciones();
    document.getElementById('claveSecuencial').value = '';
    mostrarMensajeSecuencial('Estructura limpiada correctamente', 'success');
}

function guardarSecuencial() {
    const datos = JSON.stringify({ tipo: 'secuencialBinaria', tamano: sbTamanoEstructura, digitos: sbTamanoDigitos, datos: estructuraDatos });
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estructura_busqueda.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeSecuencial('Estructura guardada correctamente', 'success');
}

function cargarSecuencial() {
    document.getElementById('fileInputSecuencial').click();
}

// ==================== BÚSQUEDA BINARIA ====================

function renderizarBinaria() {
    renderizarEstructura('Binaria');
}

function mostrarMensajeBinaria(mensaje, tipo) {
    mostrarMensaje('Binaria', mensaje, tipo);
}

function insertarBinaria() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    // Limpiar resaltados previos de binaria
    document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada', 'clave-eliminando', 'clave-insertando', 'clave-insertada', 'clave-moviendo');
    });

    if (!sbInicializado) {
        mostrarMensajeBinaria('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveInput = document.getElementById('claveBinaria');
    const claveValor = claveInput.value.trim();

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(claveValor, sbTamanoDigitos);
    if (!validacion.valido) {
        mostrarMensajeBinaria(validacion.mensaje, 'warning');
        return;
    }

    const clave = validacion.clave;

    if (estructuraDatos.includes(clave)) {
        mostrarMensajeBinaria('La clave ya existe en la estructura', 'warning');
        return;
    }

    if (estructuraDatos.length >= sbTamanoEstructura) {
        mostrarMensajeBinaria(`La estructura está llena (${sbTamanoEstructura}/${sbTamanoEstructura})`, 'danger');
        return;
    }

    estructuraDatos.push(clave);
    claveInput.value = '';

    renderizarConAnimacion('Binaria', clave, true);
    renderizarEstructura('Secuencial');

    const posicion = [...estructuraDatos].sort(compararAlfanumerico).indexOf(clave) + 1;
    mostrarMensajeBinaria(`Clave "${clave}" insertada en posición ${posicion} (${estructuraDatos.length}/${sbTamanoEstructura})`, 'success');
}

function buscarBinaria() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    if (!sbInicializado) {
        mostrarMensajeBinaria('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveBinaria').value.trim();

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeBinaria('La clave solo puede contener números', 'warning');
        return;
    }

    document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada', 'clave-eliminando', 'clave-insertando', 'clave-insertada');
    });

    const arr = [...estructuraDatos].sort(compararAlfanumerico);

    if (arr.length === 0) {
        mostrarMensajeBinaria('La estructura está vacía', 'warning');
        return;
    }

    let izq = 0;
    let der = arr.length - 1;
    let pasos = [];

    while (izq <= der) {
        const mid = Math.floor((izq + der) / 2);
        pasos.push({ mid, izq, der, valor: arr[mid] });

        const comparacion = compararAlfanumerico(arr[mid], claveValor);
        if (comparacion === 0) {
            pasos[pasos.length - 1].encontrado = true;
            break;
        } else if (comparacion < 0) {
            izq = mid + 1;
        } else {
            der = mid - 1;
        }
    }

    // Only target occupied boxes (not empty ones) - use data-index to find them
    const allBoxes = document.querySelectorAll('#visualizacionBinaria .clave-box[data-index]');
    animacionEnCurso = true;

    // Build a map from data-index to DOM element
    const boxByIndex = {};
    allBoxes.forEach(box => {
        const di = parseInt(box.getAttribute('data-index'));
        boxByIndex[di] = box;
    });

    pasos.forEach((paso, i) => {
        const timeout = setTimeout(() => {
            // Clear previous buscando and mark descartados
            allBoxes.forEach(box => {
                const di = parseInt(box.getAttribute('data-index'));
                box.classList.remove('clave-buscando');
                if (di < arr.length) {
                    if (di < paso.izq || di > paso.der) {
                        box.classList.add('clave-descartada');
                    }
                }
            });
            const midBox = boxByIndex[paso.mid];
            if (midBox) midBox.classList.add('clave-buscando');

            if (paso.encontrado) {
                setTimeout(() => {
                    if (midBox) {
                        midBox.classList.remove('clave-buscando');
                        midBox.classList.add('clave-encontrada');
                    }
                    mostrarMensajeBinaria(`Clave "${claveValor}" encontrada en posición ${paso.mid + 1} (${i + 1} pasos)`, 'success');
                    animacionEnCurso = false;
                }, 300);
            } else if (i === pasos.length - 1) {
                setTimeout(() => {
                    if (midBox) midBox.classList.remove('clave-buscando');
                    mostrarMensajeBinaria(`Clave "${claveValor}" no encontrada (${pasos.length} pasos)`, 'danger');
                    animacionEnCurso = false;
                }, 300);
            }
        }, i * 600);

        timeouts.push(timeout);
    });
}

function eliminarBinaria() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    // Limpiar resaltados previos de binaria
    document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada', 'clave-eliminando', 'clave-insertando', 'clave-insertada');
    });

    if (!sbInicializado) {
        mostrarMensajeBinaria('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveValor = document.getElementById('claveBinaria').value.trim();

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeBinaria('La clave solo puede contener números', 'warning');
        return;
    }

    const index = estructuraDatos.indexOf(claveValor);
    if (index === -1) {
        mostrarMensajeBinaria(`Clave "${claveValor}" no encontrada`, 'danger');
        return;
    }

    if (!confirm(`¿Está seguro de eliminar la clave "${claveValor}"?`)) {
        return;
    }

    const arr = [...estructuraDatos].sort(compararAlfanumerico);
    const posicion = arr.indexOf(claveValor) + 1;

    let izq = 0;
    let der = arr.length - 1;
    let pasos = [];

    while (izq <= der) {
        const mid = Math.floor((izq + der) / 2);
        pasos.push({ mid, izq, der });

        const comparacion = compararAlfanumerico(arr[mid], claveValor);
        if (comparacion === 0) {
            pasos[pasos.length - 1].encontrado = true;
            break;
        } else if (comparacion < 0) {
            izq = mid + 1;
        } else {
            der = mid - 1;
        }
    }

    const allBoxes = document.querySelectorAll('#visualizacionBinaria .clave-box[data-index]');
    animacionEnCurso = true;

    const boxByIndex = {};
    allBoxes.forEach(box => {
        const di = parseInt(box.getAttribute('data-index'));
        boxByIndex[di] = box;
    });

    pasos.forEach((paso, i) => {
        const timeout = setTimeout(() => {
            allBoxes.forEach(box => {
                const di = parseInt(box.getAttribute('data-index'));
                box.classList.remove('clave-buscando');
                if (di < arr.length) {
                    if (di < paso.izq || di > paso.der) {
                        box.classList.add('clave-descartada');
                    }
                }
            });
            const midBox = boxByIndex[paso.mid];
            if (midBox) midBox.classList.add('clave-buscando');

            if (paso.encontrado) {
                setTimeout(() => {
                    if (midBox) {
                        midBox.classList.remove('clave-buscando');
                        midBox.classList.add('clave-eliminando');
                    }

                    setTimeout(() => {
                        estructuraDatos.splice(index, 1);
                        sincronizarVisualizaciones();
                        document.getElementById('claveBinaria').value = '';
                        mostrarMensajeBinaria(`Clave "${claveValor}" eliminada de posición ${posicion}. ${estructuraDatos.length}/${sbTamanoEstructura}`, 'success');
                        animacionEnCurso = false;
                    }, 500);
                }, 300);
            }
        }, i * 600);

        timeouts.push(timeout);
    });
}

function limpiarBinaria() {
    if (!sbInicializado) {
        mostrarMensajeBinaria('Primero debe crear la estructura', 'warning');
        return;
    }
    if (!confirm('¿Está seguro de limpiar toda la estructura?')) {
        return;
    }

    limpiarTimeouts();
    estructuraDatos = [];
    sincronizarVisualizaciones();
    document.getElementById('claveBinaria').value = '';
    mostrarMensajeBinaria('Estructura limpiada correctamente', 'success');
}

function guardarBinaria() {
    const datos = JSON.stringify({ tipo: 'secuencialBinaria', tamano: sbTamanoEstructura, digitos: sbTamanoDigitos, datos: estructuraDatos });
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'estructura_busqueda.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeBinaria('Estructura guardada correctamente', 'success');
}

function cargarBinaria() {
    document.getElementById('fileInputBinaria').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('fileInputSecuencial').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const datos = JSON.parse(e.target.result);
                    if (datos.tipo === 'secuencialBinaria') {
                        sbTamanoEstructura = datos.tamano;
                        sbTamanoDigitos = datos.digitos;
                        estructuraDatos = datos.datos;
                        sbInicializado = true;
                        document.getElementById('tamanoEstructuraSecuencial').value = sbTamanoEstructura;
                        document.getElementById('tamanoSecuencial').value = sbTamanoDigitos;
                        document.getElementById('tamanoEstructuraBinaria').value = sbTamanoEstructura;
                        document.getElementById('tamanoBinaria').value = sbTamanoDigitos;
                    } else {
                        // Legacy format (plain array)
                        estructuraDatos = datos;
                        sbInicializado = true;
                    }
                    sincronizarVisualizaciones();
                    mostrarMensajeSecuencial('Estructura cargada correctamente', 'success');
                } catch (error) {
                    mostrarMensajeSecuencial('Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
        }
        this.value = '';
    });

    document.getElementById('fileInputBinaria').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const datos = JSON.parse(e.target.result);
                    if (datos.tipo === 'secuencialBinaria') {
                        sbTamanoEstructura = datos.tamano;
                        sbTamanoDigitos = datos.digitos;
                        estructuraDatos = datos.datos;
                        sbInicializado = true;
                        document.getElementById('tamanoEstructuraSecuencial').value = sbTamanoEstructura;
                        document.getElementById('tamanoSecuencial').value = sbTamanoDigitos;
                        document.getElementById('tamanoEstructuraBinaria').value = sbTamanoEstructura;
                        document.getElementById('tamanoBinaria').value = sbTamanoDigitos;
                    } else {
                        estructuraDatos = datos;
                        sbInicializado = true;
                    }
                    sincronizarVisualizaciones();
                    mostrarMensajeBinaria('Estructura cargada correctamente', 'success');
                } catch (error) {
                    mostrarMensajeBinaria('Error al cargar el archivo', 'danger');
                }
            };
            reader.readAsText(file);
        }
        this.value = '';
    });

    // Limpiar resaltados al cambiar de pestaña
    document.getElementById('tab-secuencial').addEventListener('hidden.bs.tab', function() {
        limpiarTimeouts();
        document.querySelectorAll('#visualizacionSecuencial .clave-row').forEach(el => {
            el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-eliminando');
        });
        ocultarMensaje('Secuencial');
    });

    document.getElementById('tab-binaria').addEventListener('hidden.bs.tab', function() {
        limpiarTimeouts();
        document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
            el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada', 'clave-eliminando');
        });
        ocultarMensaje('Binaria');
    });

    // Sincronizar al mostrar las pestañas
    document.getElementById('tab-secuencial').addEventListener('shown.bs.tab', function() {
        // Ocultar panel de bienvenida
        const panelBienvenida = document.getElementById('panel-bienvenida');
        if (panelBienvenida) panelBienvenida.style.display = 'none';

        renderizarSecuencial();
        ocultarMensaje('Secuencial');
    });

    document.getElementById('tab-binaria').addEventListener('shown.bs.tab', function() {
        // Ocultar panel de bienvenida
        const panelBienvenida = document.getElementById('panel-bienvenida');
        if (panelBienvenida) panelBienvenida.style.display = 'none';

        renderizarBinaria();
        ocultarMensaje('Binaria');
    });
});
