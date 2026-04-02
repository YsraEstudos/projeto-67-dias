```markdown
# Design System Strategy: The High-Octane Studio

## 1. Overview & Creative North Star
**Creative North Star: The Performance Cockpit**
This design system is engineered for high-stakes focus. It moves away from the "cozy" dark mode aesthetic and leans into a high-performance, editorial vibe reminiscent of flight instrumentation or high-end racing telemetry. We achieve this through "Organic Brutalism"—where rigid data structures meet soft, ultra-refined radius scales and neon accents that cut through the darkness with mathematical precision.

By utilizing intentional asymmetry in card layouts and a high-contrast typography scale (Space Grotesk vs. Manrope), the UI feels active rather than static. The dashboard is not just a container for information; it is a tool for momentum.

---

## 2. Colors: Chromatic Precision
Our palette relies on a deep, obsidian base (`background: #0e0e0e`) punctuated by "Hyper-Lume" accents. These neons are not decorative; they are functional indicators of progress and priority.

*   **The "No-Line" Rule:** We strictly prohibit the use of 1px solid borders to define sections. Layouts must be carved out using background shifts. A `surface-container-low` block should sit on the `surface` background to define its boundary. 
*   **The "Glass & Gradient" Rule:** Main CTAs or active progress bars should utilize subtle gradients (e.g., `primary` to `primary-container`) to provide a "liquid" feel that flat colors lack. Use Backdrop Blurs (12px–20px) on floating navigation elements using semi-transparent `surface-container` values to maintain a sense of environmental depth.
*   **Neon Logic:** 
    *   `primary` (#f5ffc4): Reserved for "Winning" states and completed progress.
    *   `secondary` (#fed01b): Reserved for "Active Focus" and critical goals.
    *   `tertiary` (#c6fff3): Used for "Content Review" and supplemental data.

---

## 3. Typography: Editorial Hierarchy
We utilize a dual-font strategy to balance technical clarity with editorial authority.

*   **Display & Headlines (Space Grotesk):** This typeface provides a technical, wide-set aesthetic. Use `display-lg` for daily progress percentages to make them feel like monumental achievements.
*   **Titles & Body (Manrope):** A humanist sans-serif that ensures readability during long study sessions. Use `title-md` for card headings to provide a softer counterpoint to the aggressive display type.
*   **Labels (Inter):** Reserved for metadata and micro-copy. Use `label-sm` in all-caps with `0.05em` letter spacing for "Status" or "Category" tags to mimic professional documentation.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows feel "muddy" in true dark mode. We replace them with Tonal Layering.

*   **The Layering Principle:** Depth is achieved by stacking. 
    *   **Level 0 (Base):** `surface` (#0e0e0e).
    *   **Level 1 (Sections):** `surface-container-low`.
    *   **Level 2 (Active Cards):** `surface-container-high`.
*   **Ambient Shadows:** If a card must "float" (e.g., a modal or tool-tip), use a diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6)`. The color should be a tinted version of the background, never a generic grey.
*   **The "Ghost Border" Fallback:** If accessibility requirements demand a container border, use `outline-variant` at **15% opacity**. This creates a "hairline" shimmer that defines the edge without creating a visual cage.

---

## 5. Components: Precision Primitives

### Cards
*   **Styling:** Use `xl` (1.5rem) roundedness for outer dashboard containers and `md` (0.75rem) for nested items. 
*   **Rule:** Forbid divider lines. Use `spacing-6` (1.5rem) to separate internal card content.

### Buttons
*   **Primary:** Background `primary`, text `on-primary`. High-contrast, no shadow.
*   **Secondary (Ghost):** `outline-variant` border at 20% opacity. Text in `primary`.
*   **Interactive State:** On hover, primary buttons should "glow" using a `primary_dim` outer shadow (8px blur, 20% opacity).

### Progress Tracks
*   **Implementation:** Tracks should use `surface-variant`. The "fill" must be `primary_fixed` with a subtle horizontal gradient to `primary`. 
*   **Hierarchy:** The primary daily goal track should be 8px height; secondary tracks should be 4px.

### Chips (Data Tags)
*   **Selection:** Use `surface-container-highest` as the base. Active states use a `primary` label with a `primary-container` background at 10% opacity.

---

## 6. Do's and Don'ts

### Do:
*   **Asymmetric Focus:** Place high-priority stats (e.g., "Daily Progress") in larger, uniquely sized cards to break the "grid" feel.
*   **Tonal Context:** Use `surface-bright` only for small interactive elements that need to pop against the obsidian background.
*   **Breathing Room:** Use `spacing-10` or `spacing-12` between major modules. White space in dark mode is "dark space"—it's vital for focus.

### Don't:
*   **Avoid Pure White Text:** Use `on-surface` for primary text, but use `on-surface-variant` for secondary info to reduce eye strain.
*   **No "Box-in-a-Box":** Avoid nesting a bordered card inside another bordered card. Use a background color shift instead.
*   **Don't Over-Saturate:** Only use the neon `primary` and `secondary` for data. Never use them for large background surfaces; they are meant to be "light sources," not "paint."
*   **No Standard Grids:** Avoid making every card the same width. High-productivity dashboards should prioritize information density where needed and breathing room elsewhere.```