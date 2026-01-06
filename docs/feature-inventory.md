# Feature Inventory & Usage Guide

## 1. Node Types
The system supports four distinct types of nodes, defined in `types.ts`:

| Type | Icon | Behavior |
|------|------|----------|
| **Folder** | 📁 | Container for other nodes. Can be nested infinitely. Supports Drag-and-Drop. |
| **Note** | 📄 | Markdown text editor with **Wiki-Link** support. |
| **Todo** | ☑️ | Enhanced task node with **Subtasks**, **Priority**, **Due Date**, and **Content**. |
| **Session**| ⏱️ | A special note type that stores `sessionDuration`. |

## 2. Organization & Structure
*   **Tree View:** Folders, Notes, and Sessions appear in the sidebar tree. **Todos are hidden** from the tree view to reduce clutter and are managed exclusively in the Task view.
*   **Global Search:** Use the search bar in the sidebar to find notes by title or content instantly. Breadcrumbs show the file path.
*   **Concept Linking:** Use `[[Wiki Links]]` inside notes to connect ideas. Clicking them navigates to the target note.
*   **Backlinks:** At the bottom of every note, see exactly which other notes link to it.

## 3. Dedicated Task Management
The app includes a powerful top-level **"My Tasks"** view (`TodoSection.tsx`) that aggregates all tasks from your tree.

### Smart Filters
The sidebar in "My Tasks" organizes your workload automatically:
*   **Today:** Tasks due specifically today.
*   **Upcoming:** Tasks with future due dates.
*   **Overdue:** Past due tasks (highlighted in red).
*   **Completed:** Archive of finished work.

### Advanced Task Metadata
Clicking any task opens the **Detail Modal** where you can manage:
*   **Subtasks:** Break down complex tasks into smaller checkboxes with a visual progress bar.
*   **Rich Content:** Use Markdown and `[[Wiki Links]]` in your task descriptions just like regular notes.
*   **Edit/Preview:** Toggle between editing markdown and viewing rendered content with clickable links.
*   **Backlinks:** View other notes or tasks that link to this task.
*   **Priority:** Set Urgent/High/Medium/Low status.
*   **Due Date:** Assign deadlines.

### Quick Capture
In the "My Tasks" view, use the floating input bar at the top to instantly add new tasks to your Inbox without leaving the screen.

## 4. Daily Journal
The "Today" button in the quick-add bar triggers a smart logic flow:
1.  Checks if a top-level **"Journal"** folder exists (creates it if missing).
2.  Checks if a note with **Today's Date** (YYYY-MM-DD) exists inside it.
3.  If missing, creates it with a pre-filled "Daily Log" template.
4.  Immediately navigates to that note.

## 5. The Session Engine
The Floating Timer is a global component (`SessionTimer.tsx`) that lives outside the router/view hierarchy.
*   **Persistence:** You can navigate to different notes while the timer runs.
*   **Linkage:** When a session starts, it "links" to the currently active node.
*   **Completion:** Stopping a session creates a new **Session Node** filled with a summary template.

## 6. Analytics
The Dashboard Overview calculates statistics in real-time by flattening the recursive tree:
*   **Weekly Activity:** A bar chart visualizing minutes spent in "Session" nodes over the last 7 days.
*   **Completion Rate:** `completed_todos / total_todos`.
*   **Streak:** Tracks consecutive days of activity.

## 7. Mobile Native Features
When built as an APK via Capacitor:
*   **Safe Area Support:** The layout automatically adjusts padding for iPhone Notches and Android Camera cutouts.
*   **No Zoom:** The viewport is locked to prevent accidental pinch-zooming, feeling like a native app.
*   **OLED Mode:** The Dark theme uses `#000000` pure black for maximum battery efficiency.