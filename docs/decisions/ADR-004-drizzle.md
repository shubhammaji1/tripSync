# ADR-004: Drizzle ORM for Data Access and Schema Migrations

## Status
Accepted

## Context
We need a lightweight, fully type-safe ORM that compiles with zero overhead, integrates directly with PostgreSQL, and provides deterministic migration generation.

## Decision
Use Drizzle ORM (`drizzle-orm` + `drizzle-kit`).

## Consequences
- Pure TypeScript schema definitions that can be shared or mapped directly to API types.
- SQL-like query builder that avoids hidden N+1 query surprises of traditional heavy ORMs.
