# Supersession Document

## Semantic Identity
- Identifies notifications using context: `(userId, sourceReEvaluationId)`.
- When a newer decision snapshot arrives, active unread notifications are marked `SUPERSEDED` and linked (`supersededByNotificationId`).
- Action Items in terminal `COMPLETED` state are **immune** to supersession.
