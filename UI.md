# CS 331 — Assignment 6  
**User Interface (UI)**  
---

## I. UI choice (What we are using & why)
- **Chosen UI:** Direct-manipulation graphical web interface built with **React**.
- **Why we are using this:**
  - We are building a portal for students, faculty, and admins - a graphical web UI is intuitive and familiar.
  - We are implementing dashboards, forms, file uploads, and real-time notifications - direct manipulation fits these interactions.
  - We are using Supabase real-time subscriptions, so the UI can show live updates (notifications, assignment status) without page reloads.
  - We are prioritizing low learning curve, mobile responsiveness, and accessibility for all types of users.
- **Why not other UI types:**
  - Command-line interface - not suitable for general university users (not user-friendly).
  - Menu-based/text-only UI - too limiting for file uploads, dashboards, and real-time updates.

---