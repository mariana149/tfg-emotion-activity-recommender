let misActividades = [];
let filtroActual = 'todas';
let editandoId = null;

const modalCrear = new bootstrap.Modal(document.getElementById('modalCrear'));
const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
const modalVer = new bootstrap.Modal(document.getElementById('modalVer'));

const estadoBadge = {
    'borrador': '<span class="badge bg-secondary">Borrador</span>',
    'propuesta': '<span class="badge bg-warning text-dark">Propuesta</span>',
    'publicada': '<span class="badge bg-success">Publicada</span>'
};

async function cargar() {
    const r = await fetch('/api/mis-actividades');
    const d = await r.json();
    if (d.success) {
        misActividades = d.data;
        renderLista();
    }
}

function renderLista() {
    const lista = misActividades.filter(a => {
        if (filtroActual === 'todas') return true;
        return a.estado === filtroActual;
    });

    const contenedor = document.getElementById('listaMisActividades');

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No tienes actividades en este estado.</p>';
        return;
    }

    contenedor.innerHTML = lista.map(a => `
        <div class="card shadow-sm mb-3">
            <div class="card-body d-flex align-items-center gap-3 flex-wrap">
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                        <span class="fw-500">${a.name}</span>
                        ${estadoBadge[a.estado] || ''}
                    </div>
                    <small class="text-muted">${a.description || 'Sin descripción'}</small>
                </div>
                
                <div class="d-flex gap-2 flex-wrap">
                    <button class="btn btn-sm btn-outline-secondary" onclick='verDetalle(${JSON.stringify(a)})'>
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    ${a.estado === 'borrador' ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="editarActividad(${a.id}, '${a.name}', '${a.description || ''}')">
                            <i class="bi bi-pencil"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-outline-primary" onclick="proponerActividad(${a.id})">
                            <i class="bi bi-send"></i> Proponer
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarActividad(${a.id})">
                            <i class="bi bi-trash"></i> Eliminar
                        </button>
                    ` : ''}
                    ${a.estado === 'propuesta' ? `
                        <button class="btn btn-sm btn-outline-warning" onclick="cancelarPropuesta(${a.id})">
                            <i class="bi bi-arrow-counterclockwise"></i> Cancelar propuesta
                        </button>
                    ` : ''}
                    ${a.estado === 'publicada' ? `
                        <span class="text-muted small"><i class="bi bi-check-circle text-success"></i> Publicada por el admin</span>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filtroActual = this.dataset.filtro;
        renderLista();
    });
});

document.getElementById('btnGuardarActividad').addEventListener('click', async function() {
    const nombre = document.getElementById('crearNombre').value.trim();
    const energia = document.getElementById('crearEnergia').value;
    const duracion = document.getElementById('crearDuracion').value;
    const categoria = document.getElementById('crearCategoria').value;
    
    if (!nombre || !energia || !duracion || !categoria) {
        document.getElementById('errorCrear').textContent = 'Nombre, energía, categoria y duración son obligatorios';
        document.getElementById('errorCrear').classList.remove('d-none');
        return;
    }

    const r = await fetch('/api/mis-actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: nombre,
            description: document.getElementById('crearDescripcion').value,
            category_id: document.getElementById('crearCategoria').value,
            energy_level: energia,
            duration_minutes: duracion,
            indoor: document.getElementById('crearIndoor').checked ? 1 : 0,
            individual: document.getElementById('crearIndividual').checked ? 1 : 0
        })
    });
    const d = await r.json();

    if (d.success) {
        modalCrear.hide();
        cargar();
    } else {
        document.getElementById('errorCrear').textContent = d.message || 'Error al crear';
        document.getElementById('errorCrear').classList.remove('d-none');
    }
});

document.getElementById('modalCrear').addEventListener('hidden.bs.modal', function() {
    document.getElementById('crearNombre').value = '';
    document.getElementById('crearDescripcion').value = '';
    document.getElementById('crearCategoria').value = '';
    document.getElementById('crearEnergia').value = 'low';
    document.getElementById('crearDuracion').value = '';
    document.getElementById('crearIndoor').checked = false;
    document.getElementById('crearIndividual').checked = false;
    document.getElementById('errorCrear').classList.add('d-none');
});


function verDetalle(a) {
    document.getElementById('verNombre').textContent = a.name;
    document.getElementById('verDescripcion').textContent = a.description || 'Sin descripción';
    document.getElementById('verCategoria').textContent = a.category || 'Sin categoría';
    document.getElementById('verEnergia').textContent = a.energy_level || '—';
    document.getElementById('verDuracion').textContent = a.duration_minutes ? a.duration_minutes + ' min' : '—';
    document.getElementById('verIndoor').textContent = a.indoor ? 'Interior' : 'Exterior';
    document.getElementById('verModalidad').textContent = a.individual ? 'Individual' : 'Grupo';
    modalVer.show();
}

function editarActividad(id, nombre, descripcion) {
    editandoId = id;
    document.getElementById('editNombre').value = nombre;
    document.getElementById('editDescripcion').value = descripcion;
    document.getElementById('errorEditar').classList.add('d-none');
    modalEditar.show();
}

document.getElementById('btnGuardarEdicion').addEventListener('click', async function() {
    const nombre = document.getElementById('editNombre').value.trim();
    if (!nombre) {
        document.getElementById('errorEditar').textContent = 'El nombre es obligatorio';
        document.getElementById('errorEditar').classList.remove('d-none');
        return;
    }

    const r = await fetch(`/api/mis-actividades/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: nombre,
            description: document.getElementById('editDescripcion').value
        })
    });
    const d = await r.json();

    if (d.success) {
        modalEditar.hide();
        cargar();
    } else {
        document.getElementById('errorEditar').textContent = d.message || 'Error al guardar';
        document.getElementById('errorEditar').classList.remove('d-none');
    }
});

async function proponerActividad(id) {
    if (!confirm('¿Quieres proponer esta actividad al administrador para que la publique?')) return;

    const r = await fetch(`/api/mis-actividades/${id}/proponer`, { method: 'POST' });
    const d = await r.json();

    if (d.success) cargar();
    else alert(d.message || 'Error al proponer');
}

async function eliminarActividad(id) {
    if (!confirm('¿Quieres eliminar esta actividad?')) return;

    const r = await fetch(`/api/mis-actividades/${id}/eliminar`, { method: 'POST' });
    const d = await r.json();

    if (d.success) cargar();
    else alert(d.message || 'Error al eliminar');
}

async function cancelarPropuesta(id) {
    if (!confirm('¿Quieres cancelar la propuesta? Volverá a borrador.')) return;
    const r = await fetch(`/api/mis-actividades/${id}/cancelar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) cargar();
    else alert(d.message || 'Error al cancelar');
}
cargar();