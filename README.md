# Driveflow

Driveflow is a responsive driving-school website with an interactive course finder
for helping prospective students choose between Essential, Flexible and VIP course
packages.

## Course Finder

The feature is located on the main page directly below the hero section. It asks
four questions, recommends one course, explains the reasoning, shows a concise
trade-off against the closest alternative and routes the user toward registration.

Key files:

- `src/course-finder/course-finder-data.js`: typed JSDoc course and quiz configuration.
- `src/course-finder/course-finder-scoring.js`: weighted recommendation logic.
- `src/course-finder/course-finder-analytics.js`: typed JSDoc analytics adapter.
- `src/main.js`: accessible interactive finder UI.

Registration URLs are configured in the course data. Because this repository did
not include an existing checkout or registration flow, the primary CTAs currently
link to `/register?course=essential`, `/register?course=flexible` and
`/register?course=vip`.

Analytics events are routed through `trackCourseFinderEvent`. In unsupported
environments the adapter safely no-ops after emitting a browser custom event.
Implemented events:

- `course_finder_viewed`
- `course_finder_started`
- `course_finder_question_answered`
- `course_finder_completed`
- `course_recommended`
- `recommended_course_selected`
- `course_comparison_opened`
- `course_finder_restarted`

## Development

```bash
node scripts/dev-server.mjs
node scripts/format-check.mjs
node --check src/main.js
node --test
node scripts/build.mjs
node scripts/e2e-course-finder.mjs
node scripts/responsive-check.mjs
```

No package manager or third-party runtime dependency is required for the static
site. The optional end-to-end test uses the Playwright package bundled with the
Codex desktop runtime when it is available.
