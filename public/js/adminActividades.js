const modalStats = new bootstrap.Modal(document.getElementById('modalStats'));

const emotionMap = {
    1: 'Feliz', 2: 'Calma', 3: 'Neutral',
    4: 'Triste', 5: 'Estrés', 6: 'Ansiedad'
};

document.querySelectorAll('.btn-stats').forEach(btn => {
    btn.addEventListener('click', async function() {
        const id = this.dataset.id;
        const nombre = this.dataset.nombre;

        document.getElementById('modalStatsNombre').textContent = nombre;
        document.getElementById('statsRealizadas').textContent = '...';
        document.getElementById('statsUsuarios').textContent = '...';
        document.getElementById('statsValoracion').textContent = '...';
        document.getElementById('statsExito').textContent = '...';
        document.getElementById('statsEmocion').textContent = '...';

        modalStats.show();

        const r = await fetch(`/admin/actividades/${id}/stats`);
        const d = await r.json();

        if (!d.success) {
            document.getElementById('statsRealizadas').textContent = 'Error';
            return;
        }

        const s = d.data;
        document.getElementById('statsRealizadas').textContent = s.realizadas;
        document.getElementById('statsUsuarios').textContent = s.usuarios;
        document.getElementById('statsValoracion').textContent = s.valoracion ? s.valoracion + ' / 5' : '—';
        document.getElementById('statsExito').textContent = s.exito ? s.exito + '%' : '—';
        document.getElementById('statsEmocion').textContent = s.emocionFrecuente ? emotionMap[s.emocionFrecuente] : '—';
    });
});

document.querySelectorAll('.btn-toggle-activo').forEach(btn => {
    btn.addEventListener('click', async function() {
        const id = this.dataset.id;
        const activo = this.dataset.activo === '1';
        const url = `/admin/actividades/${id}/${activo ? 'desactivar' : 'activar'}`;

        const r = await fetch(url, { method: 'POST' });
        const d = await r.json();

        if (!d.success) return alert('Error al actualizar la actividad');

        const fila = document.querySelector(`tr[data-id="${id}"]`);
        const badge = fila.querySelector('.estado-badge');
        const nuevoActivo = !activo;

        badge.className = `admin-badge estado-badge ${nuevoActivo ? 'admin-badge-green' : 'admin-badge-red'}`;
        badge.textContent = nuevoActivo ? 'Activa' : 'Inactiva';

        this.dataset.activo = nuevoActivo ? '1' : '0';
        this.innerHTML = nuevoActivo
            ? '<i class="bi bi-x-circle"></i><span class="d-none d-lg-inline ms-1">Desactivar</span>'
            : '<i class="bi bi-check-circle"></i><span class="d-none d-lg-inline ms-1">Activar</span>';
        fila.dataset.activo = nuevoActivo ? '1' : '0';

        aplicarFiltro();
    });
});

const filtrosActivos = new Set();

const excluyentes = {
    'activas': 'inactivas',
    'inactivas': 'activas',
    'indoor': 'outdoor',
    'outdoor': 'indoor',
    'individual': 'grupo',
    'grupo': 'individual'
};

function aplicarFiltro() {
    const texto = document.getElementById('buscador').value.toLowerCase();
    let visibles = 0;

    document.querySelectorAll('#tablaActividades tr:not([data-mensaje])').forEach(fila => {
        const nombre = fila.dataset.nombre || '';
        const activo = fila.dataset.activo === '1';
        const indoor = fila.dataset.indoor === '1';
        const individual = fila.dataset.individual === '1';

        const coincideBusqueda = nombre.includes(texto);

        const coincideFiltro =
            (!filtrosActivos.has('activas') || activo) &&
            (!filtrosActivos.has('inactivas') || !activo) &&
            (!filtrosActivos.has('indoor') || indoor) &&
            (!filtrosActivos.has('outdoor') || !indoor) &&
            (!filtrosActivos.has('individual') || individual) &&
            (!filtrosActivos.has('grupo') || !individual);

        const mostrar = coincideBusqueda && coincideFiltro;
        fila.classList.toggle('d-none', !mostrar);
        if (mostrar) visibles++;
    });

    let msgVacio = document.getElementById('msgVacioActividades');
    if (!msgVacio) {
        msgVacio = document.createElement('tr');
        msgVacio.id = 'msgVacioActividades';
        msgVacio.setAttribute('data-mensaje', 'true');
        msgVacio.innerHTML = '<td colspan="5" class="text-center text-muted py-3">No se han encontrado actividades</td>';
        document.getElementById('tablaActividades').appendChild(msgVacio);
    }
    msgVacio.classList.toggle('d-none', visibles > 0);
}

document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const filtro = this.dataset.filtro;

        if (filtro === 'todas') {
            filtrosActivos.clear();
            document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            aplicarFiltro();
            return;
        }

        document.querySelector('[data-filtro="todas"]').classList.remove('active');

        const opuesto = excluyentes[filtro];

        if (this.classList.contains('active')) {
            this.classList.remove('active');
            filtrosActivos.delete(filtro);
            if (filtrosActivos.size === 0) {
                document.querySelector('[data-filtro="todas"]').classList.add('active');
            }
        } else {
            if (opuesto && filtrosActivos.has(opuesto)) {
                filtrosActivos.delete(opuesto);
                document.querySelector(`[data-filtro="${opuesto}"]`).classList.remove('active');
            }
            this.classList.add('active');
            filtrosActivos.add(filtro);
        }

        aplicarFiltro();
    });
});

document.getElementById('buscador').addEventListener('input', aplicarFiltro);

const modalEditar = new bootstrap.Modal(document.getElementById('modalEditar'));
let editandoId = null;

document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', function() {
        editandoId = this.dataset.id;
        document.getElementById('editNombre').value = this.dataset.nombre;
        document.getElementById('editDescripcion').value = this.dataset.descripcion;
        document.getElementById('errorEditar').classList.add('d-none');
        modalEditar.show();
    });
});

async function guardarEdicion() {
    const nombre = document.getElementById('editNombre').value.trim();
    const descripcion = document.getElementById('editDescripcion').value.trim();

    if (!nombre) {
        document.getElementById('errorEditar').textContent = 'El nombre es obligatorio';
        document.getElementById('errorEditar').classList.remove('d-none');
        return;
    }

    const r = await fetch(`/admin/actividades/editar/${editandoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, description: descripcion })
    });
    const d = await r.json();

    if (d.success) {
        const fila = document.querySelector(`tr[data-id="${editandoId}"]`);
        fila.querySelector('td:first-child').textContent = nombre;
        fila.dataset.nombre = nombre.toLowerCase();
        fila.querySelector('.btn-editar').dataset.nombre = nombre;
        fila.querySelector('.btn-editar').dataset.descripcion = descripcion;
        modalEditar.hide();
    } else {
        document.getElementById('errorEditar').textContent = d.message || 'Error al guardar';
        document.getElementById('errorEditar').classList.remove('d-none');
    }
}

const modalCrear = new bootstrap.Modal(document.getElementById('modalCrear'));

document.getElementById('btnGuardarActividad').addEventListener('click', guardarActividad);

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

async function guardarActividad() {
    const nombre = document.getElementById('crearNombre').value.trim();
    const descripcion = document.getElementById('crearDescripcion').value.trim();
    const categoria = document.getElementById('crearCategoria').value;
    const energia = document.getElementById('crearEnergia').value;
    const duracion = document.getElementById('crearDuracion').value;
    const indoor = document.getElementById('crearIndoor').checked ? 1 : 0;
    const individual = document.getElementById('crearIndividual').checked ? 1 : 0;

    if (!nombre || !energia || !duracion || !categoria) {
        document.getElementById('errorCrear').textContent = 'Nombre, categoría, energía y duración son obligatorios';
        document.getElementById('errorCrear').classList.remove('d-none');
        return;
    }

    const r = await fetch('/admin/actividades/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, description: descripcion, category_id: categoria, energy_level: energia, duration_minutes: duracion, indoor, individual })
    });
    const d = await r.json();

    if (d.success) {
        modalCrear.hide();
        window.location.reload();
    } else {
        document.getElementById('errorCrear').textContent = d.message || 'Error al crear';
        document.getElementById('errorCrear').classList.remove('d-none');
    }
}

document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', function() {
        const tr = this.closest('tr');

        document.getElementById('verNombre').textContent = tr.querySelector('td:first-child').textContent;
        document.getElementById('verDescripcion').textContent = tr.dataset.descripcion || '—';
        document.getElementById('verCategoria').textContent = tr.dataset.categoria;
        document.getElementById('verEnergia').textContent = tr.dataset.energia;
        document.getElementById('verDuracion').textContent = tr.dataset.duracion ? tr.dataset.duracion + ' min' : '—';
        document.getElementById('verIndoor').textContent = tr.dataset.indoor === '1' ? 'Interior' : 'Exterior';
        document.getElementById('verIndividual').textContent = tr.dataset.individual === '1' ? 'Individual' : 'Grupo';
        document.getElementById('verCreadaPor').textContent = tr.dataset.creadaPor || '—';

        new bootstrap.Modal(document.getElementById('modalVer')).show();
    });
});