use std::collections::BTreeMap;

use gloo_events::EventListener;
use yew::{
    function_component, html, use_effect_with, use_node_ref, use_state_eq, Html, Properties,
};

use crate::{
    util::{maybe_link, view_text},
    AppRoute, Channel, FeatureData, RouterLink, VersionData, FEATURES, VERSIONS,
};

const BETA: VersionData = VersionData {
    number: "beta",
    channel: Channel::Beta,
    headline: Some("Coming in the next release"),
    summary: None,
    example: None,
    release_date: None,
    release_notes: None,
    gh_milestone_id: None,
    blog_post_path: None,
};

const UNSTABLE: VersionData = VersionData {
    number: "unstable",
    channel: Channel::Nightly,
    headline: Some("Still taking shape"),
    ..BETA
};

#[derive(PartialEq, Properties)]
pub struct Props {
    #[prop_or_default]
    pub initial_version: Option<&'static str>,
}

/// Render content in Rust. The release-atlas custom element owns only browser interaction.
#[function_component(Atlas)]
pub fn atlas(props: &Props) -> Html {
    let initial = props
        .initial_version
        .or_else(|| VERSIONS.iter().find(|v| v.channel == Channel::Stable).map(|v| v.number));

    let versions: Vec<_> = VERSIONS
        .iter()
        .rev()
        .filter(|v| v.channel == Channel::Stable)
        .chain([&BETA, &UNSTABLE])
        .collect();

    let root = use_node_ref();
    let window = use_state_eq(|| {
        let hash = gloo_utils::window().location().hash().unwrap_or_default();
        let index = versions
            .iter()
            .position(|v| Some(v.number) == props.initial_version)
            .or_else(|| versions.iter().position(|v| format!("#{}", v.number) == hash))
            .or_else(|| versions.iter().position(|v| Some(v.number) == initial))
            .unwrap_or(0);

        (index.saturating_sub(2), (index + 2).min(versions.len() - 1))
    });

    {
        let window = window.clone();

        use_effect_with(root.clone(), move |root| {
            let listener = root.cast::<web_sys::Element>().map(|element| {
                let target = element.clone();

                EventListener::new(&element, "atlas-window", move |_| {
                    let start =
                        target.get_attribute("data-window-start").and_then(|v| v.parse().ok());
                    let end = target.get_attribute("data-window-end").and_then(|v| v.parse().ok());

                    if let (Some(start), Some(end)) = (start, end) {
                        window.set((start, end));
                    }
                })
            });

            move || drop(listener)
        });
    }

    let releases = versions.iter().enumerate().map(|(index, version)| {
        html! {
            <ReleasePanel key={version.number} version={*version}
                mounted={index >= window.0 && index <= window.1} />
        }
    });

    html! {
        <@{"release-atlas"} ref={root} class="atlas" data-initial-version={initial}>
            <div class="atlas-viewport" tabindex="0" role="region"
                aria-label="Release stream. Use left and right arrow keys to browse.">
                <div class="atlas-track">
                    {for releases}
                    <div class="atlas-spacer" aria-hidden="true"></div>
                </div>
            </div>
            <div class="atlas-dock">
                <div class="atlas-dock-heading">
                    <span>{"Release timeline"}</span>
                    <span class="atlas-timeline-hint">{"Drag or select a version"}</span>
                </div>
                <div class="atlas-timeline" aria-label="Release timeline">
                    <div class="atlas-timeline-plane">
                        {for versions.iter().enumerate().map(|(index, v)| html! {
                            <button type="button" class="atlas-tick"
                                data-index={index.to_string()} aria-label={format!("Rust {}", v.number)}>
                                <span>{if v.channel == Channel::Stable { v.number } else { channel_label(v.channel) }}</span>
                                <small>{v.release_date.map(timeline_date).unwrap_or_else(|| "Upcoming".into())}</small>
                            </button>
                        })}
                    </div>
                    <span class="atlas-cursor" aria-hidden="true"></span>
                </div>
                <div class="atlas-footer">
                    <span>{"Scroll, swipe, drag, or use the arrow keys."}</span>
                </div>
                <span class="sr-only atlas-announcement" aria-live="polite"></span>
            </div>
        </@>
    }
}

pub fn navigation() -> Html {
    let versions =
        VERSIONS.iter().rev().filter(|v| v.channel == Channel::Stable).chain([&BETA, &UNSTABLE]);

    html! {
        <div class="atlas-navigation">
            <label for="atlas-release">{"Jump to release"}</label>
            <select id="atlas-release" aria-label="Jump to release">
                {for versions.map(|v| html! {
                    <option value={v.number}>
                        {if v.channel == Channel::Stable { format!("Rust {}", v.number) } else { channel_label(v.channel).into() }}
                    </option>
                })}
            </select>
            <div class="atlas-arrows">
                <button type="button" data-action="previous" aria-label="Previous release">
                    {arrow(false)}
                </button>
                <button type="button" data-action="next" aria-label="Next release">
                    {arrow(true)}
                </button>
            </div>
        </div>
    }
}

#[derive(PartialEq, Properties)]
struct ReleasePanelProps {
    version: &'static VersionData,
    mounted: bool,
}

#[function_component(ReleasePanel)]
fn release_panel(props: &ReleasePanelProps) -> Html {
    let version = props.version;
    let contents = if props.mounted {
        let features = FEATURES
            .iter()
            .filter(|feature| match feature.version {
                Some(release) if release.channel == Channel::Stable => {
                    release.number == version.number
                }
                Some(release) if release.channel == Channel::Beta => {
                    version.channel == Channel::Beta
                }
                _ => version.channel == Channel::Nightly,
            })
            .collect();

        view_release(version, features)
    } else {
        Html::default()
    };

    html! {
        <section class="atlas-release" data-version={version.number}
            data-channel={channel_label(version.channel)} data-date={version.release_date}
            aria-label={format!("Rust {}", version.number)}>
            {contents}
        </section>
    }
}

fn timeline_date(date: &str) -> String {
    let months =
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let month = date.get(5..7).and_then(|value| value.parse::<usize>().ok());

    match month.and_then(|month| month.checked_sub(1)).and_then(|index| months.get(index)) {
        Some(month) => format!("{} {}", month, &date[..4]),
        None => date.into(),
    }
}

fn channel_label(channel: Channel) -> &'static str {
    match channel {
        Channel::Stable => "",
        Channel::Beta => "Beta",
        Channel::Nightly => "Unstable",
    }
}

fn arrow(right: bool) -> Html {
    html! {
        <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d={if right { "M4 10h12m-5-5 5 5-5 5" } else { "M16 10H4m5-5-5 5 5 5" }} />
        </svg>
    }
}

fn section_order(section: &str) -> u8 {
    match section {
        "Language" => 0,
        "Compiler" => 1,
        "Libraries" => 2,
        "Stabilized APIs" | "Stabilised APIs" => 3,
        "Const Stabilized APIs" | "Const Stabilised APIs" => 4,
        "Cargo" => 5,
        "Rustdoc" => 6,
        "Compatibility Notes" | "Compatibility notes" => 7,
        "Internal Changes" | "Internal changes" => 8,
        _ => 9,
    }
}

fn view_release(version: &VersionData, features: Vec<&FeatureData>) -> Html {
    let count = features.len();
    let mut groups = BTreeMap::<(u8, &str), Vec<&FeatureData>>::new();

    for feature in features {
        let section = feature.changelog_section.unwrap_or("Other tracked features");
        groups.entry((section_order(section), section)).or_default().push(feature);
    }

    let sections = groups.into_iter().map(|((_, title), mut features)| {
        features.sort_by_key(|f| f.title);

        html! {
            <section class="atlas-feature-group">
                <h3>{title}<span>{features.len()}</span></h3>
                {for features.into_iter().map(view_feature)}
            </section>
        }
    });

    let channel = channel_label(version.channel);

    html! {
        <>
            <div class="atlas-release-heading">
                {if version.channel == Channel::Stable {
                    html! { <RouterLink to={AppRoute::Version { number: version.number.into() }}
                        classes="atlas-version">{version.number}</RouterLink> }
                } else {
                    html! { <span class="atlas-version">{channel}</span> }
                }}
                <div class="atlas-release-meta">
                    <time datetime={version.release_date}>
                        {version.release_date.unwrap_or("")}
                    </time>
                </div>
            </div>
            <div class="atlas-release-content" tabindex="0"
                aria-label={format!("Features in Rust {}", version.number)}>
                {version.headline.map(|headline| html! { <h2>{headline}</h2> }).unwrap_or_default()}
                {if let Some(summary) = version.summary {
                    html! { <p class="atlas-summary">{summary}</p> }
                } else {
                    html! {}
                }}
                {if let Some(example) = version.example {
                    html! { <pre class="atlas-example"><code>{example}</code></pre> }
                } else {
                    html! {}
                }}
                {for sections}
                {if count == 0 {
                    html! { <p>{"No features are tracked for this release yet."}</p> }
                } else {
                    html! {}
                }}
                <ul class="atlas-source-links">
                    {maybe_link("Release announcement", "https://blog.rust-lang.org/", version.blog_post_path)}
                    {maybe_link("Full release notes", "https://github.com/rust-lang/rust/blob/master/RELEASES.md#", version.release_notes)}
                    {maybe_link("GitHub milestone", "https://github.com/rust-lang/rust/milestone/", version.gh_milestone_id)}
                </ul>
            </div>
        </>
    }
}

fn view_feature(feature: &FeatureData) -> Html {
    let documentation_base = match feature.version.map(|version| version.channel) {
        Some(Channel::Stable) => "https://doc.rust-lang.org/",
        Some(Channel::Beta) => "https://doc.rust-lang.org/beta/",
        _ => "https://doc.rust-lang.org/nightly/",
    };

    html! {
        <details class="atlas-feature">
            <summary>{view_text(feature.title)}</summary>
            <div class="atlas-feature-details">
                <RouterLink to={AppRoute::Feature { name: feature.slug.into() }}>
                    {"Feature details and permalink"}
                </RouterLink>
                <ul class="atlas-source-links">
                    {maybe_link("Documentation", documentation_base, feature.doc_path)}
                    {maybe_link("Stabilization PR", "https://github.com/rust-lang/rust/pull/", feature.stabilization_pr_id)}
                    {maybe_link("Tracking issue", "https://github.com/rust-lang/rust/issues/", feature.tracking_issue_id)}
                </ul>
                {if feature.items.is_empty() {
                    html! {}
                } else {
                    html! { <ul class="atlas-items">
                        {for feature.items.iter().map(|item| html! { <li><code>{item}</code></li> })}
                    </ul> }
                }}
            </div>
        </details>
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn release_groups_follow_changelog_order() {
        let mut headings = ["Cargo", "Stabilised APIs", "Compiler", "Language", "Libraries"];
        headings.sort_by_key(|heading| section_order(heading));

        assert_eq!(headings, ["Language", "Compiler", "Libraries", "Stabilised APIs", "Cargo"]);
    }

    #[test]
    fn unclassified_features_follow_verified_sections() {
        assert!(section_order("Other tracked features") > section_order("Internal Changes"));
    }
}
