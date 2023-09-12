WITH repos AS (
    SELECT
        gr.repo_id, gr.repo_name
    FROM github_repos gr
    WHERE
        gr.owner_id = {{ownerId}}
        {% if repoIds.size > 0 %}
        AND gr.repo_id IN ({{ repoIds | join: ',' }})
        {% endif %}
)
SELECT
    gu.country_code,
    COUNT(DISTINCT actor_login) AS participants
FROM github_events ge
JOIN github_users gu ON ge.actor_login = gu.login
WHERE
    ge.repo_id IN (SELECT repo_id FROM repos)
    {% case role %}
        {% when 'pr_creators' %}
        AND ge.type = 'PullRequestEvent' AND ge.action = 'opened'
        {% when 'pr_reviewers' %}
        AND ge.type = 'PullRequestReviewEvent' AND ge.action = 'created'
        {% when 'issue_creators' %}
        AND ge.type = 'IssuesEvent' AND ge.action = 'opened'
        {% when 'commit_authors' %}
        AND ge.type = 'PushEvent' AND ge.action = ''
        {% else %}
        {% when 'pr_commenters' %}
        AND ge.type = 'IssueCommentEvent' AND ge.action = 'created'
        AND EXISTS (
            SELECT 1
            FROM github_events ge2
            WHERE
                ge2.type = 'PullRequestEvent'
                AND ge2.action = 'opened'
                AND ge2.created_at < ge.created_at
                AND ge2.repo_id = ge.repo_id
                AND ge2.number = ge.number
            )
        {% when 'issue_commenters' %}
        AND ge.type = 'IssueCommentEvent' AND ge.action = 'created'
        AND EXISTS (
            SELECT 1
            FROM github_events ge2
            WHERE
                ge2.type = 'IssuesEvent'
                AND ge2.action = 'opened'
                AND ge2.created_at < ge.created_at
                AND ge2.repo_id = ge.repo_id
                AND ge2.number = ge.number
            )
        {% else %}
        AND ge.type IN ('PullRequestEvent', 'PullRequestReviewEvent', 'IssuesEvent', 'IssueCommentEvent', 'PushEvent')
        AND ge.action IN ('opened', 'created', '')
        {% if excludeBots %}
        -- Exclude bot users.
        AND ge.actor_login NOT LIKE '%bot%'
        {% endif %}
    {% endcase %}
    {% case period %}
        {% when 'past_7_days' %} AND ge.created_at > (NOW() - INTERVAL 7 DAY)
        {% when 'past_28_days' %} AND ge.created_at > (NOW() - INTERVAL 28 DAY)
        {% when 'past_90_days' %} AND ge.created_at > (NOW() - INTERVAL 90 DAY)
        {% when 'past_12_months' %} AND ge.created_at > (NOW() - INTERVAL 12 MONTH)
    {% endcase %}
    AND gu.country_code NOT IN ('', 'N/A', 'UND')
GROUP BY gu.country_code
ORDER BY participants DESC
LIMIT {{ n }}
