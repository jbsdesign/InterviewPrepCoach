# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development commands

This is a Next.js App Router project managed with npm. The primary entrypoint for development is the scripts section in `package.json`. Commands below use npm, but any package manager that understands npm scripts (yarn, pnpm, bun) can be substituted.

- Install dependencies:
  - `npm install`
- Run the development server on port 3000:
  - `npm run dev`
- Create a production build:
  - `npm run build`
- Start the production server (after `npm run build`):
  - `npm run start`
- Run linting for the whole project using the Next ESLint config:
  - `npm run lint`

### Testing

There is currently no test runner or `npm test` script configured in `package.json`. Add a test framework and scripts before relying on automated tests or asking Warp to run a single test or a single spec file.

## Project structure and architecture

High level structure (top level):

- `app/` Next.js App Router root. Contains the root layout, global CSS import, and the main page for `/`.
- `public/` Static assets served by Next.js, including SVG icons such as `coach-whistle-logo.svg` used on the home page.
- `next.config.ts` Next.js configuration file (currently minimal placeholder).
- `tsconfig.json` TypeScript configuration shared by the app and tooling.
- `eslint.config.mjs` ESLint configuration based on `eslint-config-next`.
- `postcss.config.mjs` PostCSS configuration that wires in Tailwind CSS v4.

### App directory

The app uses the Next.js App Router with a single public route at `/`.

- `app/layout.tsx`
  - Declares global `metadata` for the site (title and description).
  - Imports Geist and Geist Mono fonts via `next/font/google` and exposes them as CSS variables.
  - Imports `./globals.css` so global styles and Tailwind utilities are available everywhere.
  - Defines `RootLayout`, which wraps every page in the HTML shell and sets the `body` class to include the Geist font variables and antialiasing.

- `app/page.tsx`
  - Default route for `/` and current main UI entrypoint.
  - Renders the "Interview Prep Coach" landing and authentication shell as a single React component, using Tailwind utility classes for layout and styling.
  - Uses `next/image` to display the `coach-whistle-logo.svg` asset from `public/` and centers a card-style panel in the viewport.
  - Contains a segmented control for "Sign up" vs "Sign in" and an email plus password form, but there is currently no client side state or submission handler wired up. Submissions are effectively no-ops until explicit handlers, server actions, or API routes are introduced.
  - This is the primary place to start implementing new features, extracting reusable components, and adding navigation or auth flows until additional routes or segments are added under `app/`.

- `app/globals.css`
  - Imports Tailwind via `@import "tailwindcss";` using the Tailwind v4 PostCSS plugin configured in `postcss.config.mjs`.
  - Defines CSS variables for `--background` and `--foreground` and swaps them for dark mode using a `prefers-color-scheme: dark` media query.
  - Defines an inline Tailwind theme block that maps `--color-background`, `--color-foreground`, and font families to the Geist font variables created in `layout.tsx`.
  - Sets base `body` styles (background, text color, and a system font family) that are combined with Tailwind utility classes on individual components.

There are currently no custom API routes, server components with data fetching, or additional route segments beyond the root page.

### TypeScript and module resolution

- `tsconfig.json`
  - Enables `strict` type checking and uses `moduleResolution: "bundler"` appropriate for Next 16.
  - Includes all `*.ts`, `*.tsx`, and `*.mts` files in the project plus Next generated type files under `.next/`.
  - Defines a path alias `@/*` that points to the project root. When new modules are added, prefer imports like `@/app/your-module` rather than long relative paths.

### Linting and formatting

- `eslint.config.mjs`
  - Uses `defineConfig` from `eslint/config` and composes `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
  - Overrides default ignores using `globalIgnores` so that `.next/**`, `out/**`, `build/**`, and `next-env.d.ts` are ignored explicitly.
  - `npm run lint` is the canonical way to run linting in this repo.

### Styling pipeline

- `postcss.config.mjs`
  - Registers "@tailwindcss/postcss" as the sole PostCSS plugin, which drives Tailwind v4.
  - Combined with `app/globals.css` this provides utility classes and theme tokens for the whole app.

### Package and runtime dependencies

- `package.json`
  - Runtime dependencies: `next`, `react`, `react-dom`.
  - Dev dependencies: TypeScript, ESLint, `eslint-config-next`, Tailwind CSS v4, and React/Node type packages.
  - Scripts: `dev`, `build`, `start`, and `lint` are the main entrypoints that Warp should use when running or validating the app.
