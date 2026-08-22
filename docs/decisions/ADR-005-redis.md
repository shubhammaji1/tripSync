# ADR-005: Redis for Caching and Pub/Sub

## Status
Accepted

## Context
Real-time group collaboration requires distributed pub/sub to notify multiple connected app instances when trips, itineraries, or expenses are updated.

## Decision
Use Redis as the unified cache and message broker layer.

## Consequences
- Ultra-low latency broadcast of domain events.
- Foundation for rate limiting and background queue management.
