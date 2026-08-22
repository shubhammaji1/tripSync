# ADR-007: Background Jobs with BullMQ

## Status
Accepted

## Context
Asynchronous processing is necessary for sending email notifications, daily itinerary digests, settlement reminder alerts, and scheduled background tasks without blocking the main HTTP request/response lifecycle.

## Decision
Use BullMQ atop Redis in a dedicated worker process (`apps/worker`).

## Consequences
- HTTP requests return instantly without waiting for external SMTP or push delivery.
- Built-in retry mechanisms, job backoff, and dead-letter queues.
