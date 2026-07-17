# Contributing to CodeVision

Thank you for helping make programming concepts easier to understand.

CodeVision welcomes code, documentation, design, accessibility, testing, examples, bug reports, and feature ideas.

## Before you start

1. Search existing issues and pull requests to avoid duplicates.
2. For a large feature or architecture change, open an issue first.
3. Keep each pull request focused on one clear change.
4. Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

```bash
git clone https://github.com/YOUR_USERNAME/see-code-learn.git
cd see-code-learn
bun install
bun run dev
```

Add the original repository as `upstream`:

```bash
git remote add upstream https://github.com/RayyanKhan4004/see-code-learn.git
```

## Create a branch

Use a short, descriptive branch name:

```bash
git checkout -b feature/react-render-visualizer
```

Suggested prefixes:

- `feature/` for new functionality
- `fix/` for bug fixes
- `docs/` for documentation
- `refactor/` for internal improvements
- `chore/` for maintenance

## Development guidelines

- Use TypeScript.
- Match the existing project structure and component patterns.
- Keep components focused and reusable.
- Prefer clear names over clever abstractions.
- Add comments only where the reason behind code is not obvious.
- Preserve accessibility, keyboard support, and responsive behavior.
- Do not manually edit generated files such as `routeTree.gen.ts`.
- Avoid unrelated formatting or dependency changes.
- Never commit credentials, API keys, local environment files, or personal data.

## Before opening a pull request

Run:

```bash
bun run format
bun run lint
bun run build
```

Verify the affected visualizer manually and include screenshots or a short recording for UI changes.

## Commit messages

Use clear, action-oriented messages:

```text
feat: add closure scope visualization
fix: prevent duplicate event-loop steps
docs: explain microtask queue behavior
```

## Open a pull request

Your pull request should include:

- What changed
- Why the change is useful
- How it was tested
- Screenshots or recordings for UI changes
- Related issue numbers, such as `Closes #42`

Maintainers may request changes. Reviews are intended to improve quality and help contributors learn.

## Good first contributions

Good starter contributions include:

- Documentation fixes
- New JavaScript examples
- Better empty or error states
- Accessibility improvements
- Mobile-layout fixes
- Reproducible bug reports
- Tests for existing behavior
- Small UI polish with screenshots

## Reporting bugs

Use the bug-report issue form and provide:

- A minimal code example
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and operating system
- Screenshots or recordings when useful

## Suggesting features

Explain the learning problem first, then describe the proposed solution. Strong feature requests include a concrete example of what the learner should be able to see or understand.

## License of contributions

By submitting a contribution, you agree that your contribution will be licensed under the repository's [MIT License](LICENSE).
