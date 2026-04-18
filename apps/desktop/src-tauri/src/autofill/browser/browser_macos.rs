//! macOS stub. Phase 2 will implement this with the Accessibility API
//! (`AXUIElement`) to read the frontmost app + address bar.

use crate::autofill::AutofillTarget;

pub fn read_target() -> Option<AutofillTarget> {
    None
}
