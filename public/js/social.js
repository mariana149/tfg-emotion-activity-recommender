function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    toast.className = `toast align-items-center text-white border-0 bg-${tipo}`;
    toastMsg.textContent = mensaje;
    bootstrap.Toast.getOrCreateInstance(toast).show();
}

function eliminarElemento(selector) {
    const el = document.querySelector(selector);
    if (el) el.remove();
}

function nombreCompleto(u) {
    return u.apellidos ? `${u.nombre} ${u.apellidos}` : u.nombre;
}

async function aceptarSolicitud(conexionId) {
    const r = await fetch(`/api/social/solicitud/${conexionId}/aceptar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast('Solicitud aceptada');
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function rechazarSolicitud(conexionId) {
    const r = await fetch(`/api/social/solicitud/${conexionId}/rechazar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast('Solicitud rechazada');
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function cancelarSolicitud(conexionId) {
    const r = await fetch(`/api/social/solicitud/${conexionId}/rechazar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast('Solicitud cancelada');
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function desconectar(conexionId, nombre) {
    if (!confirm(`¿Desconectarte de ${nombre}?`)) return;
    const r = await fetch(`/api/social/conexion/${conexionId}`, { method: 'DELETE' });
    const d = await r.json();
    if (d.success) {
        mostrarToast(`Desconectado de ${nombre}`);
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function bloquear(userId, nombre) {
    if (!confirm(`¿Bloquear a ${nombre}? No podrá enviarte solicitudes.`)) return;
    const r = await fetch(`/api/social/bloquear/${userId}`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast(`${nombre} bloqueado`);
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function desbloquear(userId, nombre) {
    if (!confirm(`¿Desbloquear a ${nombre}?`)) return;
    const r = await fetch(`/api/social/desbloquear/${userId}`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast(`${nombre} desbloqueado`);
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function buscarUsuarios(q) {
    const contenedor = document.getElementById('resultadosBusqueda');
    contenedor.innerHTML = '<div class="text-muted small">Buscando...</div>';

    const r = await fetch(`/api/social/buscar?q=${encodeURIComponent(q)}`);
    const d = await r.json();

    if (!d.success || d.data.length === 0) {
        contenedor.innerHTML = '<div class="text-muted small">Sin resultados</div>';
        return;
    }

    contenedor.innerHTML = d.data.map(u => renderCardUsuario(u)).join('');
}

function renderCardUsuario(u) {
    return `
        <div class="d-flex align-items-center gap-3 p-3 border rounded mb-2" id="usuario-${u.id}">
            <img src="${u.foto || '/img/defaultFoto.png'}"
                 class="rounded-circle" width="44" height="44" style="object-fit:cover;">
            <div class="flex-grow-1">
                <div class="fw-500">${nombreCompleto(u)}</div>
            </div>
            <div class="boton-conexion-${u.id}">
                ${renderBotonConexion(u)}
            </div>
        </div>
    `;
}

function renderBotonConexion(u) {
    if (u.estado_conexion === 'aceptada') {
        return `<span class="badge bg-success"><i class="bi bi-check-lg me-1"></i>Conectado</span>`;
    }
    if (u.estado_conexion === 'pendiente') {
        if (u.solicitante_id === u.id) {
            return `
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-success"
                            onclick="aceptarSolicitud(${u.conexion_id})">
                        Aceptar
                    </button>
                    <button class="btn btn-sm btn-outline-secondary"
                            onclick="rechazarSolicitud(${u.conexion_id})">
                        Rechazar
                    </button>
                </div>`;
        }
        return `<button class="btn btn-sm btn-outline-secondary" disabled>Pendiente</button>`;
    }
    return `
        <button class="btn btn-sm btn-success"
                onclick="enviarSolicitudBuscador(${u.id}, this)">
            <i class="bi bi-person-plus me-1"></i>Conectar
        </button>`;
}

async function enviarSolicitudBuscador(receptorId, btn) {
    btn.disabled = true;
    const r = await fetch('/api/social/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receptorId })
    });
    const d = await r.json();
    if (d.success) {
        document.querySelectorAll(`.boton-conexion-${receptorId}`).forEach(contenedor => {
            contenedor.innerHTML = `<button class="btn btn-sm btn-outline-secondary" disabled>Pendiente</button>`;
        });
        mostrarToast('Solicitud enviada');
    } else {
        btn.disabled = false;
        mostrarToast(d.mensaje, 'danger');
    }
}

async function cargarSimilares() {
    const contenedor = document.getElementById('listaSimilares');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="text-center text-muted py-4">
            <div class="spinner-border spinner-border-sm text-success me-2"></div>
            Calculando afinidad...
        </div>`;

    const r = await fetch('/api/social/similares');
    const d = await r.json();

    if (!d.success || d.data.length === 0) {
        contenedor.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-people" style="font-size:2rem;opacity:.3;"></i>
                <p class="mt-2 mb-0 small">Realiza más actividades para encontrar usuarios similares</p>
            </div>`;
        return;
    }

    contenedor.innerHTML = `<div class="row g-3">${d.data.map(renderCardSimilar).join('')}</div>`;
}

function renderCardSimilar(u) {
    const scoreColor = u.score >= 70 ? 'success' : u.score >= 40 ? 'warning' : 'secondary';
    let boton;
    if (u.yaConectado) {
        boton = `<span class="badge bg-success"><i class="bi bi-check-lg me-1"></i>Conectado</span>`;
    } else if (u.solicitudRecibida) {
        boton = `
            <div class="d-flex gap-1">
                <button class="btn btn-sm btn-success"
                        onclick="aceptarSolicitud(${u.conexionIdRecibida})">
                    Aceptar
                </button>
                <button class="btn btn-sm btn-outline-secondary"
                        onclick="rechazarSolicitud(${u.conexionIdRecibida})">
                    Rechazar
                </button>
            </div>`;
    } else if (u.solicitudEnviada) {
        boton = `<button class="btn btn-sm btn-outline-secondary" disabled>Pendiente</button>`;
    } else {
        boton = `<button class="btn btn-sm btn-success" onclick="enviarSolicitudBuscador(${u.id}, this)">
                     <i class="bi bi-person-plus me-1"></i>Conectar
                 </button>`;
    }

    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="d-flex align-items-center gap-3 p-3 border rounded h-100 flex-wrap">
                <img src="${u.foto || '/img/defaultFoto.png'}"
                     class="rounded-circle" width="48" height="48" style="object-fit:cover;">
                <div class="flex-grow-1">
                    <div class="fw-500 mb-1">${nombreCompleto(u)}</div>
                <div class="mt-1">
                    <span class="badge bg-${scoreColor} bg-opacity-10 text-${scoreColor}">
                        ${u.score}% afinidad
                    </span>
                    <br>
                    <div class="d-flex gap-1 mt-1">
                        <span class="badge bg-light text-muted">
                            <i class="bi bi-activity me-1"></i>${u.scoreActividades}%
                        </span>
                        <span class="badge bg-light text-muted">
                            <i class="bi bi-emoji-smile me-1"></i>${u.scoreEmocional}%
                        </span>
                    </div>
                </div>
                </div>
                <div class="boton-conexion-${u.id}">
                    ${boton}
                </div>
            </div>
        </div>`;
}

let _actividades = [];

async function abrirModalRecomendar(destinatarioId, nombre) {
    document.getElementById('destinatarioId').value = destinatarioId;
    document.getElementById('nombreDestinatario').textContent = nombre;
    document.getElementById('errorRecomendar').classList.add('d-none');

    document.getElementById('inputBuscarActividad').value = '';
    document.getElementById('actividadSeleccionadaId').value = '';
    document.getElementById('dropdownActividades').classList.add('d-none');

    if (_actividades.length === 0) {
        const r = await fetch('/api/actividades');
        const d = await r.json();
        _actividades = d.data || [];
    }

    document.getElementById('mensajeRec').value = '';
    new bootstrap.Modal(document.getElementById('modalRecomendar')).show();

    setTimeout(() => document.getElementById('inputBuscarActividad').focus(), 300);
}

function filtrarActividades(q) {
    const dropdown = document.getElementById('dropdownActividades');
    document.getElementById('actividadSeleccionadaId').value = '';

    if (!q.trim()) {
        dropdown.classList.add('d-none');
        return;
    }

    const filtradas = _actividades.filter(a =>
        a.name.toLowerCase().includes(q.toLowerCase())
    );

    if (filtradas.length === 0) {
        dropdown.innerHTML = '<div class="px-3 py-2 text-muted small">Sin resultados</div>';
    } else {
        dropdown.innerHTML = filtradas.map(a => `
            <div class="px-3 py-2 cursor-pointer dropdown-item-actividad"
                 style="cursor:pointer;"
                 onmousedown="seleccionarActividad(${a.id}, '${a.name.replace(/'/g, "\'")}')">
                ${a.name}
            </div>
        `).join('');
    }
    dropdown.classList.remove('d-none');
}

function seleccionarActividad(id, nombre) {
    document.getElementById('actividadSeleccionadaId').value = id;
    document.getElementById('inputBuscarActividad').value = nombre;
    document.getElementById('dropdownActividades').classList.add('d-none');
    document.getElementById('errorRecomendar').classList.add('d-none');
}

document.addEventListener('click', function(e) {
    const input = document.getElementById('inputBuscarActividad');
    const dropdown = document.getElementById('dropdownActividades');
    if (input && dropdown && !input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('d-none');
    }
});

async function enviarRecomendacion() {
    const destinatarioId = document.getElementById('destinatarioId').value;
    const activityId = document.getElementById('actividadSeleccionadaId').value;
    const mensaje = document.getElementById('mensajeRec').value.trim();

    if (!activityId) {
        document.getElementById('errorRecomendar').classList.remove('d-none');
        return;
    }
    document.getElementById('errorRecomendar').classList.add('d-none');

    const r = await fetch('/api/social/recomendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destinatarioId, activityId, mensaje })
    });
    const d = await r.json();

    bootstrap.Modal.getInstance(document.getElementById('modalRecomendar')).hide();

    if (d.success) {
        mostrarToast('Actividad recomendada');
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function aceptarRecSocial(recId) {
    const r = await fetch(`/api/social/recomendaciones/${recId}/aceptar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast(d.mensaje);
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function rechazarRecSocial(recId) {
    const r = await fetch(`/api/social/recomendaciones/${recId}/rechazar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) {
        mostrarToast('Recomendación rechazada', 'secondary');
        setTimeout(() => location.reload(), 800);
    } else {
        mostrarToast(d.mensaje, 'danger');
    }
}

async function actualizarBadgeNotificaciones() {
    const r = await fetch('/api/social/pendientes/count');
    const d = await r.json();
    if (!d.success) return;

    const link = document.querySelector('a[href="/notificaciones"]');
    if (!link) return;

    const badgeAnterior = link.querySelector('.badge-notif');
    if (badgeAnterior) badgeAnterior.remove();

    if (d.total > 0) {
        const badge = document.createElement('span');
        badge.className = 'badge bg-danger badge-notif ms-auto';
        badge.style.cssText = 'font-size:.65rem;padding:2px 6px;';
        badge.textContent = d.total;
        link.appendChild(badge);
    }
}