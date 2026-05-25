const emotionMap = {
    1: { label: 'Feliz', emoji: '😊' },
    2: { label: 'Calma', emoji: '😌' },
    3: { label: 'Neutral', emoji: '😐' },
    4: { label: 'Triste', emoji: '😔' },
    5: { label: 'Estrés', emoji: '😣' },
    6: { label: 'Ansiedad', emoji: '😰' }
};

const energyMap = { 'baja': 1, 'media': 2, 'alta': 3 };

let recomendacionesActuales = [];
let estadoCards = {};

function todasGestionadas() {
    return recomendacionesActuales.length > 0 &&
        recomendacionesActuales.every(r => estadoCards[r.recommendation_id] !== 'pendiente');
}

function actualizarBoton() {
    const btn = document.getElementById('btnSolicitarNuevas');
    if (todasGestionadas()) {
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-success');
        btn.disabled = false;
    } else {
        btn.classList.remove('btn-success');
        btn.classList.add('btn-danger');
        btn.disabled = false;
    }
}

function renderCards() {
    const contenedor = document.getElementById('listaRecomendaciones');
    contenedor.innerHTML = recomendacionesActuales.map(r => {
        const estado = estadoCards[r.recommendation_id];
        const a      = r.activity;

return `
    <div class="col-md-4">
        <div class="activity-card ${estado === 'rechazada' ? 'opacity-50' : ''}">
            <div class="activity-card-accent"></div>
            <div class="activity-card-body">
                <div class="d-flex justify-content-between align-items-start mb-1">
                    <span class="card-name">${a.name}</span>
                </div>
                <p class="card-desc">${a.description || 'Sin descripción'}</p>
                <div class="card-meta">
                    <span class="meta-badge">${a.indoor ? '🏠 Indoor' : '🌿 Outdoor'}</span>
                    <span class="meta-badge">${a.individual ? '👤 Individual' : '👥 Grupo'}</span>
                    ${a.category ? `<span class="meta-badge">📂 ${a.category}</span>` : ''}
                    ${a.energy_level ? `<span class="meta-badge">⚡ ${a.energy_level}</span>` : ''}
                    ${a.duration_minutes ? `<span class="meta-badge">⏱ ${a.duration_minutes} min</span>` : ''}
                </div>
                <p class="text-muted small fst-italic mb-3">💡 ${r.reason}</p>
                <div class="mt-auto">
                    ${estado === 'pendiente' ? `
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-secondary w-100"
                                    onclick="guardarRec(${r.recommendation_id}, ${a.id}, '${a.name}', this)">
                                <i class="bi bi-bookmark"></i> Guardar
                            </button>
                            <button class="btn btn-sm btn-success w-100"
                                    onclick="realizarRec(${r.recommendation_id}, ${a.id}, '${a.name}', ${r.emotion_tipo}, ${r.emotion_intensity}, '${r.emotion_energy}')">
                                Realizar
                            </button>
                            <button class="btn btn-sm btn-outline-danger w-100"
                                    onclick="rechazarRec(${r.recommendation_id})">
                                Rechazar
                            </button>
                        </div>
                    ` : `
                        <span class="badge ${estado === 'aceptada' ? 'bg-success' : 'bg-secondary'}">
                            ${estado === 'aceptada' ? 'Aceptada' : 'Rechazada'}
                        </span>
                    `}
                </div>
            </div>
        </div>
    </div>
`;
    }).join('');
}

document.getElementById('btnSolicitar').addEventListener('click', solicitar);
document.getElementById('btnSolicitarNuevas').addEventListener('click', function() {
    if (!todasGestionadas()) {
        alert('Acepta o rechaza todas las recomendaciones primero');
        return;
    }
    document.getElementById('fase1').classList.remove('d-none');
    document.getElementById('fase2').classList.add('d-none');

    document.querySelectorAll('[name=recEmotion]').forEach(r => r.checked = false);
    document.getElementById('recEnergia').value    = '';
    document.getElementById('recIntensidad').value = '3';
    document.getElementById('lblIntensidadRec').textContent = '3';
});

async function solicitar() {
    const emotion = document.querySelector('[name=recEmotion]:checked');
    const energia = document.getElementById('recEnergia').value;
    const intensidad = parseInt(document.getElementById('recIntensidad').value);

    if (!emotion || !energia) {
        document.getElementById('errorRec').classList.remove('d-none');
        return;
    }
    document.getElementById('errorRec').classList.add('d-none');

    document.getElementById('btnSolicitar').disabled = true;
    document.getElementById('btnSolicitar').textContent = 'Calculando...';

    const r = await fetch('/api/recomendacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emotion: parseInt(emotion.value),
            intensity: intensidad,
            energy_level: energia
        })
    });
    const d = await r.json();

    document.getElementById('btnSolicitar').disabled = false;
    document.getElementById('btnSolicitar').textContent = 'Solicitar recomendación';

    if (!d.success) {
        alert(d.message || 'Error al obtener recomendaciones');
        return;
    }

    recomendacionesActuales = d.data;
    estadoCards = {};
    recomendacionesActuales.forEach(r => {
        estadoCards[r.recommendation_id] = 'pendiente';
    });

    const emo = emotionMap[parseInt(emotion.value)];
    document.getElementById('resumenEmocion').innerHTML =
        `${emo.emoji} ${emo.label} · ${energia} · Intensidad ${intensidad}/5`;

    document.getElementById('fase1').classList.add('d-none');
    document.getElementById('fase2').classList.remove('d-none');

    renderCards();
    actualizarBoton();
}
async function guardarRec(recId, activityId, nombre, btn) {
    const r = await fetch('/api/guardadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId })
    });
    const d = await r.json();
    if (d.success || d.message === 'Ya tienes esta actividad guardada') {
        await fetch(`/api/recomendacion/${recId}/aceptar`, { method: 'POST' });
        btn.innerHTML = '<i class="bi bi-bookmark-fill"></i> Guardada';
        btn.disabled = true;
        btn.classList.remove('btn-outline-secondary');
        btn.classList.add('btn-success');
        estadoCards[recId] = 'aceptada';
        renderCards();   
        actualizarBoton();
    } else {
        alert(d.message || 'Error al guardar');
    }
}
async function realizarRec(recId, activityId, nombre, emotionTipo, emotionIntensity, emotionEnergy) {
    abrirModalRealizar(activityId, nombre, recId, emotionTipo, emotionIntensity, emotionEnergy);
    
    document.addEventListener('actividadRealizada', async function handler() {
        await fetch(`/api/recomendacion/${recId}/aceptar`, { method: 'POST' });
        estadoCards[recId] = 'aceptada';
        renderCards();
        actualizarBoton();
        document.removeEventListener('actividadRealizada', handler);
    });
}

async function rechazarRec(recId) {
    await fetch(`/api/recomendacion/${recId}/rechazar`, { method: 'POST' });
    estadoCards[recId] = 'rechazada';
    renderCards();
    actualizarBoton();
}
async function cargarPendientes() {
    const r = await fetch('/api/recomendacion/pendientes');
    const d = await r.json();
    if (d.success && d.data.length > 0) {
        recomendacionesActuales = d.data;
        estadoCards = {};
        recomendacionesActuales.forEach(r => {
            estadoCards[r.recommendation_id] = 'pendiente';
        });
        document.getElementById('resumenEmocion').innerHTML = `
            <div class="aviso-pendientes">
                <i class="bi bi-exclamation-circle me-1"></i>
                Tienes recomendaciones pendientes de gestionar
            </div>
        `;
        document.getElementById('fase1').classList.add('d-none');
        document.getElementById('fase2').classList.remove('d-none');
        renderCards();
        actualizarBoton();
    }
}

cargarPendientes();