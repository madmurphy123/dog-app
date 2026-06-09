# Kenny's Day — App Icons & Mark

The official app identity: **Companion** (a sitting dog) on the Sunset gradient.

## iOS app icon — `AppIcon.appiconset/`
Drop this whole folder into your Xcode asset catalog (`Assets.xcassets/`), or
point an existing `AppIcon` set at these PNGs. `Contents.json` is already wired
for iPhone + iPad + App Store (1024). PNGs are square and fully opaque — iOS
applies the rounded-corner mask itself, so do **not** pre-round them.

Sizes included: 20, 29, 40, 58, 60, 76, 80, 87, 120, 152, 167, 180 (iOS),
plus 192 & 512 (handy for web/PWA/Android) and 1024 (App Store).

## In-app dog mark (transparent SVG)
- `kenny-mark.svg` — body uses `currentColor`; set the colour in CSS
  (e.g. `color: #FBF2E7` on the plum header, or `color: #5A3147` on cream).
  Facial features are baked as a translucent dark so they read on any tint.
- `kenny-mark-cream.svg` — pre-filled cream (for dark/plum surfaces).
- `kenny-mark-plum.svg` — pre-filled plum (for light surfaces).

## Vector icon (full colour)
- `kenny-icon.svg` — rounded, gradient + cream dog (web favicon / marketing).
- `kenny-icon-square.svg` — square master (re-raster at any size).

## Palette reference
Gradient: #EDAF74 → #D86F62 → #683E52 (150°). Cream mark: #FBF2E7.
