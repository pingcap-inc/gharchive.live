WITH pr_24h AS (
	SELECT
			actor_id, actor_login,
			COUNT(DISTINCT CASE WHEN action = 'opened' THEN pr_or_issue_id ELSE NULL END) AS opened_prs,
			COUNT(DISTINCT CASE WHEN action = 'closed' AND pr_merged = false THEN pr_or_issue_id ELSE NULL END) AS closed_prs,
			COUNT(DISTINCT CASE WHEN action = 'closed' AND pr_merged = true THEN pr_or_issue_id ELSE NULL END) AS merged_prs
	FROM
			github_events ge
	WHERE
			type = 'PullRequestEvent'
			AND (action = 'opened' OR action = 'closed')
			AND created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
			AND actor_login NOT LIKE '%[bot]'
			AND actor_login NOT LIKE '%bot'
	GROUP BY
			actor_id, actor_login
)
SELECT 
	actor_id, actor_login, (opened_prs + closed_prs + merged_prs) as total_prs,
	opened_prs, closed_prs, merged_prs
FROM pr_24h
ORDER BY total_prs DESC
LIMIT 5