# Current PT Scheduler Implementation

This document describes the implementation at commit `1b31635` and the supplied
`database.json`. It records current behavior before any redesign.

## What the application is

The scheduler is a browser-only React 19/Vite application. It has no server,
authentication, database service, or automatic persistence. All working data is
held in React state until the user downloads a new `database.json`.

Material UI provides the tabs, dialogs, cards, buttons, and data grids. The app
has one route (`/`). It first presents a database entry screen where the user
can load a saved schedule or start with an empty database. The scheduler then
provides four tabs:

1. **Upload** imports PT availability files, Howdy class data, or a previously
   downloaded scheduler database. It also exports the current database.
2. **Peer Teachers** displays PTs, permits note editing, and deletes PTs.
3. **Labs** displays labs, permits `maxPTs` editing, exports CSV, and deletes labs.
4. **Assign Labs** selects a PT, shows compatible and assigned labs, and adds or
   removes assignments. It also lists labs with open slots.

The root state lives in `src/components/Scheduler.jsx`:

```text
Scheduler
├── peerTeachers[]
├── labs[]
├── selectedPT
├── selectedLab
└── active tab
```

Every tab receives the arrays and their React setters as props. There is no
separate data or scheduling layer.

## End-to-end workflow

```text
PT text files ───────┐
Howdy JSON ──────────┼─> Upload tab ─> in-memory React state
database.json ───────┘                       │
                                             ├─> table inspection/editing
                                             ├─> assignment changes
                                             └─> downloaded database.json
```

A normal session is therefore:

1. Open the application and load a complete `database.json`, or start empty.
2. When starting empty, upload PT text files plus Howdy JSON from the Upload tab.
3. Review PTs and labs.
4. Assign or remove labs.
5. Download `database.json` before closing or refreshing the page.

Refreshing before step 5 loses all changes.

## Stored data model

The database file has exactly two top-level arrays:

```js
{
  labs: Lab[],
  peerTeachers: PeerTeacher[]
}
```

### `Lab`

```js
{
  course: string,       // e.g. "120"
  section: string,      // e.g. "501"
  professor: string,
  time: string,         // e.g. "TR 02:20 PM - 03:10 PM"
  location: string,
  hours: number,
  pt: string[],         // assigned PT UINs
  maxPTs: number
}
```

The composite `(course, section)` is treated as the lab identifier.

### `PeerTeacher`

```js
{
  firstname: string,
  lastname: string,
  uin: string,          // PT identifier
  hours: number,        // sum of assigned lab hours
  busyTimes: {
    M: string[],
    T: string[],
    W: string[],
    R: string[],
    F: string[]
  },                    // ranges use "HH:MM-HH:MM"
  labs: Array<{ course: string, section: string }>,
  notes?: string
}
```

An assignment is duplicated in three places:

- the PT UIN in `lab.pt`;
- the lab key in `peerTeacher.labs`;
- the lab's hours included in `peerTeacher.hours`.

All three must change together. There is no validation or reconciliation step
when loading or exporting data.

## Supplied database snapshot

The provided file is structurally complete and internally consistent:

| Measure | Value |
| --- | ---: |
| Labs | 84 |
| Peer teachers | 31 |
| Assigned lab slots | 83 |
| Open lab slots | 1 |
| Total lab hours | 140 |
| Assigned PT hours | 138 |
| Unknown PT/lab references | 0 |
| One-sided assignments | 0 |
| PT hour mismatches | 0 |
| Over-capacity labs | 0 |
| Duplicate PT or lab identifiers | 0 |

The two-hour difference is the one open lab slot, not inconsistent data.

`database.json` contains UINs and should be treated as sensitive operational
data. It is currently untracked and should not be committed.

## Import and export behavior

### Complete database import

`DatabaseUploadButton.jsx` parses JSON, sorts both arrays, replaces current
state, and clears the selected PT. It checks only whether parsing and subsequent
property access throw; it does not validate the schema or relationships.

### PT availability import

Each text file is interpreted as:

```text
First Middle Last UIN
MW 09:10-10:00
TR 14:20-15:10
```

The last token is the UIN, the preceding token is the last name, and all earlier
tokens form the first name. Remaining lines become busy ranges. Reimporting the
same UIN removes the existing PT and their assignments, then inserts a fresh PT
with zero hours and no labs.

### Howdy lab import

The importer accepts a JSON array from the Howdy class-search endpoint. It:

- keeps only `CSCE` rows;
- keeps only a hard-coded course list;
- reads instructor and meeting data from JSON strings inside each row;
- keeps laboratory meetings;
- derives day letters, time, location, and weekly hours;
- initializes every imported lab with no PTs and `maxPTs: 1`.

### Export

Export serializes the two state arrays without validation or formatting and
downloads them as `database.json`. The temporary object URL is not revoked,
which is minor for this small, manual workflow.

## Assignment rules as implemented

A lab appears as possible for a PT when:

1. the lab has fewer than `maxPTs` assigned;
2. its time does not overlap the PT's `busyTimes`;
3. its time does not overlap the PT's already assigned labs.

Times are parsed by attaching each weekday to dates in July 2003 and comparing
JavaScript `Date` objects. Assigning a lab appends both references and adds its
hours. Removing it removes both references and subtracts its hours.

There are no rules for target/minimum/maximum PT hours, course qualifications,
preferences, professor preferences, or travel time between rooms.

## Important implementation problems

These are current defects or high-risk behaviors, not redesign ideas.

1. **Assigned-lab conflicts can be skipped.** In `AssignTab.jsx`, an empty
   `busyTimes[day]` causes an early `continue`, so already assigned labs are not
   checked for that candidate day.
2. **Back-to-back ranges are treated as overlapping.** The overlap test uses
   strict `<` and `>` comparisons. A range ending exactly when another starts
   is rejected.
3. **Import replacement logic is broken.** Both lab importers use `filter()` but
   then treat the resulting array as one lab (`temp.pt`, `temp.hours`). The Howdy
   importer also refers to undefined `course` and `section` variables. Duplicate
   replacement therefore does not reliably detach old assignments.
4. **Multiple laboratory meetings overwrite each other.** The Howdy loop writes
   one `time`, `location`, and `hours` field repeatedly, so only the last lab
   meeting survives.
5. **State is mutated in place.** Assignment and deletion paths directly modify
   lab/PT objects before setting new arrays. This makes updates harder to reason
   about and can leave `selectedPT` pointing at mutated or stale data.
6. **The data model permits drift.** Assignment references and derived hours are
   duplicated, but imports and edits do not verify consistency.
7. **Upload success can be misleading.** The complete database dialog marks the
   operation completed even after a caught error. PT multi-file loading also
   uses a function-local counter shared by asynchronous callbacks.
8. **No guard exists for missing files or malformed fields.** Cancelling a file
   chooser or loading structurally invalid JSON can enter an error path only
   after attempting to read/access invalid values.
9. **Deleting a lab removes too much in one edge case.** The PT lab filter uses
   `course !== course && section !== section`; it should remove only the exact
   composite key, but this expression can remove other labs sharing either the
   course or section.
10. **The interface is fixed-size.** The root is `1300 × 700`, major panels use
    `900–1000px` widths, and content relies on nested scroll areas. It does not
    adapt cleanly to smaller windows.
11. **Focus indication is explicitly removed from tabs.** This makes keyboard
    navigation less obvious and is an accessibility regression.
12. **The landing state gives no workflow guidance.** Users start on four upload
    buttons with no status summary, required-next-step explanation, save warning,
    or distinction between starting fresh and restoring a database.

## Repository health before modernization

- `npm run build` succeeds, with an 856 kB minified JavaScript bundle and Vite's
  warning that the chunk exceeds 500 kB.
- `npm run lint` fails with 161 errors. Most are missing prop validation, plus
  unused imports/variables, missing React keys, and the undefined variables in
  the Howdy replacement path noted above.
- `npm install` reports 21 dependency audit findings: 3 low, 6 moderate, and 12
  high. No automatic dependency changes were made during this analysis.
- Visual inspection at a 786 px-wide viewport confirms that the fixed-width
  landing page clips the database upload/download actions off-screen.

The dependency modernization completed on September 22, 2026 upgrades the app
to React 19, Vite 8, Material UI 9, MUI X Data Grid 9, React Router 7, and ESLint
10. The production build and lint now pass, all four tabs retain their original
controls in browser smoke testing, and `npm audit` reports no vulnerabilities.

## Why the current interface is difficult to understand

The application exposes its storage mechanics as the primary navigation. A
user must understand three import formats before seeing whether data is already
loaded. The assignment screen then presents three dense columns—PTs, possible
labs, and assigned labs—plus a separate unassigned-labs region, but offers no
summary of progress or explicit explanation of why a pairing is unavailable.

The UI also uses selection in two directions:

- selecting a PT populates possible and assigned labs;
- selecting an unassigned lab colors PT cards by availability.

That second mode does not assign the selected lab directly, so the relationship
between selection and action is not obvious.

## Smallest sound revamp boundary

Before visual redesign, the safest boundary is to make one assignment relation
authoritative and derive the other views and hour totals from it. Scheduling
compatibility should then be one pure function returning both a boolean and a
human-readable reason. The UI can consume that single result everywhere.

That gives a clearer product flow without adding a backend:

```text
Load data -> validate -> review progress -> assign with reasons -> export
```

A backend, accounts, automatic optimization, and a new component framework are
not required to make the existing single-user workflow clear and reliable.
