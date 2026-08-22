# ADR-001: Modular Monolith Architecture

## Status
Accepted

## Context
TripSync is a collaborative group travel platform requiring high development velocity, data consistency across multiple entities (trips, itineraries, expenses, settlements), and low operational overhead before reaching massive scale.

## Decision
We choose a **Modular Monolith** architecture with a single NestJS backend service partitioned into discrete domain modules (`auth`, `trips`, `members`, `itinerary`, `expenses`, `settlements`, `tasks`, `emergency`, `analytics`).

## Consequences
- **Positive**: Single deployment unit, atomic database transactions across domain boundaries, simplified local development, zero inter-service network latency or distributed transaction complexity.
- **Negative**: Requires strict module boundary discipline to prevent tight coupling. Modules can later be extracted into independent services if scaling demands it.
