# Identity Localization

Localize only the supplied museum identity display fields into Chinese. Do not
browse, research, select works, reinterpret attribution, or change factual
metadata.

Write only JSON with `schemaVersion: 1` and `works`. Return exactly one result
for every supplied `workId`, in the same order. Each result must contain:

- `workId`, unchanged;
- `titleZh`, a concise natural Chinese display title;
- `titleEn`, copied exactly from the supplied English title;
- `artistZh`, the established Chinese name when well known, otherwise a
  conservative transliteration that preserves attribution qualifiers;
- `artistEn`, copied exactly from the supplied artist string.

Do not add facts or explanatory prose. Do not translate accession numbers,
dates, media, URLs, or object identity anchors.
