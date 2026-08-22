# ADR-003: PostgreSQL as Primary Database

## Status
Accepted

## Context
Trip data is deeply relational: trips have members, days have activities, expenses have split participants, and settlements connect payer/payee pairs. Financial transactions and expense splits require ACID guarantees.

## Decision
Use PostgreSQL 16+ for all primary entity storage, indexes, constraints, and JSON fields for flexible metadata.

## Consequences
- ACID transactions guarantee financial settlement calculations and expense splits are never partially recorded.
- Rich ecosystem of SQL extensions and analytical aggregation functions.
