# hevy

CLI for the [Hevy API](https://api.hevyapp.com/docs/).

## Install

```sh
npm install -g hevy
```

Get an API key from <https://hevy.com/settings?api>:

```sh
export HEVY_API_KEY=...
```

`hevy --help` and `hevy --version` work without an API key. API commands
require `HEVY_API_KEY`.

## Commands

```sh
hevy whoami

hevy routines     list | get <id> | create --file f.json | edit <id> [--file f.json]
hevy folders      list | get <id> | create <title...>
hevy workouts     list | get <id> | create --file f.json | edit <id> [--file f.json]
hevy workouts     count | events [--since <iso>]
hevy exercises    list | get <id> | history <id> [--start <iso>] [--end <iso>]
hevy exercises    create --title T --type weight_reps --equipment dumbbell --muscle quadriceps
hevy measurements list | get <date> | create --file f.json | edit <date> [--file f.json]
```

Common flags: `--page N`, `--page-size N`, `--json` (raw API response).

## Machine-readable usage

Use `--json` for scripts and agents. Human-readable output is for terminals;
JSON output is the raw API response printed to stdout.

Create and edit commands read a JSON object directly, not an API envelope:

```sh
hevy workouts create --file examples/workout.json --json
hevy routines edit r1 --file examples/routine.json --json
hevy measurements create --file examples/measurement.json --json
```

Use `--file -` for stdin:

```sh
hevy workouts get w1 --json \
  | jq '.title = "renamed"' \
  | hevy workouts edit w1 --file - --json
```

If `--file` is omitted, create commands read piped stdin. They fail instead of
waiting when stdin is a TTY:

```sh
jq '.title = "copy"' examples/routine.json | hevy routines create --json
```

For routines and workouts, the CLI wraps the object for the API and strips
server-managed fields (`id`, `created_at`, `updated_at`) before creating or
editing. Measurements are sent as the object itself; measurement edits strip
`date` from the PUT body because the date is part of the URL.

Errors are written to stderr and return a non-zero exit code.

`exercises list` paginates server-side; pipe through `grep` to filter:

```sh
hevy exercises list --page-size 100 | grep -i squat
```

`edit` without `--file` opens `$VISUAL` (falling back to `$EDITOR`, then `vi`).
`--file -` reads stdin, so you can round-trip:

```sh
hevy routines get r1 --json | jq '.title="renamed"' | hevy routines edit r1 --file -
```

## Creating a workout

`hevy workouts create --file workout.json` expects the workout object
directly (the CLI wraps it in `{ "workout": ... }` for the API):

```json
{
  "title": "Friday Leg Day 🔥",
  "description": "Quads focus",
  "start_time": "2024-08-14T12:00:00Z",
  "end_time": "2024-08-14T12:45:00Z",
  "is_private": false,
  "exercises": [
    {
      "exercise_template_id": "D04AC939",
      "superset_id": null,
      "notes": "Form on point",
      "sets": [
        { "type": "warmup", "weight_kg": 60, "reps": 8 },
        { "type": "normal", "weight_kg": 100, "reps": 10, "rpe": 8 },
        { "type": "normal", "weight_kg": 100, "reps": 10 }
      ]
    }
  ]
}
```

Find `exercise_template_id` with `hevy exercises list | grep -i squat`.

Set fields by exercise type:

- `weight_reps`: `weight_kg`, `reps`
- `reps_only`: `reps`
- `duration`: `duration_seconds`
- `distance_duration`: `distance_meters`, `duration_seconds`
- `weight_distance_duration`: `weight_kg`, `distance_meters`, `duration_seconds`

Set `type` is one of `warmup | normal | failure | dropset`. `rpe` (optional)
is one of `6, 7, 7.5, 8, 8.5, 9, 9.5, 10`. Group exercises into a superset
by giving them the same integer `superset_id`.

The same shape works for `edit`. Routines and measurements use the same
"object directly, no wrapper" convention — `hevy <thing> get <id> --json`
shows the exact shape to send back.

## License

MIT
