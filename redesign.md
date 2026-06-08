I want you to act as a Senior Angular Architect, Senior UX Designer, E-Commerce Conversion Specialist, Mobile UI Engineer, and Frontend Performance Engineer.

Analyze the entire Angular codebase and implement a complete storefront optimization focused on increasing product discovery, engagement, and conversions.

## Context

This is an online fruit and grocery ordering application.

The current homepage is visually acceptable but does not immediately expose products to users.

The first screen that loads is dominated by the hero section (`app-hero-section`).

From user testing and observation:

- Users do not immediately see available fruits and products.
- Users must scroll before discovering products.
- Product discovery is delayed.
- The homepage is not optimized for conversion.
- The visual hierarchy favors branding over products.
- Product cards do not strongly encourage adding items to cart.
- The current experience feels informational rather than transactional.

My goal is:

- Users should see products immediately.
- Users should feel encouraged to browse and add products.
- Product discovery should happen within seconds.
- The homepage should feel like a modern high-converting grocery marketplace.
- The first screen should showcase products rather than large marketing banners.

---

# TASK 1 — Homepage Conversion Audit

Analyze:

- Home page
- Hero section
- Product showcase section
- Featured products section
- Category sections
- Promotional sections

Determine:

- Which sections contribute to conversion
- Which sections create friction
- Which sections push products below the fold

Provide a UX audit before making changes.

---

# TASK 2 — Remove or Redesign Hero Section

Analyze `app-hero-section`.

If it occupies significant above-the-fold space:

- Remove it entirely OR
- Reduce it drastically

Replace it with a conversion-focused layout.

Goal:

When the page loads, users should immediately see:

- Fruits
- Product images
- Product prices
- Categories
- Add-to-cart actions

without needing to scroll.

---

# TASK 3 — Product-First Homepage

Redesign the homepage so that the first visible content includes:

- Featured fruits
- Best sellers
- Seasonal products
- Categories
- Popular products

The homepage should resemble a modern grocery marketplace.

Examples of desired behavior:

Users immediately see:

- Apples
- Bananas
- Mangoes
- Oranges
- Berries
- Seasonal fruit collections

with pricing and purchase actions.

---

# TASK 4 — Improve Product Cards

Inspect all product card components.

Current issue:

The card primarily relies on an arrow/navigation interaction.

Required improvements:

- Add prominent "Add to Cart" button
- Add quantity controls where appropriate
- Add hover interactions
- Add mobile-friendly interactions
- Make CTA visually dominant

Users should not need to enter a product page before adding items.

Enable quick purchasing behavior.

---

# TASK 5 — Conversion-Oriented Product Cards

For every product card:

Evaluate:

- Product image prominence
- Product name visibility
- Price visibility
- CTA visibility

Optimize according to modern e-commerce standards.

Suggested elements:

- Add to Cart button
- Quick Add button
- Quantity selector
- Sale badges
- Best Seller badges
- Fresh Today badges
- Seasonal tags

Use whichever is most appropriate.

---

# TASK 6 — Homepage Psychological Optimization

Improve the homepage so users naturally continue browsing.

Focus on:

- Product imagery
- Color hierarchy
- Visual flow
- Product grouping
- Category exposure

The experience should feel:

- Fresh
- Premium
- Trustworthy
- Easy to purchase

Avoid dark patterns.

Do not use manipulative techniques.

Instead maximize clarity, engagement, and discoverability.

---

# TASK 7 — Favicon Redesign

The current favicon does not reinforce the fruit marketplace branding.

Analyze current favicon implementation.

Replace it with a fruit-themed favicon.

Potential concepts:

- Apple
- Mango
- Orange
- Fruit basket
- Leaf + fruit combination
- Minimal fruit icon

Requirements:

- SVG favicon
- PNG fallback
- High-DPI support
- Mobile browser compatibility
- Browser tab clarity

Implement all required Angular asset references.

---

# TASK 8 — Mobile Navigation Audit

Investigate:

- mobile-drawer
- mobile menu
- mobile navigation
- mobile sidebar

Current bug:

When mobile drawer is opened:

- Dashboard becomes partially hidden
- Logout becomes partially hidden
- Some items overflow
- Some items become unclickable
- Navigation is not fully accessible

Reproduce and identify root cause.

Potential causes:

- overflow hidden
- incorrect height calculations
- z-index issues
- fixed positioning issues
- viewport sizing issues
- flexbox constraints
- safe-area handling issues

Determine actual root cause.

---

# TASK 9 — Mobile Drawer Fix

Ensure:

All navigation items remain:

- visible
- accessible
- scrollable
- clickable

on:

- small Android devices
- iPhones
- narrow viewports
- landscape mode

Requirements:

- no clipping
- no overflow bugs
- no inaccessible actions
- proper scrolling behavior

---

# TASK 10 — Responsive Design Audit

Perform a full responsive review.

Check:

320px
360px
375px
390px
414px
768px
1024px
1280px
1440px

Identify:

- overflowing containers
- clipped text
- broken grids
- hidden buttons
- inaccessible controls
- layout shifts

Fix all discovered issues.

---

# TASK 11 — Performance Preservation

Ensure changes do not negatively affect:

- lazy loading
- Angular routing
- bundle size
- Core Web Vitals
- Largest Contentful Paint
- mobile performance

Prefer reusable Angular components.

---

# TASK 12 — Deliverables

Provide:

1. UX audit findings
2. Root cause analysis
3. List of affected files
4. Exact code changes
5. Complete code for modified files
6. New components created
7. CSS/SCSS changes
8. Favicon assets created
9. Responsive fixes applied
10. Before/after explanation
11. Final testing checklist

Do not provide only recommendations.

Implement the fixes directly in the codebase and show all required code changes.
