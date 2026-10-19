use std::mem;

use gloo_events::EventListener;
use gloo_utils::{body, document_element, window};
use wasm_bindgen::JsCast;
use web_sys::{HtmlElement, InputEvent, MouseEvent};
use yew::{html, Callback, Component, Context, Html, NodeRef, Properties};
use yew_router::scope_ext::RouterScopeExt;

use crate::{
    icons::{fa_bars, fa_moon, fa_question_circle, fa_sun},
    AppRoute, RouterLink,
};

pub struct Header {
    is_menu_open: bool,
    document_click_listener: Option<EventListener>,
}

pub enum Msg {
    OpenMenu,
    CloseMenu,
    UpdateTheme(&'static str),
}

#[derive(Clone, PartialEq, Properties)]
pub struct Props {
    #[prop_or_default]
    pub input_ref: NodeRef,
    pub oninput: Callback<InputEvent>,
    pub onclear: Callback<()>,
    pub has_query: bool,
}

impl Component for Header {
    type Message = Msg;
    type Properties = Props;

    fn create(_: &Context<Self>) -> Self {
        Self { is_menu_open: false, document_click_listener: None }
    }

    fn update(&mut self, ctx: &Context<Self>, msg: Msg) -> bool {
        match msg {
            Msg::OpenMenu => {
                if !self.is_menu_open {
                    self.document_click_listener = Some(EventListener::new(&body(), "click", {
                        let link = ctx.link().clone();
                        move |_| link.send_message(Msg::CloseMenu)
                    }));
                }

                !mem::replace(&mut self.is_menu_open, true)
            }
            Msg::CloseMenu => {
                if self.is_menu_open {
                    self.document_click_listener = None;
                }

                mem::replace(&mut self.is_menu_open, false)
            }
            Msg::UpdateTheme(theme) => {
                document_element()
                    .dyn_into::<HtmlElement>()
                    .unwrap()
                    .dataset()
                    .set("theme", theme)
                    .unwrap();

                if let Ok(Some(st)) = window().local_storage() {
                    st.set_item("theme", theme).unwrap();
                }

                true
            }
        }
    }

    fn changed(&mut self, _: &Context<Self>, _old_props: &Self::Properties) -> bool {
        true
    }

    fn view(&self, ctx: &Context<Self>) -> Html {
        let (menu_button, menu_classes) = if self.is_menu_open {
            (
                html! {
                    <button type="button" class="active" aria-label="Close menu"
                        aria-expanded="true" aria-controls="site-menu">
                        {fa_bars()}
                    </button>
                },
                "menu active",
            )
        } else {
            let open_menu = ctx.link().callback(|ev: MouseEvent| {
                ev.stop_propagation();
                Msg::OpenMenu
            });

            (
                html! {
                    <button type="button" onclick={open_menu} aria-label="Open menu"
                        aria-expanded="false" aria-controls="site-menu">
                        {fa_bars()}
                    </button>
                },
                "menu",
            )
        };

        let set_theme = |theme: &'static str| ctx.link().callback(move |_| Msg::UpdateTheme(theme));

        let root: HtmlElement = document_element().dyn_into().unwrap();
        let theme_anchor = if root.dataset().get("theme").unwrap() == "dark" {
            html! {
                <button type="button" class="menu-action" onclick={set_theme("light")}>
                    {fa_sun()}{"Light theme"}
                </button>
            }
        } else {
            html! {
                <button type="button" class="menu-action" onclick={set_theme("dark")}>
                    {fa_moon()}{"Dark theme"}
                </button>
            }
        };

        let link = ctx.link().to_owned();
        let cb = ctx.props().oninput.clone();
        let oninput = move |ev| {
            if link.route::<AppRoute>() != Some(AppRoute::Index) {
                link.navigator().unwrap().push(&AppRoute::Index);
            }
            cb.emit(ev);
        };
        let clear = ctx.props().onclear.clone();
        let onclear = Callback::from(move |_| clear.emit(()));
        let onkeydown = ctx.link().batch_callback(|event: web_sys::KeyboardEvent| {
            (event.key() == "Escape").then_some(Msg::CloseMenu)
        });

        html! {
            <header onkeydown={onkeydown}>
                <div class="inner">
                    <a class="site-brand" href="/" aria-label="caniuse.rs release atlas">{"caniuse.rs"}</a>
                    <div class="caniuse">
                        <label for="query">{"Can I use"}</label>
                        <input ref={ctx.props().input_ref.clone()} id="query" type="search"
                            placeholder="Search features" oninput={oninput} />
                        {if ctx.props().has_query {
                            html! { <button type="button" class="search-clear" onclick={onclear}>{"Clear"}</button> }
                        } else {
                            html! { "?" }
                        }}
                    </div>
                    {super::atlas::navigation()}
                    <nav aria-label="Site navigation">
                        {menu_button}
                        <ul id="site-menu" class={"menu ".to_owned() + menu_classes}>
                            <li>{theme_anchor}</li>
                            <li><a href="/">{"Release atlas"}</a></li>
                            <li><a href="/recent">{"Recently stabilized"}</a></li>
                            <li><a href="/unstable">{"Unstable features"}</a></li>
                            <li>
                                <RouterLink to={AppRoute::About}>
                                    {fa_question_circle()}{"About"}
                                </RouterLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </header>
        }
    }
}
