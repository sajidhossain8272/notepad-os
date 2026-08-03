# Contributing to Notepad OS

Thank you for your interest in contributing to **Notepad OS**! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## How to Contribute

1. **Fork the repository** on GitHub: `https://github.com/sajidhossain8272/notepad-os`
2. **Create a new feature branch** from `main`:
   ```bash
   git checkout -b feature/new-theme
   ```
   Or for bug fixes:
   ```bash
   git checkout -b fix/storage-bug
   ```
3. **Make your changes** and test them locally:
   ```bash
   npm run build
   ```
4. **Commit your changes** following our commit standards.
5. **Push your branch** to your fork and **submit a Pull Request**.

---

## Commit Style Guidelines

We follow Conventional Commits format:

- `feat:` New features (e.g. `feat: add minimal dark theme`)
- `fix:` Bug fixes (e.g. `fix: resolve note search input clear issue`)
- `docs:` Documentation updates (e.g. `docs: update installation instructions`)
- `chore:` Maintenance tasks (e.g. `chore: update dependencies`)

---

## Code Standards

- **TypeScript**: Enforce strict typing everywhere.
- **Local-First & Privacy**: Never add telemetry, tracking, cloud sign-in, or external API calls without user consent.
- **Performance**: Maintain sub-second startup times and small bundle sizes.
