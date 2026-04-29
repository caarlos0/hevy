# hevy

A small CLI for managing [Hevy](https://hevy.com) data via the public
[Hevy API](https://api.hevyapp.com/docs/). Covers everything the API
currently exposes: routines, routine folders, workouts (incl. count and
event feed), exercise templates (incl. custom exercise creation and
history), and body measurements.

## Install

```sh
npm install -g hevy
```

## Auth

Get an API key from <https://hevy.com/settings?api> and export it:

```sh
export HEVY_API_KEY=...   # bash/zsh
set -gx HEVY_API_KEY ...  # fish
```

## Usage

```sh
hevy whoami

# Routines
hevy routines list [--page N] [--page-size N] [--json]
hevy routines get <id> [--json]
hevy routines create --file routine.json
hevy routines edit <id>                   # opens $EDITOR with current JSON
hevy routines edit <id> --file routine.json

# Routine folders (read + create only — API does not expose update/delete)
hevy folders list [--page N] [--page-size N] [--json]
hevy folders get <id> [--json]
hevy folders create <title...> [--json]

# Workouts
hevy workouts list [--page N] [--page-size N] [--json]
hevy workouts get <id> [--json]
hevy workouts create --file workout.json
hevy workouts edit <id>                   # opens $EDITOR with current JSON
hevy workouts edit <id> --file workout.json
hevy workouts count [--json]
hevy workouts events [--page N] [--page-size N] [--since <iso>] [--json]

# Exercise templates
hevy exercises list [--search term] [--page N] [--page-size N] [--json]
hevy exercises get <id> [--json]
hevy exercises create \
  --title "Bulgarian Split Squat" \
  --type weight_reps \
  --equipment dumbbell \
  --muscle quadriceps \
  [--other-muscles glutes,hamstrings] [--json]
hevy exercises history <id> [--start <iso>] [--end <iso>] [--json]

# Body measurements (date format: YYYY-MM-DD)
hevy measurements list [--page N] [--page-size N] [--json]
hevy measurements get <date> [--json]
hevy measurements create --file measurement.json
hevy measurements edit <date>             # opens $EDITOR with current JSON
hevy measurements edit <date> --file measurement.json
```

`--json` emits the raw API response on stdout, suitable for piping into
`jq`. Without it, output is human-readable.

`create` and `edit --file -` read JSON from stdin, so you can round-trip:

```sh
hevy routines get r1 --json | jq '.title = "renamed"' | hevy routines edit r1 --file -
```

To place a routine in a folder at creation, set `folder_id` in the JSON
payload (e.g. `jq '.folder_id = 42'`). The API does not expose moving an
existing routine between folders, nor any folder/routine/workout/measurement
delete or folder rename. If/when it does, support will be added.

## License

MIT
