//! Linux stub. Phase 2 will implement this via AT-SPI (primary) with an
//! x11rb fallback for pure-X11 sessions, plus Wayland app-name detection.

use crate::autofill::AutofillTarget;

pub fn read_target() -> Option<AutofillTarget> {
    None
}
