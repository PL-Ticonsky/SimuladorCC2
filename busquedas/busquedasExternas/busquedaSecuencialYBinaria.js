/**
 * Simulador CC2 - Busqueda Secuencial y Binaria Externa por Bloques
 * Estado compartido entre ambas pestañas (como en internas).
 */

let sbxDatos = [];
let sbxCantidadMax = 27;
let sbxTamanoBloque = 5;
let sbxCantidadBloques = 6;
let sbxDigitosClave = 3;
let sbxInicializado = false;
let sbxAnimando = false;
let sbxTimeouts = [];

function limpiarTimeoutsSBExterna() {
    sbxTimeouts.forEach(function (t) { clearTimeout(t); });
    sbxTimeouts = [];
    sbxAnimando = false;
}

function compararSBExterna(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function mostrarMensajeSBExterna(tipo, mensaje, clase) {
    const id = tipo === 'Secuencial' ? 'mensajeBloquesSecuencial' : 'mensajeBloquesBinaria';
    const alertDiv = document.getElementById(id);
    if (!alertDiv) return;
    alertDiv.className = 'alert alert-' + clase;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function sincronizarCamposConfiguracionSBExterna(cantidad, digitos) {
    const idsCantidad = ['cantidadDatosBloquesSecuencial', 'cantidadDatosBloquesBinaria'];
    const idsDigitos = ['digitosBloquesSecuencial', 'digitosBloquesBinaria'];

    idsCantidad.forEach(function (id) {
        const input = document.getElementById(id);
        if (input) input.value = cantidad;
    });

    idsDigitos.forEach(function (id) {
        const input = document.getElementById(id);
        if (input) input.value = digitos;
    });
}

function obtenerArregloSBExterna() {
    const datos = sbxDatos.slice().sort(compararSBExterna);
    const arreglo = new Array(sbxCantidadMax).fill(null);
    for (let i = 0; i < datos.length; i++) arreglo[i] = datos[i];
    return arreglo;
}

function renderizarSBExterna(tipo) {
    const containerId = tipo === 'Secuencial' ? 'visualizacionBloquesSecuencial' : 'visualizacionBloquesBinaria';
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!sbxInicializado) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    const arreglo = obtenerArregloSBExterna();
    let html = '<div class="bloques-grid">';

    for (let b = 0; b < sbxCantidadBloques; b++) {
        html += '<div class="bloque-card" data-bloque="' + b + '">';
        html += '<div class="bloque-header">Bloque ' + (b + 1) + '</div>';
        html += '<div class="bloque-body">';

        for (let i = 0; i < sbxTamanoBloque; i++) {
            const globalIdx = b * sbxTamanoBloque + i;
            const utilizable = globalIdx < sbxCantidadMax;
            const valor = utilizable ? arreglo[globalIdx] : null;
            const vacio = valor === null;

            html += '<div class="bloque-celda ' + (vacio ? 'bloque-vacio ' : '') + (!utilizable ? 'bloque-no-utilizable' : '') + '" data-global="' + globalIdx + '">';
            html += '<span class="bloque-celda-index">' + (globalIdx + 1) + '</span>';
            html += '<span class="bloque-celda-valor">' + (utilizable && !vacio ? valor : '') + '</span>';
            html += '</div>';
        }

        html += '</div></div>';
    }

    html += '</div>';
    html += '<div class="mt-2 text-muted small">Elementos: ' + sbxDatos.length + '/' + sbxCantidadMax + ' | Bloques: ' + sbxCantidadBloques + ' x ' + sbxTamanoBloque + ' | Digitos: ' + sbxDigitosClave + '</div>';
    container.innerHTML = html;
}

function renderizarAmbasSBExterna() {
    renderizarSBExterna('Secuencial');
    renderizarSBExterna('Binaria');
}

function validarClaveSBExterna(tipo) {
    const inputId = tipo === 'Secuencial' ? 'claveBloquesSecuencial' : 'claveBloquesBinaria';
    const clave = (document.getElementById(inputId).value || '').trim();

    if (!clave || !/^[0-9]+$/.test(clave)) {
        return { valido: false, mensaje: 'Ingrese una clave numerica valida' };
    }
    if (clave.length !== sbxDigitosClave) {
        return { valido: false, mensaje: 'La clave debe tener exactamente ' + sbxDigitosClave + ' digitos' };
    }

    return { valido: true, clave: clave };
}

function limpiarInputClaveSBExterna(tipo) {
    const inputId = tipo === 'Secuencial' ? 'claveBloquesSecuencial' : 'claveBloquesBinaria';
    const input = document.getElementById(inputId);
    if (input) input.value = '';
}

function animarRutaSBExterna(tipo, ruta, clasePaso, callback) {
    const containerId = tipo === 'Secuencial' ? '#visualizacionBloquesSecuencial' : '#visualizacionBloquesBinaria';
    const delay = 380;
    let t = 0;

    ruta.forEach(function (idx, pos) {
        sbxTimeouts.push(setTimeout(function () {
            if (pos > 0) {
                const prev = document.querySelector(containerId + ' .bloque-celda[data-global="' + ruta[pos - 1] + '"]');
                if (prev) prev.classList.remove(clasePaso);
            }
            const celda = document.querySelector(containerId + ' .bloque-celda[data-global="' + idx + '"]');
            if (celda) celda.classList.add(clasePaso);
        }, t));
        t += delay;
    });

    sbxTimeouts.push(setTimeout(function () {
        if (ruta.length > 0) {
            const ultima = document.querySelector(containerId + ' .bloque-celda[data-global="' + ruta[ruta.length - 1] + '"]');
            if (ultima) ultima.classList.remove(clasePaso);
        }
        if (typeof callback === 'function') callback();
    }, t));
}

function resolverSecuencialPorBloques(clave) {
    const datos = sbxDatos.slice().sort(compararSBExterna);
    const rutaComparacion = [];
    const rutaRecorrido = [];

    for (let b = 0; b < sbxCantidadBloques; b++) {
        const inicio = b * sbxTamanoBloque;
        if (inicio >= datos.length) {
            return {
                encontrado: false,
                indice: -1,
                rutaComparacion: rutaComparacion,
                rutaRecorrido: rutaRecorrido,
                pasos: rutaComparacion.length + rutaRecorrido.length
            };
        }

        const fin = Math.min(inicio + sbxTamanoBloque, datos.length) - 1;
        const ultimo = datos[fin];

        rutaComparacion.push(fin);

        if (compararSBExterna(clave, ultimo) <= 0) {
            for (let i = inicio; i <= fin; i++) {
                rutaRecorrido.push(i);

                const cmp = compararSBExterna(datos[i], clave);
                if (cmp === 0) {
                    return {
                        encontrado: true,
                        indice: i,
                        rutaComparacion: rutaComparacion,
                        rutaRecorrido: rutaRecorrido,
                        pasos: rutaComparacion.length + rutaRecorrido.length
                    };
                }
                if (cmp > 0) {
                    return {
                        encontrado: false,
                        indice: -1,
                        rutaComparacion: rutaComparacion,
                        rutaRecorrido: rutaRecorrido,
                        pasos: rutaComparacion.length + rutaRecorrido.length
                    };
                }
            }

            return {
                encontrado: false,
                indice: -1,
                rutaComparacion: rutaComparacion,
                rutaRecorrido: rutaRecorrido,
                pasos: rutaComparacion.length + rutaRecorrido.length
            };
        }
    }

    return {
        encontrado: false,
        indice: -1,
        rutaComparacion: rutaComparacion,
        rutaRecorrido: rutaRecorrido,
        pasos: rutaComparacion.length + rutaRecorrido.length
    };
}

function animarSecuencialPorBloquesExterna(tipo, resultado, callback) {
    animarRutaSBExterna(tipo, resultado.rutaComparacion || [], 'celda-ultimo-comparando', function () {
        animarRutaSBExterna(tipo, resultado.rutaRecorrido || [], 'celda-buscando', callback);
    });
}

function resolverBinaria(clave) {
    const datos = sbxDatos.slice().sort(compararSBExterna);
    const ruta = [];
    let izq = 0;
    let der = datos.length - 1;

    while (izq <= der) {
        // En rangos pares se fuerza la mitad izquierda (misma convención que internas).
        const medio = izq + Math.floor((der - izq) / 2);
        ruta.push(medio);

        const cmp = compararSBExterna(datos[medio], clave);
        if (cmp === 0) {
            return { encontrado: true, indice: medio, ruta: ruta, pasos: ruta.length };
        }
        if (cmp < 0) {
            izq = medio + 1;
        } else {
            der = medio - 1;
        }
    }

    return { encontrado: false, indice: -1, ruta: ruta, pasos: ruta.length };
}

function crearEstructuraCompartidaSBExterna(origenTipo) {
    limpiarTimeoutsSBExterna();

    const pref = origenTipo === 'Secuencial' ? 'Secuencial' : 'Binaria';
    const cantidad = parseInt(document.getElementById('cantidadDatosBloques' + pref).value, 10) || 27;
    const digitos = parseInt(document.getElementById('digitosBloques' + pref).value, 10) || 3;

    if (cantidad < 4 || cantidad > 10000) {
        mostrarMensajeSBExterna(origenTipo, 'La cantidad debe estar entre 4 y 10000', 'warning');
        return;
    }
    if (digitos < 1 || digitos > 20) {
        mostrarMensajeSBExterna(origenTipo, 'La cantidad de digitos debe estar entre 1 y 20', 'warning');
        return;
    }

    sbxCantidadMax = cantidad;
    sbxTamanoBloque = Math.max(1, Math.floor(Math.sqrt(cantidad)));
    sbxCantidadBloques = Math.ceil(cantidad / sbxTamanoBloque);
    sbxDigitosClave = digitos;
    sbxDatos = [];
    sbxInicializado = true;

    sincronizarCamposConfiguracionSBExterna(sbxCantidadMax, sbxDigitosClave);
    renderizarAmbasSBExterna();

    mostrarMensajeSBExterna('Secuencial', 'Estructura compartida creada: ' + sbxCantidadBloques + ' bloques de ' + sbxTamanoBloque, 'success');
    mostrarMensajeSBExterna('Binaria', 'Estructura compartida creada: ' + sbxCantidadBloques + ' bloques de ' + sbxTamanoBloque, 'success');
}

function insertarCompartidoSBExterna(tipo) {
    if (sbxAnimando) limpiarTimeoutsSBExterna();
    if (!sbxInicializado) {
        mostrarMensajeSBExterna(tipo, 'Primero debe crear la estructura', 'warning');
        return;
    }

    const valid = validarClaveSBExterna(tipo);
    if (!valid.valido) {
        mostrarMensajeSBExterna(tipo, valid.mensaje, 'warning');
        return;
    }

    const clave = valid.clave;
    if (sbxDatos.indexOf(clave) !== -1) {
        mostrarMensajeSBExterna(tipo, 'La clave "' + clave + '" ya existe en la estructura', 'warning');
        return;
    }
    if (sbxDatos.length >= sbxCantidadMax) {
        mostrarMensajeSBExterna(tipo, 'La estructura esta llena', 'danger');
        return;
    }

    sbxDatos.push(clave);
    sbxDatos.sort(compararSBExterna);
    const indice = sbxDatos.indexOf(clave);

    limpiarInputClaveSBExterna(tipo);
    renderizarAmbasSBExterna();

    sbxAnimando = true;
    const containerId = tipo === 'Secuencial' ? '#visualizacionBloquesSecuencial' : '#visualizacionBloquesBinaria';
    const celda = document.querySelector(containerId + ' .bloque-celda[data-global="' + indice + '"]');
    if (!celda) {
        sbxAnimando = false;
        return;
    }

    celda.classList.add('celda-insertando');
    sbxTimeouts.push(setTimeout(function () {
        celda.classList.remove('celda-insertando');
        celda.classList.add('celda-insertada');
        mostrarMensajeSBExterna(tipo, 'Clave <strong>"' + clave + '"</strong> insertada en posicion ' + (indice + 1), 'success');
        sbxTimeouts.push(setTimeout(function () {
            celda.classList.remove('celda-insertada');
            sbxAnimando = false;
        }, 900));
    }, 420));
}

function buscarCompartidoSBExterna(tipo) {
    if (sbxAnimando) limpiarTimeoutsSBExterna();
    if (!sbxInicializado) {
        mostrarMensajeSBExterna(tipo, 'Primero debe crear la estructura', 'warning');
        return;
    }

    const valid = validarClaveSBExterna(tipo);
    if (!valid.valido) {
        mostrarMensajeSBExterna(tipo, valid.mensaje, 'warning');
        return;
    }

    if (sbxDatos.length === 0) {
        mostrarMensajeSBExterna(tipo, 'La estructura esta vacia', 'warning');
        return;
    }

    const clave = valid.clave;
    renderizarSBExterna(tipo);
    sbxAnimando = true;

    const resultado = tipo === 'Secuencial' ? resolverSecuencialPorBloques(clave) : resolverBinaria(clave);
    const ejecutarAnimacion = tipo === 'Secuencial'
        ? function (cb) { animarSecuencialPorBloquesExterna(tipo, resultado, cb); }
        : function (cb) { animarRutaSBExterna(tipo, resultado.ruta, 'celda-buscando', cb); };

    ejecutarAnimacion(function () {
        const containerId = tipo === 'Secuencial' ? '#visualizacionBloquesSecuencial' : '#visualizacionBloquesBinaria';
        if (resultado.encontrado) {
            const celda = document.querySelector(containerId + ' .bloque-celda[data-global="' + resultado.indice + '"]');
            if (celda) celda.classList.add('celda-encontrada');
            mostrarMensajeSBExterna(tipo, 'Clave <strong>"' + clave + '"</strong> encontrada en ' + resultado.pasos + ' pasos', 'success');
        } else {
            mostrarMensajeSBExterna(tipo, 'Clave <strong>"' + clave + '"</strong> no encontrada (' + resultado.pasos + ' pasos)', 'danger');
        }
        sbxAnimando = false;
    });
}

function eliminarCompartidoSBExterna(tipo) {
    if (sbxAnimando) limpiarTimeoutsSBExterna();
    if (!sbxInicializado) {
        mostrarMensajeSBExterna(tipo, 'Primero debe crear la estructura', 'warning');
        return;
    }

    const valid = validarClaveSBExterna(tipo);
    if (!valid.valido) {
        mostrarMensajeSBExterna(tipo, valid.mensaje, 'warning');
        return;
    }

    const clave = valid.clave;
    if (!confirm('Esta seguro de eliminar la clave "' + clave + '"?')) return;

    if (sbxDatos.length === 0) {
        mostrarMensajeSBExterna(tipo, 'La estructura esta vacia', 'warning');
        return;
    }

    renderizarSBExterna(tipo);
    sbxAnimando = true;

    const resultado = tipo === 'Secuencial' ? resolverSecuencialPorBloques(clave) : resolverBinaria(clave);
    const ejecutarAnimacion = tipo === 'Secuencial'
        ? function (cb) { animarSecuencialPorBloquesExterna(tipo, resultado, cb); }
        : function (cb) { animarRutaSBExterna(tipo, resultado.ruta, 'celda-buscando', cb); };

    ejecutarAnimacion(function () {
        if (!resultado.encontrado) {
            mostrarMensajeSBExterna(tipo, 'Clave <strong>"' + clave + '"</strong> no encontrada para eliminar', 'danger');
            sbxAnimando = false;
            return;
        }

        const containerId = tipo === 'Secuencial' ? '#visualizacionBloquesSecuencial' : '#visualizacionBloquesBinaria';
        const celda = document.querySelector(containerId + ' .bloque-celda[data-global="' + resultado.indice + '"]');
        if (celda) celda.classList.add('celda-eliminando');

        sbxTimeouts.push(setTimeout(function () {
            const idx = sbxDatos.indexOf(clave);
            if (idx !== -1) sbxDatos.splice(idx, 1);
            limpiarInputClaveSBExterna(tipo);
            renderizarAmbasSBExterna();
            mostrarMensajeSBExterna(tipo, 'Clave <strong>"' + clave + '"</strong> eliminada correctamente', 'success');
            sbxAnimando = false;
        }, 520));
    });
}

function limpiarCompartidoSBExterna() {
    if (!confirm('Esta seguro de limpiar toda la estructura?')) return;

    limpiarTimeoutsSBExterna();
    sbxDatos = [];
    renderizarAmbasSBExterna();
    limpiarInputClaveSBExterna('Secuencial');
    limpiarInputClaveSBExterna('Binaria');
    mostrarMensajeSBExterna('Secuencial', 'Estructura limpiada correctamente', 'success');
    mostrarMensajeSBExterna('Binaria', 'Estructura limpiada correctamente', 'success');
}

function guardarCompartidoSBExterna(tipo) {
    const payload = {
        tipo: 'bloques_sb_externa',
        cantidadMax: sbxCantidadMax,
        tamanoBloque: sbxTamanoBloque,
        cantidadBloques: sbxCantidadBloques,
        digitosClave: sbxDigitosClave,
        datos: sbxDatos.slice().sort(compararSBExterna)
    };

    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bloques_secuencial_binaria_externa.json';
    a.click();
    URL.revokeObjectURL(url);

    mostrarMensajeSBExterna(tipo, 'Estructura compartida guardada correctamente', 'success');
}

function cargarCompartidoSBExterna(tipo) {
    const inputId = tipo === 'Secuencial' ? 'fileInputBloquesSecuencial' : 'fileInputBloquesBinaria';
    const input = document.getElementById(inputId);
    if (input) input.click();
}

function procesarCargaCompartidaSBExterna(texto, tipoMensaje) {
    const data = JSON.parse(texto);
    if (data.tipo !== 'bloques_sb_externa' && data.tipo !== 'bloques_secuencial_externa' && data.tipo !== 'bloques_binaria_externa') {
        throw new Error('Formato no compatible para secuencial/binaria externa');
    }

    sbxCantidadMax = data.cantidadMax;
    sbxTamanoBloque = data.tamanoBloque || Math.max(1, Math.floor(Math.sqrt(sbxCantidadMax)));
    sbxCantidadBloques = data.cantidadBloques || Math.ceil(sbxCantidadMax / sbxTamanoBloque);
    sbxDigitosClave = data.digitosClave || 3;
    sbxDatos = (data.datos || []).slice().sort(compararSBExterna);
    sbxInicializado = true;

    sincronizarCamposConfiguracionSBExterna(sbxCantidadMax, sbxDigitosClave);
    renderizarAmbasSBExterna();

    mostrarMensajeSBExterna('Secuencial', 'Estructura compartida cargada correctamente', 'success');
    mostrarMensajeSBExterna('Binaria', 'Estructura compartida cargada correctamente', 'success');
    mostrarMensajeSBExterna(tipoMensaje, 'Estructura compartida cargada correctamente', 'success');
}

function crearEstructuraSecuencialExterna() { crearEstructuraCompartidaSBExterna('Secuencial'); }
function crearEstructuraBinariaExterna() { crearEstructuraCompartidaSBExterna('Binaria'); }

function insertarSecuencialExterna() { insertarCompartidoSBExterna('Secuencial'); }
function insertarBinariaExterna() { insertarCompartidoSBExterna('Binaria'); }

function buscarSecuencialExterna() { buscarCompartidoSBExterna('Secuencial'); }
function buscarBinariaExterna() { buscarCompartidoSBExterna('Binaria'); }

function eliminarSecuencialExterna() { eliminarCompartidoSBExterna('Secuencial'); }
function eliminarBinariaExterna() { eliminarCompartidoSBExterna('Binaria'); }

function limpiarSecuencialExterna() { limpiarCompartidoSBExterna(); }
function limpiarBinariaExterna() { limpiarCompartidoSBExterna(); }

function guardarSecuencialExterna() { guardarCompartidoSBExterna('Secuencial'); }
function guardarBinariaExterna() { guardarCompartidoSBExterna('Binaria'); }

function cargarSecuencialExterna() { cargarCompartidoSBExterna('Secuencial'); }
function cargarBinariaExterna() { cargarCompartidoSBExterna('Binaria'); }

document.addEventListener('DOMContentLoaded', function () {
    const fileInputSec = document.getElementById('fileInputBloquesSecuencial');
    const fileInputBin = document.getElementById('fileInputBloquesBinaria');

    function enlazarInput(input, tipoMensaje) {
        if (!input) return;
        input.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    procesarCargaCompartidaSBExterna(ev.target.result, tipoMensaje);
                } catch (err) {
                    mostrarMensajeSBExterna(tipoMensaje, 'Error al cargar archivo: ' + err.message, 'danger');
                }
            };

            reader.readAsText(file);
            this.value = '';
        });
    }

    enlazarInput(fileInputSec, 'Secuencial');
    enlazarInput(fileInputBin, 'Binaria');

    const cantSec = document.getElementById('cantidadDatosBloquesSecuencial');
    const cantBin = document.getElementById('cantidadDatosBloquesBinaria');
    const digSec = document.getElementById('digitosBloquesSecuencial');
    const digBin = document.getElementById('digitosBloquesBinaria');

    if (cantSec && cantBin) {
        cantSec.addEventListener('input', function () { cantBin.value = cantSec.value; });
        cantBin.addEventListener('input', function () { cantSec.value = cantBin.value; });
    }
    if (digSec && digBin) {
        digSec.addEventListener('input', function () { digBin.value = digSec.value; });
        digBin.addEventListener('input', function () { digSec.value = digBin.value; });
    }
});


