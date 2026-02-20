/**
 * Simulador CC2 - Módulo de Búsquedas
 * Búsqueda Secuencial y Binaria
 * Soporta claves alfanuméricas
 */

// Estructura de datos compartida (ahora almacena strings)
let estructuraDatos = [];

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

function renderizarEstructura(tipo) {
    const container = document.getElementById(`visualizacion${tipo}`);

    if (estructuraDatos.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">La estructura está vacía</div>';
        return;
    }

    // Ordenar los datos alfanuméricamente
    let datosRender = [...estructuraDatos].sort(compararAlfanumerico);

    // Renderizado diferente para Secuencial (vertical) y Binaria (horizontal)
    if (tipo === 'Secuencial') {
        let html = '<div class="estructura-vertical">';
        datosRender.forEach((valor, index) => {
            html += `<div class="clave-row" data-index="${index}">
                        <span class="clave-index-left">${index + 1}</span>
                        <span class="clave-valor-vertical">${valor}</span>
                     </div>`;
        });
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length} (Estructura dinámica, ordenada)</div>`;
        container.innerHTML = html;
    } else {
        let html = '<div class="estructura-horizontal">';
        datosRender.forEach((valor, index) => {
            html += `<div class="clave-box" data-index="${index}">
                        <span class="clave-index">${index + 1}</span>
                        <span class="clave-valor">${valor}</span>
                     </div>`;
        });
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length} (Estructura dinámica, ordenada)</div>`;
        container.innerHTML = html;
    }
}

function renderizarConAnimacion(tipo, claveNueva, esInsercion) {
    const container = document.getElementById(`visualizacion${tipo}`);

    // Ordenar los datos alfanuméricamente
    let datosRender = [...estructuraDatos].sort(compararAlfanumerico);

    // Encontrar la posición de la clave nueva
    let posicionClave = datosRender.indexOf(claveNueva);

    if (tipo === 'Secuencial') {
        let html = '<div class="estructura-vertical">';
        datosRender.forEach((valor, index) => {
            const esNuevo = esInsercion && valor === claveNueva;
            html += `<div class="clave-row ${esNuevo ? 'clave-insertando' : ''}" data-index="${index}">
                        <span class="clave-index-left">${index + 1}</span>
                        <span class="clave-valor-vertical">${valor}</span>
                     </div>`;
        });
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length} (Estructura dinámica, ordenada)</div>`;
        container.innerHTML = html;
    } else {
        let html = '<div class="estructura-horizontal">';
        datosRender.forEach((valor, index) => {
            const esNuevo = esInsercion && valor === claveNueva;
            html += `<div class="clave-box ${esNuevo ? 'clave-insertando' : ''}" data-index="${index}">
                        <span class="clave-index">${index + 1}</span>
                        <span class="clave-valor">${valor}</span>
                     </div>`;
        });
        html += '</div>';
        html += `<div class="mt-2 text-muted small">Elementos: ${estructuraDatos.length} (Estructura dinámica, ordenada)</div>`;
        container.innerHTML = html;
    }

    // Animación de reordenamiento
    if (esInsercion) {
        const selector = tipo === 'Secuencial' ? '.clave-row' : '.clave-box';
        const boxes = container.querySelectorAll(selector);
        boxes.forEach((box, idx) => {
            if (idx >= posicionClave) {
                box.classList.add('clave-moviendo');
                setTimeout(() => {
                    box.classList.remove('clave-moviendo');
                }, 500);
            }
        });

        // Resaltar el insertado
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

    const claveInput = document.getElementById('claveSecuencial');
    const claveValor = claveInput.value.trim();
    const tamanoMax = parseInt(document.getElementById('tamanoSecuencial').value) || 3;

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(claveValor, tamanoMax);
    if (!validacion.valido) {
        mostrarMensajeSecuencial(validacion.mensaje, 'warning');
        return;
    }

    const clave = validacion.clave;

    if (estructuraDatos.includes(clave)) {
        mostrarMensajeSecuencial('La clave ya existe en la estructura', 'warning');
        return;
    }

    estructuraDatos.push(clave);
    claveInput.value = '';

    // Animación de inserción
    renderizarConAnimacion('Secuencial', clave, true);
    renderizarEstructura('Binaria');

    // Encontrar posición final
    const posicion = [...estructuraDatos].sort(compararAlfanumerico).indexOf(clave) + 1;
    mostrarMensajeSecuencial(`Clave "${clave}" insertada en posición ${posicion}`, 'success');
}

function buscarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    const claveValor = document.getElementById('claveSecuencial').value.trim();

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeSecuencial('La clave solo puede contener números', 'warning');
        return;
    }

    // Limpiar resaltados anteriores
    document.querySelectorAll('#visualizacionSecuencial .clave-row').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando');
    });

    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-row');

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

            // Quitar resaltado del anterior
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

    const claveValor = document.getElementById('claveSecuencial').value.trim();

    if (!claveValor) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeSecuencial('La clave solo puede contener números', 'warning');
        return;
    }

    const indexEnDatos = estructuraDatos.indexOf(claveValor);
    const existeEnEstructura = indexEnDatos !== -1;

    // Solo pedir confirmación si la clave existe
    if (existeEnEstructura) {
        if (!confirm(`¿Está seguro de eliminar la clave "${claveValor}"?`)) {
            return;
        }
    }


    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-row');

    if (boxes.length === 0) {
        mostrarMensajeSecuencial('La estructura está vacía', 'warning');
        return;
    }

    // Encontrar posición antes de eliminar (si existe)
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
                        mostrarMensajeSecuencial(`Clave "${claveValor}" eliminada de posición ${posicion} (${pasos} pasos)`, 'success');
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
    // Confirmación antes de limpiar
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
    const datos = JSON.stringify(estructuraDatos);
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

    const claveInput = document.getElementById('claveBinaria');
    const claveValor = claveInput.value.trim();
    const tamanoMax = parseInt(document.getElementById('tamanoBinaria').value) || 3;

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(claveValor, tamanoMax);
    if (!validacion.valido) {
        mostrarMensajeBinaria(validacion.mensaje, 'warning');
        return;
    }

    const clave = validacion.clave;

    if (estructuraDatos.includes(clave)) {
        mostrarMensajeBinaria('La clave ya existe en la estructura', 'warning');
        return;
    }

    estructuraDatos.push(clave);
    claveInput.value = '';

    // Animación de inserción
    renderizarConAnimacion('Binaria', clave, true);
    renderizarEstructura('Secuencial');

    // Encontrar posición final
    const posicion = [...estructuraDatos].sort(compararAlfanumerico).indexOf(clave) + 1;
    mostrarMensajeBinaria(`Clave "${clave}" insertada en posición ${posicion}`, 'success');
}

function buscarBinaria() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    const claveValor = document.getElementById('claveBinaria').value.trim();

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeBinaria('La clave solo puede contener números', 'warning');
        return;
    }

    // Limpiar resaltados anteriores
    document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada');
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

    const boxes = document.querySelectorAll('#visualizacionBinaria .clave-box');
    animacionEnCurso = true;

    pasos.forEach((paso, i) => {
        const timeout = setTimeout(() => {
            boxes.forEach((box, idx) => {
                box.classList.remove('clave-buscando');
                if (idx < paso.izq || idx > paso.der) {
                    box.classList.add('clave-descartada');
                }
            });
            boxes[paso.mid].classList.add('clave-buscando');

            if (paso.encontrado) {
                setTimeout(() => {
                    boxes[paso.mid].classList.remove('clave-buscando');
                    boxes[paso.mid].classList.add('clave-encontrada');
                    mostrarMensajeBinaria(`Clave "${claveValor}" encontrada en posición ${paso.mid + 1} (${i + 1} pasos)`, 'success');
                    animacionEnCurso = false;
                }, 300);
            } else if (i === pasos.length - 1) {
                setTimeout(() => {
                    boxes[paso.mid].classList.remove('clave-buscando');
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

    const claveValor = document.getElementById('claveBinaria').value.trim();

    if (!claveValor) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    // Validar que solo contenga números
    if (!/^[0-9]+$/.test(claveValor)) {
        mostrarMensajeBinaria('La clave solo puede contener números', 'warning');
        return;
    }

    const index = estructuraDatos.indexOf(claveValor);
    if (index === -1) {
        mostrarMensajeBinaria(`Clave "${claveValor}" no encontrada`, 'danger');
        return;
    }

    // Confirmación antes de eliminar
    if (!confirm(`¿Está seguro de eliminar la clave "${claveValor}"?`)) {
        return;
    }

    // Encontrar posición antes de eliminar
    const arr = [...estructuraDatos].sort(compararAlfanumerico);
    const posicion = arr.indexOf(claveValor) + 1;

    // Animación de búsqueda binaria antes de eliminar
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

    const boxes = document.querySelectorAll('#visualizacionBinaria .clave-box');
    animacionEnCurso = true;

    pasos.forEach((paso, i) => {
        const timeout = setTimeout(() => {
            boxes.forEach((box, idx) => {
                box.classList.remove('clave-buscando');
                if (idx < paso.izq || idx > paso.der) {
                    box.classList.add('clave-descartada');
                }
            });
            boxes[paso.mid].classList.add('clave-buscando');

            if (paso.encontrado) {
                setTimeout(() => {
                    boxes[paso.mid].classList.remove('clave-buscando');
                    boxes[paso.mid].classList.add('clave-eliminando');

                    setTimeout(() => {
                        estructuraDatos.splice(index, 1);
                        sincronizarVisualizaciones();
                        document.getElementById('claveBinaria').value = '';
                        mostrarMensajeBinaria(`Clave "${claveValor}" eliminada de posición ${posicion}`, 'success');
                        animacionEnCurso = false;
                    }, 500);
                }, 300);
            }
        }, i * 600);

        timeouts.push(timeout);
    });
}

function limpiarBinaria() {
    // Confirmación antes de limpiar
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
    const datos = JSON.stringify(estructuraDatos);
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
    // Listener para cargar archivo secuencial
    document.getElementById('fileInputSecuencial').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    estructuraDatos = JSON.parse(e.target.result);
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

    // Listener para cargar archivo binaria
    document.getElementById('fileInputBinaria').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    estructuraDatos = JSON.parse(e.target.result);
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
