# 🍊 FreshRoots — Angular E-Commerce UI Redesign Prompt
### Branch: `UI_Optimize` | Senior Angular UI/UX Redesign Brief

---

## 🎯 PROJECT VISION

Transform the fruits e-commerce Angular app into an **immersive, cinematic farm-to-table brand experience** — inspired by:

- **UXBERT.com** → Layered scroll-triggered text reveals, split-screen layouts, magnetic hover labels, multi-step form UX, smooth section transitions
- **LandoNorris.com** → Full-viewport hero with cinematic scroll-lock sequences, signature-style typography, parallax image stacking, cursor-reactive elements, editorial photo grids
- **AwwwardsSite (Mohamed Shehata)** → Minimal white-space breathing, oversized type as design element, precise grid-breaking, smooth route transitions
- **NRG Data Center** → Bold industrial storytelling, animated stat counters, milestone timeline journeys, feature callout cards with hover depth

**Narrative Flow:** Orchard → Harvest → Warehouse → Processing → Packaging → Delivery → Your Table

---

## 🎨 DESIGN SYSTEM

### Color Palette
```scss
// CSS Custom Properties
--color-soil:       #2C1A0E;   // Deep earthy brown — primary dark
--color-bark:       #5C3D1E;   // Mid bark brown
--color-moss:       #3D5A2B;   // Forest moss green
--color-grove:      #5A7A3A;   // Grove green
--color-leaf:       #7BAD4E;   // Fresh leaf
--color-citrus:     #F4A51A;   // Ripe orange-yellow
--color-mango:      #FF7130;   // Mango sunset
--color-berry:      #C0392B;   // Berry red accent
--color-cream:      #F9F4EC;   // Warm cream canvas
--color-parchment:  #EDE3D0;   // Parchment tan
--color-chalk:      #FDFAF5;   // Near-white chalk

// Semantic tokens
--bg-primary:       var(--color-chalk);
--bg-card:          var(--color-parchment);
--bg-dark:          var(--color-soil);
--text-primary:     var(--color-soil);
--text-accent:      var(--color-mango);
--brand-primary:    var(--color-grove);
--brand-glow:       var(--color-leaf);
```

### Typography
```scss
// Google Fonts imports
@import url('fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');

$font-display:  'Playfair Display', serif;   // Hero titles, section headings
$font-body:     'DM Sans', sans-serif;       // Body, labels, UI
$font-editorial:'Instrument Serif', serif;   // Pull quotes, callouts

// Scale
--text-hero:    clamp(4rem, 10vw, 9rem);     // "FRESH FROM THE GROVE"
--text-display: clamp(2.5rem, 5vw, 5rem);
--text-heading: clamp(1.5rem, 3vw, 2.5rem);
--text-body:    1rem / 1.7;
--text-label:   0.75rem;   letter-spacing: 0.15em; text-transform: uppercase;
```

### Motion Design Tokens
```scss
--ease-grove:       cubic-bezier(0.16, 1, 0.3, 1);   // Spring out
--ease-harvest:     cubic-bezier(0.7, 0, 0.84, 0);   // Heavy in
--ease-drift:       cubic-bezier(0.25, 0.46, 0.45, 0.94); // Natural float
--dur-instant:      80ms;
--dur-fast:         200ms;
--dur-medium:       400ms;
--dur-slow:         700ms;
--dur-cinematic:    1200ms;
```

---

## 🏗️ PAGE-BY-PAGE ARCHITECTURE

---

### 1. HERO SECTION — "The Scroll-Lock Cinematic Journey"
**Inspired by: LandoNorris scroll-lock hero + NRG storytelling sequence**

```
[ FULL VIEWPORT — sticky scroll-lock container — 500vh total ]

Panel 1 (0–100vh):   Dark soil background fades in
                     Oversized text "GROVE TO" splits apart as you scroll
                     Soil texture grain overlay animated via CSS noise

Panel 2 (100–200vh): "YOUR TABLE" assembles letter-by-letter
                     Background cross-fades to sunrise orchard photo
                     Floating fruit SVGs drift up from bottom

Panel 3 (200–300vh): Journey timeline activates
                     6 milestone icons slide in from right (Orchard → Delivery)
                     Each animates independently on scroll progress

Panel 4 (300–400vh): Stats counter section
                     "2,400+ Farms | 48hr Harvest-to-Door | 100% Natural"
                     Numbers count up as they enter viewport

Panel 5 (400–500vh): CTA unlocks — "Start Shopping"
                     Pinned fruit imagery explodes outward
```

**Angular Implementation:**
```typescript
// scroll-journey.directive.ts
@Directive({ selector: '[scrollJourney]' })
export class ScrollJourneyDirective implements OnInit {
  private progress$ = fromEvent(window, 'scroll').pipe(
    map(() => window.scrollY / (document.body.scrollHeight - window.innerHeight)),
    distinctUntilChanged()
  );

  // Bind CSS custom property --scroll-progress to [0,1]
  // Each panel uses range mapping: panel2 active from 0.2–0.4 etc.
}

// Use GSAP ScrollTrigger or Angular CDK ScrollDispatcher
// Pin the hero section with position:sticky on a scroll-track container
```

---

### 2. NAVIGATION — "Magnetic Orchard Nav"
**Inspired by: UXBERT triple-label hover, LandoNorris full-screen menu**

**Desktop Nav:**
```
[ Sticky, transparent → blur-backdrop on scroll ]
Logo (leaf SVG + wordmark) | [Shop] [Journey] [About] [Contact] | Cart(count)

Hover effect on nav links:
  - Text duplicated in 3 layers (like UXBERT)
  - On hover: layers shift vertically with stagger
  - Active link: underline grown from center with --color-leaf
```

**Mobile / Full-Screen Menu:**
```
Hamburger (animated to × via stroke-dashoffset)
  → Overlay slides in from top with clip-path: inset(0 0 100% 0) → inset(0)
  → Menu items stagger-reveal with translateY + opacity
  → Background: blurred orchard photo
  → Each link has a small fruit emoji that rotates on hover
```

**Angular Component:**
```typescript
@Component({ selector: 'app-nav' })
export class NavComponent {
  isMenuOpen = signal(false);
  scrolled = toSignal(fromEvent(window,'scroll').pipe(
    map(() => window.scrollY > 50)
  ));
}
```

---

### 3. PRODUCT GRID — "The Harvest Table"
**Inspired by: Mohamed Shehata editorial grid + UXBERT card hover depth**

**Layout:**
```
[ Masonry-inspired 3-col grid with intentional size variation ]

Large card (2×):   Hero fruit photo, full-bleed, overlaid price
Regular card (1×): Photo + name + origin badge + add-to-cart
Feature card:      Video loop of fruit being sliced (autoplay muted)

Filter bar (sticky):
  All | Citrus | Tropical | Berries | Melons | Seasonal
  → Active filter: pill background slides to new selection (sliding indicator)
  → Chips animate in/out with scale + opacity on filter change
```

**Card Hover Interaction:**
```scss
.fruit-card {
  --card-lift: 0px;
  transform: translateY(var(--card-lift)) scale(1);
  box-shadow: 0 4px 20px rgba(44,26,14,0.08);
  transition: transform var(--dur-medium) var(--ease-grove),
              box-shadow var(--dur-medium) var(--ease-grove);

  &:hover {
    --card-lift: -8px;
    box-shadow: 0 20px 60px rgba(44,26,14,0.18);

    .card-image { transform: scale(1.06); }
    .add-to-cart { opacity: 1; translateY(0); }
    .origin-badge { color: var(--color-mango); }
  }
}

// Tilt effect (vanilla-tilt.js or custom pointer listener)
// Track mouse within card, rotate3d subtly max ±8deg
```

**Angular Implementation:**
```typescript
// product-card.component.ts — standalone
@Component({
  selector: 'app-product-card',
  animations: [
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('{{delay}}ms {{dur}}ms ease', style({ opacity: 1, transform: 'none' }))
      ])
    ])
  ]
})
```

---

### 4. JOURNEY SECTION — "Farm to Table Animated Timeline"
**Inspired by: NRG milestone storytelling, UXBERT split-section reveals**

```
[ Full-width section, dark background --color-soil ]

Left column (sticky):  Oversized step number "01" → "06" morphs as you scroll
Right column (scroll): Each step card slides in from right

Steps:
  01 🌱 ORCHARD      — "Hand-selected from partner farms across Nepal & India"
  02 🧺 HARVEST      — "Picked at peak ripeness within 24hr of your order"
  03 🏭 SORTING      — "Quality-checked, graded, chilled to preserve freshness"
  04 📦 PACKING      — "Eco-packaging, zero plastic, 100% compostable"
  05 🚚 DISPATCH     — "Express cold-chain logistics"
  06 🍽️ YOUR TABLE   — "Delivered within 48 hours of harvest"
```

**Animation:**
- Connecting SVG path line draws between each step as user scrolls
- Each step icon has a lottie-style CSS animation (rotate, bounce, pulse)
- Background shifts subtly from deep soil → morning green as journey progresses

**Angular:**
```typescript
// journey-step.component.ts
// Use IntersectionObserver via Angular CDK observe module
// Each step gets active class when 60% visible
// SVG path: stroke-dashoffset animated from full-length → 0
```

---

### 5. FEATURED FRUITS MARQUEE — "The Endless Orchard"
**Inspired by: LandoNorris horizontal scrolling sections**

```
[ Two-row infinite marquee — opposite directions ]

Row 1 →:  [ 🍋 Meyer Lemon ] [ 🥭 Alphonso Mango ] [ 🍓 Strawberry ] [ 🍇 Muscat ]...
Row 2 ←:  [ 🍊 Blood Orange ] [ 🥥 Young Coconut ] [ 🍍 Gold Pineapple ]...

Each tag: fruit emoji + name + origin country flag emoji
Hover on row: pauses marquee with CSS animation-play-state: paused
Hover on individual item: card expands with quick product preview popup
```

```scss
.marquee-track {
  display: flex;
  animation: marquee-scroll 30s linear infinite;
  &:hover { animation-play-state: paused; }
}
@keyframes marquee-scroll {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

---

### 6. PRODUCT DETAIL PAGE — "The Fruit Story"
**Inspired by: LandoNorris editorial fullscreen imagery + UXBERT layered reveals**

```
[ Split-screen layout ]

LEFT (60%):  Sticky image gallery
             Main image + 4 thumbnail strip below
             Image transition: clip-path wipe effect on thumbnail click
             Zoom on hover (transform-origin: cursor position)

RIGHT (40%): Scrollable details
             Fruit name (huge, Playfair Display)
             Origin badge with flag + farm name
             Price (animated number transition on variant change)
             Weight selector (pill toggle, slide animation)
             Quantity stepper (micro-animation on ±)
             Add to Cart CTA (full-width, ripple effect, confirms with checkmark)
             Expandable sections: Nutrition | Storage Tips | Farm Story
```

**Micro-interactions:**
```typescript
// quantity-stepper.component.ts
// On increment: number slides up (old number out-up, new number in-up)
// On decrement: number slides down
// CSS: overflow:hidden on counter, translateY animations
```

---

### 7. CART & CHECKOUT — "The Harvest Basket"
**Inspired by: UXBERT multi-step form UX**

```
Cart Sidebar (slide from right, overlay):
  Header: "Your Harvest Basket 🧺"
  Items: each with remove animation (slide out + height collapse)
  Subtotal animates on change (count-up effect)
  "Checkout" CTA

Checkout (multi-step, full page):
  Step indicator: 3 dots with active line progression
  Step 1: Delivery Details — clean form, floating labels
  Step 2: Delivery Schedule — date picker (custom, fruit-themed)
  Step 3: Payment + Review
  Step 4: Confirmation — animated fruit delivery illustration
```

---

### 8. SCROLL ANIMATIONS SYSTEM

```typescript
// scroll-reveal.directive.ts
@Directive({ selector: '[reveal]' })
export class RevealDirective implements AfterViewInit {
  @Input() revealDelay = 0;
  @Input() revealDirection: 'up' | 'left' | 'right' = 'up';

  private io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      this.el.nativeElement.classList.add('revealed');
      this.io.disconnect();
    }
  }, { threshold: 0.15 });
}
```

```scss
[reveal] {
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.7s var(--ease-grove), transform 0.7s var(--ease-grove);
  &.revealed { opacity: 1; transform: none; }
}
[reveal][revealDirection="left"]  { transform: translateX(-40px); }
[reveal][revealDirection="right"] { transform: translateX(40px); }
```

---

### 9. CUSTOM CURSOR
**Inspired by: Mohamed Shehata / LandoNorris cursor design**

```typescript
// cursor.component.ts
// Two circles: outer ring (40px, border only) + inner dot (8px, filled)
// Outer follows mouse with lerp delay (laggy magnetic feel)
// Inner snaps instantly
// On hover over interactive elements:
//   outer ring scales to 60px, fills with rgba(90,122,58,0.15)
//   text "VIEW" or "ADD" appears inside cursor
// On click: brief scale-down then spring back
```

---

### 10. PAGE TRANSITIONS

```typescript
// app.component.ts — route animations
export const routeAnimations = trigger('routeAnimations', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(':enter, :leave', style({ position: 'absolute', width: '100%' })),
    query(':leave', animate('300ms ease', style({ opacity: 0, transform: 'translateY(-20px)' }))),
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('400ms 150ms ease', style({ opacity: 1, transform: 'none' }))
    ])
  ])
]);
```

---

## 📁 FILE STRUCTURE

```
src/
├── app/
│   ├── core/
│   │   ├── directives/
│   │   │   ├── scroll-reveal.directive.ts
│   │   │   ├── magnetic-hover.directive.ts
│   │   │   ├── tilt-card.directive.ts
│   │   │   └── cursor-reactive.directive.ts
│   │   └── services/
│   │       ├── scroll-progress.service.ts
│   │       └── cart.service.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── cursor/
│   │   │   ├── nav/
│   │   │   ├── footer/
│   │   │   └── marquee/
│   ├── pages/
│   │   ├── home/
│   │   │   ├── hero/           ← scroll-lock cinematic
│   │   │   ├── journey/        ← animated timeline
│   │   │   ├── featured/       ← marquee section
│   │   │   └── products-preview/
│   │   ├── shop/
│   │   ├── product-detail/
│   │   └── checkout/
│   └── animations/
│       ├── route.animations.ts
│       └── ui.animations.ts
├── styles/
│   ├── _tokens.scss     ← all CSS variables
│   ├── _typography.scss
│   ├── _animations.scss
│   └── styles.scss
└── assets/
    ├── fonts/
    ├── svgs/            ← fruit SVGs, icons
    └── textures/        ← grain overlay, paper texture
```

---

## 🔧 TECH STACK & PACKAGES

```json
"dependencies": {
  "@angular/animations": "^17+",
  "@angular/cdk": "^17+",          // ScrollingModule, ObserversModule
  "gsap": "^3.12+",                 // ScrollTrigger for hero sequence
  "swiper": "^11+",                 // Product image gallery
  "vanilla-tilt": "^1.8+",         // Card tilt effect
  "lenis": "^1.0+",                 // Smooth scroll
  "splitting": "^1.0+",            // Text character splitting for reveals
  "countup.js": "^2.8+"            // Animated stat counters
}
```

---

## 🌿 BRAND VOICE & COPY TONE

- Headlines: **Bold, earthy, poetic** — "Sun-Kissed. Stone-Ground. Grove-Fresh."
- Body: **Warm, trustworthy, knowledgeable** — like a farmer at a market
- CTAs: **Action + sensory** — "Taste the Grove", "Fill Your Basket", "Start Fresh"
- Labels: **Minimal, factual** — "Farm: Pokhara Valley | Picked: Yesterday | Miles: 12"

---

## ✅ BRANCH CHECKLIST

```bash
git checkout -b UI_Optimize

# Phase 1: Design Tokens + Typography
# Phase 2: Layout skeleton (Nav, Hero, Footer)  
# Phase 3: Scroll system (directives, smooth scroll)
# Phase 4: Hero cinematic sequence
# Phase 5: Product grid + cards
# Phase 6: Journey timeline section
# Phase 7: Marquee + featured sections
# Phase 8: Product detail page
# Phase 9: Cart + Checkout flow
# Phase 10: Custom cursor + micro-interactions
# Phase 11: Page transitions
# Phase 12: Performance audit (lazy loading, OnPush, trackBy)
```

---

*Generated for: Angular Fruits E-Commerce — Branch `UI_Optimize`*
*Reference sites: uxbert.com, landonorris.com, awwwards Mohamed Shehata, NRG Data Center*
