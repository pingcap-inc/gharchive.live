/*!40101 SET NAMES binary*/;
CREATE TABLE `github_repos` (
  `repo_id` int(11) NOT NULL,
  `repo_name` varchar(150) NOT NULL,
  `owner_id` int(11) NOT NULL,
  `owner_login` varchar(255) NOT NULL,
  `owner_is_org` tinyint(1) NOT NULL,
  `description` varchar(512) NOT NULL DEFAULT '',
  `primary_language` varchar(32) NOT NULL DEFAULT '',
  `license` varchar(32) NOT NULL DEFAULT '',
  `size` bigint(20) NOT NULL DEFAULT '0',
  `stars` int(11) NOT NULL DEFAULT '0',
  `forks` int(11) NOT NULL DEFAULT '0',
  `parent_repo_id` int(11) DEFAULT NULL,
  `is_fork` tinyint(1) NOT NULL DEFAULT '0',
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `latest_released_at` timestamp NULL DEFAULT NULL,
  `pushed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `updated_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `last_event_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `refreshed_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`repo_id`) /*T![clustered_index] CLUSTERED */,
  KEY `index_gr_on_owner_id` (`owner_id`),
  KEY `index_gr_on_repo_name` (`repo_name`),
  KEY `index_gr_on_stars` (`stars`),
  KEY `index_gr_on_repo_id_repo_name` (`repo_id`,`repo_name`),
  KEY `index_gr_on_created_at_is_deleted` (`created_at`,`is_deleted`),
  KEY `index_gr_on_owner_login_owner_id_is_deleted` (`owner_login`,`owner_id`,`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
