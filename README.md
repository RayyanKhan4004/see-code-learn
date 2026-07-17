# CodeVision

> See how your code actually runs.

CodeVision is an interactive learning platform that visualizes what happens inside JavaScript while code executes. Instead of only reading explanations, learners can watch the call stack, memory heap, event loop, microtask queue, macrotask queue, and Web APIs change step by step.

**Live app:** https://see-code-learn.vercel.app

## Why CodeVision?

Concepts such as closures, asynchronous JavaScript, garbage collection, and the event loop can feel abstract. CodeVision turns those invisible processes into visual, interactive explanations.

## Current features

- JavaScript execution visualizer
- Call stack visualization
- Heap and object-reference visualization
- Event loop visualization
- Microtask and macrotask queues
- Web API tracking
- Monaco-based code editor
- Step-by-step execution controls

## Roadmap

Community contributions are especially welcome in these areas:

- React render-cycle visualizer
- Next.js SSR, CSR, SSG, and hydration visualizer
- Database and query-execution visualizer
- Networking and HTTP lifecycle visualizer
- More JavaScript examples and learning challenges
- Accessibility and mobile improvements
- Documentation and translations

## Tech stack

- React 19
- TypeScript
- TanStack Start
- TanStack Router
- TanStack Query
- Monaco Editor
- Tailwind CSS 4
- Vite
- Bun

## Getting started

### Prerequisites

Install [Bun](https://bun.sh/) and Git.

### Run locally

```bash
git clone https://github.com/RayyanKhan4004/see-code-learn.git
cd see-code-learn
bun install
bun run dev
```

Open the local URL shown in your terminal.

### Available commands

```bash
bun run dev       # Start the development server
bun run build     # Create a production build
bun run preview   # Preview the production build
bun run lint      # Run ESLint
bun run format    # Format files with Prettier
```

## Contributing

Contributions of every size are welcome, including bug reports, documentation, UI improvements, examples, visualizers, and accessibility fixes.

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

A good first contribution can be:

- Improving an explanation
- Adding a JavaScript example
- Fixing a visual or responsive issue
- Adding accessibility labels
- Writing documentation
- Reproducing and documenting a bug

Browse the [open issues](https://github.com/RayyanKhan4004/see-code-learn/issues) to get started.

## Community

Please follow our [Code of Conduct](CODE_OF_CONDUCT.md). Be respectful, constructive, and welcoming to learners and contributors of all experience levels.

## Security

Please do not publish security vulnerabilities in public issues. Follow the instructions in [SECURITY.md](SECURITY.md).

## Support the project

You can support CodeVision by:

- Starring the repository
- Sharing it with learners
- Reporting useful issues
- Contributing code or documentation
- Sponsoring the project through the repository's **Sponsor** button when funding is available

## License

CodeVision is released under the [MIT License](LICENSE).

Copyright © 2026 Rayyan Khan.
