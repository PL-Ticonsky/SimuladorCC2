/**
 * Simulador CC2 - Búsquedas Externas: Bloques de Información
 * Estructura: datos ordenados divididos en bloques de tamaño √n.
 * Búsqueda: compara con el último de cada bloque, luego secuencial dentro del bloque.
 */

// ==================== VARIABLES GLOBALES ====================
let bloquesDatos = [];               // datos insertados (se auto-ordena)
let bloquesCantidadMax = 27;         // capacidad total
let bloquesTamanoBloque = 5;         // tamaño de cada bloque (floor(√n))
let bloquesCantidadBloques = 6;      // cantidad de bloques
let bloquesInicializado = false;
let animacionBloquesEnCurso = false;
let timeoutsBloques = [];

// ==================== UTILIDADES ====================

function limpiarTimeoutsBloques() {
    timeoutsBloques.forEach(t => clearTimeout(t));
    timeoutsBloques = [];
    animacionBloquesEnCurso = false;
}

function mostrarMensajeBloques(mensaje, tipo) {
    const alertDiv = document.getElementById('mensajeBloques');
    if (!alertDiv) return;
    alertDiv.className = `alert alert-${tipo}`;
    alertDiv.innerHTML = mensaje;
    alertDiv.classList.remove('d-none');
}

function compararNumerico(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// ==================== CREAR ESTRUCTURA ====================

function crearEstructuraBloques() {
    limpiarTimeoutsBloques();

    const cantidad = parseInt(document.getElementById('cantidadDatosBloques').value) || 27;

    if (cantidad < 4 || cantidad > 10000) {
        mostrarMensajeBloques('La cantidad debe estar entre 4 y 10000', 'warning');
        return;
    }

    bloquesCantidadMax = cantidad;
    bloquesTamanoBloque = Math.floor(Math.sqrt(cantidad));
    bloquesCantidadBloques = Math.ceil(cantidad / bloquesTamanoBloque);
    bloquesDatos = [];
    bloquesInicializado = true;

    document.getElementById('bloquesControles').classList.remove('d-none');

    const desc = document.getElementById('descripcionBloques');
    desc.innerHTML = `<strong>Bloques de Información:</strong> Capacidad total: <code>${cantidad}</code>. √${cantidad} ≈ ${Math.sqrt(cantidad).toFixed(2)} → tamaño de bloque: <code>${bloquesTamanoBloque}</code>. Se crean <code>${bloquesCantidadBloques}</code> bloques (${bloquesCantidadBloques} × ${bloquesTamanoBloque} = ${bloquesCantidadBloques * bloquesTamanoBloque} ≥ ${cantidad}). Datos insertados secuencialmente y auto-ordenados.`;

    renderizarBloques();
    mostrarMensajeBloques(`Estructura creada: ${bloquesCantidadBloques} bloques de ${bloquesTamanoBloque} posiciones (capacidad ${cantidad})`, 'success');
}

// ==================== RENDERIZADO ====================

function obtenerBloques() {
    const datosOrdenados = [...bloquesDatos].sort(compararNumerico);
    const bloques = [];
    for (let b = 0; b < bloquesCantidadBloques; b++) {
        const inicio = b * bloquesTamanoBloque;
        const bloque = [];
        for (let i = 0; i < bloquesTamanoBloque; i++) {
            const globalIdx = inicio + i;
            if (globalIdx < bloquesCantidadMax) {
                bloque.push(globalIdx < datosOrdenados.length ? datosOrdenados[globalIdx] : null);
            }
        }
        bloques.push(bloque);
    }
    return bloques;
}

function renderizarBloques() {
    const container = document.getElementById('visualizacionBloques');
    if (!container) return;

    if (!bloquesInicializado) {
        container.innerHTML = '<div class="text-muted text-center">Presione "Crear estructura" para inicializar</div>';
        return;
    }

    const bloques = obtenerBloques();

    let html = '<div class="bloques-grid">';

    for (let b = 0; b < bloques.length; b++) {
        const bloque = bloques[b];
        html += `<div class="bloque-card" data-bloque="${b}">`;
        html += `<div class="bloque-header">Bloque ${b + 1}</div>`;
        html += `<div class="bloque-body">`;

        for (let i = 0; i < bloque.length; i++) {
            const globalIdx = b * bloquesTamanoBloque + i;
            const valor = bloque[i];
            const vacio = valor === null;
            html += `<div class="bloque-celda ${vacio ? 'bloque-vacio' : ''}" data-bloque="${b}" data-pos="${i}" data-global="${globalIdx}">`;
            html += `<span class="bloque-celda-index">${globalIdx + 1}</span>`;
            html += `<span class="bloque-celda-valor">${vacio ? '' : valor}</span>`;
            html += `</div>`;
        }

        html += `</div></div>`;
    }

    html += '</div>';

    const espaciosVacios = bloquesCantidadBloques * bloquesTamanoBloque - bloquesCantidadMax;
    html += `<div class="mt-2 text-muted small">Bloques: ${bloquesCantidadBloques} × ${bloquesTamanoBloque} | Elementos: ${bloquesDatos.length}/${bloquesCantidadMax}${espaciosVacios > 0 ? ` | Espacios no utilizables: ${espaciosVacios}` : ''}</div>`;

    container.innerHTML = html;
}

// ==================== INSERTAR ====================

function insertarBloques() {
    if (animacionBloquesEnCurso) limpiarTimeoutsBloques();

    if (!bloquesInicializado) {
        mostrarMensajeBloques('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveInput = document.getElementById('claveBloques');
    const claveStr = claveInput.value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeBloques('Ingrese una clave numérica válida', 'warning');
        return;
    }

    if (bloquesDatos.includes(claveStr)) {
        mostrarMensajeBloques(`La clave "${claveStr}" ya existe en la estructura`, 'warning');
        return;
    }

    if (bloquesDatos.length >= bloquesCantidadMax) {
        mostrarMensajeBloques(`La estructura está llena (${bloquesCantidadMax} datos)`, 'danger');
        return;
    }

    bloquesDatos.push(claveStr);
    claveInput.value = '';

    renderizarBloques();

    // Animación: encontrar la posición y resaltarla
    animacionBloquesEnCurso = true;
    const datosOrdenados = [...bloquesDatos].sort(compararNumerico);
    const posGlobal = datosOrdenados.indexOf(claveStr);
    const bloqueIdx = Math.floor(posGlobal / bloquesTamanoBloque);
    const posEnBloque = posGlobal % bloquesTamanoBloque;

    timeoutsBloques.push(setTimeout(() => {
        const celda = document.querySelector(`.bloque-celda[data-global="${posGlobal}"]`);
        if (celda) {
            celda.classList.add('celda-insertando');
            timeoutsBloques.push(setTimeout(() => {
                celda.classList.remove('celda-insertando');
                celda.classList.add('celda-insertada');
                mostrarMensajeBloques(
                    `Clave <strong>"${claveStr}"</strong> insertada en Bloque ${bloqueIdx + 1}, posición ${posEnBloque + 1} (global: ${posGlobal + 1})`,
                    'success'
                );
                timeoutsBloques.push(setTimeout(() => {
                    celda.classList.remove('celda-insertada');
                    animacionBloquesEnCurso = false;
                }, 1000));
            }, 400));
        } else {
            animacionBloquesEnCurso = false;
        }
    }, 100));
}

// ==================== BUSCAR ====================

function buscarBloques() {
    if (animacionBloquesEnCurso) limpiarTimeoutsBloques();

    if (!bloquesInicializado) {
        mostrarMensajeBloques('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveStr = document.getElementById('claveBloques').value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeBloques('Ingrese una clave numérica válida', 'warning');
        return;
    }

    if (bloquesDatos.length === 0) {
        mostrarMensajeBloques('La estructura está vacía', 'warning');
        return;
    }

    renderizarBloques();
    animacionBloquesEnCurso = true;

    const bloques = obtenerBloques();
    const delay = 500;
    let pasos = 0;

    // Fase 1: Comparar con el último elemento de cada bloque
    let bloqueObjetivo = -1;

    const compararBloque = (b) => {
        if (b >= bloques.length) {
            // No se encontró bloque adecuado
            timeoutsBloques.push(setTimeout(() => {
                mostrarMensajeBloques(
                    `Clave <strong>"${claveStr}"</strong> no encontrada (${pasos} pasos)`,
                    'danger'
                );
                animacionBloquesEnCurso = false;
            }, delay));
            return;
        }

        pasos++;
        const bloque = bloques[b];

        // Encontrar el último elemento no nulo del bloque
        let ultimoIdx = -1;
        for (let i = bloque.length - 1; i >= 0; i--) {
            if (bloque[i] !== null) { ultimoIdx = i; break; }
        }

        // Si el bloque está vacío, saltar
        if (ultimoIdx === -1) {
            const card = document.querySelector(`.bloque-card[data-bloque="${b}"]`);
            if (card) card.classList.add('bloque-saltado');
            compararBloque(b + 1);
            return;
        }

        const globalUltimo = b * bloquesTamanoBloque + ultimoIdx;
        const celdaUltimo = document.querySelector(`.bloque-celda[data-global="${globalUltimo}"]`);
        const card = document.querySelector(`.bloque-card[data-bloque="${b}"]`);

        timeoutsBloques.push(setTimeout(() => {
            if (card) card.classList.add('bloque-activo');
            if (celdaUltimo) celdaUltimo.classList.add('celda-ultimo-comparando');

            const comp = compararNumerico(claveStr, bloque[ultimoIdx]);

            timeoutsBloques.push(setTimeout(() => {
                if (comp <= 0) {
                    // La clave podría estar en este bloque
                    bloqueObjetivo = b;
                    if (celdaUltimo) celdaUltimo.classList.remove('celda-ultimo-comparando');
                    // Buscar secuencialmente en el bloque
                    buscarSecuencialEnBloque(b, bloques, claveStr, pasos);
                } else {
                    // La clave es mayor, saltar al siguiente bloque
                    if (card) {
                        card.classList.remove('bloque-activo');
                        card.classList.add('bloque-saltado');
                    }
                    if (celdaUltimo) celdaUltimo.classList.remove('celda-ultimo-comparando');
                    compararBloque(b + 1);
                }
            }, delay));
        }, delay));
    };

    compararBloque(0);
}

function buscarSecuencialEnBloque(bloqueIdx, bloques, claveStr, pasosIniciales) {
    const bloque = bloques[bloqueIdx];
    const delay = 400;
    let pasos = pasosIniciales;

    const buscarEnPos = (i) => {
        if (i >= bloque.length || bloque[i] === null) {
            // No encontrado en este bloque
            timeoutsBloques.push(setTimeout(() => {
                mostrarMensajeBloques(
                    `Clave <strong>"${claveStr}"</strong> no encontrada en Bloque ${bloqueIdx + 1} (${pasos} pasos)`,
                    'danger'
                );
                animacionBloquesEnCurso = false;
            }, delay));
            return;
        }

        pasos++;
        const globalIdx = bloqueIdx * bloquesTamanoBloque + i;
        const celda = document.querySelector(`.bloque-celda[data-global="${globalIdx}"]`);

        timeoutsBloques.push(setTimeout(() => {
            // Limpiar anterior
            if (i > 0) {
                const prevGlobal = bloqueIdx * bloquesTamanoBloque + (i - 1);
                const prevCelda = document.querySelector(`.bloque-celda[data-global="${prevGlobal}"]`);
                if (prevCelda) prevCelda.classList.remove('celda-buscando');
            }
            if (celda) celda.classList.add('celda-buscando');

            const comp = compararNumerico(bloque[i], claveStr);

            if (comp === 0) {
                // ¡Encontrado!
                timeoutsBloques.push(setTimeout(() => {
                    if (celda) {
                        celda.classList.remove('celda-buscando');
                        celda.classList.add('celda-encontrada');
                    }
                    mostrarMensajeBloques(
                        `Clave <strong>"${claveStr}"</strong> encontrada en Bloque ${bloqueIdx + 1}, posición ${i + 1} (${pasos} pasos)`,
                        'success'
                    );
                    animacionBloquesEnCurso = false;
                }, delay));
            } else if (comp > 0) {
                // Ya es mayor que la clave, no puede estar más adelante
                timeoutsBloques.push(setTimeout(() => {
                    if (celda) celda.classList.remove('celda-buscando');
                    mostrarMensajeBloques(
                        `Clave <strong>"${claveStr}"</strong> no encontrada en Bloque ${bloqueIdx + 1} (${pasos} pasos)`,
                        'danger'
                    );
                    animacionBloquesEnCurso = false;
                }, delay));
            } else {
                buscarEnPos(i + 1);
            }
        }, delay));
    };

    buscarEnPos(0);
}

// ==================== ELIMINAR ====================

function eliminarBloques() {
    if (animacionBloquesEnCurso) limpiarTimeoutsBloques();

    if (!bloquesInicializado) {
        mostrarMensajeBloques('Primero debe crear la estructura', 'warning');
        return;
    }

    const claveStr = document.getElementById('claveBloques').value.trim();

    if (!claveStr || !/^[0-9]+$/.test(claveStr)) {
        mostrarMensajeBloques('Ingrese una clave numérica válida', 'warning');
        return;
    }

    if (!bloquesDatos.includes(claveStr)) {
        mostrarMensajeBloques(`Clave <strong>"${claveStr}"</strong> no encontrada`, 'danger');
        return;
    }

    if (!confirm(`¿Está seguro de eliminar la clave "${claveStr}"?`)) return;

    renderizarBloques();
    animacionBloquesEnCurso = true;

    const bloques = obtenerBloques();
    const delay = 500;
    let pasos = 0;

    // Fase 1: Comparar con el último elemento de cada bloque
    const compararBloque = (b) => {
        if (b >= bloques.length) {
            timeoutsBloques.push(setTimeout(() => {
                mostrarMensajeBloques(`Clave <strong>"${claveStr}"</strong> no encontrada (${pasos} pasos)`, 'danger');
                animacionBloquesEnCurso = false;
            }, delay));
            return;
        }

        pasos++;
        const bloque = bloques[b];

        let ultimoIdx = -1;
        for (let i = bloque.length - 1; i >= 0; i--) {
            if (bloque[i] !== null) { ultimoIdx = i; break; }
        }

        if (ultimoIdx === -1) {
            const card = document.querySelector(`.bloque-card[data-bloque="${b}"]`);
            if (card) card.classList.add('bloque-saltado');
            compararBloque(b + 1);
            return;
        }

        const globalUltimo = b * bloquesTamanoBloque + ultimoIdx;
        const celdaUltimo = document.querySelector(`.bloque-celda[data-global="${globalUltimo}"]`);
        const card = document.querySelector(`.bloque-card[data-bloque="${b}"]`);

        timeoutsBloques.push(setTimeout(() => {
            if (card) card.classList.add('bloque-activo');
            if (celdaUltimo) celdaUltimo.classList.add('celda-ultimo-comparando');

            const comp = compararNumerico(claveStr, bloque[ultimoIdx]);

            timeoutsBloques.push(setTimeout(() => {
                if (comp <= 0) {
                    if (celdaUltimo) celdaUltimo.classList.remove('celda-ultimo-comparando');
                    eliminarSecuencialEnBloque(b, bloques, claveStr, pasos);
                } else {
                    if (card) { card.classList.remove('bloque-activo'); card.classList.add('bloque-saltado'); }
                    if (celdaUltimo) celdaUltimo.classList.remove('celda-ultimo-comparando');
                    compararBloque(b + 1);
                }
            }, delay));
        }, delay));
    };

    compararBloque(0);
}

function eliminarSecuencialEnBloque(bloqueIdx, bloques, claveStr, pasosIniciales) {
    const bloque = bloques[bloqueIdx];
    const delay = 400;
    let pasos = pasosIniciales;

    const buscarEnPos = (i) => {
        if (i >= bloque.length || bloque[i] === null) {
            timeoutsBloques.push(setTimeout(() => {
                mostrarMensajeBloques(`Clave <strong>"${claveStr}"</strong> no encontrada (${pasos} pasos)`, 'danger');
                animacionBloquesEnCurso = false;
            }, delay));
            return;
        }

        pasos++;
        const globalIdx = bloqueIdx * bloquesTamanoBloque + i;
        const celda = document.querySelector(`.bloque-celda[data-global="${globalIdx}"]`);

        timeoutsBloques.push(setTimeout(() => {
            if (i > 0) {
                const prevGlobal = bloqueIdx * bloquesTamanoBloque + (i - 1);
                const prevCelda = document.querySelector(`.bloque-celda[data-global="${prevGlobal}"]`);
                if (prevCelda) prevCelda.classList.remove('celda-buscando');
            }
            if (celda) celda.classList.add('celda-buscando');

            const comp = compararNumerico(bloque[i], claveStr);

            if (comp === 0) {
                // Encontrado — animación de eliminación
                timeoutsBloques.push(setTimeout(() => {
                    if (celda) {
                        celda.classList.remove('celda-buscando');
                        celda.classList.add('celda-eliminando');
                    }
                    timeoutsBloques.push(setTimeout(() => {
                        const idx = bloquesDatos.indexOf(claveStr);
                        if (idx !== -1) bloquesDatos.splice(idx, 1);
                        renderizarBloques();
                        document.getElementById('claveBloques').value = '';
                        mostrarMensajeBloques(
                            `Clave <strong>"${claveStr}"</strong> eliminada de Bloque ${bloqueIdx + 1} (${pasos} pasos)`,
                            'success'
                        );
                        animacionBloquesEnCurso = false;
                    }, 500));
                }, delay));
            } else if (comp > 0) {
                timeoutsBloques.push(setTimeout(() => {
                    if (celda) celda.classList.remove('celda-buscando');
                    mostrarMensajeBloques(`Clave <strong>"${claveStr}"</strong> no encontrada (${pasos} pasos)`, 'danger');
                    animacionBloquesEnCurso = false;
                }, delay));
            } else {
                buscarEnPos(i + 1);
            }
        }, delay));
    };

    buscarEnPos(0);
}

// ==================== LIMPIAR ====================

function limpiarBloques() {
    if (!confirm('¿Está seguro de limpiar toda la estructura?')) return;

    limpiarTimeoutsBloques();
    bloquesDatos = [];
    renderizarBloques();
    document.getElementById('claveBloques').value = '';
    mostrarMensajeBloques('Estructura limpiada correctamente', 'success');
}

// ==================== GUARDAR / CARGAR ====================

function guardarBloques() {
    const datos = JSON.stringify({
        tipo: 'bloques',
        cantidadMax: bloquesCantidadMax,
        tamanoBloque: bloquesTamanoBloque,
        cantidadBloques: bloquesCantidadBloques,
        datos: bloquesDatos
    });
    const blob = new Blob([datos], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bloques_informacion.json';
    a.click();
    URL.revokeObjectURL(url);
    mostrarMensajeBloques('Estructura guardada correctamente', 'success');
}

function cargarBloques() {
    document.getElementById('fileInputBloques').click();
}

// ==================== EVENT LISTENERS ====================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar archivo
    document.getElementById('fileInputBloques').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            try {
                const datos = JSON.parse(ev.target.result);
                if (datos.tipo !== 'bloques') throw new Error('Formato inválido');
                bloquesCantidadMax = datos.cantidadMax;
                bloquesTamanoBloque = datos.tamanoBloque;
                bloquesCantidadBloques = datos.cantidadBloques;
                bloquesDatos = datos.datos;
                bloquesInicializado = true;

                document.getElementById('cantidadDatosBloques').value = bloquesCantidadMax;
                document.getElementById('bloquesControles').classList.remove('d-none');

                const desc = document.getElementById('descripcionBloques');
                desc.innerHTML = `<strong>Bloques de Información:</strong> Estructura cargada. ${bloquesCantidadBloques} bloques de ${bloquesTamanoBloque}.`;

                renderizarBloques();
                mostrarMensajeBloques('Estructura cargada correctamente', 'success');
            } catch (err) {
                mostrarMensajeBloques('Error al cargar el archivo: ' + err.message, 'danger');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
});
