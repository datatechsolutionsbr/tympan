//! Native Dioxus ports of Tympan's elements: the same anatomy, stylesheet
//! contract (`.ty-*` classes and `data-*` state) and SSR markup as the
//! generated bindings in [`crate::generated`], but with the behaviour in
//! Rust (signals, effects, the platform's form semantics) instead of the
//! custom-element script — a host that uses only these components does not
//! need to serve `elements.js`.
//!
//! Each port is validated against the same `tests/fixtures` the generated
//! bindings and the TypeScript elements are tested against (see
//! `tests/parity/native/`), so the three renderers cannot drift apart.
//! Form-native elements (checkbox, switch, text field) keep the platform's
//! own `<input>` and only mirror state, exactly as the custom elements did;
//! composite elements (tabs, toast, notification center) compose and drive
//! their anatomy declaratively in `rsx!` with the DOM effects cfg-gated in
//! a private `mod wasm`.

pub mod action_menu;
pub mod avatar;
pub mod breadcrumbs;
pub mod button;
pub mod checkbox;
pub mod command_palette;
pub mod currency_field;
pub mod data_table;
pub mod drawer;
pub mod heading;
pub mod inline_notice;
pub mod link;
pub mod markdown_view;
pub mod modal;
pub mod native_select;
pub mod notification_center;
pub mod page_header;
pub mod popover;
pub mod progress_bar;
pub mod section_heading;
pub mod segmented_control;
pub mod separator;
pub mod skeleton;
pub mod skip_link;
pub mod spinner;
pub mod status_pill;
pub mod surface;
pub mod switch;
pub mod tabs;
pub mod tag;
pub mod tag_field;
pub mod text_area;
pub mod text_field;
pub mod theme_palette;
pub mod toast;
pub mod wheel_picker;

pub use action_menu::{ActionMenuAction, ActionMenuMode, ActionMenuOpenChange, TyActionMenu};
pub use avatar::{AvatarActorKind, AvatarSize, AvatarTint, TyAvatar};
pub use breadcrumbs::{BreadcrumbsMode, BreadcrumbsNavigate, TyBreadcrumbs};
pub use button::{ButtonShape, ButtonSize, ButtonType, ButtonVariant, TyButton};
pub use checkbox::{CheckboxAppearance, CheckboxChange, TyCheckbox};
pub use command_palette::{CommandPaletteScopeChange, CommandPaletteSelect, TyCommandPalette};
pub use currency_field::{CurrencyFieldSize, CurrencyFieldValueChange, TyCurrencyField};
pub use data_table::{
    DataTableDensity, DataTableRowAction, DataTableSelectionChange, DataTableSelectionMode,
    DataTableSortChange, DataTableSortDirection, TyDataTable,
};
pub use drawer::{DrawerOpenChange, DrawerPlacement, DrawerWidth, TyDrawer};
pub use heading::{HeadingAppearance, HeadingLevel, TyHeading};
pub use inline_notice::{
    InlineNoticeAlign, InlineNoticeTitleAs, InlineNoticeTone, InlineNoticeUrgency, TyInlineNotice,
};
pub use link::{LinkEmphasis, TyLink};
pub use markdown_view::{MarkdownViewDensity, TyMarkdownView};
pub use modal::{ModalInitialFocus, ModalOpenChange, ModalRole, ModalWidth, TyModal};
pub use native_select::{NativeSelectChange, TyNativeSelect};
pub use notification_center::{
    NotificationCenterDismiss, NotificationCenterOpenChange, TyNotificationCenter,
};
pub use page_header::{PageHeaderHeadingLevel, PageHeaderInput, PageHeaderScale, TyPageHeader};
pub use popover::{PopoverAlign, PopoverOpenChange, PopoverPlacement, TyPopover};
pub use progress_bar::{ProgressBarSize, ProgressBarTone, TyProgressBar};
pub use section_heading::{SectionHeadingLevel, TySectionHeading};
pub use segmented_control::{SegmentedControlChange, SegmentedControlSize, TySegmentedControl};
pub use separator::{SeparatorEmphasis, SeparatorOrientation, SeparatorSpacing, TySeparator};
pub use skeleton::{SkeletonPreset, SkeletonShape, TySkeleton};
pub use skip_link::TySkipLink;
pub use spinner::{SpinnerShape, SpinnerSize, SpinnerTone, TySpinner};
pub use status_pill::{StatusPillSize, StatusPillTone, TyStatusPill};
pub use surface::{SurfaceElevation, SurfacePadding, SurfaceTitleLevel, TySurface};
pub use switch::{SwitchChange, SwitchLayout, SwitchSize, TySwitch};
pub use tabs::{TabsActivation, TabsOrientation, TabsSelectionChange, TyTabs};
pub use tag::{TagSize, TagTone, TyTag};
pub use tag_field::{TagFieldChange, TagFieldTone, TyTagField};
pub use text_area::{TextAreaInput, TextAreaResize, TyTextArea};
pub use text_field::{
    TextFieldAppearance, TextFieldInput, TextFieldInputType, TextFieldMode, TyTextField,
};
pub use theme_palette::{
    ThemePaletteDefaultDensity, ThemePaletteDefaultMode, ThemePaletteThemeChange, TyThemePalette,
};
pub use toast::{
    use_toast, ToastAction, ToastDuration, ToastHandle, ToastOptions, ToastPlacement, ToastRecord,
    ToastToastAction, ToastToastDismiss, ToastTone, TyToast,
};
pub use wheel_picker::{TyWheelPicker, WheelPickerChange};
