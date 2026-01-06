# Cortex: Idea Inbox & Second Brain MVP Roadmap

## 1. Project Vision
**Cortex** is designed to be a friction-less "Second Brain" application. It serves as a capture mechanism for ideas, a task manager for execution, and a learning companion for deep work sessions.

**Core Philosophy:**
1.  **Infinite Nesting:** Knowledge is hierarchical.
2.  **Session-Based Learning:** Tracking time spent on topics is as important as the notes taken.
3.  **Data Sovereignty:** Exportable to standard formats (Markdown/Obsidian).
4.  **Platform Agnostic:** Runs on Web and Native Mobile (Android/iOS).

---

## 2. Status: What Works (Current Build)
As of the latest update, the following core loops are functional:

### 🧠 Knowledge Management
- **Infinite Tree Structure:** Folders can contain folders, notes, todos, or sessions infinitely.
- **Global Search:** Real-time filtered search with breadcrumb navigation.
- **Concept Linking:** Bidirectional `[[Wiki Link]]` support with a Backlinks panel.
- **Organization:** Drag-and-Drop, Rename, Duplicate context actions.
- **Daily Journal:** One-tap creation of dated daily logs (e.g., `2023-11-21`).

### ✅ Advanced Task Management
- **Centralized Dashboard:** A dedicated "Tasks" view aggregating todos from the entire tree.
- **Smart Filters:** Group by Overdue, Today, Upcoming.
- **Metadata:** Support for Priority (Urgent/High/Med/Low) and Due Dates.
- **Visual Cues:** Color-coded icons in the tree view based on task priority.

### 💾 Persistence
- **IndexedDB Storage:** Data is stored asynchronously using `idb-keyval`, removing the 5MB `localStorage` limit.
- **Auto-Migration:** Automatically migrates legacy `localStorage` data to IndexedDB.

### ⏱️ Productivity & Flow
- **Focus Timer:** A floating stopwatch that persists across navigation.
- **Session Logging:** Stopping a timer automatically generates a "Session Note" with duration and timestamps.
- **Real-Time Analytics:** Dashboard charts visualizing actual weekly learning activity and streaks.

### 🎨 UI & UX
- **Monochrome Aesthetics:** A strict "True Black & White" theme designed for high contrast and OLED efficiency.
- **Mobile Native:** Configured with Capacitor for APK generation.

### 🔌 Interoperability
- **Obsidian Export:** One-click download of any node as a `.md` file with Frontmatter.
- **Otter.ai Import:** A dedicated modal to parse and append transcripts from Otter.ai into notes.

---

## 3. Roadmap (The Future)

### Phase 2.5: Media & Rich Content (Upcoming)
- [ ] **Image Attachments:** Support pasting images directly into notes (storing as Blobs in IndexedDB).
- [ ] **File System Access API:** Allow saving directly to a local folder on the user's hard drive.

### Phase 3: Intelligence (Q3)
- [ ] **Semantic Search:** Search not just by title, but by content meaning.
- [ ] **Auto-Tagging:** LLM integration to suggest tags based on note content.
- [ ] **Review Mode:** Spaced repetition system for notes marked as "Flashcards".

### Phase 4: Collaboration (Q4)
- [ ] **Shared Workspaces:** Real-time collaboration on specific sub-trees.
- [ ] **Public Publishing:** "Publish to Web" feature for a specific folder.

---

## 4. Immediate Next Steps
1. Add support for image attachments in notes (Base64 or Blob storage).
2. Enhance Focus Timer with Pomodoro presets (25/5 intervals).