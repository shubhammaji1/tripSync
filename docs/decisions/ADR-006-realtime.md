# ADR-006: Realtime Collaboration Architecture

## Status
Accepted

## Context
Multiple travelers modify trips simultaneously (adding activities, logging food expenses, checking tasks). The app must reflect state changes without requiring manual browser refreshes.

## Decision
Implement a hybrid realtime strategy:
1. NestJS WebSocket Gateway connected to Redis Pub/Sub for custom application-level live event distribution.
2. Supabase Realtime client for client-side direct table subscription where appropriate.

## Consequences
- Immediate UI synchronization for active trip members.
- Resilient reconnection handling.
