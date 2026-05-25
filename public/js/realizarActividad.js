const modalRealizar = new bootstrap.Modal(document.getElementById('modalRealizar'));

const emotionMapRealizar = {
    1: { label: 'Feliz', emoji: '😊' },
    2: { label: 'Calma', emoji: '😌' },
    3: { label: 'Neutral', emoji: '😐' },
    4: { label: 'Triste', emoji: '😔' },
    5: { label: 'Estrés', emoji: '😣' },
    6: { label: 'Ansiedad', emoji: '😰' }
};

const valenciaMap = { 1: 1, 2: 1, 3: 0, 4: -1, 5: -1, 6: -2 };

let realizarState = {
    actividadId: null,
    logId: null,
    esRecomendacion: false,
    recommendationId: null,
    emotionRecId: null,
    emotionBeforeId: null,
    emotionAfterId: null,
    energiaBefore: null,
    energiaAfter: null,
    intensidadBefore: null,
    intensidadAfter: null,
    rating: null,
    pasoActual: null
};

function mostrarPaso(paso) {
    ['paso1a', 'paso1b', 'paso2', 'paso3', 'paso4'].forEach(p =>
        document.getElementById(p).classList.add('d-none')
    );
    document.getElementById(paso).classList.remove('d-none');
    realizarState.pasoActual = paso;

    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnCancelar  = document.getElementById('btnCancelarRealizar');

    if (paso === 'paso1a') {
        btnSiguiente.classList.add('d-none');
    } else if (paso === 'paso4') {
        btnSiguiente.textContent = 'Cerrar';
        btnCancelar.classList.add('d-none');
    } else {
        btnSiguiente.classList.remove('d-none');
        btnSiguiente.textContent = 'Siguiente';
        btnCancelar.classList.remove('d-none');
    }
}

async function abrirModalRealizar(actividadId, nombre, recommendationId, emotionTipo, emotionIntensity, emotionEnergy) {
    realizarState = {
        actividadId,
        logId: null,
        esRecomendacion:  !!recommendationId,
        recommendationId: recommendationId || null,
        emotionRecTipo: emotionTipo || null,
        emotionRecIntensity: emotionIntensity || null,
        emotionRecEnergy: emotionEnergy || null,
        emotionBeforeId: null,
        emotionAfterId: null,
        energiaBefore: null,
        energiaAfter: null,
        intensidadBefore: null,
        intensidadAfter: null,
        rating: null,
        pasoActual: null
    };

    document.getElementById('realizarNombre').textContent = nombre;
    document.querySelectorAll('[name=emotionBefore]').forEach(r => r.checked = false);
    document.querySelectorAll('[name=emotionAfter]').forEach(r => r.checked = false);
    document.querySelectorAll('[name=rating]').forEach(r => r.checked = false);
    document.getElementById('energiaBefore').value = '';
    document.getElementById('energiaAfter').value  = '';
    document.getElementById('intensidadBefore').value = '3';
    document.getElementById('intensidadAfter').value  = '3';
    document.getElementById('lblIntensidadBefore').textContent = '3';
    document.getElementById('lblIntensidadAfter').textContent  = '3';
    document.getElementById('errorPaso1b').classList.add('d-none');
    document.getElementById('errorPaso2').classList.add('d-none');
    document.getElementById('errorPaso3').classList.add('d-none');
    document.getElementById('btnSiguiente').classList.remove('d-none');
    document.getElementById('btnCancelarRealizar').classList.remove('d-none');
    document.getElementById('btnSiguiente').textContent = 'Siguiente';

    if (realizarState.esRecomendacion && emotionTipo) {
        const emo = emotionMapRealizar[emotionTipo];
        document.getElementById('emocionRecomendacion').textContent = emo ? emo.emoji : '😐';
        document.getElementById('nombreEmocionRec').textContent = emo ? emo.label : '';
        document.getElementById('detalleIntensidadRec').textContent = emotionIntensity + '/5';
        document.getElementById('detalleEnergiaRec').textContent = emotionEnergy;
        mostrarPaso('paso1a');
    } else {
        mostrarPaso('paso1b');
    }

    modalRealizar.show();
}

document.getElementById('btnSigueSiendo').addEventListener('click', function() {
    realizarState.emotionBeforeId = realizarState.emotionRecTipo;
    realizarState.energiaBefore = realizarState.emotionRecEnergy;
    realizarState.intensidadBefore = realizarState.emotionRecIntensity;
    mostrarPaso('paso2');
});

document.getElementById('btnHaCambiado').addEventListener('click', function() {
    mostrarPaso('paso1b');
});

document.getElementById('btnSiguiente').addEventListener('click', async function() {
    const paso = realizarState.pasoActual;

    if (paso === 'paso1b') {
        const emotion = document.querySelector('[name=emotionBefore]:checked');
        const energia = document.getElementById('energiaBefore').value;
        const intensidad = parseInt(document.getElementById('intensidadBefore').value);
        if (!emotion || !energia) {
            document.getElementById('errorPaso1b').classList.remove('d-none');
            return;
        }
        document.getElementById('errorPaso1b').classList.add('d-none');
        realizarState.emotionBeforeId = parseInt(emotion.value);
        realizarState.energiaBefore = energia;
        realizarState.intensidadBefore = intensidad;
        mostrarPaso('paso2');

    } else if (paso === 'paso2') {
        const emotion = document.querySelector('[name=emotionAfter]:checked');
        const energia = document.getElementById('energiaAfter').value;
        const intensidad = parseInt(document.getElementById('intensidadAfter').value);
        if (!emotion || !energia) {
            document.getElementById('errorPaso2').classList.remove('d-none');
            return;
        }
        document.getElementById('errorPaso2').classList.add('d-none');
        realizarState.emotionAfterId = parseInt(emotion.value);
        realizarState.energiaAfter = energia;
        realizarState.intensidadAfter = intensidad;
        mostrarPaso('paso3');

    } else if (paso === 'paso3') {
        const rating = document.querySelector('[name=rating]:checked');
        if (!rating) {
            document.getElementById('errorPaso3').classList.remove('d-none');
            return;
        }
        document.getElementById('errorPaso3').classList.add('d-none');
        realizarState.rating = parseInt(rating.value);
        await finalizarActividad();
        mostrarResultado();
        mostrarPaso('paso4');

    } else if (paso === 'paso4') {
        modalRealizar.hide();
    }
});

async function finalizarActividad() {
    // 1. Registrar emoción before en emotion_logs
    const rEmoB = await fetch('/api/emociones/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emotion: realizarState.emotionBeforeId,
            intensity: realizarState.intensidadBefore,
            energy_level: realizarState.energiaBefore || 'media',
            notes: ''
        })
    });
    const dEmoB = await rEmoB.json();
    if (!dEmoB.success) { alert('Error al registrar emoción antes'); return; }

    // 2. Registrar emoción after en emotion_logs
    const rEmoA = await fetch('/api/emociones/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emotion: realizarState.emotionAfterId,
            intensity: realizarState.intensidadAfter,
            energy_level: realizarState.energiaAfter,
            notes: ''
        })
    });
    const dEmoA = await rEmoA.json();
    if (!dEmoA.success) { alert('Error al registrar emoción después'); return; }

    // 3. Crear activity_log completo
    const rStart = await fetch('/activity/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            activity_id: realizarState.actividadId,
            recommendation_id: realizarState.recommendationId || null,
            emotion_before_id: dEmoB.emotionId,
            emotion_after_id: dEmoA.emotionId,
            rating: realizarState.rating
        })
    });
    const dStart = await rStart.json();
    if (!dStart.success) { alert('Error al guardar la actividad'); return; }
    realizarState.logId = dStart.logId;
}

function mostrarResultado() {
    const vBefore = valenciaMap[realizarState.emotionBeforeId] ?? 0;
    const vAfter  = valenciaMap[realizarState.emotionAfterId]  ?? 0;
    const iBefore = realizarState.intensidadBefore || 3;
    const iAfter  = realizarState.intensidadAfter  || 3;

    const puntBefore = vBefore * iBefore;
    const puntAfter = vAfter * iAfter;
    const diff = puntAfter - puntBefore;

    let icono, texto, color;
    if (diff > 0) { icono = '✓'; texto = 'Tu bienestar ha mejorado'; color = 'text-success'; }
    else if (diff < 0) { icono = '↓'; texto = 'Tu bienestar ha empeorado'; color = 'text-danger';  }
    else { icono = '→'; texto = 'Tu bienestar no ha cambiado'; color = 'text-muted';   }

    document.getElementById('resultadoIcono').textContent = icono;
    document.getElementById('resultadoIcono').className = `${color} mb-2`;
    document.getElementById('resultadoTexto').textContent = texto;
    document.getElementById('resultadoTexto').className = `fw-500 ${color}`;
    document.dispatchEvent(new CustomEvent('actividadRealizada', { detail: { actividadId: realizarState.actividadId } }));
}