---
name: caniuse.rs
description: Rust feature reference and horizontal release atlas.
colors:
  atlas-paper: "#14232c"
  atlas-ink: "#e7eef0"
  atlas-muted: "#b0bec4"
  atlas-line: "#405762"
  atlas-accent: "#d6f39b"
  atlas-code: "#21343e"
  atlas-light-paper: "#f6f8f2"
  atlas-light-ink: "#24382e"
  atlas-light-muted: "#51685b"
  atlas-light-line: "#bdcbbf"
  atlas-light-accent: "#356419"
  atlas-light-code: "#e6eddd"
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

This document records the implemented atlas and its shared navigation. Search, feature details, recent features, and unstable features retain their existing reference layouts. The atlas palette does not replace those pages' status colors.

**Key Characteristics:**

- Horizontal release columns with independently scrollable feature lists.
- Flat surfaces, fine dividers, and green accents.
- Local sans-serif and monospace fonts.
- A bottom timeline that follows release position.

## Colors

### Primary

The atlas accent identifies version links, the active timeline position, open feature titles, example code, and keyboard focus. The default is pale green on a dark blue-gray surface. The light theme uses a deeper green accent.

### Neutral

Paper, ink, muted text, divider, and code-surface tokens have explicit light-theme equivalents. Keep each theme's values together. Shared navigation adopts the atlas colors while the atlas is present. Existing reference pages continue to use the global surface and status tokens in `static/style.css`.

## Typography

Use locally hosted Source Sans Pro for interface text and Source Code Pro for code. Both have regular and semibold WOFF2 files and use `font-display: swap`.

Version numbers use the display role with tabular numerals. Page headings use the headline role. Release headings use semibold text (1.6rem, line-height 1.2). Summary text uses the body role with a maximum width of 60ch. Feature titles use the same body size and line-height; metadata and navigation labels are smaller. Inline code retains the monospace family and can wrap long names.

## Layout

The atlas page spans the viewport width, with desktop padding of 4.5rem 0 1rem. The atlas fills the remaining viewport height with a minimum height of 540px. Its heading and timeline dock surround a flexible horizontal viewport.

Release columns use `min(640px, calc(100% - 110px))`, with a divider and right padding. Each release has its own vertical content scroll area. A trailing spacer allows the final release to align with the first-column position.

At a viewport width of 700px or less, the shared header grows to 4.5rem, page gutters shrink to 1rem, and the atlas minimum height becomes 550px. At an atlas container width of 580px or less, column width becomes `calc(100% - 34px)`, gaps and right padding shrink, metadata stacks, and navigation controls stack. The release selector keeps its accessible label when the visible label is hidden. Short screens can require page scrolling because of the minimum height.

## Elevation & Depth

Atlas surfaces are flat. Dividers separate releases and feature groups; a distinct background identifies code examples. Atlas buttons remove the global button shadow. The shared reference interface still uses small shadows on buttons and menus.

The timeline uses spatial motion for position: its ticks are 112px apart and move with the fractional release position. There is no decorative image layer.

## Shapes

Release columns have square edges and thin rules. The release selector and code examples use small rounded corners. Previous and next buttons are circular, with a 44px desktop size and a 40px compact size. Timeline targets have a minimum width of 64px and height of 58px.

## Components

### Shared navigation and search

The fixed header contains the site link, search field, and menu. The search field uses a bottom border and a visible keyboard focus outline. The menu keeps access to existing reference routes and the theme switch. The atlas defaults to dark and has a light variant selected through the shared theme control.

### Release navigation

The select, previous/next buttons, and timeline ticks navigate the same release stream. Boundary arrows become disabled. The focused stream and timeline support Left, Right, Home, and End. Native select, link, and disclosure keyboard behavior is preserved.

The stream supports horizontal scrolling, touch swipes, and pointer dragging. Vertical wheel input stays vertical. Dragging does not start on links, inputs, selects, or code.

### Feature disclosures

Native details/summary elements show feature titles and expand to reveal the feature permalink, available source links, and tracked API items. An accent marker and open-state color show disclosure state. Groups use explicit changelog-section metadata; missing metadata appears under “Other tracked features.” Counts describe tracked features, not the full contents of a Rust release.

### Timeline and motion

The timeline shows version, abbreviated month, and year, or “Upcoming” when no date is present. Active ticks expose `aria-current`. Offscreen ticks leave the tab order, and fully offscreen release columns become inert. A polite live region announces the selected version and channel after a short delay.

The timeline always follows horizontal movement with parallax. Reduced-motion preference makes release jumps immediate. Jumps of more than three releases are also immediate.

The root route opens at the latest stable release. Beta and Unstable panels follow it. An explicit release route selects its requested version.

## Do's and Don'ts

### Do:

- **Do** keep release position visible through version text and timeline state.
- **Do** preserve native links, disclosure controls, and keyboard focus.
- **Do** keep long feature lists vertically scrollable within their release.
- **Do** use explicit data for section names, release copy, and examples.

### Don't:

- **Don't** infer changelog categories from feature titles.
- **Don't** describe tracked-feature counts as complete release-note coverage.
- **Don't** require storage for release navigation.
- **Don't** apply atlas-specific styling to all reference pages without review.
