# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is the frontend UI for the AI Code Analyzer system, built with Next.js 15.5.0, React 19, and TypeScript. It uses Tailwind CSS v4 for styling and includes Turbopack for faster development builds. The UI is designed to work with a backend code analysis service.

## Development Commands

### Core Development
```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Testing and Quality
Currently no test suite is configured. When adding tests, typical Next.js patterns would include:
- Jest + React Testing Library for unit/integration tests
- Playwright or Cypress for e2e tests

## Architecture

### Project Structure
- **Next.js 15 App Router**: Uses the modern `src/app/` directory structure
- **TypeScript Configuration**: Strict TypeScript setup with path aliases (`@/*` -> `./src/*`)
- **Styling**: Tailwind CSS v4 with custom CSS variables for theming
- **Fonts**: Uses Geist Sans and Geist Mono fonts from Google Fonts

### Key Configuration Files
- `next.config.ts`: Next.js configuration (minimal, extensible)
- `tsconfig.json`: TypeScript configuration with strict settings
- `eslint.config.mjs`: ESLint configuration using Next.js recommended rules
- `tailwindcss` imported directly in `globals.css`

### Current State
The project is in initial setup phase with:
- Default Next.js landing page (`src/app/page.tsx`)
- Root layout with font configuration (`src/app/layout.tsx`)
- Dark/light theme support via CSS custom properties
- Basic responsive design

## Development Patterns

### File Organization
- Use the `src/app/` directory for pages and layouts (App Router)
- Components should be organized in `src/components/` (when created)
- Utilities and shared logic in `src/lib/` or `src/utils/` (when created)
- Types should be defined in `src/types/` or co-located with components

### Styling Approach
- Tailwind CSS v4 with custom theme configuration
- CSS custom properties for theme values (background, foreground colors)
- Font variables integrated with Tailwind configuration
- Responsive design using Tailwind's responsive prefixes

### Backend Integration
This UI is designed to work with the companion `codeAnalyzer` backend service. API integration patterns should:
- Use Next.js API routes (`src/app/api/`) for backend communication
- Implement proper error handling and loading states
- Consider using React Server Components where appropriate

## Port and Local Development
- Development server runs on `http://localhost:3000` by default
- Hot reload is enabled for immediate feedback during development
- Turbopack provides faster builds and hot reloading

## Dependencies Management
- Node.js packages managed via npm
- Key dependencies: React 19.1.0, Next.js 15.5.0, TypeScript 5
- Development dependencies include Tailwind CSS v4, ESLint with Next.js config
