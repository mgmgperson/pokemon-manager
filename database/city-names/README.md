# Local city-name reference lists

From `server/`, run:

```sh
npm run names:download
```

This downloads eight settlement-name lists from a fixed revision of
[Azgaar's Fantasy Map Generator](https://github.com/Azgaar/Fantasy-Map-Generator)
into `azgaar.json`. The JSON is gitignored; this directory is not a SQLite
database. A checksum verifies the source before an atomic replacement, and the
JSON includes the upstream MIT licence and attribution. The download command
can also restore missing or damaged lists. It changes no save data.

Generation works offline after setup. The generator itself performs no file
reads; callers load the reference file for Azgaar styles. Missing/invalid lists
produce an actionable error, not an automatic download or a silently substituted
style. Pokémon-style word generation needs no downloaded lists.

The local generator uses a two-character Markov context, rather than importing
Azgaar's map/UI code. It rejects unchanged training examples, exact collisions
with authored/proposed names, and one-edit near-collisions with authored or
proposed names of at least four characters. It cannot guarantee that an
invented name does not also exist somewhere in the real world. Names remain
reviewable proposals; nothing in this directory is world canon.

The English list is English settlement training material, not a US/Canadian
corpus. Selecting a language style does not establish the region's nationality
or change the existing trainer-name country weights.
