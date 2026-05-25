const modalVer = new bootstrap.Modal(document.getElementById('modalVer'));
const modalStats = new bootstrap.Modal(document.getElementById('modalStats'));

document.querySelectorAll('.btn-ver').forEach(btn => {
    btn.addEventListener('click', function() {
        const tr = this.closest('tr');
        const activo = tr.dataset.activo === '1';

        document.getElementById('verNombre').textContent = tr.dataset.nombreCompleto;
        document.getElementById('verEmail').textContent = tr.dataset.emailFull;
        document.getElementById('verPais').textContent = tr.dataset.pais;
        document.getElementById('verCiudad').textContent = tr.dataset.ciudad;
        document.getElementById('verEstado').innerHTML =
            `<span class="admin-badge ${activo ? 'admin-badge-green' : 'admin-badge-red'}">${activo ? 'Activo' : 'Inactivo'}</span>`;

        modalVer.show();
    });
});

document.querySelectorAll('.btn-stats').forEach(btn => {
    btn.addEventListener('click', async function() {
        const id = this.dataset.id;
        const tr = this.closest('tr');

        document.getElementById('statsNombre').textContent = tr.dataset.nombreCompleto;
        document.getElementById('statsEmociones').textContent = '...';
        document.getElementById('statsActividades').textContent = '...';
        document.getElementById('statsValoracion').textContent = '...';
        document.getElementById('statsExito').textContent = '...';

        modalStats.show();

        const r = await fetch(`/admin/usuarios/${id}/stats`);
        const d = await r.json();

        if (!d.success) {
            document.getElementById('statsEmociones').textContent = 'Error';
            return;
        }

        const s = d.data.stats;
        document.getElementById('statsEmociones').textContent = s.emociones;
        document.getElementById('statsActividades').textContent = s.actividades;
        document.getElementById('statsValoracion').textContent = s.valoracion ? s.valoracion + ' / 5' : '—';
        document.getElementById('statsExito').textContent = s.exito ? s.exito + '%' : '—';
    });
});

document.querySelectorAll('.btn-toggle-activo').forEach(btn => {
    btn.addEventListener('click', async function() {
        const id = this.dataset.id;
        const activo = this.dataset.activo === '1';
        const url = `/admin/usuarios/${id}/${activo ? 'desactivar' : 'activar'}`;

        const r = await fetch(url, { method: 'POST' });
        const d = await r.json();

        if (!d.success) return alert('Error al actualizar el usuario');

        const fila = document.querySelector(`tr[data-id="${id}"]`);
        const badge = fila.querySelector('.admin-badge');
        const nuevoActivo = !activo;

        badge.className = `admin-badge ${nuevoActivo ? 'admin-badge-green' : 'admin-badge-red'}`;
        badge.textContent = nuevoActivo ? 'Activo' : 'Inactivo';

        this.dataset.activo = nuevoActivo ? '1' : '0';
        this.innerHTML = nuevoActivo
            ? '<i class="bi bi-x-circle"></i><span class="d-none d-lg-inline ms-1">Desactivar</span>'
            : '<i class="bi bi-check-circle"></i><span class="d-none d-lg-inline ms-1">Activar</span>';
        fila.dataset.activo = nuevoActivo ? '1' : '0';

        aplicarFiltro(filtroActual);
    });
});

let filtroActual = 'todos';

function aplicarFiltro(filtro) {
    filtroActual = filtro;
    const texto = document.getElementById('buscador').value.toLowerCase();
    let visibles = 0;

    document.querySelectorAll('#tablaUsuarios tr:not([data-mensaje])').forEach(fila => {
        const nombre = fila.dataset.nombre || '';
        const email = fila.dataset.email  || '';
        const activo = fila.dataset.activo === '1';

        const coincideBusqueda = nombre.includes(texto) || email.includes(texto);
        const coincideFiltro =
            filtro === 'todos' ? true :
            filtro === 'activos' ? activo :
            filtro === 'inactivos' ? !activo : true;

        const mostrar = coincideBusqueda && coincideFiltro;
        fila.classList.toggle('d-none', !mostrar);
        if (mostrar) visibles++;
    });

    // Mensaje sin resultados
    let msgVacio = document.getElementById('msgVacio');
    if (!msgVacio) {
        msgVacio = document.createElement('tr');
        msgVacio.id = 'msgVacio';
        msgVacio.setAttribute('data-mensaje', 'true');
        msgVacio.innerHTML = '<td colspan="4" class="text-center text-muted py-3">No se han encontrado usuarios</td>';
        document.getElementById('tablaUsuarios').appendChild(msgVacio);
    }
    msgVacio.classList.toggle('d-none', visibles > 0);
}

document.querySelectorAll('.admin-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        aplicarFiltro(this.dataset.filtro);
    });
});

document.getElementById('buscador').addEventListener('input', function() {
    aplicarFiltro(filtroActual);
});