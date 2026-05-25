const emotionMap = {
    1: { label: 'Feliz', emoji: '😊' },
    2: { label: 'Calma', emoji: '😌' },
    3: { label: 'Neutral', emoji: '😐' },
    4: { label: 'Triste', emoji: '😔' },
    5: { label: 'Estrés', emoji: '😣' },
    6: { label: 'Ansiedad', emoji: '😰' }
};

let recomendadas = [];
let noRecomendadas = [];
let filtroActual = 'todas';

async function cargar() {
    const [rRec, rNoRec] = await Promise.allSettled([
        fetch('/api/recomendacion/historial'),
        fetch('/api/recomendacion/sin-recomendacion')
    ]);

    if (rRec.status === 'fulfilled' && rRec.value.ok) {
        const d = await rRec.value.json();
        if (d.success) recomendadas = d.data;
    }

    if (rNoRec.status === 'fulfilled' && rNoRec.value.ok) {
        const d = await rNoRec.value.json();
        if (d.success) noRecomendadas = d.data;
    }

    renderLista();
}

function calcularResultado(valence_before, intensity_before, valence_after, intensity_after) {
    if (valence_before === null || valence_after === null) return null;
    const puntBefore = valence_before * (intensity_before || 3);
    const puntAfter = valence_after * (intensity_after || 3);
    const diff = puntAfter - puntBefore;
    if (diff > 0) return { texto: 'Mejoró', color: 'text-success' };
    else if (diff < 0) return { texto: 'Empeoró', color: 'text-danger'  };
    else return { texto: 'Sin cambio', color: 'text-muted' };
}

function renderCardRecomendada(r) {
    const resultado = calcularResultado(r.valence_before, r.intensity_before, r.valence_after, r.intensity_after);
    const fecha = new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const emocion = emotionMap[r.emotion_tipo];

    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-500 mb-0">${r.activity_name}</h6>
                        <span class="badge ${r.aceptada === 1 ? 'bg-success' : r.aceptada === 0 ? 'bg-secondary' : 'bg-warning text-dark'}">
                            ${r.aceptada === 1 ? 'Aceptada' : r.aceptada === 0 ? 'Rechazada' : 'Pendiente'}
                        </span>
                    </div>
                    <small class="text-muted mb-2">${fecha}</small>
                    ${emocion ? `<p class="small mb-2">Te sentías: ${emocion.emoji} ${emocion.label}</p>` : ''}
                    ${r.reason ? `<p class="text-muted small fst-italic mb-2">${r.reason}</p>` : ''}
                    <div class="d-flex gap-1 flex-wrap mb-2">
                        <span class="badge bg-light text-muted">${r.category || 'Sin categoría'}</span>
                        <span class="badge bg-light text-muted">${r.energy_level}</span>
                        <span class="badge bg-light text-muted">${r.indoor ? 'Indoor' : 'Outdoor'}</span>
                        <span class="badge bg-light text-muted">${r.individual ? 'Individual' : 'Grupo'}</span>
                    </div>
                    ${resultado ? `
                        <div class="mt-auto">
                            <small class="${resultado.color} fw-500">${resultado.texto}</small>
                            ${r.rating ? `<small class="text-muted ms-2">${'⭐'.repeat(r.rating)}</small>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderCardNoRecomendada(r) {
    const resultado = calcularResultado(r.valence_before, r.intensity_before, r.valence_after, r.intensity_after);
    const fecha = new Date(r.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <div class="card-body d-flex flex-column">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="fw-500 mb-0">${r.activity_name}</h6>
                        <span class="badge bg-light text-muted">Hecha</span>
                    </div>
                    <small class="text-muted mb-2">${fecha}</small>
                    <div class="d-flex gap-1 flex-wrap mb-3">
                        <span class="badge bg-light text-muted">${r.category || 'Sin categoría'}</span>
                        <span class="badge bg-light text-muted">${r.energy_level}</span>
                        <span class="badge bg-light text-muted">${r.indoor ? 'Indoor' : 'Outdoor'}</span>
                        <span class="badge bg-light text-muted">${r.individual ? 'Individual' : 'Grupo'}</span>
                    </div>
                    <div class="mt-auto">
                        ${resultado ? `
                            <div class="d-flex align-items-center gap-2">
                                <small class="${resultado.color} fw-500">${resultado.texto}</small>
                                ${r.rating ? `<small class="text-muted">${'⭐'.repeat(r.rating)}</small>` : ''}
                            </div>
                        ` : '<small class="text-muted">Sin feedback registrado</small>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLista() {
    const contenedor = document.getElementById('listaHistorial');

    let lista = [];
    if (filtroActual === 'todas') {
        lista = [
            ...recomendadas.map(r => ({ ...r, tipo: 'recomendada' })),
            ...noRecomendadas.map(r => ({ ...r, tipo: 'no-recomendada' }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filtroActual === 'recomendadas') {
        lista = recomendadas.map(r => ({ ...r, tipo: 'recomendada' }));
    } else {
        lista = noRecomendadas.map(r => ({ ...r, tipo: 'no-recomendada' }));
    }

    if (lista.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay registros en este filtro.</p>';
        return;
    }

    contenedor.innerHTML = lista.map(r =>
        r.tipo === 'recomendada' ? renderCardRecomendada(r) : renderCardNoRecomendada(r)
    ).join('');
}

document.querySelectorAll('[data-filtro]').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('[data-filtro]').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        filtroActual = this.dataset.filtro;
        renderLista();
    });
});

cargar();