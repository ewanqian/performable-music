# Data Pipeline

## Principle

Prefer legal/public metadata APIs and **locally owned reference audio**. Do not build the research pipeline around scraping protected streaming audio.

## Metadata sources

### MusicBrainz
Official API: https://musicbrainz.org/doc/MusicBrainz_API

Useful for:
- artist / release / recording / work metadata;
- IDs and relationships;
- release dates and labels;
- structured discography queries.

API root: `https://musicbrainz.org/ws/2/`

### ListenBrainz
Docs: https://listenbrainz.readthedocs.io/en/latest/

Useful for:
- public listening data;
- popularity/listening context;
- playlists and user-history research where appropriate.

### Artist / label official pages
Use as the first source for credits, release statements and production notes.

For KASHIWA / TITAN:
- artist release page;
- artist statement;
- Virgin Babylon Bandcamp.

### Discogs
Use its documented API for release/edition metadata where needed. Treat user-entered metadata as secondary evidence and verify important claims against primary sources.

## Do not depend on Spotify Audio Features

Spotify restricted new Web API applications from Audio Features / Audio Analysis access in late 2024. Do not make this project’s reproducibility depend on those endpoints.

## Audio analysis stack

### Sonic Visualiser + Vamp
Use for human-readable timelines, spectrograms and plugin-based annotation.

### librosa
Use for lightweight Python extraction:
- onset envelope;
- tempo/tempogram;
- RMS;
- spectral centroid/bandwidth/flatness;
- chroma;
- tonal centroid;
- recurrence/similarity experiments.

### Essentia
Use when a larger descriptor set, MIR research workflow, rhythm/tonality/segmentation or more systematic batch analysis is useful.

### music21
Use for symbolic/computational musicology when MIDI or score-like symbolic material exists. It is not a substitute for waveform analysis.

### FluCoMa
Use for interactive corpus analysis and data-driven instruments inside Max/SuperCollider/Pd.

## Suggested local directory

```text
corpus/
  raw/              # local only; gitignored
  metadata/
  features/
  annotations/
  segments/         # only original/licensed segments if committed
analysis/
  notebooks/
  scripts/
  plots/
```

## Per-track reproducible output

For each analyzed track, aim to create:

```text
metadata.json
timeline.csv
features.json
sections.csv
notes.md
plots/
```

No source audio is required in Git for another researcher to inspect the method.

## Minimal feature schema

```json
{
  "track": "",
  "source_version": "",
  "duration_sec": 0,
  "tempo_hypothesis": [],
  "rms_curve": "path/to/csv",
  "onset_curve": "path/to/csv",
  "spectral_centroid_curve": "path/to/csv",
  "chroma": "path/to/npy-or-csv",
  "manual_sections": "sections.csv",
  "notes": "notes.md"
}
```

The most important data remains the relationship between measured features and musical interpretation.
