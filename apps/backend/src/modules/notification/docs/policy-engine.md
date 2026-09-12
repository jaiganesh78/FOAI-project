# Policy Engine Document

## Deterministic Policy Evaluation Precedence
1. Event Causality / Version Check
2. Materiality Check (`DecisionDiff.isMaterial === true`)
3. Persistent Deduplication Check (`UNIQUE([sourceEventId, notificationType, userId])`)
4. Supersession Check
5. Cooldown Window Check (`cooldownWindowSeconds`)
6. Rate Limit Window Check (`maxPerWindow`)
7. Timezone Quiet Hours Check (`NotificationPreference.timezone`)
8. Citizen Preference Check (`NotificationPreference.status === 'ENABLED'`)
9. Policy Precedence & Channel Fallback Precedence Resolution
10. Atomic DB Commit

Precedence Order: Global Policy -> Category Policy -> Urgency Policy -> Citizen Preference -> Channel Availability.
