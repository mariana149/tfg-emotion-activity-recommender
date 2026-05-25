let todasActividades = [];
let savedIds = new Set();
let realizadasIds = new Set();


async function init() {
    const [rTodas, rGuardadas, rRealizadas] = await Promise.allSettled([
        fetch('/api/actividades'),
        fetch('/api/guardadas'),
        fetch('/api/realizadas')
    ]);

    if (rTodas.status === 'fulfilled') {
        const d = await rTodas.value.json();
        if (d.success) todasActividades = d.data;
    }
    if (rGuardadas.status === 'fulfilled') {
        const d = await rGuardadas.value.json();
        if (d.success) savedIds = new Set(d.data.map(a => a.id));
    }
    if (rRealizadas.status === 'fulfilled' && rRealizadas.value.ok) {
        const d = await rRealizadas.value.json();
        if (d.success) realizadasIds = new Set(d.data.map(a => a.activity_id));
    }
    renderActividades();
}

const filtrosActivos = new Set();

const excluyentes = {
    'guardadas': 'noGuardadas',
    'noGuardadas': 'guardadas',
    'indoor': 'outdoor',
    'outdoor': 'indoor',
    'individual': 'grupo',
    'grupo': 'individual'
};

document.querySelectorAll('.btn-filtro').forEach(btn => {
    btn.addEventListener('click', function() {
        const filtro = this.dataset.filtro;
        if (filtro === 'todas') {
            filtrosActivos.clear();
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderActividades();
            return;
        }
        document.querySelector('[data-filtro="todas"]').classList.remove('active');
        const opuesto = excluyentes[filtro];
        if (this.classList.contains('active')) {
            this.classList.remove('active');
            filtrosActivos.delete(filtro);
            if (filtrosActivos.size === 0)
                document.querySelector('[data-filtro="todas"]').classList.add('active');
        } else {
            if (opuesto && filtrosActivos.has(opuesto)) {
                filtrosActivos.delete(opuesto);
                document.querySelector(`[data-filtro="${opuesto}"]`).classList.remove('active');
            }
            this.classList.add('active');
            filtrosActivos.add(filtro);
        }
        renderActividades();
    });
});

function renderActividades() {
    const texto = document.getElementById('buscador')?.value.toLowerCase() || '';
    const lista = todasActividades.filter(a => {
        const coincideTexto = a.name.toLowerCase().includes(texto);
        return coincideTexto && (
            (!filtrosActivos.has('guardadas') || savedIds.has(a.id)) &&
            (!filtrosActivos.has('noGuardadas') || !savedIds.has(a.id)) &&
            (!filtrosActivos.has('indoor') || a.indoor === 1) &&
            (!filtrosActivos.has('outdoor') || a.indoor === 0) &&
            (!filtrosActivos.has('individual') || a.individual === 1) &&
            (!filtrosActivos.has('grupo') || a.individual === 0)
        );
    });

    const contenedor = document.getElementById('listaActividades');
    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay actividades en este filtro.</p>';
        return;
    }

    contenedor.innerHTML = lista.map(a => `
        <div class="col-md-4">
            <div class="activity-card">
                <div class="activity-card-accent"></div>
                <div class="activity-card-body">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <span class="card-name">${a.name}</span>
                        ${savedIds.has(a.id) ? '<span class="badge-guardada">Guardada</span>' : ''}
                    </div>
                    <p class="card-desc">${a.description || 'Sin descripción'}</p>
                    <div class="card-meta">
                        <span class="meta-badge">${a.indoor ? '🏠 Indoor' : '🌿 Outdoor'}</span>
                        <span class="meta-badge">${a.individual ? '👤 Individual' : '👥 Grupo'}</span>
                        ${a.category ? `<span class="meta-badge">📂 ${a.category}</span>` : ''}
                        ${a.energy_level ? `<span class="meta-badge">⚡ ${a.energy_level}</span>` : ''}
                        ${a.duration_minutes ? `<span class="meta-badge">⏱ ${a.duration_minutes} min</span>` : ''}
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-secondary w-100 custom-border"
                                onclick="empezar(${a.id}, '${a.name}')">
                            ${realizadasIds.has(a.id) ? 'Repetir' : 'Empezar'}
                        </button>
                        ${savedIds.has(a.id)
                            ? `<button class="btn btn-sm btn-outline-danger w-100"
                                    onclick="quitar(${a.id})">Quitar</button>`
                            : `<button class="btn btn-sm w-100 custom-border"
                                    onclick="guardar(${a.id})">Guardar</button>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

async function guardar(activityId) {
    const r = await fetch('/api/guardadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
    });
    const d = await r.json();
    if (d.success) { savedIds.add(activityId); renderActividades(); }
}

async function quitar(activityId) {
    const r = await fetch('/api/guardadas/quitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
    });
    const d = await r.json();
    if (d.success) { savedIds.delete(activityId); renderActividades(); }
}

function empezar(actividadId, nombre) {
    abrirModalRealizar(actividadId, nombre, null, null);
}
document.addEventListener('actividadRealizada', function(e) {
    realizadasIds.add(e.detail.actividadId);
    renderActividades();
});
document.getElementById('buscador').addEventListener('input', renderActividades);
init();