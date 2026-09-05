# CrystalEdu Lab

**An interactive 3D crystallography lab in the browser — explore Bravais lattices, Miller indices, and symmetry operations without installing any software.**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Author](#author)
- [License](#license)

## Overview

Crystallography is hard to teach from static textbook diagrams — lattices, symmetry elements, and Miller planes are inherently 3D, and a flat figure only shows one angle at a time. **CrystalEdu Lab** turns those diagrams into something students can rotate, reset, and step through interactively, directly in a browser, on desktop or phone.

It's built for undergraduate materials-science / crystallography courses: instructors can use it to demonstrate concepts live, and students can use it on their own to build intuition before an exam — no software installation, no license, just a link.

## Features

- **14 Bravais lattices + ionic/covalent structures** (19 total) — cubic, tetragonal, orthorhombic, hexagonal, trigonal, monoclinic, triclinic systems, each with adjustable supercell repetition, ball-and-stick / space-filling (CPK) render modes, and bond toggling.
- **Miller indices explorer** — visualize crystallographic **directions [uvw]** and **planes (hkl)** on conventional or primitive cells, with configurable origin.
- **Symmetry operations lab** — apply proper rotations (1, 2, 3, 4, 6) and rotoinversions (1̄, 2̄, 3̄, 4̄, 6̄) to a point and watch its orbit form in 3D, alongside a live 2D stereographic projection.
  - **Direct mode** — apply an operation and see the full orbit at once.
  - **Step-by-step mode** — walk through each symmetry-equivalent position one at a time, useful for teaching how an orbit is built.
- **Structure Gallery** — browse all 19 structures side by side as a quick reference.
- **Bilingual UI** — full English / French interface toggle.
- **Responsive design** — usable on phone, tablet, and desktop; layout adapts rather than hiding content.
- **In-app feedback form** — users can report issues or suggestions directly from the footer.

## Tech Stack

- **[Next.js 14](https://nextjs.org/)** (App Router, static export)
- **[React 18](https://react.dev/)**
- **[Three.js](https://threejs.org/)** for the 3D scene (lattices, symmetry orbits)
- **HTML5 Canvas** for the 2D stereographic projection
- Deployed on **[Vercel](https://vercel.com/)**

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
git clone https://github.com/AitLamine/CrystalEdu_Lab.git
cd CrystalEdu_Lab
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production build

```bash
npm run build
```

This produces a static export in the `out/` directory (see `next.config.js`), which can be deployed to any static host (Vercel, GitHub Pages, Netlify, etc.).

## Usage

1. **Crystal Structures tab** — pick a structure from the dropdown (or the Gallery), adjust supercell repetitions, toggle bonds/render mode, and drag to rotate / scroll to zoom.
2. **Miller Indices tab** — switch between Directions and Planes, enter `[uvw]` or `(hkl)` indices, and choose the conventional or primitive cell to see the corresponding vector or plane rendered on the lattice.
3. **Symmetry tab** — choose a symmetry operation, pick Direct or Step-by-Step mode, and apply it to the default point to see its orbit build up in both the 3D view and the 2D stereographic projection.
4. Use the language toggle (FR/EN) and theme toggle (☀️/🌙) in the header at any time; the footer's **Feedback** button opens a short form for bug reports or suggestions.

## Project Structure

```
crystaledu/
├── app/                  # Next.js App Router entry (layout, page, error/loading states)
├── components/           # UI: AppShell, Header, Footer, Struct/Miller/Symmetry/Gallery controls
└── lib/                  # Structure definitions, symmetry-operation math, translations
```

## Contributing

Issues and pull requests are welcome. If you're proposing a larger change, please open an issue first to discuss what you'd like to change.

## Author

**Lahcen Ait Lamine**
[GitHub @AitLamine](https://github.com/AitLamine)

## License

All rights reserved. No open-source license has been applied to this project yet.
