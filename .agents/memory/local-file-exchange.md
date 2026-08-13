---
name: Local-first file exchange
description: Durable guidance for spreadsheet import and export in the local-first ERP workspace.
---

The ERP should keep inventory import/export usable without a backend or user-provided API credentials. Spreadsheet input can be parsed in the browser, while Excel/Google Sheets exports should use a broadly compatible CSV representation; TXT and valid ZIP bundles can be offered alongside it.

**Why:** The artifact is intentionally client-only, and workspace-root package installation is constrained by the monorepo setup, so file exchange must not depend on a server or a fragile package install.

**How to apply:** Preserve browser-local persistence and keep import/export actions explicit about the supported formats and their compatibility.