-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-06-2025 a las 01:58:55
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `tactical_ops_chile`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `achievements`
--

CREATE TABLE `achievements` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `requirement_type` varchar(50) NOT NULL,
  `requirement_value` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `achievements`
--

INSERT INTO `achievements` (`id`, `name`, `description`, `icon`, `requirement_type`, `requirement_value`, `created_at`) VALUES
(1, 'Primera Conexión', 'Te has registrado en la comunidad', 'user-plus', 'registration', 1, '2025-06-13 21:59:20'),
(2, 'Primera Victoria', 'Gana tu primera partida', 'trophy', 'wins', 1, '2025-06-13 21:59:20'),
(3, 'Francotirador', 'Consigue 50 eliminaciones con sniper', 'crosshair', 'sniper_kills', 50, '2025-06-13 21:59:20'),
(4, 'Veterano', 'Juega 100 partidas', 'shield', 'games_played', 100, '2025-06-13 21:59:20'),
(5, 'Leyenda', 'Alcanza el top 10 del ranking', 'crown', 'ranking_position', 10, '2025-06-13 21:59:20'),
(6, 'Asesino', 'Consigue 1000 eliminaciones', 'skull', 'kills', 1000, '2025-06-13 21:59:20'),
(7, 'Superviviente', 'Mantén una racha de 20 eliminaciones', 'heart', 'best_streak', 20, '2025-06-13 21:59:20'),
(8, 'Dedicado', 'Juega 100 horas', 'clock', 'hours_played', 100, '2025-06-13 21:59:20'),
(9, 'Imparable', 'Gana 50 partidas', 'zap', 'wins', 50, '2025-06-13 21:59:20'),
(10, 'Maestro', 'Mantén un K/D ratio superior a 2.0', 'star', 'kd_ratio', 200, '2025-06-13 21:59:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `banner_config`
--

CREATE TABLE `banner_config` (
  `id` int(11) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `banner_config`
--

INSERT INTO `banner_config` (`id`, `is_enabled`, `created_at`, `updated_at`) VALUES
(1, 1, '2025-06-18 23:29:22', '2025-06-18 23:29:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `banner_items`
--

CREATE TABLE `banner_items` (
  `id` int(11) NOT NULL,
  `banner_id` varchar(50) NOT NULL,
  `type` enum('image','video') NOT NULL,
  `url` text NOT NULL,
  `link` text DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `autoplay` tinyint(1) DEFAULT 1,
  `muted` tinyint(1) DEFAULT 1,
  `duration` int(11) DEFAULT 5,
  `object_fit` enum('cover','contain','fill','scale-down','none') DEFAULT 'cover',
  `object_position` varchar(50) DEFAULT 'center center',
  `scale_percent` int(11) DEFAULT 100,
  `brightness` int(11) DEFAULT 100,
  `contrast` int(11) DEFAULT 100,
  `blur` int(11) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `banner_items`
--

INSERT INTO `banner_items` (`id`, `banner_id`, `type`, `url`, `link`, `title`, `description`, `autoplay`, `muted`, `duration`, `object_fit`, `object_position`, `scale_percent`, `brightness`, `contrast`, `blur`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '1', 'image', 'https://i.ibb.co/Fbwqt0S7/Banner-Tacticaops.jpg?auto=compress&cs=tinysrgb&w=1920&h=600&fit=crop', NULL, '¡Bienvenido a Tactical Ops 3.5 Chile!', 'La comunidad más activa de Tactical Ops en Chile', 1, 1, 12000, 'cover', 'center center', 100, 100, 100, 0, 1, 0, '2025-06-18 23:29:22', '2025-06-20 21:15:16'),
(4, '1750300348947', 'image', 'https://vsthemes.org/uploads/posts/workshop/262040415363fdb5ef167ac214203567.webp', NULL, 'Prueba', '', 1, 1, 5, 'cover', 'center center', 100, 100, 100, 0, 2, 0, '2025-06-19 02:31:01', '2025-06-19 02:32:02'),
(5, '1750454094404', 'image', 'https://i.ibb.co/3m4J8tG6/36.png', NULL, 'Tactical ops', '', 1, 1, 14000, 'fill', 'center center', 100, 100, 100, 0, 1, 1, '2025-06-20 21:13:55', '2025-06-20 21:35:12'),
(6, '1750455283535', 'image', 'https://i.ibb.co/3m4J8tG6/36.png', NULL, 'Chile', '', 1, 1, 1200, 'cover', 'center center', 100, 100, 100, 0, 2, 1, '2025-06-20 21:33:36', '2025-06-20 21:35:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clans`
--

CREATE TABLE `clans` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `tag` varchar(20) NOT NULL,
  `icon` varchar(50) DEFAULT 'crown',
  `logo` text DEFAULT NULL,
  `leader_id` int(11) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `clans`
--

INSERT INTO `clans` (`id`, `name`, `tag`, `icon`, `logo`, `leader_id`, `description`, `created_at`, `updated_at`) VALUES
(3, 'Administracion', 'GM', 'crown', 'https://w7.pngwing.com/pngs/874/17/png-transparent-logo-clan-symbol-gray-wolf-symbol-miscellaneous-emblem-logo.png', NULL, 'Administradores de la comunidad', '2025-06-18 01:04:57', '2025-06-20 21:09:47'),
(4, 'Ases', 'AS', 'sword', 'https://i.ibb.co/mV1QFVxz/Ases.png', 2, 'Clan @aS', '2025-06-19 02:20:51', '2025-06-20 18:43:21'),
(5, 'SIR', 'SIR', 'shield', '', NULL, 'Sir', '2025-06-20 21:09:01', '2025-06-20 21:09:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clan_member_requests`
--

CREATE TABLE `clan_member_requests` (
  `id` int(11) NOT NULL,
  `clan_id` int(11) NOT NULL,
  `requested_by` int(11) NOT NULL,
  `target_user_id` int(11) NOT NULL,
  `action` enum('add','remove') NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comments`
--

CREATE TABLE `comments` (
  `id` int(11) NOT NULL,
  `news_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deletion_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `comments`
--

INSERT INTO `comments` (`id`, `news_id`, `user_id`, `content`, `is_deleted`, `deleted_by`, `deleted_at`, `deletion_reason`, `created_at`, `updated_at`) VALUES
(9, 3, 4, 'Bueeena los hijos del TRONKYNAZO', 0, NULL, NULL, NULL, '2025-06-14 22:24:25', '2025-06-14 22:24:25'),
(10, 3, 11, 'ponganle condon que se vieneee', 0, NULL, NULL, NULL, '2025-06-16 14:49:52', '2025-06-20 21:02:14'),
(11, 3, 11, 'ponganle condon que se vieene', 1, 2, '2025-06-19 02:12:52', 'Spam', '2025-06-16 14:52:04', '2025-06-19 02:12:52');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `forum_replies`
--

CREATE TABLE `forum_replies` (
  `id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `deleted_by` int(11) DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deletion_reason` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `forum_topics`
--

CREATE TABLE `forum_topics` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `is_locked` tinyint(1) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `replies_count` int(11) NOT NULL DEFAULT 0,
  `last_reply_at` timestamp NULL DEFAULT NULL,
  `last_reply_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `maps`
--

CREATE TABLE `maps` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `display_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `game_mode` varchar(100) DEFAULT NULL,
  `max_players` int(11) DEFAULT NULL,
  `difficulty` enum('easy','medium','hard','expert') DEFAULT 'medium',
  `environment` varchar(100) DEFAULT NULL,
  `size` enum('small','medium','large','extra_large') DEFAULT 'medium',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `maps`
--

INSERT INTO `maps` (`id`, `name`, `display_name`, `description`, `image_url`, `game_mode`, `max_players`, `difficulty`, `environment`, `size`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Dust2', 'TO-DUST2', 'Dust', 'https://i.ibb.co/Sw5BXTTc/IMG-5108.png', 'Bomb Defaul', 16, 'medium', 'Desierto', 'medium', 1, 2, '2025-06-23 23:26:39', '2025-06-23 23:26:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `from_user_id` int(11) NOT NULL,
  `to_user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `messages`
--

INSERT INTO `messages` (`id`, `from_user_id`, `to_user_id`, `content`, `is_read`, `created_at`) VALUES
(1, 2, 1, 'Yees', 0, '2025-06-13 23:24:32'),
(3, 2, 4, 'wekito', 0, '2025-06-14 17:44:21'),
(4, 2, 4, 'wekito', 0, '2025-06-14 17:44:31'),
(5, 2, 4, 'holi', 0, '2025-06-14 18:33:35'),
(6, 2, 4, 'gg', 0, '2025-06-14 18:46:34'),
(7, 2, 4, 'tronky', 0, '2025-06-14 19:28:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `news`
--

CREATE TABLE `news` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `image` text DEFAULT NULL,
  `author` varchar(50) NOT NULL,
  `is_pinned` tinyint(1) NOT NULL DEFAULT 0,
  `views` int(11) NOT NULL DEFAULT 0,
  `likes` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `news`
--

INSERT INTO `news` (`id`, `title`, `content`, `image`, `author`, `is_pinned`, `views`, `likes`, `created_at`, `updated_at`) VALUES
(3, 'Bienvenidos a nuestra comunidad', '¡Bienvenidos a Tactical Ops Chile Oficial!\n\nEsta plataforma es el punto de encuentro para nuestra comunidad, donde encontrarás las últimas noticias, información sobre matches y todo lo relacionado con el Torneo de Cell.\n\nRegístrate, personaliza tu perfil a tu gusto y forma parte de la acción. Actualmente seguimos mejorando el sitio, y muy pronto podrás unirte a clanes, enviar mensajes privados y disfrutar de muchas más funciones. ¡Mantente atento a las novedades!', 'https://i.ibb.co/ZR9skg1j/Torneo-Cell.jpg', 'StigmacL', 0, 0, 0, '2025-06-14 21:52:29', '2025-06-21 17:04:37'),
(5, 'Actualización ', 'Durante la jornada de hoy, se realizará una actualización importante en nuestra infraestructura: implementaremos una mejora a la versión 3.5 de nuestros servidores, optimizando el rendimiento y la experiencia de juego.\n\nAdemás, estarán disponibles nuevos servidores con la versión 3.4, incluyendo Arena 1 y Liga 1, para ampliar tus opciones y desafiarte en nuevos entornos competitivos.\n\n¡Gracias por seguir siendo parte de Tactical Ops!', 'https://i.ibb.co/Sw5BXTTc/IMG-5108.png', 'StigmacL', 1, 0, 0, '2025-06-21 17:04:30', '2025-06-21 17:04:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `news_likes`
--

CREATE TABLE `news_likes` (
  `id` int(11) NOT NULL,
  `news_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `news_likes`
--

INSERT INTO `news_likes` (`id`, `news_id`, `user_id`, `created_at`) VALUES
(6, 3, 11, '2025-06-16 14:49:37'),
(7, 3, 15, '2025-06-17 01:21:20'),
(8, 3, 17, '2025-06-17 02:24:19'),
(9, 3, 10, '2025-06-17 15:20:47'),
(12, 3, 2, '2025-06-19 02:56:28'),
(14, 3, 19, '2025-06-21 01:41:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `post_likes`
--

CREATE TABLE `post_likes` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tournaments`
--

CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('individual','clan') NOT NULL,
  `team_size` int(11) DEFAULT 1,
  `max_participants` int(11) NOT NULL,
  `status` enum('draft','registration','active','completed','cancelled') NOT NULL DEFAULT 'draft',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `prize_pool` varchar(255) DEFAULT NULL,
  `rules` text DEFAULT NULL,
  `maps` text DEFAULT NULL,
  `bracket_type` enum('single_elimination','double_elimination','round_robin','swiss') DEFAULT 'single_elimination',
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tournaments`
--

INSERT INTO `tournaments` (`id`, `name`, `description`, `type`, `team_size`, `max_participants`, `status`, `start_date`, `end_date`, `prize_pool`, `rules`, `maps`, `bracket_type`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Torneo Prueba', '', 'individual', 1, 8, 'draft', '2025-06-18 22:33:00', '2025-06-19 22:33:00', '', '', '[]', 'single_elimination', 2, '2025-06-19 02:32:21', '2025-06-19 02:32:21');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tournament_maps`
--

CREATE TABLE `tournament_maps` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `map_id` int(11) NOT NULL,
  `map_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tournament_matches`
--

CREATE TABLE `tournament_matches` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `round` int(11) NOT NULL,
  `match_number` int(11) NOT NULL,
  `participant1_id` int(11) DEFAULT NULL,
  `participant2_id` int(11) DEFAULT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `score1` int(11) DEFAULT 0,
  `score2` int(11) DEFAULT 0,
  `map_played` varchar(255) DEFAULT NULL,
  `status` enum('pending','in_progress','completed','cancelled') DEFAULT 'pending',
  `scheduled_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tournament_participants`
--

CREATE TABLE `tournament_participants` (
  `id` int(11) NOT NULL,
  `tournament_id` int(11) NOT NULL,
  `participant_type` enum('user','clan') NOT NULL,
  `participant_id` varchar(50) NOT NULL,
  `team_name` varchar(255) DEFAULT NULL,
  `team_members` text DEFAULT NULL,
  `points` int(11) DEFAULT 0,
  `wins` int(11) DEFAULT 0,
  `losses` int(11) DEFAULT 0,
  `status` enum('registered','active','eliminated','winner') DEFAULT 'registered',
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `tournament_participants`
--

INSERT INTO `tournament_participants` (`id`, `tournament_id`, `participant_type`, `participant_id`, `team_name`, `team_members`, `points`, `wins`, `losses`, `status`, `registered_at`) VALUES
(2, 1, 'user', '4', '', '[]', 0, 0, 0, 'registered', '2025-06-23 23:31:18');

--
-- Disparadores `tournament_participants`
--
DELIMITER $$
CREATE TRIGGER `update_tournament_participant_count_delete` AFTER DELETE ON `tournament_participants` FOR EACH ROW BEGIN
    UPDATE tournaments 
    SET participant_count = (
        SELECT COUNT(*) 
        FROM tournament_participants 
        WHERE tournament_id = OLD.tournament_id 
        AND status IN ('registered', 'active')
    )
    WHERE id = OLD.tournament_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_tournament_participant_count_insert` AFTER INSERT ON `tournament_participants` FOR EACH ROW BEGIN
    UPDATE tournaments 
    SET participant_count = (
        SELECT COUNT(*) 
        FROM tournament_participants 
        WHERE tournament_id = NEW.tournament_id 
        AND status IN ('registered', 'active')
    )
    WHERE id = NEW.tournament_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `update_tournament_participant_count_update` AFTER UPDATE ON `tournament_participants` FOR EACH ROW BEGIN
    UPDATE tournaments 
    SET participant_count = (
        SELECT COUNT(*) 
        FROM tournament_participants 
        WHERE tournament_id = NEW.tournament_id 
        AND status IN ('registered', 'active')
    )
    WHERE id = NEW.tournament_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tournament_team_members`
--

CREATE TABLE `tournament_team_members` (
  `id` int(11) NOT NULL,
  `participant_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('leader','member','substitute') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','player') NOT NULL DEFAULT 'player',
  `avatar` text DEFAULT NULL,
  `status` text DEFAULT NULL,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `clan` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `hide_email` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `avatar`, `status`, `is_online`, `clan`, `is_active`, `last_login`, `created_at`, `updated_at`, `hide_email`) VALUES
(1, 'Asistente Virtual', 'Asistente@tacticalops.cl', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'https://www.cambridge.org/elt/blog/wp-content/uploads/2020/08/GettyImages-1221348467-e1597069527719.jpg', 'Buscando...', 1, 'GM', 1, NULL, '2025-06-13 21:59:20', '2025-06-20 21:09:47', 0),
(2, 'StigmacL', 'Stigmacl@tacticalops.cl', '$2y$10$.iIWhSXlNb.RxK5djnqe1.edKWJMpA1yzN7vLeZMzYkLRwR1VmkS.', 'admin', 'https://vsthemes.org/uploads/posts/workshop/262040415363fdb5ef167ac214203567.webp', 'Mente Podrida', 0, 'AS', 1, '2025-06-23 23:56:36', '2025-06-13 22:39:33', '2025-06-23 23:56:48', 0),
(4, 'gLLm', 'bpanattv@gmail.com', '$2y$10$lMgVTSCKTYlMoNYX6xaoN.qgViv/jpn3q2ZceHckxrJcxGngk8Ke2', 'admin', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Hijo del Tronkys', 0, NULL, 1, '2025-06-17 22:42:48', '2025-06-13 23:42:10', '2025-06-20 20:55:56', 0),
(6, 'KrAtOz', 'kratozcl@hotmail.com', '$2y$10$jnWKbS8TywNX0bbwbDW5W.MgWZ2vtyagyp/um.J0YmV/RGXvtTQ7S', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'tuna+traka+nipa', 0, NULL, 1, '2025-06-14 20:23:20', '2025-06-14 20:20:17', '2025-06-20 20:57:15', 0),
(10, 'ArzOn!', '', '$2y$10$OvmaeBpAW9lwwyrDR7da/.v8UJld11ZLrEeIQvKdLFv415dra/Phe', 'player', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQRbbBVOCq3S_vMTwItz59Nu86sgvz2KJdqow&s', 'Pro Player', 0, NULL, 1, '2025-06-17 15:20:57', '2025-06-16 14:35:54', '2025-06-17 15:21:05', 0),
(11, 'richyvanpersie', 'reyesduran16@hotmail.com', '$2y$10$zPqTU40iMVNPHPb/DF8eROY92Hi/h97jgkyk/hfvWw/WcoYLxYKui', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 0, NULL, 1, NULL, '2025-06-16 14:48:53', '2025-06-20 20:56:52', 0),
(14, 'winno', 'bruno3021@gmail.com', '$2y$10$fMrI5mB63kA1Zcl6cd0R4Ov2WxxBohcg3/.5IKgesep.UHhjRkiIi', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 0, NULL, 1, '2025-06-17 01:06:36', '2025-06-17 01:02:12', '2025-06-20 20:58:56', 0),
(15, 'Faka', 'fa.em.vy.10@gmail.com', '$2y$10$FooIHBwriWcf6jfF0YIYuu9maipxMNq2OfSl50wkms3gKy3FpfEIe', 'player', 'https://www.freiheit.org/sites/default/files/styles/uv_full_content_large_16_9_webp/public/2024-11/argentinien-milei_3.png.webp?itok=mLRGtfiD?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 0, NULL, 1, '2025-06-17 01:24:01', '2025-06-17 01:19:56', '2025-06-17 16:11:10', 0),
(16, '@eLvAZO\"!!!', 'joofelipe83@gmail.com', '$2y$10$EctoQvbNxPyDofYOnu8JDOSANKMAI7eK22KFFs6CSb7ISxlmGBaMK', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 0, NULL, 1, '2025-06-17 01:27:18', '2025-06-17 01:24:01', '2025-06-20 20:58:18', 0),
(17, 'Tiroloko', 'turismoelmedano@gmail.com', '$2y$10$frHSJcyXQiDeDFlIp9XvWOSTE6jnxbpTALDicXuR2ay6yEhFqb42S', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', '', 0, 'AS', 1, '2025-06-20 23:02:08', '2025-06-17 02:22:57', '2025-06-20 23:03:48', 0),
(18, 'Grayfox.SIR', 'abraham.prhst@gmail.com', '$2y$10$bND5QmDdAVYQnUV6S3lq2eMv/kfWaZFUJgpXqC.v2c0yU.uqUdV3O', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 0, NULL, 1, '2025-06-19 04:01:00', '2025-06-19 03:59:58', '2025-06-20 20:58:09', 0),
(19, 'Mensito', 'ign.pvzc@gmail.com', '$2y$10$js2i.edLkTxSmhge3b9svOJfrVk9to.LtjauKbQAcMlDU3l4VKVR6', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 1, NULL, 1, '2025-06-21 01:41:02', '2025-06-19 04:11:39', '2025-06-21 01:41:02', 0),
(21, 'Synco_cybersyn', 'manueladolfo.hi@gmail.com', '$2y$10$UF8k7ByCJiXlzOKj9MMCU.YRf2XPQgFRa5olw5dxKO61OwWCYSIqC', 'player', 'https://i.ibb.co/SD0ZjMMF/Logo-Comunidad.png?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop', 'Nuevo jugador', 1, NULL, 1, '2025-06-20 20:04:24', '2025-06-20 18:21:23', '2025-06-20 20:57:48', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_achievements`
--

CREATE TABLE `user_achievements` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_id` int(11) NOT NULL,
  `unlocked_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_achievements`
--

INSERT INTO `user_achievements` (`id`, `user_id`, `achievement_id`, `unlocked_at`) VALUES
(1, 1, 1, '2025-06-13 21:59:20'),
(2, 2, 1, '2025-06-13 22:39:33'),
(4, 4, 1, '2025-06-13 23:42:10'),
(6, 6, 1, '2025-06-14 20:20:17'),
(10, 10, 1, '2025-06-16 14:35:54'),
(11, 11, 1, '2025-06-16 14:48:53'),
(14, 14, 1, '2025-06-17 01:02:12'),
(15, 15, 1, '2025-06-17 01:19:56'),
(16, 16, 1, '2025-06-17 01:24:01'),
(17, 17, 1, '2025-06-17 02:22:57'),
(18, 18, 1, '2025-06-19 03:59:58'),
(19, 19, 1, '2025-06-19 04:11:39'),
(21, 21, 1, '2025-06-20 18:21:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_posts`
--

CREATE TABLE `user_posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` enum('image','video') NOT NULL,
  `url` text NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_posts`
--

INSERT INTO `user_posts` (`id`, `user_id`, `type`, `url`, `title`, `description`, `created_at`) VALUES
(3, 2, 'image', 'https://i.ibb.co/84x3Dvcx/IMG-5111.png', '', '', '2025-06-21 20:12:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_stats`
--

CREATE TABLE `user_stats` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `games_played` int(11) NOT NULL DEFAULT 0,
  `hours_played` decimal(10,2) NOT NULL DEFAULT 0.00,
  `best_streak` int(11) NOT NULL DEFAULT 0,
  `kd_ratio` decimal(5,2) NOT NULL DEFAULT 0.00,
  `kills` int(11) NOT NULL DEFAULT 0,
  `deaths` int(11) NOT NULL DEFAULT 0,
  `wins` int(11) NOT NULL DEFAULT 0,
  `losses` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `user_stats`
--

INSERT INTO `user_stats` (`id`, `user_id`, `games_played`, `hours_played`, `best_streak`, `kd_ratio`, `kills`, `deaths`, `wins`, `losses`, `updated_at`) VALUES
(1, 1, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-13 21:59:20'),
(2, 2, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-13 22:39:33'),
(4, 4, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-13 23:42:10'),
(6, 6, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-14 20:20:17'),
(10, 10, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-16 14:35:54'),
(11, 11, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-16 14:48:53'),
(14, 14, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-17 01:02:12'),
(15, 15, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-17 01:19:56'),
(16, 16, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-17 01:24:01'),
(17, 17, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-17 02:22:57'),
(18, 18, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-19 03:59:58'),
(19, 19, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-19 04:11:39'),
(21, 21, 0, 0.00, 0, 0.00, 0, 0, 0, 0, '2025-06-20 18:21:23');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `achievements`
--
ALTER TABLE `achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `banner_config`
--
ALTER TABLE `banner_config`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `banner_items`
--
ALTER TABLE `banner_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_banner_id` (`banner_id`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indices de la tabla `clans`
--
ALTER TABLE `clans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tag` (`tag`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `fk_clans_leader` (`leader_id`);

--
-- Indices de la tabla `clan_member_requests`
--
ALTER TABLE `clan_member_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_clan_requests_clan` (`clan_id`),
  ADD KEY `fk_clan_requests_requester` (`requested_by`),
  ADD KEY `fk_clan_requests_target` (`target_user_id`),
  ADD KEY `fk_clan_requests_reviewer` (`reviewed_by`),
  ADD KEY `idx_status` (`status`);

--
-- Indices de la tabla `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_comments_news` (`news_id`),
  ADD KEY `fk_comments_user` (`user_id`),
  ADD KEY `fk_comments_deleted_by` (`deleted_by`);

--
-- Indices de la tabla `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_forum_replies_topic` (`topic_id`),
  ADD KEY `fk_forum_replies_user` (`user_id`),
  ADD KEY `fk_forum_replies_deleted_by` (`deleted_by`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `forum_topics`
--
ALTER TABLE `forum_topics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_forum_topics_user` (`user_id`),
  ADD KEY `fk_forum_topics_last_reply_by` (`last_reply_by`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_pinned` (`is_pinned`);

--
-- Indices de la tabla `maps`
--
ALTER TABLE `maps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_name` (`name`),
  ADD KEY `fk_maps_created_by` (`created_by`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_game_mode` (`game_mode`);

--
-- Indices de la tabla `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_messages_from_user` (`from_user_id`),
  ADD KEY `fk_messages_to_user` (`to_user_id`),
  ADD KEY `idx_conversation` (`from_user_id`,`to_user_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indices de la tabla `news`
--
ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_pinned` (`is_pinned`);

--
-- Indices de la tabla `news_likes`
--
ALTER TABLE `news_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`news_id`,`user_id`),
  ADD KEY `fk_news_likes_user` (`user_id`);

--
-- Indices de la tabla `post_likes`
--
ALTER TABLE `post_likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_post_like` (`post_id`,`user_id`),
  ADD KEY `fk_post_likes_user` (`user_id`);

--
-- Indices de la tabla `tournaments`
--
ALTER TABLE `tournaments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tournaments_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_tournaments_status_type` (`status`,`type`);

--
-- Indices de la tabla `tournament_maps`
--
ALTER TABLE `tournament_maps`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_tournament_map` (`tournament_id`,`map_id`),
  ADD KEY `fk_tournament_maps_tournament` (`tournament_id`),
  ADD KEY `fk_tournament_maps_map` (`map_id`);

--
-- Indices de la tabla `tournament_matches`
--
ALTER TABLE `tournament_matches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tournament_matches_tournament` (`tournament_id`),
  ADD KEY `fk_tournament_matches_participant1` (`participant1_id`),
  ADD KEY `fk_tournament_matches_participant2` (`participant2_id`),
  ADD KEY `fk_tournament_matches_winner` (`winner_id`),
  ADD KEY `idx_round` (`round`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_matches_tournament_round` (`tournament_id`,`round`);

--
-- Indices de la tabla `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant` (`tournament_id`,`participant_type`,`participant_id`),
  ADD KEY `fk_tournament_participants_tournament` (`tournament_id`),
  ADD KEY `idx_participants_tournament_status` (`tournament_id`,`status`);

--
-- Indices de la tabla `tournament_team_members`
--
ALTER TABLE `tournament_team_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_participant_user` (`participant_id`,`user_id`),
  ADD KEY `fk_team_members_participant` (`participant_id`),
  ADD KEY `fk_team_members_user` (`user_id`),
  ADD KEY `idx_team_members_participant_role` (`participant_id`,`role`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_achievement` (`user_id`,`achievement_id`),
  ADD KEY `fk_user_achievements_achievement` (`achievement_id`);

--
-- Indices de la tabla `user_posts`
--
ALTER TABLE `user_posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user_posts_user` (`user_id`);

--
-- Indices de la tabla `user_stats`
--
ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `achievements`
--
ALTER TABLE `achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `banner_config`
--
ALTER TABLE `banner_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `banner_items`
--
ALTER TABLE `banner_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `clans`
--
ALTER TABLE `clans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `clan_member_requests`
--
ALTER TABLE `clan_member_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `forum_replies`
--
ALTER TABLE `forum_replies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `forum_topics`
--
ALTER TABLE `forum_topics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `maps`
--
ALTER TABLE `maps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `news`
--
ALTER TABLE `news`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `news_likes`
--
ALTER TABLE `news_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `post_likes`
--
ALTER TABLE `post_likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tournaments`
--
ALTER TABLE `tournaments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `tournament_maps`
--
ALTER TABLE `tournament_maps`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tournament_matches`
--
ALTER TABLE `tournament_matches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tournament_participants`
--
ALTER TABLE `tournament_participants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tournament_team_members`
--
ALTER TABLE `tournament_team_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `user_achievements`
--
ALTER TABLE `user_achievements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `user_posts`
--
ALTER TABLE `user_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `user_stats`
--
ALTER TABLE `user_stats`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `clans`
--
ALTER TABLE `clans`
  ADD CONSTRAINT `fk_clans_leader` FOREIGN KEY (`leader_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `clan_member_requests`
--
ALTER TABLE `clan_member_requests`
  ADD CONSTRAINT `fk_clan_requests_clan` FOREIGN KEY (`clan_id`) REFERENCES `clans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_clan_requests_requester` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_clan_requests_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_clan_requests_target` FOREIGN KEY (`target_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `fk_comments_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_comments_news` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `forum_replies`
--
ALTER TABLE `forum_replies`
  ADD CONSTRAINT `fk_forum_replies_deleted_by` FOREIGN KEY (`deleted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_forum_replies_topic` FOREIGN KEY (`topic_id`) REFERENCES `forum_topics` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_forum_replies_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `forum_topics`
--
ALTER TABLE `forum_topics`
  ADD CONSTRAINT `fk_forum_topics_last_reply_by` FOREIGN KEY (`last_reply_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_forum_topics_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `maps`
--
ALTER TABLE `maps`
  ADD CONSTRAINT `fk_maps_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_messages_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_messages_to_user` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `news_likes`
--
ALTER TABLE `news_likes`
  ADD CONSTRAINT `fk_news_likes_news` FOREIGN KEY (`news_id`) REFERENCES `news` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_news_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `post_likes`
--
ALTER TABLE `post_likes`
  ADD CONSTRAINT `fk_post_likes_post` FOREIGN KEY (`post_id`) REFERENCES `user_posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_post_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tournaments`
--
ALTER TABLE `tournaments`
  ADD CONSTRAINT `fk_tournaments_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tournament_maps`
--
ALTER TABLE `tournament_maps`
  ADD CONSTRAINT `fk_tournament_maps_map` FOREIGN KEY (`map_id`) REFERENCES `maps` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tournament_maps_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tournament_matches`
--
ALTER TABLE `tournament_matches`
  ADD CONSTRAINT `fk_tournament_matches_participant1` FOREIGN KEY (`participant1_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tournament_matches_participant2` FOREIGN KEY (`participant2_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_tournament_matches_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_tournament_matches_winner` FOREIGN KEY (`winner_id`) REFERENCES `tournament_participants` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `tournament_participants`
--
ALTER TABLE `tournament_participants`
  ADD CONSTRAINT `fk_tournament_participants_tournament` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tournament_team_members`
--
ALTER TABLE `tournament_team_members`
  ADD CONSTRAINT `fk_team_members_participant` FOREIGN KEY (`participant_id`) REFERENCES `tournament_participants` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_team_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_achievements`
--
ALTER TABLE `user_achievements`
  ADD CONSTRAINT `fk_user_achievements_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_user_achievements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_posts`
--
ALTER TABLE `user_posts`
  ADD CONSTRAINT `fk_user_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_stats`
--
ALTER TABLE `user_stats`
  ADD CONSTRAINT `fk_user_stats_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
