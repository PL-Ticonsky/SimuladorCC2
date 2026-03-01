/**
 * Simulador CC2 - Búsquedas Externas: Conversión de Base
 * Lógica: dígito_i × base^(n-1-i), luego tomar últimos dígitos según tamaño.
 * Colisiones: lista enlazada dinámica.
 */

// ==================== VARIABLES GLOBALES ====================
let conversionEstructura = [];    // Array de arrays (lista enlazada por posición)
let conversionTamano = 100;
let conversionBase = 7;
let conversionInicializada = false;
let animacionConversionEnCurso = false;
let timeoutsConversion = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsConversion() {
    timeoutsConversion.forEach(t => clearTimeout(t));
    timeoutsConversion = [];
    animacionConversionEnCurso = false;
}

function mostrarMensajeConversion(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeConversion');
    if (!alertDiv) return;
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

/**
 * Calcula la posición hash por conversión de base.
 * Para cada dígito d_i de la clave (de izquierda a derecha):
 *   resultado += d_i × base^(n-1-i)
 * Luego se toman los últimos dígitos según el tamaño de la estructura.
 */
function calcularHashConversion(claveStr, base, tamano) {
    let resultado = 0;
    const n = claveStr.length;
    for (let i = 0; i < n; i++) {
        const digito = parseInt(claveStr[i], 10);
        resultado += digito * Math.pow(base, n - 1 - i);
    }
    // Tomar los últimos dígitos según tamaño
    const posicion = resultado % tamano;
    return { posicion, resultado };
}

function generarDetalleConversion(claveStr, base, tamano) {
    const n = claveStr.length;
    let partes = [];
    let resultado = 0;
    for (let i = 0; i < n; i++) {
        const digito = parseInt(claveStr[i], 10);
        const valor = digito * Math.pow(base, n - 1 - i);
        partes.push(`${digito}×${base}<sup>${n - 1 - i}</sup>`);
        resultado += valor;
    }
    const posicion = resultado % tamano;
    const digitosTam = tamano.toString().length - 1;
    return {
        formula: partes.join(' + '),
        resultado,
        posicion,
        detalle: `H(${claveStr}) = ${partes.join(' + ')} = ${resultado} → últimos ${digitosTam > 0 ? digitosTam : 1} dígito(s) → posición <strong>${posicion + 1}</strong>`
    };
}

// ==================== CREAR ESTRUCTURA ====================

function crearEstructuraConversion() {
    limpiarTimeoutsConversion();

    const tamano = parseInt(document.getElementById('tamanoEstructuraConversion').value) || 100;
    const base = parseInt(document.getElementById('baseConversion').value) || 7;

    if (tamano < 5 || tamano > 10000) {
        mostrarMensajeConversion('El tamaño debe estar entre 5 y 10000', 'warning');
        return;
    }
    if (base < 2 || base > 36) {
        mostrarMensajeConversion('La base debe estar entre 2 y 36', 'warning');
        return;
    }

    conversionTamano = tamano;
    conversionBase = base;
    conversionEstructura = [];
    for (let i = 0; i < tamano; i++) {
        conversionEstructura[i] = [];
    }
    conversionInicializada = true;

    document.getElementById('conversionControles').classList.remove('d-none');

    const desc = document.getElementById('descripcionConversion');
    desc.innerHTML = `<strong>Conversión de Base ${base}:</strong> Para cada dígito <code>d<sub>i</sub></code> de la clave, se calcula <code>Σ d<sub>i</sub> × ${base}<sup>n-1-i</sup></code>. Del resultado se toman los últimos dígitos según el tamaño de la estructura (<code>${tamano}</code>). Las colisiones se manejan de forma dinámica.`;

    renderizarConversion();
    mostrarMensajeConversion(`Estructura creada con tamaño ${tamano} y base ${base}`, 'success');
}

// ==================== RENDERIZADO ====================

function renderizarConversion() {
    const container = document.getElementById('visualizacionConversion');
    if (!container) return;

    if (!conversionInicializada || conversionEstructura.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    let html = '<div class="lista-enlazada-vertical">';

    const primerIndice = 0;
    const ultimoIndice = conversionEstructura.length - 1;
    const indicesConDatos = [];

    for (let i = 0; i < conversionEstructura.length; i++) {
        if (conversionEstructura[i].length > 0) {
            indicesConDatos.push(i);
        }
    }

    const indicesMostrar = new Set([primerIndice, ultimoIndice, ...indicesConDatos]);
    const indicesOrdenados = Array.from(indicesMostrar).sort((a, b) => a - b);
    const hayDatos = indicesConDatos.length > 0;

    for (let j = 0; j < indicesOrdenados.length; j++) {
        const i = indicesOrdenados[j];
        const lista = conversionEstructura[i];

        if (j > 0) {
            const indiceAnterior = indicesOrdenados[j - 1];
            if (i - indiceAnterior > 1 && !hayDatos) {
                html += `<div class="lista-fila-vertical lista-ellipsis">
                            <div class="lista-celda-principal">
                                <span class="lista-valor-principal text-muted">...</span>
                            </div>
                         </div>`;
            }
        }

        html += `<div class="lista-fila-vertical" data-index="${i}">`;
        html += `<div class="lista-celda-principal">
                    <span class="clave-index-left">${i + 1}</span>
                    <span class="lista-valor-principal">${lista.length > 0 ? lista[0] : ''}</span>
                 </div>`;

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

    const totalElementos = conversionEstructura.reduce((acc, l) => acc + l.length, 0);
    html += `<div class="mt-2 text-muted small">Posiciones: ${conversionEstructura.length} | Total elementos: ${totalElementos}</div>`;

    container.innerHTML = html;
}

// ==================== INSERTAR ====================

function insertarConversion() {
    if (animacionConversionEnCurso) limpiarTimeoutsConversion();

    if (!conversionInicializada) {
        mostrarMensajeConversion('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveInput = document.getElementById('claveConversion');
    const claveStr = claveInput.value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeConversion('Ingrese una clave numérica válida', 'warning');
        return;
    }

    // Verificar que no exista ya
    for (const lista of conversionEstructura) {
        if (lista.includes(claveStr)) {
            mostrarMensajeConversion(`La clave "${claveStr}" ya existe en la estructura`, 'warning');
            return;
        }
    }

    const { posicion, resultado } = calcularHashConversion(claveStr, conversionBase, conversionTamano);
    const detalle = generarDetalleConversion(claveStr, conversionBase, conversionTamano);

    conversionEstructura[posicion].push(claveStr);
    claveInput.value = '';
    renderizarConversion();

    // Animación: resaltar la fila insertada
    animacionConversionEnCurso = true;
    const delay = 300;

    timeoutsConversion.push(setTimeout(() => {
        const fila = document.querySelector(`#visualizacionConversion .lista-fila-vertical[data-index="${posicion}"]`);
        if (fila) {
            const celda = fila.querySelector('.lista-celda-principal');
            if (celda) celda.classList.add('lista-buscando');

            // Si es colisión (hay más de 1), resaltar el nodo externo
            const lista = conversionEstructura[posicion];
            if (lista.length > 1) {
                const nodos = fila.querySelectorAll('.lista-nodo-externo');
                const ultimo = nodos[nodos.length - 1];
                if (ultimo) ultimo.classList.add('lista-buscando');
            }

            timeoutsConversion.push(setTimeout(() => {
                if (celda) {
                    celda.classList.remove('lista-buscando');
                    celda.classList.add('lista-insertada');
                }
                if (lista.length > 1) {
                    const nodos = fila.querySelectorAll('.lista-nodo-externo');
                    const ultimo = nodos[nodos.length - 1];
                    if (ultimo) {
                        ultimo.classList.remove('lista-buscando');
                        ultimo.classList.add('lista-insertada');
                    }
                }

                const colisionMsg = lista.length > 1 ? ` (colisión #${lista.length - 1} resuelta por lista enlazada)` : '';
                mostrarMensajeConversion(
                    `${detalle.detalle}<br>Clave <strong>"${claveStr}"</strong> insertada en posición ${posicion + 1}${colisionMsg}`,
                    'success'
                );

                timeoutsConversion.push(setTimeout(() => {
                    if (celda) celda.classList.remove('lista-insertada');
                    const nodos = fila.querySelectorAll('.lista-nodo-externo');
                    nodos.forEach(n => n.classList.remove('lista-insertada'));
                    animacionConversionEnCurso = false;
                }, 1000));
            }, delay));
        } else {
            animacionConversionEnCurso = false;
        }
    }, 100));
}

// ==================== BUSCAR ====================

function buscarConversion() {
    if (animacionConversionEnCurso) limpiarTimeoutsConversion();

    if (!conversionInicializada) {
        mostrarMensajeConversion('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveStr = document.getElementById('claveConversion').value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeConversion('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const { posicion } = calcularHashConversion(claveStr, conversionBase, conversionTamano);
    const detalle = generarDetalleConversion(claveStr, conversionBase, conversionTamano);
    const lista = conversionEstructura[posicion];

    renderizarConversion();
    animacionConversionEnCurso = true;
    const delay = 400;

    // Paso 1: resaltar la posición hash
    timeoutsConversion.push(setTimeout(() => {
        const fila = document.querySelector(`#visualizacionConversion .lista-fila-vertical[data-index="${posicion}"]`);
        if (!fila) {
            mostrarMensajeConversion(`Clave <strong>"${claveStr}"</strong> no encontrada`, 'danger');
            animacionConversionEnCurso = false;
            return;
        }

        const celda = fila.querySelector('.lista-celda-principal');
        if (celda) celda.classList.add('lista-buscando');

        // Buscar secuencialmente en la lista enlazada
        let encontrado = false;
        let pasos = 0;

        const buscarEnLista = (idx) => {
            if (idx >= lista.length) {
                // No encontrado
                timeoutsConversion.push(setTimeout(() => {
                    if (celda) celda.classList.remove('lista-buscando');
                    mostrarMensajeConversion(
                        `${detalle.detalle}<br>Clave <strong>"${claveStr}"</strong> no encontrada en posición ${posicion + 1} (${pasos} pasos)`,
                        'danger'
                    );
                    animacionConversionEnCurso = false;
                }, delay));
                return;
            }

            pasos++;

            timeoutsConversion.push(setTimeout(() => {
                // Limpiar resaltados anteriores
                fila.querySelectorAll('.lista-nodo-externo').forEach(n => n.classList.remove('lista-buscando', 'lista-encontrada'));
                if (idx > 0 && celda) celda.classList.remove('lista-buscando');

                if (idx === 0) {
                    if (celda) celda.classList.add('lista-buscando');
                } else {
                    const nodos = fila.querySelectorAll('.lista-nodo-externo');
                    if (nodos[idx - 1]) nodos[idx - 1].classList.add('lista-buscando');
                }

                if (lista[idx] === claveStr) {
                    // Encontrado
                    encontrado = true;
                    timeoutsConversion.push(setTimeout(() => {
                        if (idx === 0) {
                            if (celda) {
                                celda.classList.remove('lista-buscando');
                                celda.classList.add('lista-encontrada');
                            }
                        } else {
                            const nodos = fila.querySelectorAll('.lista-nodo-externo');
                            if (nodos[idx - 1]) {
                                nodos[idx - 1].classList.remove('lista-buscando');
                                nodos[idx - 1].classList.add('lista-encontrada');
                            }
                        }
                        mostrarMensajeConversion(
                            `${detalle.detalle}<br>Clave <strong>"${claveStr}"</strong> encontrada en posición ${posicion + 1}, nodo ${idx + 1} (${pasos} pasos)`,
                            'success'
                        );
                        animacionConversionEnCurso = false;
                    }, delay));
                } else {
                    buscarEnLista(idx + 1);
                }
            }, delay));
        };

        buscarEnLista(0);
    }, 200));
}

// ==================== ELIMINAR ====================

function eliminarConversion() {
    if (animacionConversionEnCurso) limpiarTimeoutsConversion();

    if (!conversionInicializada) {
        mostrarMensajeConversion('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveStr = document.getElementById('claveConversion').value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeConversion('Ingrese una clave numérica válida', 'warning');
        return;
    }

    const { posicion } = calcularHashConversion(claveStr, conversionBase, conversionTamano);
    const detalle = generarDetalleConversion(claveStr, conversionBase, conversionTamano);
    const lista = conversionEstructura[posicion];
    const idxEnLista = lista.indexOf(claveStr);

    if (idxEnLista === -1) {
        mostrarMensajeConversion(`Clave <strong>"${claveStr}"</strong> no encontrada`, 'danger');
        return;
    }

    if (!confirm(`¿Está seguro de eliminar la clave "${claveStr}"?`)) return;

    renderizarConversion();
    animacionConversionEnCurso = true;
    const delay = 400;

    // Animación: buscar y luego eliminar
    timeoutsConversion.push(setTimeout(() => {
        const fila = document.querySelector(`#visualizacionConversion .lista-fila-vertical[data-index="${posicion}"]`);
        if (!fila) {
            animacionConversionEnCurso = false;
            return;
        }

        let pasos = 0;
        const animarBusqueda = (idx) => {
            if (idx > idxEnLista) return;
            pasos++;

            timeoutsConversion.push(setTimeout(() => {
                // Limpiar anteriores
                const celda = fila.querySelector('.lista-celda-principal');
                const nodos = fila.querySelectorAll('.lista-nodo-externo');
                if (celda) celda.classList.remove('lista-buscando');
                nodos.forEach(n => n.classList.remove('lista-buscando'));

                if (idx === 0) {
                    if (celda) celda.classList.add('lista-buscando');
                } else {
                    if (nodos[idx - 1]) nodos[idx - 1].classList.add('lista-buscando');
                }

                if (idx === idxEnLista) {
                    // Encontrado, animación de eliminación
                    timeoutsConversion.push(setTimeout(() => {
                        if (idx === 0) {
                            if (celda) {
                                celda.classList.remove('lista-buscando');
                                celda.classList.add('lista-eliminando');
                            }
                        } else {
                            if (nodos[idx - 1]) {
                                nodos[idx - 1].classList.remove('lista-buscando');
                                nodos[idx - 1].classList.add('lista-eliminando');
                            }
                        }

                        timeoutsConversion.push(setTimeout(() => {
                            conversionEstructura[posicion].splice(idxEnLista, 1);
                            renderizarConversion();
                            document.getElementById('claveConversion').value = '';
                            mostrarMensajeConversion(
                                `${detalle.detalle}<br>Clave <strong>"${claveStr}"</strong> eliminada de posición ${posicion + 1} (${pasos} pasos)`,
                                'success'
                            );
                            animacionConversionEnCurso = false;
                        }, 500));
                    }, delay));
                } else {
                    animarBusqueda(idx + 1);
                }
            }, delay));
        };

        animarBusqueda(0);
    }, 200));
}

// ==================== LIMPIAR ====================

function limpiarConversion() {
    if (!confirm('¿Está seguro de limpiar toda la estructura?')) return;

    limpiarTimeoutsConversion();
    for (let i = 0; i < conversionEstructura.length; i++) {
        conversionEstructura[i] = [];
    }
    renderizarConversion();
    document.getElementById('claveConversion').value = '';
    mostrarMensajeConversion('Estructura limpiada correctamente', 'success');
}

// ==================== GUARDAR / CARGAR ====================

function guardarConversion() {
    const datos = JSON.stringify({
        tipo: 'conversion',
        tamano: conversionTamano,
        base: conversionBase,
        estructura: conversionEstructura
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversion_base.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeConversion('Estructura guardada correctamente', 'success');
}

function cargarConversion() {
    document.getElementById('fileInputConversion').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar archivo
    document.getElementById('fileInputConversion').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const datos = JSON.parse(ev.target.result);
                if (datos.tipo !== 'conversion') throw new Error('Formato inválido');
                conversionTamano = datos.tamano;
                conversionBase = datos.base;
                conversionEstructura = datos.estructura;
                conversionInicializada = true;

                document.getElementById('tamanoEstructuraConversion').value = conversionTamano;
                document.getElementById('baseConversion').value = conversionBase;
                document.getElementById('conversionControles').classList.remove('d-none');

                const desc = document.getElementById('descripcionConversion');
                desc.innerHTML = `<strong>Conversión de Base ${conversionBase}:</strong> Estructura cargada.`;

                renderizarConversion();
                mostrarMensajeConversion('Estructura cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeConversion('Error al cargar el archivo: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // Ocultar bienvenida al cambiar tab
    const tabs = document.querySelectorAll('#busquedasExtTabs button[data-bs-toggle="pill"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function() {
            const bienvenida = document.getElementById('panel-bienvenida-ext');
            if (bienvenida) bienvenida.style.display = 'none';
        });
    });
});
