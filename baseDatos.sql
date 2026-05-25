-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-05-2026 a las 20:46:07
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tfg`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activities`
--

CREATE TABLE `activities` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `category_id` int(11) NOT NULL,
  `energy_level` varchar(10) DEFAULT NULL,
  `duration_minutes` int(11) NOT NULL,
  `indoor` tinyint(1) NOT NULL,
  `individual` tinyint(1) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) DEFAULT 1,
  `estado` enum('borrador','propuesta','publicada') DEFAULT 'borrador',
  `created_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `activities`
--

INSERT INTO `activities` (`id`, `name`, `description`, `category_id`, `energy_level`, `duration_minutes`, `indoor`, `individual`, `created_at`, `activo`, `estado`, `created_by`) VALUES
(1, 'Meditación guiada', 'Sigue una sesión de meditación guiada para calmar la mente', 1, 'baja', 15, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(2, 'Respiración profunda', 'Practica ejercicios de respiración para reducir el estrés', 1, 'baja', 5, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(3, 'Salir a correr', 'Date una vuelta corriendo por tu barrio o parque cercano', 2, 'alta', 30, 0, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(4, 'Pasear al aire libre', 'Da un paseo tranquilo por un parque o zona natural', 2, 'baja', 20, 0, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(5, 'Dibujar o pintar', 'Expresa tu creatividad mediante el dibujo o la pintura', 3, 'baja', 30, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(6, 'Escribir en un diario', 'Escribe tus pensamientos y sentimientos del día', 3, 'baja', 15, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(7, 'Quedar con amigos', 'Queda con tus amigos para tomar algo o charlar', 4, 'media', 60, 0, 0, '2026-05-14 16:00:37', 1, 'publicada', 1),
(8, 'Llamar a un familiar', 'Llama a un familiar con el que no hayas hablado últimamente', 4, 'baja', 20, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(9, 'Preparar tu comida favorita', 'Cocina tu plato favorito y disfrútalo', 5, 'media', 45, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(10, 'Escuchar música relajante', 'Pon tu lista de reproducción favorita y desconecta', 5, 'baja', 20, 1, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(11, 'Visitar un parque natural', 'Pasa un rato en la naturaleza y desconecta del día a día', 6, 'media', 60, 0, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(12, 'Observar el amanecer o atardecer', 'Busca un lugar con buenas vistas y disfruta del momento', 6, 'baja', 30, 0, 1, '2026-05-14 16:00:37', 1, 'publicada', 1),
(15, 'Pilates', 'Sesión de pilates para fortalecer el core', 2, 'media', 45, 1, 1, '2026-05-14 17:45:30', 1, 'publicada', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `recommendation_id` int(11) DEFAULT NULL,
  `emotion_before_id` int(11) DEFAULT NULL,
  `emotion_after_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `rating` tinyint(4) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categories`
--

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Relajación'),
(2, 'Actividad física'),
(3, 'Creatividad'),
(4, 'Social'),
(5, 'Bienestar'),
(6, 'Naturaleza');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conexiones`
--

CREATE TABLE `conexiones` (
  `id` int(11) NOT NULL,
  `solicitante_id` int(11) NOT NULL,
  `receptor_id` int(11) NOT NULL,
  `estado` enum('pendiente','aceptada','bloqueada') NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `bloqueador_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `emotion_logs`
--

CREATE TABLE `emotion_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `emotion` tinyint(4) NOT NULL,
  `intensity` tinyint(4) NOT NULL,
  `energy_level` varchar(10) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `valence` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recomendaciones_sociales`
--

CREATE TABLE `recomendaciones_sociales` (
  `id` int(11) NOT NULL,
  `remitente_id` int(11) NOT NULL,
  `destinatario_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `mensaje` varchar(300) DEFAULT NULL,
  `estado` enum('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recommendations`
--

CREATE TABLE `recommendations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `emotion_id` int(11) NOT NULL,
  `score` float NOT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `aceptada` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recommendation_config`
--

CREATE TABLE `recommendation_config` (
  `id` int(11) NOT NULL,
  `param` varchar(50) NOT NULL,
  `value` int(11) NOT NULL DEFAULT 1,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `recommendation_config`
--

INSERT INTO `recommendation_config` (`id`, `param`, `value`, `description`) VALUES
(1, 'emotion_weight', 3, 'Compatibilidad entre estado emocional, valencia e intensidad con la actividad'),
(2, 'energy_weight', 2, 'Match entre nivel de energía del usuario y el requerido por la actividad'),
(3, 'personal_history', 4, 'Mejora previa en el estado emocional del usuario con esta actividad'),
(4, 'global_history', 2, 'Mejora global en el estado emocional de los usuarios con esta actividad'),
(5, 'exploration', 2, 'Penalización por recomendar actividades repetidas recientemente'),
(6, 'affinity', 1, 'Combinación de frecuencia de realización y valoración personal');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `saved_activities`
--

CREATE TABLE `saved_activities` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `activity_id` int(11) NOT NULL,
  `recommendation_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) UNSIGNED NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `apellidos` varchar(100) DEFAULT NULL,
  `pais` varchar(100) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `admin` tinyint(1) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `nombre`, `apellidos`, `pais`, `ciudad`, `email`, `password`, `admin`, `activo`, `created_at`, `foto`) VALUES
(1, NULL, NULL, NULL, NULL, 'admin@test.com', '$2b$10$T/d7q3vjlTuiJO4vcVY6feVDxInFAfZN0nji1e809M7GcRLfA3DHC', 1, 1, '2026-05-14 15:49:55', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indices de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recommendation_id` (`recommendation_id`),
  ADD KEY `emotion_before_id` (`emotion_before_id`),
  ADD KEY `emotion_after_id` (`emotion_after_id`),
  ADD KEY `idx_user_activity` (`user_id`,`created_at`),
  ADD KEY `idx_activity_log` (`activity_id`);

--
-- Indices de la tabla `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `conexiones`
--
ALTER TABLE `conexiones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_conexion` (`solicitante_id`,`receptor_id`),
  ADD KEY `idx_conexiones_receptor` (`receptor_id`,`estado`),
  ADD KEY `idx_conexiones_solicitante` (`solicitante_id`,`estado`),
  ADD KEY `bloqueador_id` (`bloqueador_id`);

--
-- Indices de la tabla `emotion_logs`
--
ALTER TABLE `emotion_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_emotion` (`user_id`,`created_at`);

--
-- Indices de la tabla `recomendaciones_sociales`
--
ALTER TABLE `recomendaciones_sociales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `remitente_id` (`remitente_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `idx_recsocial_destinatario` (`destinatario_id`,`estado`);

--
-- Indices de la tabla `recommendations`
--
ALTER TABLE `recommendations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `emotion_id` (`emotion_id`),
  ADD KEY `idx_user_recommendations` (`user_id`,`created_at`),
  ADD KEY `idx_activity_recommendation` (`activity_id`);

--
-- Indices de la tabla `recommendation_config`
--
ALTER TABLE `recommendation_config`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `saved_activities`
--
ALTER TABLE `saved_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `activity_id` (`activity_id`),
  ADD KEY `recommendation_id` (`recommendation_id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `conexiones`
--
ALTER TABLE `conexiones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `emotion_logs`
--
ALTER TABLE `emotion_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recomendaciones_sociales`
--
ALTER TABLE `recomendaciones_sociales`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recommendations`
--
ALTER TABLE `recommendations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `recommendation_config`
--
ALTER TABLE `recommendation_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `saved_activities`
--
ALTER TABLE `saved_activities`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_logs_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  ADD CONSTRAINT `activity_logs_ibfk_3` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `activity_logs_ibfk_4` FOREIGN KEY (`emotion_before_id`) REFERENCES `emotion_logs` (`id`),
  ADD CONSTRAINT `activity_logs_ibfk_5` FOREIGN KEY (`emotion_after_id`) REFERENCES `emotion_logs` (`id`);

--
-- Filtros para la tabla `conexiones`
--
ALTER TABLE `conexiones`
  ADD CONSTRAINT `conexiones_ibfk_1` FOREIGN KEY (`solicitante_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conexiones_ibfk_2` FOREIGN KEY (`receptor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conexiones_ibfk_3` FOREIGN KEY (`bloqueador_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `emotion_logs`
--
ALTER TABLE `emotion_logs`
  ADD CONSTRAINT `emotion_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recomendaciones_sociales`
--
ALTER TABLE `recomendaciones_sociales`
  ADD CONSTRAINT `recomendaciones_sociales_ibfk_1` FOREIGN KEY (`remitente_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recomendaciones_sociales_ibfk_2` FOREIGN KEY (`destinatario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recomendaciones_sociales_ibfk_3` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `recommendations`
--
ALTER TABLE `recommendations`
  ADD CONSTRAINT `recommendations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recommendations_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`),
  ADD CONSTRAINT `recommendations_ibfk_3` FOREIGN KEY (`emotion_id`) REFERENCES `emotion_logs` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `saved_activities`
--
ALTER TABLE `saved_activities`
  ADD CONSTRAINT `saved_activities_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_activities_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `saved_activities_ibfk_3` FOREIGN KEY (`recommendation_id`) REFERENCES `recommendations` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
