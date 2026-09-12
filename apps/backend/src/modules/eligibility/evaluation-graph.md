# Policy Evaluation Graph Architecture

## Structural Graph Representation
Every evaluation produces a directed graph linking:
1. **Fact Nodes (`FACT`)**: `landHolding: 1.5`, `annualIncome: 180000`.
2. **Rule Nodes (`RULE`)**: `RULE_PM_KISAN_LAND` (`PASSED`).
3. **Policy Node (`POLICY`)**: `PM_KISAN`.
4. **Outcome Node (`OUTCOME`)**: `ELIGIBLE`.

Edges represent evaluation dependencies (`EVALUATES`, `SATISFIES`, `RESULTS_IN`).
