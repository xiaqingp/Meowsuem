# Museum scope

Use the museum request and canonical content instruction to establish a compact,
factual scope for this run. Confirm the museum identity, discover its official
site or official collection entry point, location and collection boundaries,
then determine a reasonable editorial capacity from the museum's own scope.
Do not select works, score the museum or write visitor-facing prose.

Output `scope.json` with `museumId`, `museumName`, `city`, `country`,
`officialCollectionUrl`, `editorialCapacity`, `collectionBoundaries`,
`exclusions`, `riskFlags`, `sourcePointers`, and `coordinates` as a
two-number `[latitude, longitude]` array supported by a reliable map or official
location source.

The request may contain only museum names and location. Do not require a caller
supplied URL or work count. `editorialCapacity` is a planning capacity, not a
preselected answer or a requirement to pad the candidate pool.
