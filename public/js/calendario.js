document.addEventListener("DOMContentLoaded", async function () {

    const calendarEl = document.getElementById("calendar");

    const response = await fetch("/api/emociones");
    const data = await response.json();

    const emotionMap = {
        1: { label: "Feliz", emoji: "😊", color: "#16a34a" },
        2: { label: "Calma", emoji: "😌", color: "#0891b2" },
        3: { label: "Neutral", emoji: "😐", color: "#6b7280" },
        4: { label: "Triste", emoji: "😔", color: "#7c3aed" },
        5: { label: "Estrés", emoji: "😣", color: "#f59e0b" },
        6: { label: "Ansiedad", emoji: "😰", color: "#dc2626" },
    };

    const eventos = data.map(e => ({
        title: emotionMap[e.emotion]?.emoji + " " + emotionMap[e.emotion]?.label,
        start: e.created_at,
        backgroundColor: emotionMap[e.emotion]?.color,
        borderColor: emotionMap[e.emotion]?.color,
        extendedProps: {
            emotion: e.emotion,
            intensity: e.intensity,
            energy: e.energy_level,
            notes: e.notes,
            fecha: e.created_at,
        }
    }));

    const modalDetalle = new bootstrap.Modal(document.getElementById('modalDetalleEmocion'));

    function abrirDetalle(event) {
        const popover = document.querySelector('.fc-popover');
        if (popover) popover.style.display = 'none';
        const p = event.extendedProps;
        const em = emotionMap[p.emotion];
        const fecha = new Date(p.fecha).toLocaleString('es-ES', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        document.getElementById('detalleEstado').innerHTML =
            `<span class="badge rounded-pill" style="background:${em.color};font-size:14px">${em.emoji} ${em.label}</span>`;
        document.getElementById('detalleIntensidad').textContent = p.intensity + ' / 5';
        document.getElementById('detalleEnergia').textContent = p.energy || '—';
        document.getElementById('detalleNotas').textContent = p.notes  || 'Sin notas';
        document.getElementById('detalleFecha').textContent = fecha;

        modalDetalle.show();
    }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        height: 'auto',
        dayMaxEvents: 3,
        events: eventos,

        eventClick: function(info) {
            abrirDetalle(info.event);
        }
    });

    calendar.render();
});