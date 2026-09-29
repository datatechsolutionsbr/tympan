//! SSR parity: every generated binding renders exactly the markup its
//! element's definition specifies (see `parity/generated.rs`, written by
//! `tools/elements/generate.mjs`, and `tests/fixtures`).

mod common;

#[rustfmt::skip]
#[path = "parity/generated.rs"]
mod generated;

#[path = "parity/native/action_menu.rs"]
mod native_action_menu;

#[path = "parity/native/avatar.rs"]
mod native_avatar;

#[path = "parity/native/breadcrumbs.rs"]
mod native_breadcrumbs;

#[path = "parity/native/button.rs"]
mod native_button;

#[path = "parity/native/checkbox.rs"]
mod native_checkbox;

#[path = "parity/native/command_palette.rs"]
mod native_command_palette;

#[path = "parity/native/currency_field.rs"]
mod native_currency_field;

#[path = "parity/native/data_table.rs"]
mod native_data_table;

#[path = "parity/native/drawer.rs"]
mod native_drawer;

#[path = "parity/native/heading.rs"]
mod native_heading;

#[path = "parity/native/inline_notice.rs"]
mod native_inline_notice;

#[path = "parity/native/link.rs"]
mod native_link;

#[path = "parity/native/markdown_view.rs"]
mod native_markdown_view;

#[path = "parity/native/modal.rs"]
mod native_modal;

#[path = "parity/native/native_select.rs"]
mod native_native_select;

#[path = "parity/native/notification_center.rs"]
mod native_notification_center;

#[path = "parity/native/page_header.rs"]
mod native_page_header;

#[path = "parity/native/popover.rs"]
mod native_popover;

#[path = "parity/native/progress_bar.rs"]
mod native_progress_bar;

#[path = "parity/native/section_heading.rs"]
mod native_section_heading;

#[path = "parity/native/segmented_control.rs"]
mod native_segmented_control;

#[path = "parity/native/separator.rs"]
mod native_separator;

#[path = "parity/native/skeleton.rs"]
mod native_skeleton;

#[path = "parity/native/skip_link.rs"]
mod native_skip_link;

#[path = "parity/native/spinner.rs"]
mod native_spinner;

#[path = "parity/native/status_pill.rs"]
mod native_status_pill;

#[path = "parity/native/surface.rs"]
mod native_surface;

#[path = "parity/native/switch.rs"]
mod native_switch;

#[path = "parity/native/tabs.rs"]
mod native_tabs;

#[path = "parity/native/tag.rs"]
mod native_tag;

#[path = "parity/native/tag_field.rs"]
mod native_tag_field;

#[path = "parity/native/text_area.rs"]
mod native_text_area;

#[path = "parity/native/text_field.rs"]
mod native_text_field;

#[path = "parity/native/theme_palette.rs"]
mod native_theme_palette;

#[path = "parity/native/toast.rs"]
mod native_toast;

#[path = "parity/native/wheel_picker.rs"]
mod native_wheel_picker;
