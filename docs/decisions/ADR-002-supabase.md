# ADR-002: Supabase as Managed Data Platform

## Status
Accepted

## Context
TripSync needs managed PostgreSQL, secure user authentication with social logins, file storage for receipts and trip covers, and database change streams without self-hosting extensive infrastructure.

## Decision
Use Supabase as the primary data and auth platform:
- PostgreSQL for relational data
- Supabase Auth for JWT authentication and session management
- Supabase Storage for trip attachments and expense receipts
- Row Level Security (RLS) as a database-level defense-in-depth layer

## Consequences
- Fast developer iteration and robust security out of the box.
- Standard PostgreSQL connection strings allow seamless local Docker development without vendor lock-in.
