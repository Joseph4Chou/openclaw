---
summary: "How OpenClaw vendors Apple device model identifiers for friendly names in the native desktop bundle."
read_when:
  - Updating device model identifier mappings or NOTICE/license files
  - Changing how Instances UI displays device names
title: "Device model database"
---

The native desktop bundle shows friendly Apple device model names in the **Instances** UI by mapping Apple model identifiers (e.g. `iPad16,6`, `Mac16,6`) to human-readable names.

The mapping is vendored as JSON in the desktop resource bundle alongside a NOTICE file and the bundled upstream license.

## Data source

We currently vendor the mapping from the MIT-licensed repository:

- `kyle-seongwoo-jun/apple-device-identifiers`

To keep builds deterministic, the JSON files are pinned to specific upstream commits recorded in the NOTICE file that ships next to the vendored JSON.

## Updating the database

1. Pick the upstream commits you want to pin to (one for iOS, one for macOS).
2. Update the pinned commit hashes in the vendored NOTICE file.
3. Re-download the JSON files, pinned to those commits, into the same desktop resource directory:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o <desktop-resource-dir>/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o <desktop-resource-dir>/mac-device-identifiers.json
```

4. Ensure the bundled license file still matches upstream (replace it if the upstream license changes).
5. Verify the desktop bundle still builds cleanly and the Instances UI resolves the updated model names.

## Related

- [Nodes](/nodes)
- [Node troubleshooting](/nodes/troubleshooting)
