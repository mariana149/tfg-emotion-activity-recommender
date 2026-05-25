document.addEventListener("DOMContentLoaded", async function(){

    // EVOLUCIÓN
    const res1 = await fetch("/api/emociones/evolucion");
    const json1 = await res1.json();
    const evolucion = json1.data;
    const labels = evolucion.map(e => {
        const fecha = new Date(e.date);
        return fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', month: 'short', 
            hour: '2-digit', minute: '2-digit' 
        });
    });
    const values = evolucion.map(e => e.valence * e.intensity);

    new Chart(document.getElementById("graficaEvolucion"), {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Estado emocional",
                data: values,
                tension: 0.4,
                fill: true,
                backgroundColor: "rgba(132, 250, 176, 0.15)",
                borderColor: "#0F6E56",
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: "#0F6E56",
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { display: false }
                }
            }
        }
    });

    // mapa de emociones
    const emotionMap = {
        1: "😊 Feliz",
        2: "😌 Calma",
        3: "😐 Neutral",
        4: "😔 Triste",
        5: "😣 Estrés",
        6: "😰 Ansiedad"
    };

    // DISTRIBUCIÓN
    const res2 = await fetch("/api/emociones/distribucion");
    const json2 = await res2.json();
    const distribucion = json2.data;

    new Chart(document.getElementById("graficaDistribucion"),{

        type:"pie",

        data:{
            labels: distribucion.map(e => emotionMap[e.emotion]),
            datasets:[{
                data: distribucion.map(e => e.total)
            }]
        },

        options:{
            responsive:true,
            maintainAspectRatio:false
        }

    });

});