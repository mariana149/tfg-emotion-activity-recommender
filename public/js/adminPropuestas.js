const modalVer = new bootstrap.Modal(document.getElementById('modalVer'));

async function cargar() {
    const r = await fetch('/admin/actividades/propuestas');
    const d = await r.json();

    const tbody = document.getElementById('tablaPropuestas');

    if (!d.success || d.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted p-3">No hay propuestas pendientes.</td></tr>';
        return;
    }

    tbody.innerHTML = d.data.map(a => {
        const creador = a.created_by_nombre
            ? `${a.created_by_nombre} (${a.created_by_email})`
            : '—';
        return `
        <tr
            data-nombre="${a.name}"
            data-descripcion="${(a.description || '').replace(/"/g, '&quot;')}"
            data-categoria="${a.category || 'Sin categoría'}"
            data-energia="${a.energy_level}"
            data-duracion="${a.duration_minutes || '—'}"
            data-indoor="${a.indoor}"
            data-individual="${a.individual}"
            data-creada-por="${creador}"
        >
            <td>${a.name}</td>
            <td class="text-muted d-none d-md-table-cell">${a.category || '—'}</td>
            <td class="d-none d-md-table-cell">${a.energy_level}</td>
            <td class="text-muted d-none d-lg-table-cell">${creador}</td>
            <td>
                <button class="admin-btn btn-ver-propuesta">
                    <i class="bi bi-eye"></i><span class="d-none d-lg-inline ms-1">Ver</span>
                </button>
                <button class="admin-btn" onclick="publicar(${a.id})">
                    <i class="bi bi-check-circle"></i><span class="d-none d-lg-inline ms-1">Publicar</span>
                </button>
                <button class="admin-btn" onclick="rechazar(${a.id})">
                    <i class="bi bi-x-circle"></i><span class="d-none d-lg-inline ms-1">Rechazar</span>
                </button>
            </td>
        </tr>`;
    }).join('');

    // Asignar listeners después de renderizar
    document.querySelectorAll('.btn-ver-propuesta').forEach(btn => {
        btn.addEventListener('click', function() {
            const tr = this.closest('tr');
            document.getElementById('verNombre').textContent = tr.dataset.nombre;
            document.getElementById('verDescripcion').textContent = tr.dataset.descripcion || '—';
            document.getElementById('verCategoria').textContent = tr.dataset.categoria;
            document.getElementById('verEnergia').textContent = tr.dataset.energia;
            document.getElementById('verDuracion').textContent = tr.dataset.duracion !== '—' ? tr.dataset.duracion + ' min' : '—';
            document.getElementById('verIndoor').textContent = tr.dataset.indoor === '1' ? 'Interior' : 'Exterior';
            document.getElementById('verIndividual').textContent = tr.dataset.individual === '1' ? 'Individual' : 'Grupo';
            document.getElementById('verCreadaPor').textContent = tr.dataset.creadaPor || '—';
            modalVer.show();
        });
    });
}

async function publicar(id) {
    if (!confirm('¿Publicar esta actividad?')) return;
    const r = await fetch(`/admin/actividades/${id}/publicar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) cargar();
    else alert(d.message || 'Error al publicar');
}

async function rechazar(id) {
    if (!confirm('¿Rechazar esta propuesta? Volverá a borrador.')) return;
    const r = await fetch(`/admin/actividades/${id}/rechazar`, { method: 'POST' });
    const d = await r.json();
    if (d.success) cargar();
    else alert(d.message || 'Error al rechazar');
}

cargar();