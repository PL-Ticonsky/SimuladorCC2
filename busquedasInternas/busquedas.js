/**
 * Simulador CC2 - Módulo de Búsquedas
 * Búsqueda Secuencial y Binaria
 */

// Estructura de datos compartida
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

function renderizarEstructura(tipo) {
    const container = document.getElementById(`visualizacion${tipo}`);

    if (estructuraDatos.length === 0) {
        container.innerHTML = '<div class="text-muted text-center">La estructura está vacía</div>';
        return;
    }

    // Ordenar los datos para ambas búsquedas
    let datosRender = [...estructuraDatos].sort((a, b) => a - b);

    let html = '<div class="d-flex flex-wrap gap-2">';
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

function renderizarConAnimacion(tipo, claveNueva, esInsercion) {
    const container = document.getElementById(`visualizacion${tipo}`);

    // Ordenar los datos
    let datosRender = [...estructuraDatos].sort((a, b) => a - b);

    // Encontrar la posición de la clave nueva/eliminada
    let posicionClave = datosRender.indexOf(claveNueva);
    if (!esInsercion) {
        // Para eliminación, buscar donde estaba antes
        let datosAntes = [...estructuraDatos, claveNueva].sort((a, b) => a - b);
        posicionClave = datosAntes.indexOf(claveNueva);
    }

    let html = '<div class="d-flex flex-wrap gap-2">';
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

    // Animación de reordenamiento
    if (esInsercion) {
        const boxes = container.querySelectorAll('.clave-box');
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

function validarClave(valor, tamanoDigitos) {
    const claveStr = valor.toString();
    if (claveStr.length !== tamanoDigitos) {
        const min = Math.pow(10, tamanoDigitos - 1);
        const max = Math.pow(10, tamanoDigitos) - 1;
        return { valido: false, mensaje: `La clave debe tener exactamente ${tamanoDigitos} dígitos (${min} - ${max})` };
    }
    return { valido: true };
}

// ==================== BÚSQUEDA SECUENCIAL ====================

function renderizarSecuencial() {
    renderizarEstructura('Secuencial');
}

function mostrarMensajeSecuencial(mensaje, tipo) {
    mostrarMensaje('Secuencial', mensaje, tipo);
}

function insertarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    const claveInput = document.getElementById('claveSecuencial');
    const clave = parseInt(claveInput.value);
    const tamanoMax = parseInt(document.getElementById('tamanoSecuencial').value) || 2;

    if (isNaN(clave)) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(clave, tamanoMax);
    if (!validacion.valido) {
        mostrarMensajeSecuencial(validacion.mensaje, 'warning');
        return;
    }

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
    const posicion = [...estructuraDatos].sort((a, b) => a - b).indexOf(clave) + 1;
    mostrarMensajeSecuencial(`Clave ${clave} insertada en posición ${posicion}`, 'success');
}

function buscarSecuencial() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    const clave = parseInt(document.getElementById('claveSecuencial').value);

    if (isNaN(clave)) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    // Limpiar resaltados anteriores
    document.querySelectorAll('#visualizacionSecuencial .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando');
    });

    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-box');

    if (boxes.length === 0) {
        mostrarMensajeSecuencial('La estructura está vacía', 'warning');
        return;
    }

    animacionEnCurso = true;
    let encontrado = false;
    let pasos = 0;

    // Animación de búsqueda secuencial
    for (let index = 0; index < boxes.length; index++) {
        const timeout = setTimeout(() => {
            if (encontrado) return;

            pasos++;
            const box = boxes[index];

            // Quitar resaltado del anterior
            if (index > 0) {
                boxes[index - 1].classList.remove('clave-buscando');
            }

            box.classList.add('clave-buscando');

            const valorBox = parseInt(box.querySelector('.clave-valor').textContent);

            if (valorBox === clave) {
                encontrado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    box.classList.add('clave-encontrada');
                    mostrarMensajeSecuencial(`Clave ${clave} encontrada en posición ${index + 1} (${pasos} pasos)`, 'success');
                    animacionEnCurso = false;
                }, 200);
            } else if (index === boxes.length - 1) {
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    mostrarMensajeSecuencial(`Clave ${clave} no encontrada (${pasos} pasos)`, 'danger');
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

    const clave = parseInt(document.getElementById('claveSecuencial').value);

    if (isNaN(clave)) {
        mostrarMensajeSecuencial('Ingrese una clave válida', 'warning');
        return;
    }

    const index = estructuraDatos.indexOf(clave);
    if (index === -1) {
        mostrarMensajeSecuencial(`Clave ${clave} no encontrada`, 'danger');
        return;
    }

    // Encontrar posición antes de eliminar
    const posicion = [...estructuraDatos].sort((a, b) => a - b).indexOf(clave) + 1;

    // Animación de búsqueda antes de eliminar
    const boxes = document.querySelectorAll('#visualizacionSecuencial .clave-box');
    animacionEnCurso = true;
    let encontrado = false;

    for (let i = 0; i < boxes.length; i++) {
        const timeout = setTimeout(() => {
            if (encontrado) return;

            const box = boxes[i];
            if (i > 0) {
                boxes[i - 1].classList.remove('clave-buscando');
            }
            box.classList.add('clave-buscando');

            const valorBox = parseInt(box.querySelector('.clave-valor').textContent);

            if (valorBox === clave) {
                encontrado = true;
                setTimeout(() => {
                    box.classList.remove('clave-buscando');
                    box.classList.add('clave-eliminando');

                    setTimeout(() => {
                        estructuraDatos.splice(index, 1);
                        sincronizarVisualizaciones();
                        document.getElementById('claveSecuencial').value = '';
                        mostrarMensajeSecuencial(`Clave ${clave} eliminada de posición ${posicion}`, 'success');
                        animacionEnCurso = false;
                    }, 500);
                }, 200);
            }
        }, i * 300);

        timeouts.push(timeout);
    }
}

function limpiarSecuencial() {
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
    const clave = parseInt(claveInput.value);
    const tamanoMax = parseInt(document.getElementById('tamanoBinaria').value) || 2;

    if (isNaN(clave)) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    const validacion = validarClave(clave, tamanoMax);
    if (!validacion.valido) {
        mostrarMensajeBinaria(validacion.mensaje, 'warning');
        return;
    }

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
    const posicion = [...estructuraDatos].sort((a, b) => a - b).indexOf(clave) + 1;
    mostrarMensajeBinaria(`Clave ${clave} insertada en posición ${posicion}`, 'success');
}

function buscarBinaria() {
    if (animacionEnCurso) {
        limpiarTimeouts();
    }

    const clave = parseInt(document.getElementById('claveBinaria').value);

    if (isNaN(clave)) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    // Limpiar resaltados anteriores
    document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
        el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada');
    });

    const arr = [...estructuraDatos].sort((a, b) => a - b);

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

        if (arr[mid] === clave) {
            pasos[pasos.length - 1].encontrado = true;
            break;
        } else if (arr[mid] < clave) {
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
                    mostrarMensajeBinaria(`Clave ${clave} encontrada en posición ${paso.mid + 1} (${i + 1} pasos)`, 'success');
                    animacionEnCurso = false;
                }, 300);
            } else if (i === pasos.length - 1) {
                setTimeout(() => {
                    boxes[paso.mid].classList.remove('clave-buscando');
                    mostrarMensajeBinaria(`Clave ${clave} no encontrada (${pasos.length} pasos)`, 'danger');
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

    const clave = parseInt(document.getElementById('claveBinaria').value);

    if (isNaN(clave)) {
        mostrarMensajeBinaria('Ingrese una clave válida', 'warning');
        return;
    }

    const index = estructuraDatos.indexOf(clave);
    if (index === -1) {
        mostrarMensajeBinaria(`Clave ${clave} no encontrada`, 'danger');
        return;
    }

    // Encontrar posición antes de eliminar
    const arr = [...estructuraDatos].sort((a, b) => a - b);
    const posicion = arr.indexOf(clave) + 1;

    // Animación de búsqueda binaria antes de eliminar
    let izq = 0;
    let der = arr.length - 1;
    let pasos = [];

    while (izq <= der) {
        const mid = Math.floor((izq + der) / 2);
        pasos.push({ mid, izq, der });

        if (arr[mid] === clave) {
            pasos[pasos.length - 1].encontrado = true;
            break;
        } else if (arr[mid] < clave) {
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
                        mostrarMensajeBinaria(`Clave ${clave} eliminada de posición ${posicion}`, 'success');
                        animacionEnCurso = false;
                    }, 500);
                }, 300);
            }
        }, i * 600);

        timeouts.push(timeout);
    });
}

function limpiarBinaria() {
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

    // Limpiar resaltados al cerrar modal secuencial
    document.getElementById('modalSecuencial').addEventListener('hidden.bs.modal', function() {
        limpiarTimeouts();
        document.querySelectorAll('#visualizacionSecuencial .clave-box').forEach(el => {
            el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-eliminando');
        });
        ocultarMensaje('Secuencial');
    });

    // Limpiar resaltados al cerrar modal binaria
    document.getElementById('modalBinaria').addEventListener('hidden.bs.modal', function() {
        limpiarTimeouts();
        document.querySelectorAll('#visualizacionBinaria .clave-box').forEach(el => {
            el.classList.remove('clave-encontrada', 'clave-buscando', 'clave-descartada', 'clave-eliminando');
        });
        ocultarMensaje('Binaria');
    });

    // Sincronizar al abrir los modales
    document.getElementById('modalSecuencial').addEventListener('shown.bs.modal', function() {
        renderizarSecuencial();
        ocultarMensaje('Secuencial');
    });

    document.getElementById('modalBinaria').addEventListener('shown.bs.modal', function() {
        renderizarBinaria();
        ocultarMensaje('Binaria');
    });
});
