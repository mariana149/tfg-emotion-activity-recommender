const AdminDAO          = require('../dao/AdminDAO');
const RecommendationDAO = require('../dao/RecommendationDAO');
const emotionLabels = { 1:'Feliz', 2:'Calma', 3:'Neutral', 4:'Triste', 5:'Estrés', 6:'Ansiedad' };
const diasSemana = { 1:'Domingo', 2:'Lunes', 3:'Martes', 4:'Miércoles', 5:'Jueves', 6:'Viernes', 7:'Sábado' };

class AdminService {

    static async getDashboardStats() {
        const [
            usuarios,
            actividades,
            valoracionMedia,
            mejorActividad,
            totalEmociones,
            emocionFrecuente,
            totalRecomendaciones,
            totalRealizadas,
            impactoPositivo
        ] = await Promise.allSettled([
            AdminDAO.getTotalUsuarios(),
            AdminDAO.getTotalActividades(),
            AdminDAO.getValoracionMedia(),
            AdminDAO.getMejorActividad(),
            AdminDAO.getTotalEmociones(),
            AdminDAO.getEmocionMasFrecuente(),
            AdminDAO.getTotalRecomendaciones(),
            AdminDAO.getTotalActividadesRealizadas(),
            AdminDAO.getImpactoPositivo()
        ]);

        return {
            usuarios: usuarios.status === 'fulfilled' ? usuarios.value : { total: 0, activos: 0 },
            actividades: actividades.status === 'fulfilled' ? actividades.value : { total: 0, activas: 0 },
            valoracionMedia: valoracionMedia.status === 'fulfilled' ? valoracionMedia.value : 0,
            mejorActividad: mejorActividad.status === 'fulfilled' ? mejorActividad.value : null,
            totalEmociones: totalEmociones.status === 'fulfilled' ? totalEmociones.value : 0,
            emocionFrecuente: emocionFrecuente.status === 'fulfilled' ? emocionFrecuente.value : null,
            totalRecomendaciones: totalRecomendaciones.status === 'fulfilled' ? totalRecomendaciones.value : 0,
            totalRealizadas: totalRealizadas.status === 'fulfilled' ? totalRealizadas.value : 0,
            impactoPositivo: impactoPositivo.status === 'fulfilled' ? impactoPositivo.value : 0
        };
    }

    static async getGraficas() {
        const [evolucion, distribucion, impacto] = await Promise.allSettled([
            AdminDAO.getEvolucionEmocional(30),
            AdminDAO.getDistribucionEmociones(),
            AdminDAO.getImpactoActividades()
        ]);

        return {
            evolucion: evolucion.status === 'fulfilled' ? evolucion.value : [],
            distribucion: distribucion.status === 'fulfilled' ? distribucion.value : [],
            impacto: impacto.status === 'fulfilled' ? impacto.value : []
        };
    }

    static async getAllUsuarios() {
        return await AdminDAO.getAllUsuarios();
    }

    static async activarUsuario(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await AdminDAO.activarUsuario(id);
    }

    static async desactivarUsuario(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await AdminDAO.desactivarUsuario(id);
    }

    static async getStatsUsuario(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await AdminDAO.getStatsUsuario(id);
    }

    static async getUsuarioById(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await AdminDAO.getUsuarioById(id);
    }

    static async getStatsActividad(id) {
        if (!id) throw new Error('INVALID_DATA');
        return await AdminDAO.getStatsActividad(id);
    }

    static async getConfig() {
        return await RecommendationDAO.getConfig();
    }

    static async updateConfig(params) {
        if (!params || typeof params !== 'object')
            throw new Error('INVALID_DATA');

        const validParams = [
            'emotion_weight', 'energy_weight', 'personal_history',
            'global_history', 'exploration', 'affinity'
        ];

        for (const [param, value] of Object.entries(params)) {
            if (!validParams.includes(param))
                throw new Error('INVALID_PARAM');

            const numValue = parseInt(value);
            if (isNaN(numValue) || numValue < 1 || numValue > 10)
                throw new Error('INVALID_VALUE');

            await RecommendationDAO.updateConfig(param, numValue);
        }

        return true;
    }

    static async getUsuariosProblemasEmocionales() {
        const [negativasFrecuentes, valenciaBaja, tendenciaNegativa] = await Promise.all([
            AdminDAO.getUsuariosEmocionesNegativas(),
            AdminDAO.getUsuariosValenciaBaja(),
            AdminDAO.getMediaSemanalPorUsuario(),
        ]);

        const mapa = new Map();

        const agregar = (u, criterio, extras = {}) => {
            if (!mapa.has(u.id)) {
                mapa.set(u.id, {
                    id: u.id, nombre: u.nombre, apellidos: u.apellidos,
                    criterios: [], pct_negativas: null,
                    valencia_media: null, tendencia: null,
                });
            }
            const entry = mapa.get(u.id);
            entry.criterios.push(criterio);
            Object.assign(entry, extras);
        };

        negativasFrecuentes.forEach(u => agregar(u, 'Emoc. negativas >50%', { pct_negativas: u.pct_negativas }));
        valenciaBaja.forEach(u => agregar(u, 'Valencia media <-0.5', { valencia_media: u.valencia_media }));
        tendenciaNegativa.forEach(u => agregar(u, 'Tendencia negativa', {
            tendencia: `${u.media_semana_anterior} → ${u.media_esta_semana}`
        }));

        return [...mapa.values()]
            .filter(u => u.criterios.length >= 2)
            .sort((a, b) => b.criterios.length - a.criterios.length);
    }

    static async generarInsights(datos) {
        const insights = [];
        const { resumen, impactoActividades, efectividad, engagement, problemasEmocionales } = datos;

        // Umbral mínimo global
        if ((resumen.total_emociones || 0) < 10) return [];

        // Impacto positivo global
        const conDatos = impactoActividades.filter(a => a.mejora_media !== null);
        if (conDatos.length > 0) {
            const mediaGlobal = conDatos.reduce((s, a) => s + a.mejora_media, 0) / conDatos.length;
            if (mediaGlobal > 0.3) {
                insights.push({
                    tipo: 'success', icono: '✅',
                    titulo: 'Impacto positivo significativo',
                    mensaje: `Las actividades mejoran el estado emocional de los usuarios con una media de +${mediaGlobal.toFixed(2)} puntos de valence.`,
                    recomendacion: 'Continuar promoviendo el uso de actividades y reforzar el catálogo.',
                });
            } else if (mediaGlobal <= 0) {
                insights.push({
                    tipo: 'warning', icono: '⚠️',
                    titulo: 'Impacto emocional bajo',
                    mensaje: `La mejora media tras realizar actividades es de ${mediaGlobal.toFixed(2)} puntos. Las actividades no generan el impacto positivo esperado.`,
                    recomendacion: 'Revisar el catálogo de actividades y ajustar los pesos del algoritmo.',
                });
            }
        }

        // Efectividad del algoritmo
        if (efectividad.total > 0 && efectividad.pct_aceptacion !== null) {
            if (efectividad.pct_aceptacion > 60) {
                insights.push({
                    tipo: 'success', icono: '🎯',
                    titulo: 'Alto índice de aceptación de recomendaciones',
                    mensaje: `El ${efectividad.pct_aceptacion}% de las recomendaciones son aceptadas por los usuarios. El algoritmo está funcionando bien.`,
                    recomendacion: 'Mantener la configuración actual del motor de recomendación.',
                });
            } else if (efectividad.pct_aceptacion < 30) {
                insights.push({
                    tipo: 'warning', icono: '🎯',
                    titulo: 'Bajo índice de aceptación',
                    mensaje: `Solo el ${efectividad.pct_aceptacion}% de las recomendaciones son aceptadas. El algoritmo puede no estar ajustado correctamente.`,
                    recomendacion: 'Revisar los pesos del motor de recomendación en el panel de configuración.',
                });
            }
        }

        // Usuarios en riesgo
        if (resumen.total_usuarios >= 10) {
            const pct = Math.round((problemasEmocionales.length / resumen.total_usuarios) * 100);
            if (pct > 35) {
                insights.push({
                    tipo: 'danger', icono: '🚨',
                    titulo: 'Alto porcentaje de usuarios en riesgo',
                    mensaje: `El ${pct}% de usuarios presenta indicadores de malestar emocional sostenido.`,
                    recomendacion: 'Implementar notificaciones personalizadas para estos usuarios.',
                });
            } else if (pct > 20) {
                insights.push({
                    tipo: 'warning', icono: '⚠️',
                    titulo: 'Usuarios con malestar emocional detectado',
                    mensaje: `El ${pct}% de usuarios presenta indicadores de malestar en los últimos 7 días.`,
                    recomendacion: 'Considerar notificaciones de seguimiento y ajustar recomendaciones.',
                });
            }
        }

        // Emociones negativas globales
        const totalEmo = (resumen.emociones_positivas || 0) + (resumen.emociones_negativas || 0);
        if (totalEmo > 0) {
            const pctNeg = Math.round((resumen.emociones_negativas / resumen.total_emociones) * 100);
            if (pctNeg > 60) {
                insights.push({
                    tipo: 'danger', icono: '😟',
                    titulo: 'Alta carga emocional negativa',
                    mensaje: `El ${pctNeg}% de los registros emocionales son negativos (tristeza, estrés o ansiedad).`,
                    recomendacion: 'Priorizar actividades de relajación y bienestar en las recomendaciones.',
                });
            } else if (pctNeg > 40) {
                insights.push({
                    tipo: 'warning', icono: '😐',
                    titulo: 'Proporción elevada de emociones negativas',
                    mensaje: `El ${pctNeg}% de los registros emocionales son negativos. Conviene monitorizar su evolución.`,
                    recomendacion: 'Incrementar la frecuencia de recomendaciones de actividades con alto impacto positivo.',
                });
            }
        }

        // Engagement
        if (engagement) {
            const pctAct  = Math.round((engagement.activos.length / engagement.total) * 100);
            const pctAban = Math.round((engagement.abandonados.length / engagement.total) * 100);

            if (pctAban > 30) {
                insights.push({
                    tipo: 'warning', icono: '📉',
                    titulo: 'Alta tasa de abandono',
                    mensaje: `El ${pctAban}% de usuarios lleva más de 30 días sin usar la app.`,
                    recomendacion: 'Implementar notificaciones recordatorias y contenido nuevo para reactivar usuarios.',
                });
            }
            if (pctAct > 60) {
                insights.push({
                    tipo: 'success', icono: '🟢',
                    titulo: 'Alto nivel de engagement',
                    mensaje: `El ${pctAct}% de usuarios ha estado activo en los últimos 7 días.`,
                    recomendacion: 'Aprovechar el alto engagement para introducir nuevas funcionalidades.',
                });
            } else if (pctAct < 30) {
                insights.push({
                    tipo: 'warning', icono: '🔴',
                    titulo: 'Bajo nivel de engagement',
                    mensaje: `Solo el ${pctAct}% de usuarios ha estado activo en los últimos 7 días.`,
                    recomendacion: 'Revisar la experiencia de usuario y considerar notificaciones push.',
                });
            }
        }

        return insights;
    }

    static async getDatosExplotacion() {
        const emotionLabels = { 1:'Feliz', 2:'Calma', 3:'Neutral', 4:'Triste', 5:'Estrés', 6:'Ansiedad' };

        const [
            resumen,
            usuariosPorEmocion,
            usuariosMasActivos,
            impactoActividades,
            efectividad,
            engagement,
            problemasEmocionales,
        ] = await Promise.all([
            AdminDAO.getResumenGeneral(),
            AdminDAO.getUsuariosPorEmocionPredominante(),
            AdminDAO.getUsuariosMasActivos(10),
            AdminDAO.getImpactoEmocionalActividades(),
            AdminDAO.getEfectividadRecomendaciones(),
            AdminDAO.getEngagement(),
            AdminService.getUsuariosProblemasEmocionales(),
        ]);

        const usuariosPorEmocionConLabel = usuariosPorEmocion.map(u => ({
            ...u,
            label: emotionLabels[u.emotion] || `Emoción ${u.emotion}`,
        }));

        const datos = {
            resumen,
            usuariosPorEmocion: usuariosPorEmocionConLabel,
            usuariosMasActivos,
            impactoActividades,
            efectividad,
            engagement,
            problemasEmocionales,
            generadoEn: new Date().toLocaleString('es-ES'),
            periodoAnalisis: 'Últimos 30 días',
        };

        datos.insights = await AdminService.generarInsights(datos);
        return datos;
    }
}

module.exports = AdminService;