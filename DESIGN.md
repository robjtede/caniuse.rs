---
name: caniuse.rs
description: Rust feature reference and horizontal release atlas.
colors:
  atlas-paper: "#211a17"
  atlas-ink: "#f3e5d7"
  atlas-muted: "#c4a997"
  atlas-line: "#604b40"
  atlas-accent: "#ffad75"
  atlas-code: "#3a2c24"
  atlas-light-paper: "#fff8f1"
  atlas-light-ink: "#3f2d25"
  atlas-light-muted: "#765849"
  atlas-light-line: "#d9c0ad"
  atlas-light-accent: "#a3431c"
  atlas-light-code: "#edddcd"
typography:
  display:
    fontFamily: "Source Sans Pro, sans-serif"
    fontSize: "clamp(3.5rem, 7vw, 5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-.04em"
  headline:
    fontFamily: "Source Sans Pro, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.25rem)"
    fontWeight: 600
    letterSpacing: "-.03em"
  body:
    fontFamily: "Source Sans Pro, sans-serif"
    fontSize: ".95rem"
    lineHeight: 1.6
  label:
    fontFamily: "Source Sans Pro, sans-serif"
    fontSize: ".75rem"
  code:
    fontFamily: "Source Code Pro, monospace"
rounded:
  select: "5px"
  example: "6px"
  arrow: "50%"
spacing:
  panel-gap: "40px"
  panel-gap-compact: "20px"
components:
  release-select:
    backgroundColor: "{colors.atlas-paper}"
    textColor: "{colors.atlas-ink}"
    rounded: "{rounded.select}"
    padding: ".5rem"
  code-example:
    backgroundColor: "{colors.atlas-code}"
    textColor: "{colors.atlas-accent}"
    rounded: "{rounded.example}"
    padding: "1rem"
---

# Design System: caniuse.rs

## Overview

**Creative North Star: "Release atlas"**

The atlas presents Rust releases as a horizontal sequence of readable columns. Large version numbers and a bottom timeline establish position. Feature titles, source links, and code retain the density of a technical reference.

The visual direction belongs to the Rust community: warm orange accents, ivory or charcoal surfaces, and Ferris as a small, familiar guide. Search results use flat rows, fine dividers, and the atlas typography. Feature details, recent features, and unstable features share the palette and retain their existing reference layouts. Availability labels keep their separate status colors.

**Key Characteristics:**

- Horizontal release columns with independently scrollable feature lists.
- Flat surfaces, fine dividers, and orange accents.
- Locally hosted CC0 Ferris artwork in the site brand and empty search states.
- Local sans-serif and monospace fonts.
- A bottom timeline that follows release position.

## Colors

### Primary

The atlas accent identifies version links, the active timeline position, open feature titles, example code, and keyboard focus. The default is peach-orange on warm charcoal. The light theme uses burnt orange on ivory. Orange expresses community identity and navigation; text labels continue to identify availability.

### Neutral

Paper, ink, muted text, divider, and code-surface tokens have explicit light-theme equivalents. Keep each theme's values together. The atlas maps these roles to the shared tokens in `static/style.css`, so the header, atlas, and reference pages use one palette. Green, olive, amber, orange, and red remain semantic status roles, with explicit values for each theme. Text and placeholder contrast must be at least 4.5:1; control borders and focus indicators must be at least 3:1 against their surfaces.

## Typography

Use locally hosted Source Sans Pro for interface text and Source Code Pro for code. Both have regular and semibold WOFF2 files and use `font-display: swap`.

Version numbers use the display role with tabular numerals. Page headings use the headline role. Release headings use semibold text (1.6rem, line-height 1.2). Summary text uses the body role with a maximum width of 60ch. Feature titles use the same body size and line-height; metadata and navigation labels are smaller. Inline code retains the monospace family and can wrap long names.

## Layout

The atlas page spans the viewport width, with desktop padding of 4.5rem 0 1rem. The atlas fills the remaining viewport height with a minimum height of 540px. Its heading and timeline dock surround a flexible horizontal viewport.

Release columns use `min(640px, calc(100% - 110px))`, with a divider and right padding. Each release has its own vertical content scroll area. A trailing spacer allows the final release to align with the first-column position.

At a viewport width of 700px or less, the shared header grows to 4.5rem, page gutters shrink to 1rem, and the atlas minimum height becomes 550px. At an atlas container width of 580px or less, column width becomes `calc(100% - 34px)`, gaps and right padding shrink, metadata stacks, and navigation controls stack. The release selector keeps its accessible label when the visible label is hidden. Short screens can require page scrolling because of the minimum height.

## Elevation & Depth

Atlas surfaces are flat. Dividers separate releases and feature groups; a distinct background identifies code examples. Atlas buttons remove the global button shadow. The shared reference interface still uses small shadows on buttons and menus.

The timeline uses spatial motion for position: its ticks are 112px apart and move with the fractional release position. Ferris stays in the header and empty search states, with no image layer behind reference content.

## Shapes

Release columns have square edges and thin rules. The release selector and code examples use small rounded corners. Previous and next buttons are circular, with a 44px desktop size and a 40px compact size. Timeline targets have a minimum width of 64px and height of 58px.

## Components

### Shared navigation and search

The fixed header contains Ferris beside the site link, the search field, and the menu. Ferris is decorative; the link keeps its accessible name. The search field has a minimum height of 44px, a bottom border, and a visible keyboard focus outline. On compact screens, it fills its available column. The menu keeps access to existing reference routes and the theme switch. The atlas defaults to dark and has a light variant selected through the shared theme control.

### Ferris artwork

Use the unmodified flat Ferris SVG from [rustacean.net](https://rustacean.net/), hosted at `/ferris.svg`. The artist is Karen Rustad Tölva and the artwork is dedicated to the public domain under CC0 1.0. The source and license are recorded in `static/ferris.LICENSE`. Keep Ferris small beside the site name and use a larger instance in empty search states. Do not repeat the mascot in release columns or use it behind text.

### Feature search

Search results share the atlas's flat surfaces, fine dividers, body typography, and code treatment. A page heading and a live result count establish context. The feature name and availability form two columns, with long names wrapping in the first column. Empty and invalid searches keep the same page heading and show Ferris with a useful next step. Availability retains its written label and semantic color.

### Release navigation

The select, previous/next buttons, and timeline ticks navigate the same release stream. Boundary arrows become disabled. The focused stream and timeline support Left, Right, Home, and End. Native select, link, and disclosure keyboard behavior is preserved.

The stream supports horizontal scrolling, touch swipes, and pointer dragging. Vertical wheel input stays vertical. Dragging does not start on links, inputs, selects, or code.

### Feature disclosures

Native details/summary elements show feature titles and expand to reveal the feature permalink, available source links, and tracked API items. An accent marker and open-state color show disclosure state. Groups use explicit changelog-section metadata; missing metadata appears under “Other tracked features.” Counts describe tracked features, not the full contents of a Rust release.

### Timeline and motion

The timeline shows version, abbreviated month, and year, or “Upcoming” when no date is present. Active ticks expose `aria-current`. Offscreen ticks leave the tab order, and fully offscreen release columns become inert. A polite live region announces the selected version and channel after a short delay.

The timeline always follows horizontal movement with parallax. Reduced-motion preference makes release jumps immediate. Jumps of more than three releases are also immediate.

The root route opens at the latest stable release. Beta and Unstable panels follow it. Selection updates the path to `/versions/N`, `/versions/beta`, or `/versions/unstable`, replacing the current history entry. Direct paths and browser Back/Forward select the requested release. Old root hash links remain readable and change to the matching path. Path changes keep the atlas mounted, so expanded features and reading positions survive release navigation.

## Do's and Don'ts

### Do:

- **Do** keep release position visible through version text and timeline state.
- **Do** preserve native links, disclosure controls, and keyboard focus.
- **Do** keep long feature lists vertically scrollable within their release.
- **Do** use explicit data for section names, release copy, and examples.
- **Do** use orange for community identity and preserve written availability labels.
- **Do** keep Ferris artwork local and retain its source and license record.

### Don't:

- **Don't** infer changelog categories from feature titles.
- **Don't** describe tracked-feature counts as complete release-note coverage.
- **Don't** require storage for release navigation.
- **Don't** replace reference layouts or availability meanings when applying shared brand colors.
- **Don't** use mascot imagery behind feature text or repeat it in every release.
