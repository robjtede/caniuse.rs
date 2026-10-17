# [caniuse.rs]

Rust feature search

## About

This site allows you to quickly which version of Rust stabilized a certain
feature, or whether it is still unstable. Head over to [caniuse.rs] to try it!

[caniuse.rs]: https://caniuse.rs/

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
- `just deploy`: build release assets and upload them to production
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

### Adding data

You may want to look at issue [#16][] for missing data. These fields can be
specified for a feature:

* `title`: Short description to identify the feature. Should fit into
  "can i use {title}?".
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
