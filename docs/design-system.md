# UI/UX Design System

## General Principles
- Clean, modern interfaces tailored for SaaS enterprise use.
- Use TailwindCSS for consistent styling and responsive layouts.
- Dashboard layouts should emphasize data density without feeling cluttered.

## POS Interface (Crucial Directives)
The Point of Sale (POS) is the heart of the system and must be optimized for extreme speed and high volume.

- **Keyboard-First Design**: The entire checkout flow must be navigable without a mouse.
- **Auto-Focus Logic**: The cursor must programmatically remain inside the barcode search input at all times unless explicitly moved by the user for a specific action.
- **F-Keys Shortcuts**:
  - `F1` / `Enter`: Complete Sale
  - `F2`: Hold Invoice (Draft)
  - `F3`: Retrieve Held Invoice
  - `F4`: Search Alternatives
  - `F12`: Blind Shift Close
- **Typo-Tolerant Search**: The search bar should accept barcodes, trade names, or scientific names and handle minor spelling mistakes gracefully.
- **Traffic Light Color Coding (Expiry Alerts)**:
  - <span style="color: red;">Red</span>: Expiring in less than 30 days.
  - <span style="color: yellow;">Yellow</span>: Expiring in 30-90 days.
  - <span style="color: green;">Green</span>: Expiring in more than 90 days.
- **Smart Alternatives Display**: When a queried item's quantity is 0, the UI must automatically surface medications with the matching `active_ingredient_id`, sorted by lowest price and highest available stock.
