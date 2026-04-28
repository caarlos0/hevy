# hevy

A small CLI for managing [Hevy](https://hevy.com) routines via the public
[Hevy API](https://api.hevyapp.com/docs/).

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

hevy routines list [--page N] [--page-size N] [--json]
hevy routines get <id> [--json]
hevy routines create --file routine.json
hevy routines edit <id>                   # opens $EDITOR with current JSON
hevy routines edit <id> --file routine.json

hevy exercises list [--search term] [--json]
```

`--json` emits the raw API response on stdout, suitable for piping into
`jq`. Without it, output is human-readable.

`create` and `edit --file -` read JSON from stdin, so you can round-trip:

```sh
hevy routines get r1 --json | jq '.title = "renamed"' | hevy routines edit r1 --file -
```

## Out of scope (v1)

The public Hevy API does not expose routine folders or DELETE for routines.
If/when it does, support will be added.

## License

MIT
