# [caniuse.rs]

Rust feature search

## About

This site allows you to quickly which version of Rust stabilized a certain
feature, or whether it is still unstable. Head over to [caniuse.rs] to try it!

[caniuse.rs]: https://caniuse-rs.x52.dev/

## Contributing

### Running the site locally

First you need to be able to run the site locally of course, to try your
changes.

Pre-requisites:

- cargo
- [wasm-pack][] (website has install instructions, to build from source use
  `cargo install wasm-pack`)
- [rollup][] (`npm install --global rollup` if you have [npm installed][npm])

[wasm-pack]: https://rustwasm.github.io/wasm-pack/installer/
[rollup]: https://www.rollupjs.org/guide/en/
[npm]: https://www.npmjs.com/get-npm

Once those are installed, run `just serve` and the site will be
built and served at <http://localhost:8000/>.

Available recipes:

- `just build`: build development wasm/js assets into `public/`
- `just build-release`: build release wasm/js assets into `public/`
- `just serve`: build development assets and serve the site locally
- `just serve-release`: build release assets and serve the site locally
- `just fmt-check`: check Rust formatting
- `just lint`: check the WebAssembly build with Clippy
- `just test`: run the Rust unit tests
- `just container-smoke IMAGE`: check a container's startup, assets, and deep links

### Container publishing

The Docker workflow builds a `linux/amd64` image for pull requests and checks
it without publishing. Pushes to `main` or a `v*` tag publish a candidate at
`ghcr.io/robjtede/caniuse.rs:sha-<full-commit>`.

Promotion requires formatting, WebAssembly Clippy, and unit tests to pass. A
separate job then runs `just container-smoke` against the exact published
candidate digest. This checks startup as user 10001 with a read-only root
filesystem, asset content types, the WebAssembly header, feature JSON, and SPA
deep links. The smoke recipe requires Docker and Node.js 24.

After these checks pass, the job points `stable` at the same image index without
rebuilding it. Main-branch promotions also update `latest`; tag promotions add
the version tag. A failed check leaves the deployment tags unchanged.

Deployments must follow `ghcr.io/robjtede/caniuse.rs:stable` by digest. Publishing
a candidate alone does not select a new deployment image. Manual workflow runs
publish only from `main` or a `v*` tag.

### Social preview image

The shared HTML template includes a description, Open Graph metadata, and a
Twitter large-image card. Both previews use `static/opengraph.png`.

### Adding data

The home page is a horizontal release atlas. Release permalinks
(`/versions/1.57`, for example) open the atlas at that release. Search, feature
permalinks, and the recent and unstable listings remain available.

The selected release is reflected in its path (`/versions/1.57`,
`/versions/beta`, or `/versions/unstable`). Opening that URL selects the release.
Scroll updates replace the current history entry. Older root URLs such as
`/#1.57` still open the requested release and change to its version path.
CSS scroll snapping centers releases after scrolling.

The carousel mounts content only for visible releases and nearby releases.
Lightweight placeholders preserve scroll width and snap positions. Expanded
features and vertical reading positions are restored when a release returns.

Use the arrow buttons, arrow keys, release selector, or bottom timeline to move
between releases. A trackpad or touch gesture can scroll horizontally. Vertical
scrolling stays vertical. The timeline always follows horizontal movement with
parallax. The home page opens at the latest stable release, followed by Beta
and Unstable panels. Reduced-motion users get immediate release jumps.

Optional fields in `data/versions.toml` supply the editorial release introduction:

- `headline`: A short release heading.
- `summary`: A factual description of the highlighted change.
- `example`: A code or configuration excerpt. Excerpts need not be complete programs.

Without these fields, the atlas shows the version and its feature groups.
The feature groups describe this project's coverage, not every change in the Rust release.

You may want to look at issue [#16][] for missing data. These fields can be
specified for a feature:

* `title`: Short description to identify the feature. Should fit into
  "can i use {title}?".
* `changelog_section`: The verified section heading from that version's
  [Rust release notes](https://doc.rust-lang.org/stable/releases.html), such as
  `Language`, `Libraries`, `Stabilised APIs`, or `Cargo`. Preserve the upstream
  spelling. Do not infer a section from an API name or feature flag. Omit this
  field until checked; the atlas puts such entries under "Other tracked features".
* `flag`: The feature flag, if any – you can most often find this in the diff of
  the stabilization or implementation PR, for library features look for
  `#[stable]` and `#[rustc_const_stable]` attributes.
* `rfc_id`: RFC ID, if applicable – the number of the PR that added the RFC.
  Also the first part of the filename of the RFC after being merged.
* `impl_pr_id`: Implementation PR ID, if applicable – the number of the PR that
  added this feature. For features where is no clear single implementation PR,
  leave out this field.
* `tracking_issue_id`: Tracking issue ID, if applicable.
* `stabilization_pr_id`: Stabilization PR ID, if applicable.
* `doc_path`: Documentation path, if applicable –
  `https://doc.rust-lang.org/{path}`.
* `edition_guide_path`: Edition guide path, if applicable –
  `https://doc.rust-lang.org/edition-guide/{path}`
* `unstable_book_path`: Unstable book path, if applicable –
  `https://doc.rust-lang.org/unstable-book/{path}`
* `items`: Language items (functions, structs, modules) that are part of this
  feature – do not specify if this feature is exactly one item and that item
  is already used as the title
* `aliases`: Alternatives to the `title`

[#16]: https://github.com/jplatte/caniuse.rs/issues/16

## Related Projects

- [alfred-caniuse-rs](https://github.com/robjtede/alfred-caniuse-rs): caniuse.rs
  lookups as an Alfred workflow (macOS)
