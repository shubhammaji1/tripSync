# Contributing to TripSync

Thank you for your interest in contributing to TripSync! We welcome contributions of all kinds: code, documentation, bug reports, design ideas, and feature suggestions.

## Development Workflow

1. Fork the repository and clone your fork locally.
2. Create a new branch: `git checkout -b feat/your-feature-name` or `git checkout -b fix/your-bug-fix`.
3. Install dependencies: `pnpm install`.
4. Ensure tests and lint pass before submitting: `pnpm lint && pnpm test`.
5. Push to your fork and submit a Pull Request.

## Commit Message Conventions

We adhere to Conventional Commits:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

## Monorepo Commands

- `pnpm dev`: Start all apps in parallel (API, Web, Worker).
- `pnpm build`: Build all packages and applications with Turborepo caching.
- `pnpm test`: Run test suites across the monorepo.
- `pnpm db:seed`: Seed local database with sample data.
