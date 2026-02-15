## CS 331 (Software Engineering Lab)
### Assignment 4

### I. Architecture choice

**Chosen style:** Modular Monolith based on **Layered (N-Tier) Architecture** with a BaaS backend (Supabase).

**A. Why this fits the category (granularity of components)**
- **Presentation layer (UI):** React pages and shared components for Student, Faculty, and Admin views.
- **Application layer (logic):** Contexts and page logic (auth handling, role checks, navigation).
- **Data access layer:** Supabase client wrapper and query calls from pages.
- **Backend tier:** Supabase Auth + Postgres with Row Level Security (RLS) policies.
- **Modular monolith:** Student/Faculty/Admin features are separated by modules in the same app, not deployed as separate services.

Each layer has a **coarse-grained responsibility**, and communication happens between adjacent layers only, which classifies the system as a **Layered Architecture**.
Layered architecture describes how the system is structured, while monolith describes how the system is deployed.
#### A Monolithic system means:
- The application is deployed as one system
- Not split into independent microservices
- One frontend + one backend platform (Supabase) working together
Everything runs as one logical application, even though internally it is modular.
So **Modular Monolith based on Layered Architecture** means:
- Internally structured in layers
- Externally deployed as one system

**B. Why this is the best fit for this project**
- **Scalability:** UI and Supabase scale independently; no extra server to manage now.
- **Maintainability:** Clear layers reduce coupling; changes stay inside one module or layer.
- **Performance:** Direct client-to-Supabase calls keep latency low and reduce hops.
- **Simplicity:** The project scope is a portal; microservices would add unnecessary overhead.
- **Security:** Supabase Auth + RLS keep data access controlled by role and user ID.
#### Why Other Architecture Styles Are Not Suitable
- **Pure Monolithic Architecture**  
  Too tightly coupled, making maintenance and future feature expansion difficult as the system grows.
- **Microservices Architecture**  
  Introduces unnecessary complexity, high DevOps overhead, and distributed management, which is not required for the current project scope.
- **Service-Oriented Architecture (SOA)**  
  Requires heavy middleware and service governance, making it inefficient for a single-institution academic system.

Hence, a **Modular Monolith based on Layered (N-Tier) Architecture** is the most practical and scalable choice for this project.

**Simple diagram**
```
UI (React Pages/Components)
        |
App Logic (Auth Context, Role Checks, Navigation)
        |
Data Access (Supabase Client)
        |
Supabase (Auth + Postgres + RLS)
```

## II: Components of the Software Systems

The major components of the University Administrative Automation Platform are as follows:

---

### 1. Presentation Components
- Student Dashboard
- Faculty Dashboard
- Admin Dashboard
- Login and Authentication UI
- Notification Interface

---

### 2. Core Application Modules

#### a. Authentication Module
- Handles login and logout
- Integrates with Supabase Authentication
- Manages user sessions and roles

#### b. User Management Module
- Manages student, faculty, and admin profiles
- Handles onboarding by admin

#### c. Assignment Management Module
- Assignment submission
- Validation and supervisor assignment
- Faculty review and grading
- Assignment status tracking

#### d. Exam Re-evaluation Module
- Handles re-evaluation requests
- Eligibility checking
- Reviewer assignment
- Grade updates

#### e. Leave and Attendance Module
- Leave and attendance exception requests
- Faculty approval
- Attendance record updates

#### f. Notification Module
- Sends notifications and reminders
- Handles announcements from admin
- Supports system-generated alerts

#### g. Workflow and SLA Module
- Defines approval rules
- Manages SLA and escalation policies
- Supports workflow customization

#### h. Analytics and Event Logging Module
- Logs system events (case ID, activity, actor, timestamp)

---

### 3. Data Components
- Student Records
- Faculty Records
- Assignment Records
- Attendance Records
- Re-evaluation Records
- Notification Records
- Event Logs

---

### 4. External Components
- Authentication Service (Supabase Auth)
- Document Storage Service (Supabase Storage / S3)

---