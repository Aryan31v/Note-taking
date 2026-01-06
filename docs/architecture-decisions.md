# Architectural Decision Records (ADR)

## ADR 001: recursive-tree-structure
**Context:**  
The application requires "infinite nesting" where any folder can contain any number of sub-items of varying types.

**Decision:**  
We utilize a recursive `KnowledgeNode` interface where `children: KnowledgeNode[]`. 
The UI renders this using a recursive React component (`NodeTree`).

**Consequences:**
*   ✅ **Pros:** Extremely flexible. Maps 1:1 with file system logic.
*   ⚠️ **Cons:** Expensive to update deeply nested items without mutation.
*   **Mitigation:** We use recursive helper functions (`updateNodeInTree`, `deleteNodeFromTree`) in `fileHelpers.ts` to immutably update the state tree.

## ADR 002: indexeddb-storage
**Context:**  
`localStorage` has a strict limit (usually 5MB) and is synchronous, blocking the main thread during large writes. We anticipate storing images and long transcripts in the future.

**Decision:**  
We use **IndexedDB** via the lightweight wrapper `idb-keyval` to persist the Redux-like state tree.

**Consequences:**
*   ✅ **Pros:** Unlimited storage (gigabytes). Asynchronous (non-blocking).
*   ⚠️ **Cons:** Initial load is async, requiring a "Loading..." screen state in `App.tsx`.
*   **Migration:** We implemented a "lazy migration" strategy where the app checks `localStorage` if IndexedDB is empty to preserve data for existing users.

## ADR 003: flat-file-export
**Context:**  
Users are afraid of lock-in with note-taking apps.

**Decision:**  
All data must be exportable to standard Markdown. We implement a custom Markdown generator that converts our JSON state into Frontmatter (YAML) + Content.

**Consequences:**
*   We prioritize **Obsidian compatibility**. The exported Markdown includes `tags`, `aliases`, and standard headers to ensure it works in other tools immediately.

## ADR 004: uuid-vs-math-random
**Context:**  
We encountered build issues with external `uuid` libraries in certain environments.

**Decision:**  
We implemented a lightweight internal ID generator (`Math.random().toString(36)`).

**Consequences:**
*   Sufficient for client-side single-user sessions.
*   **Must be replaced** with `crypto.randomUUID()` before implementing any sync/cloud features to avoid collisions.

## ADR 005: monochrome-ui
**Context:**  
We needed a distinct visual identity that works well on mobile OLED screens and minimizes distractions during deep work.

**Decision:**  
We adopted a strict "True Black & White" theme, removing all intermediate grays (slate/zinc) from the primary background layers.

**Consequences:**
*   **Battery Life:** Pure black pixels on OLED screens turn off, saving battery on mobile.
*   **Contrast:** Highest possible contrast ratio ensures readability in direct sunlight.

## ADR 006: capacitor-mobile-wrapper
**Context:**  
We need to distribute a native Android `.apk` without rewriting the React codebase in React Native.

**Decision:**  
We use **CapacitorJS** to wrap the web build (`dist` folder).

**Consequences:**
*   We must handle "Safe Areas" (Notch, Home Indicator) manually using CSS env variables (`env(safe-area-inset-top)`).
*   We must disable user-scaling (zooming) in the viewport meta tag to mimic native app behavior.