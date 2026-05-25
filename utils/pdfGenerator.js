const puppeteer = require('puppeteer');

function seccion(titulo, icono, contenido) {
    return `<div class="seccion"><h2 class="sec-titulo">${icono} ${titulo}</h2>${contenido}</div>`;
}

function tabla(headers, rows) {
    if (!rows || rows.length === 0) {
        return `<p class="sin-datos">Sin datos suficientes.</p>`;
    }
    const ths = headers.map(h => `<th>${h}</th>`).join('');
    const trs = rows.map((row, i) =>
        `<tr class="${i % 2 === 0 ? 'par' : ''}">${row.map(c => `<td>${c ?? '-'}</td>`).join('')}</tr>`
    ).join('');
    return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function kpi(valor, label, color = '#16a34a') {
    return `<div class="kpi"><div class="kpi-val" style="color:${color}">${valor ?? '-'}</div><div class="kpi-lbl">${label}</div></div>`;
}

function badge(texto, color) {
    return `<span style="background:${color};color:white;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700">${texto}</span>`;
}

function insightBox(ins) {
    const c = {
        success: { bg:'#f0fdf4', border:'#16a34a', text:'#166534' },
        info:    { bg:'#eff6ff', border:'#2563eb', text:'#1e40af' },
        warning: { bg:'#fffbeb', border:'#f59e0b', text:'#92400e' },
        danger:  { bg:'#fef2f2', border:'#dc2626', text:'#991b1b' },
    }[ins.tipo] || { bg:'#f9fafb', border:'#6b7280', text:'#374151' };

    return `
        <div style="background:${c.bg};border-left:4px solid ${c.border};padding:10px 14px;border-radius:4px;margin-bottom:10px">
            <div style="font-weight:700;color:${c.text};margin-bottom:3px">${ins.icono} ${ins.titulo}</div>
            <div style="font-size:9px;color:#374151;margin-bottom:4px">${ins.mensaje}</div>
            <div style="font-size:9px;color:${c.text}"><strong>→</strong> ${ins.recomendacion}</div>
        </div>`;
}

const CSS = `
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Segoe UI',Arial,sans-serif; font-size:11px; color:#111; background:white; }

.portada { background:linear-gradient(135deg,#16a34a,#0d9488); color:white; padding:60px 50px; min-height:297mm; display:flex; flex-direction:column; justify-content:center; }
.portada h1 { font-size:46px; font-weight:800; margin-bottom:6px; }
.portada .sub { font-size:18px; opacity:.85; margin-bottom:4px; }
.portada .fecha { font-size:12px; opacity:.6; margin-bottom:8px; }
.portada .periodo { font-size:11px; opacity:.8; background:rgba(255,255,255,.15); display:inline-block; padding:4px 12px; border-radius:20px; margin-bottom:40px; }
.portada hr { border:none; border-top:1px solid rgba(255,255,255,.25); margin:20px 0; }
.portada .resumen { font-size:13px; line-height:1.7; opacity:.9; margin-bottom:30px; }
.grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.stat-port { background:rgba(255,255,255,.15); border-radius:10px; padding:18px; text-align:center; }
.stat-port .val { font-size:28px; font-weight:800; }
.stat-port .lbl { font-size:10px; opacity:.75; margin-top:3px; }

.contenido { padding:50px 55px; }
.seccion { margin-bottom:36px; }
.sec-titulo { font-size:14px; font-weight:700; color:#16a34a; border-bottom:2px solid #dcfce7; padding-bottom:5px; margin-bottom:12px; }

.kpis { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
.kpi { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 14px; text-align:center; flex:1; min-width:80px; }
.kpi-val { font-size:20px; font-weight:800; }
.kpi-lbl { font-size:8px; color:#6b7280; text-transform:uppercase; letter-spacing:.5px; margin-top:2px; }

table { width:100%; border-collapse:collapse; margin-bottom:10px; font-size:10px; }
thead tr { background:#16a34a; color:white; }
th { padding:6px 8px; text-align:left; font-weight:600; }
td { padding:5px 8px; border-bottom:1px solid #f0f0f0; }
tr.par td { background:#f9fafb; }

.sin-datos { color:#9ca3af; font-size:10px; font-style:italic; margin-bottom:8px; }
.info-box { background:#f0fdf4; border-left:4px solid #16a34a; padding:8px 12px; border-radius:4px; margin-bottom:10px; font-size:9px; color:#166534; }
.warn-box { background:#fef2f2; border-left:4px solid #dc2626; padding:8px 12px; border-radius:4px; margin-bottom:10px; font-size:9px; color:#991b1b; }
.footer { text-align:center; font-size:9px; color:#9ca3af; margin-top:36px; padding-top:10px; border-top:1px solid #e5e7eb; }
.page-break { page-break-before:always; padding-top:40px; display:block; }
`;

function htmlPortada(datos) {
    const r = datos.resumen;
    const pctPos = r.total_emociones > 0
        ? Math.round((r.emociones_positivas / r.total_emociones) * 100) : 0;
    const pctNeg = r.total_emociones > 0
        ? Math.round((r.emociones_negativas / r.total_emociones) * 100) : 0;

    let resumen = `Esta aplicación web de bienestar emocional recomienda actividades personalizadas según el estado emocional del usuario. `;
    if (pctPos > pctNeg) {
        resumen += `En el período analizado se observa una tendencia positiva, con un ${pctPos}% de emociones positivas frente a un ${pctNeg}% negativas. `;
    } else if (pctNeg > pctPos) {
        resumen += `En el período analizado, el ${pctNeg}% de las emociones registradas son negativas, lo que indica que la plataforma está siendo utilizada en momentos de malestar emocional. `;
    }
   
    const conImpacto = datos.impactoActividades.filter(a => a.mejora_media !== null);
    if (conImpacto.length > 0) {
        const mediaGlobal = (conImpacto.reduce((s, a) => s + a.mejora_media, 0) / conImpacto.length).toFixed(2);
        if (!isNaN(mediaGlobal)) {
            resumen += `El algoritmo de recomendación muestra un impacto ${parseFloat(mediaGlobal) > 0 ? 'positivo' : 'limitado'} con una mejora media de ${mediaGlobal} puntos en el estado emocional.`;
        }
    }

    return `
        <div class="portada">
            <h1>Informe General del Sistema</h1>
            <div class="sub">Estadísticas y análisis de la plataforma</div>
            <div class="fecha">Generado el ${datos.generadoEn}</div>
            <div class="periodo">📅 ${datos.periodoAnalisis}</div>
            <hr>
            <div class="resumen">${resumen}</div>
            <div class="grid3">
                <div class="stat-port"><div class="val">${r.total_usuarios}</div><div class="lbl">Usuarios</div></div>
                <div class="stat-port"><div class="val">${r.total_emociones}</div><div class="lbl">Registros emocionales</div></div>
                <div class="stat-port"><div class="val">${r.total_realizaciones}</div><div class="lbl">Actividades realizadas</div></div>
                <div class="stat-port"><div class="val">${pctPos}%</div><div class="lbl">Emociones positivas</div></div>
                <div class="stat-port"><div class="val">${pctNeg}%</div><div class="lbl">Emociones negativas</div></div>
                <div class="stat-port"><div class="val">${r.total_recomendaciones}</div><div class="lbl">Recomendaciones</div></div>
            </div>
        </div>`;
}

function htmlResumen(datos) {
    const r   = datos.resumen;
    const eng = datos.engagement;
    return seccion('Estadísticas clave', '📊', `
        <div class="kpis">
            ${kpi(r.total_usuarios,       'Usuarios')}
            ${kpi(r.total_actividades,    'Actividades')}
            ${kpi(r.total_realizaciones,  'Realizaciones')}
            ${kpi(r.total_emociones,      'Emociones')}
            ${kpi(r.total_recomendaciones,'Recomendaciones')}
            ${kpi(r.total_conexiones,     'Conexiones')}
            ${kpi(r.valoracion_global ? r.valoracion_global + ' ⭐' : '-', 'Valoración global')}
            ${kpi(eng?.activos?.length ?? '-',    '🟢 Activos (7d)',    '#16a34a')}
            ${kpi(eng?.inactivos?.length ?? '-',  '🟡 Inactivos (7-30d)','#f59e0b')}
            ${kpi(eng?.abandonados?.length ?? '-','🔴 Abandonados (>30d)','#dc2626')}
        </div>
    `);
}

function htmlEmocionPredominante(datos) {
    // Agrupar por emoción
    const agrupado = {};
    datos.usuariosPorEmocion.forEach(u => {
        if (!agrupado[u.label]) agrupado[u.label] = [];
        agrupado[u.label].push(`${u.nombre} ${u.apellidos}`);
    });

    const rows = Object.entries(agrupado)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([label, usuarios]) => [
            label,
            usuarios.length,
            usuarios.join(', '),
        ]);

    return seccion('Usuarios por emoción predominante', '😊', `
        <div class="info-box">Emoción registrada con mayor frecuencia por cada usuario en toda su historia en la plataforma.</div>
        ${tabla(['Emoción', 'Nº usuarios', 'Usuarios'], rows)}
    `);
}

function htmlProblemasEmocionales(datos) {
    const { problemasEmocionales, resumen } = datos;
    const pct = resumen.total_usuarios > 0
        ? Math.round((problemasEmocionales.length / resumen.total_usuarios) * 100) : 0;

    if (problemasEmocionales.length === 0) {
        return seccion('Usuarios con indicadores de malestar emocional', '⚠️',
            `<div class="info-box">✓ No se detectan usuarios con indicadores de malestar en los últimos 7 días.</div>`
        );
    }

    const rows = problemasEmocionales.map(u => [
        `${u.nombre} ${u.apellidos}`,
        u.criterios.map(c => badge(c, u.criterios.length === 3 ? '#dc2626' : '#f59e0b')).join(' '),
        u.pct_negativas != null ? `${u.pct_negativas}%` : '-',
        u.valencia_media != null ? u.valencia_media : '-',
        u.tendencia || '-',
    ]);

    return seccion('Usuarios con indicadores de malestar emocional', '⚠️', `
        <div class="warn-box">
            <strong>${problemasEmocionales.length} usuario(s) (${pct}% del total)</strong> cumplen ≥2 de 3 criterios en los últimos 7 días:
            emociones negativas >50% · valencia media <-0.5 · tendencia negativa semanal.
        </div>
        ${tabla(['Usuario', 'Criterios cumplidos', '% Emoc. neg.', 'Valencia media', 'Tendencia'], rows)}
    `);
}

function htmlUsuariosActivos(datos) {
    const rows = datos.usuariosMasActivos.map((u, i) => [
        i + 1,
        `${u.nombre} ${u.apellidos}`,
        u.actividades_realizadas,
        u.actividades_distintas,
        u.valoracion_media ? `${u.valoracion_media} ⭐` : '-',
    ]);

    return seccion('Usuarios más activos', '🏆', `
        ${tabla(['#', 'Usuario', 'Realizaciones', 'Actividades únicas', 'Valoración media'], rows)}
    `);
}

function htmlImpacto(datos) {
    const { impactoActividades, efectividad } = datos;

    const rowsAct = impactoActividades.map(a => {
        const color = a.mejora_media > 0 ? '#16a34a' : '#dc2626';
        return [
            a.name,
            a.total,
            `<span style="color:${color};font-weight:700">${a.mejora_media > 0 ? '+' : ''}${a.mejora_media}</span>`,
            `${a.pct_mejora}%`,
            a.rating_medio ? `${a.rating_medio} ⭐` : '-',
        ];
    });

    return seccion('Impacto emocional y efectividad del algoritmo', '🎯', `
        <div class="kpis">
            ${kpi(efectividad.total,           'Recomendaciones')}
            ${kpi(efectividad.aceptadas,       'Aceptadas',  '#16a34a')}
            ${kpi(efectividad.rechazadas,      'Rechazadas', '#dc2626')}
            ${kpi((efectividad.pct_aceptacion ?? 0) + '%', '% Aceptación', '#2563eb')}
        </div>
        <div class="info-box">La mejora de valence indica el cambio en el estado emocional tras la actividad (rango -10 a +5). Valores positivos indican mejora.</div>
        ${tabla(['Actividad', 'Realizaciones con datos', 'Mejora valence', '% usuarios mejoran', 'Rating'], rowsAct)}
    `);
}

function htmlEngagement(datos) {
    const { engagement } = datos;
    const total = engagement.total || 1;

    const pctAct  = Math.round((engagement.activos.length    / total) * 100);
    const pctInac = Math.round((engagement.inactivos.length  / total) * 100);
    const pctAban = Math.round((engagement.abandonados.length / total) * 100);
    const pctSin  = Math.round((engagement.sinUso.length     / total) * 100);

    return seccion('Engagement de usuarios', '📈', `
        <div class="kpis">
            ${kpi(`${engagement.activos.length} (${pctAct}%)`,     '🟢 Activos ≤7d',     '#16a34a')}
            ${kpi(`${engagement.inactivos.length} (${pctInac}%)`,  '🟡 Inactivos 7-30d', '#f59e0b')}
            ${kpi(`${engagement.abandonados.length} (${pctAban}%)`,'🔴 Abandonados >30d','#dc2626')}
            ${kpi(`${engagement.sinUso.length} (${pctSin}%)`,      '⚪ Sin uso',          '#6b7280')}
        </div>
    `);
}

function htmlInsights(datos) {
    if (!datos.insights || datos.insights.length === 0) {
        return seccion('Insights y recomendaciones', '🧠',
            `<div class="info-box">Se necesitan al menos 25 registros emocionales para generar insights automáticos.</div>`
        );
    }
    return seccion('Insights automáticos y recomendaciones', '🧠',
        datos.insights.map(i => insightBox(i)).join('')
    );
}

function generarHTML(datos) {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>${CSS}</style></head>
<body>
    ${htmlPortada(datos)}
    <div class="contenido">
        ${htmlResumen(datos)}
        <div class="page-break"></div>
        ${htmlEmocionPredominante(datos)}
        ${htmlProblemasEmocionales(datos)}
        <div class="page-break"></div>
        ${htmlUsuariosActivos(datos)}
        ${htmlImpacto(datos)}
        <div class="page-break"></div>
        ${htmlEngagement(datos)}
        ${htmlInsights(datos)}
        <div class="footer">Informe generado automáticamente · ${datos.generadoEn}</div>
    </div>
</body>
</html>`;
}

async function generarInformePDF(datos) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(generarHTML(datos), { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
        return pdf;
    } finally {
        await browser.close();
    }
}

module.exports = { generarInformePDF, generarHTML };