# Policy Change Intelligence & Population Discovery

The `PolicyChangeService` processes policy activations (`PolicyVersionActivation`) and discovers affected citizen populations.

## Bounded Population Discovery
- Uses `Fact Usage Index` and `affectedAttributeKeys` to target affected citizens.
- Persists `discoveredPopulationCount` and `populationSelectionChecksum` for deterministic replay.
- Avoids full database table scans.
