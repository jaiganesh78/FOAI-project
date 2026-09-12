# Journey Blueprint Inheritance Architecture

## Overview
Journey Blueprints follow an enterprise inheritance model (`parentBlueprintId`).

```
Government Benefit Application (Root Template)
        │
        ├── Farmer Scheme Journey (Domain Template)
        │        │
        │        ├── PM-KISAN (Concrete Policy Blueprint)
        │        └── PMFBY (Concrete Policy Blueprint)
        │
        └── Scholarship Journey (Domain Template)
                 │
                 └── NSP (Concrete Policy Blueprint)
```

## Features
- **Step Inheritance**: Child blueprints automatically inherit steps from parent and grandparent blueprints.
- **Step Overrides**: Child blueprints can override step parameters (execution policy, retry limit, timeout).
- **Added Steps**: Policy-specific steps are appended to the inherited graph.
