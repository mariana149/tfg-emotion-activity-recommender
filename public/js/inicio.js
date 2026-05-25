const emotionMap = {
    1: { label: 'Feliz', emoji: '😊' },
    2: { label: 'Calma', emoji: '😌' },
    3: { label: 'Neutral', emoji: '😐' },
    4: { label: 'Triste', emoji: '😔' },
    5: { label: 'Estrés', emoji: '😣' },
    6: { label: 'Ansiedad', emoji: '😰' }
};

async function cargarInicio() {
    const [rStats, rEmocion, rRecomendacion] = await Promise.allSettled([
        fetch('/api/usuario/stats'),
        fetch('/api/emociones/last'),
        fetch('/api/recomendacion/last')
    ]);

    if (rStats.status === 'fulfilled' && rStats.value.ok) {
        const d = await rStats.value.json();
        if (d.success) {
            document.getElementById('statEmociones').textContent = d.data.emociones;
            document.getElementById('statActividades').textContent = d.data.realizadas;
            document.getElementById('statRecomendaciones').textContent = d.data.recomendaciones;
            document.getElementById('statConexiones').textContent = d.data.conexiones;
        }
    }

    if (rEmocion.status === 'fulfilled' && rEmocion.value.ok) {
        const d = await rEmocion.value.json();
        if (d.success && d.data) {
            const e = d.data;
            const map = emotionMap[e.emotion] || { label: e.emotion, emoji: '😐' };
            document.getElementById('ultimaEmocion').innerHTML = `
                <div class="d-flex align-items-center gap-3">
                    <div style="font-size:2.5rem;">${map.emoji}</div>
                    <div>
                        <div class="fw-500">${map.label}</div>
                        <small class="text-muted">Intensidad ${e.intensity}/5 · Energía ${e.energy_level}</small><br>
                        <small class="text-muted">${new Date(e.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })}</small>
                    </div>
                </div>
                ${e.notes ? `<p class="text-muted small mt-2 mb-0">${e.notes}</p>` : ''}
            `;
        } else {
            document.getElementById('ultimaEmocion').innerHTML =
                `<p class="text-muted mb-2">Aún no has registrado ninguna emoción.</p>`;
        }
    } else {
        document.getElementById('ultimaEmocion').innerHTML =
            `<p class="text-muted mb-2">Aún no has registrado ninguna emoción.</p>`;
    }

    if (rRecomendacion.status === 'fulfilled' && rRecomendacion.value.ok) {
        const d = await rRecomendacion.value.json();
        if (d.success && d.data) {
            const r = d.data;
            document.getElementById('ultimaRecomendacion').innerHTML = `
                <div class="fw-500 mb-1">${r.activity_name}</div>
                <small class="text-muted">${r.aceptada ? 'Aceptada' : 'Rechazada'} · ${new Date(r.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'long' })}</small>
                <div class="mt-2">
                    <a href="/actividades" class="btn btn-sm gradient-custom text-dark">Ver actividades</a>
                </div>
            `;
        } else {
            document.getElementById('ultimaRecomendacion').innerHTML =
                `<p class="text-muted mb-2">Aún no tienes recomendaciones.</p>`;
        }
    } else {
        document.getElementById('ultimaRecomendacion').innerHTML =
            `<p class="text-muted mb-2">Aún no tienes recomendaciones.</p>`;
    }
}

cargarInicio();