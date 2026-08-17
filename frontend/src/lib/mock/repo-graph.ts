import type { RepoCommit, RepoEdge, RepoGraphData, RepoNode } from "@/types/repo-graph";

const commits: RepoCommit[] = [
  { index: 0, sha: "a1c9e02", message: "Scaffold app entry", author: "mira", date: "2026-01-12" },
  { index: 1, sha: "b3f0a41", message: "Add core lib + shared types", author: "mira", date: "2026-01-15" },
  { index: 2, sha: "c88de19", message: "Wire task API client", author: "devon", date: "2026-01-22" },
  { index: 3, sha: "d40f7c2", message: "Add user + auth API, task store", author: "devon", date: "2026-01-29" },
  { index: 4, sha: "e517b6a", message: "Session store + task/auth hooks", author: "priya", date: "2026-02-04" },
  { index: 5, sha: "f602c88", message: "Task list UI", author: "priya", date: "2026-02-11" },
  { index: 6, sha: "021ad3f", message: "Task form + notifications API", author: "priya", date: "2026-02-18" },
  { index: 7, sha: "13be904", message: "Dashboard route + layout shell", author: "devon", date: "2026-02-25" },
  { index: 8, sha: "24cf115", message: "Tasks route + notification bell", author: "mira", date: "2026-03-04" },
  { index: 9, sha: "35d0226", message: "Settings + login routes", author: "mira", date: "2026-03-11" },
  { index: 10, sha: "46e1337", message: "Analytics lib", author: "devon", date: "2026-04-02" },
  { index: 11, sha: "57f2448", message: "Analytics API + dashboard widget", author: "priya", date: "2026-04-09" },
  { index: 12, sha: "6803559", message: "Realtime websocket layer", author: "devon", date: "2026-05-14" },
  { index: 13, sha: "79146ab", message: "Live cursors on dashboard", author: "priya", date: "2026-06-20" },
];

const nodes: RepoNode[] = [
  { id: "src/main.tsx", path: "src/main.tsx", label: "main.tsx", group: "config", loc: 18, commitIndex: 0 },
  { id: "src/app.tsx", path: "src/app.tsx", label: "app.tsx", group: "component", loc: 42, commitIndex: 0 },

  { id: "src/lib/db.ts", path: "src/lib/db.ts", label: "db.ts", group: "lib", loc: 61, commitIndex: 1 },
  { id: "src/lib/logger.ts", path: "src/lib/logger.ts", label: "logger.ts", group: "lib", loc: 24, commitIndex: 1 },
  { id: "src/lib/env.ts", path: "src/lib/env.ts", label: "env.ts", group: "lib", loc: 15, commitIndex: 1 },
  { id: "src/types/task.ts", path: "src/types/task.ts", label: "task.ts", group: "type", loc: 20, commitIndex: 1 },
  { id: "src/types/user.ts", path: "src/types/user.ts", label: "user.ts", group: "type", loc: 17, commitIndex: 1 },

  { id: "src/lib/http-client.ts", path: "src/lib/http-client.ts", label: "http-client.ts", group: "lib", loc: 88, commitIndex: 2 },
  { id: "src/api/tasks.ts", path: "src/api/tasks.ts", label: "tasks.ts", group: "api", loc: 74, commitIndex: 2 },

  { id: "src/api/users.ts", path: "src/api/users.ts", label: "users.ts", group: "api", loc: 58, commitIndex: 3 },
  { id: "src/api/auth.ts", path: "src/api/auth.ts", label: "auth.ts", group: "api", loc: 66, commitIndex: 3 },
  { id: "src/store/task-store.ts", path: "src/store/task-store.ts", label: "task-store.ts", group: "store", loc: 95, commitIndex: 3 },

  { id: "src/store/user-store.ts", path: "src/store/user-store.ts", label: "user-store.ts", group: "store", loc: 52, commitIndex: 4 },
  { id: "src/store/session-store.ts", path: "src/store/session-store.ts", label: "session-store.ts", group: "store", loc: 48, commitIndex: 4 },
  { id: "src/hooks/use-tasks.ts", path: "src/hooks/use-tasks.ts", label: "use-tasks.ts", group: "hook", loc: 33, commitIndex: 4 },

  { id: "src/hooks/use-auth.ts", path: "src/hooks/use-auth.ts", label: "use-auth.ts", group: "hook", loc: 29, commitIndex: 5 },
  { id: "src/components/task-list.tsx", path: "src/components/task-list.tsx", label: "task-list.tsx", group: "component", loc: 71, commitIndex: 5 },
  { id: "src/components/task-card.tsx", path: "src/components/task-card.tsx", label: "task-card.tsx", group: "component", loc: 54, commitIndex: 5 },
  { id: "src/components/button.tsx", path: "src/components/button.tsx", label: "button.tsx", group: "component", loc: 28, commitIndex: 5 },

  { id: "src/api/notifications.ts", path: "src/api/notifications.ts", label: "notifications.ts", group: "api", loc: 39, commitIndex: 6 },
  { id: "src/components/task-form.tsx", path: "src/components/task-form.tsx", label: "task-form.tsx", group: "component", loc: 88, commitIndex: 6 },
  { id: "src/components/modal.tsx", path: "src/components/modal.tsx", label: "modal.tsx", group: "component", loc: 45, commitIndex: 6 },
  { id: "src/components/user-avatar.tsx", path: "src/components/user-avatar.tsx", label: "user-avatar.tsx", group: "component", loc: 22, commitIndex: 6 },
  { id: "src/components/sidebar.tsx", path: "src/components/sidebar.tsx", label: "sidebar.tsx", group: "component", loc: 63, commitIndex: 6 },

  { id: "src/components/header.tsx", path: "src/components/header.tsx", label: "header.tsx", group: "component", loc: 41, commitIndex: 7 },
  { id: "src/routes/dashboard.tsx", path: "src/routes/dashboard.tsx", label: "dashboard.tsx", group: "route", loc: 57, commitIndex: 7 },

  { id: "src/components/notification-bell.tsx", path: "src/components/notification-bell.tsx", label: "notification-bell.tsx", group: "component", loc: 36, commitIndex: 8 },
  { id: "src/routes/tasks.tsx", path: "src/routes/tasks.tsx", label: "tasks.tsx", group: "route", loc: 49, commitIndex: 8 },

  { id: "src/routes/settings.tsx", path: "src/routes/settings.tsx", label: "settings.tsx", group: "route", loc: 38, commitIndex: 9 },
  { id: "src/routes/login.tsx", path: "src/routes/login.tsx", label: "login.tsx", group: "route", loc: 44, commitIndex: 9 },

  { id: "src/lib/analytics.ts", path: "src/lib/analytics.ts", label: "analytics.ts", group: "lib", loc: 40, commitIndex: 10 },

  { id: "src/api/analytics.ts", path: "src/api/analytics.ts", label: "analytics.ts", group: "api", loc: 31, commitIndex: 11 },
  { id: "src/components/analytics-widget.tsx", path: "src/components/analytics-widget.tsx", label: "analytics-widget.tsx", group: "component", loc: 47, commitIndex: 11 },

  { id: "src/lib/websocket.ts", path: "src/lib/websocket.ts", label: "websocket.ts", group: "lib", loc: 56, commitIndex: 12 },
  { id: "src/hooks/use-realtime.ts", path: "src/hooks/use-realtime.ts", label: "use-realtime.ts", group: "hook", loc: 34, commitIndex: 12 },

  { id: "src/components/live-cursor.tsx", path: "src/components/live-cursor.tsx", label: "live-cursor.tsx", group: "component", loc: 25, commitIndex: 13 },
];

const edges: RepoEdge[] = [
  { source: "src/main.tsx", target: "src/app.tsx", kind: "import", commitIndex: 0 },
  { source: "src/app.tsx", target: "src/lib/env.ts", kind: "import", commitIndex: 1 },
  { source: "src/lib/db.ts", target: "src/lib/logger.ts", kind: "import", commitIndex: 1 },

  { source: "src/lib/http-client.ts", target: "src/lib/env.ts", kind: "import", commitIndex: 2 },
  { source: "src/api/tasks.ts", target: "src/lib/http-client.ts", kind: "import", commitIndex: 2 },
  { source: "src/api/tasks.ts", target: "src/types/task.ts", kind: "import", commitIndex: 2 },

  { source: "src/api/users.ts", target: "src/lib/http-client.ts", kind: "import", commitIndex: 3 },
  { source: "src/api/users.ts", target: "src/types/user.ts", kind: "import", commitIndex: 3 },
  { source: "src/api/auth.ts", target: "src/lib/http-client.ts", kind: "import", commitIndex: 3 },
  { source: "src/api/auth.ts", target: "src/types/user.ts", kind: "import", commitIndex: 3 },
  { source: "src/store/task-store.ts", target: "src/api/tasks.ts", kind: "call", commitIndex: 3 },
  { source: "src/store/task-store.ts", target: "src/types/task.ts", kind: "import", commitIndex: 3 },

  { source: "src/store/user-store.ts", target: "src/api/users.ts", kind: "call", commitIndex: 4 },
  { source: "src/store/session-store.ts", target: "src/api/auth.ts", kind: "call", commitIndex: 4 },
  { source: "src/hooks/use-tasks.ts", target: "src/store/task-store.ts", kind: "class", commitIndex: 4 },

  { source: "src/hooks/use-auth.ts", target: "src/store/session-store.ts", kind: "class", commitIndex: 5 },
  { source: "src/hooks/use-auth.ts", target: "src/store/user-store.ts", kind: "class", commitIndex: 5 },
  { source: "src/components/task-list.tsx", target: "src/hooks/use-tasks.ts", kind: "import", commitIndex: 5 },
  { source: "src/components/task-list.tsx", target: "src/components/task-card.tsx", kind: "import", commitIndex: 5 },
  { source: "src/components/task-card.tsx", target: "src/types/task.ts", kind: "import", commitIndex: 5 },
  { source: "src/components/task-card.tsx", target: "src/components/button.tsx", kind: "import", commitIndex: 5 },

  { source: "src/api/notifications.ts", target: "src/lib/http-client.ts", kind: "import", commitIndex: 6 },
  { source: "src/components/task-form.tsx", target: "src/hooks/use-tasks.ts", kind: "import", commitIndex: 6 },
  { source: "src/components/task-form.tsx", target: "src/components/button.tsx", kind: "import", commitIndex: 6 },
  { source: "src/components/task-form.tsx", target: "src/components/modal.tsx", kind: "import", commitIndex: 6 },
  { source: "src/components/user-avatar.tsx", target: "src/types/user.ts", kind: "import", commitIndex: 6 },
  { source: "src/components/sidebar.tsx", target: "src/hooks/use-auth.ts", kind: "import", commitIndex: 6 },
  { source: "src/components/sidebar.tsx", target: "src/components/user-avatar.tsx", kind: "import", commitIndex: 6 },

  { source: "src/components/header.tsx", target: "src/components/user-avatar.tsx", kind: "import", commitIndex: 7 },
  { source: "src/routes/dashboard.tsx", target: "src/components/sidebar.tsx", kind: "import", commitIndex: 7 },
  { source: "src/routes/dashboard.tsx", target: "src/components/header.tsx", kind: "import", commitIndex: 7 },
  { source: "src/routes/dashboard.tsx", target: "src/components/task-list.tsx", kind: "import", commitIndex: 7 },

  { source: "src/components/header.tsx", target: "src/components/notification-bell.tsx", kind: "import", commitIndex: 8 },
  { source: "src/components/notification-bell.tsx", target: "src/api/notifications.ts", kind: "call", commitIndex: 8 },
  { source: "src/routes/tasks.tsx", target: "src/components/task-list.tsx", kind: "import", commitIndex: 8 },
  { source: "src/routes/tasks.tsx", target: "src/components/task-form.tsx", kind: "import", commitIndex: 8 },
  { source: "src/routes/tasks.tsx", target: "src/components/sidebar.tsx", kind: "import", commitIndex: 8 },

  { source: "src/routes/settings.tsx", target: "src/components/sidebar.tsx", kind: "import", commitIndex: 9 },
  { source: "src/routes/settings.tsx", target: "src/hooks/use-auth.ts", kind: "import", commitIndex: 9 },
  { source: "src/routes/login.tsx", target: "src/hooks/use-auth.ts", kind: "import", commitIndex: 9 },
  { source: "src/routes/login.tsx", target: "src/components/button.tsx", kind: "import", commitIndex: 9 },
  { source: "src/app.tsx", target: "src/routes/dashboard.tsx", kind: "import", commitIndex: 9 },
  { source: "src/app.tsx", target: "src/routes/login.tsx", kind: "import", commitIndex: 9 },

  { source: "src/lib/analytics.ts", target: "src/lib/http-client.ts", kind: "import", commitIndex: 10 },
  { source: "src/lib/analytics.ts", target: "src/lib/logger.ts", kind: "import", commitIndex: 10 },

  { source: "src/api/analytics.ts", target: "src/lib/analytics.ts", kind: "call", commitIndex: 11 },
  { source: "src/components/analytics-widget.tsx", target: "src/api/analytics.ts", kind: "call", commitIndex: 11 },
  { source: "src/components/analytics-widget.tsx", target: "src/components/button.tsx", kind: "import", commitIndex: 11 },
  { source: "src/routes/dashboard.tsx", target: "src/components/analytics-widget.tsx", kind: "import", commitIndex: 11 },

  { source: "src/lib/websocket.ts", target: "src/lib/env.ts", kind: "import", commitIndex: 12 },
  { source: "src/hooks/use-realtime.ts", target: "src/lib/websocket.ts", kind: "import", commitIndex: 12 },
  { source: "src/hooks/use-realtime.ts", target: "src/store/task-store.ts", kind: "class", commitIndex: 12 },

  { source: "src/components/live-cursor.tsx", target: "src/hooks/use-realtime.ts", kind: "import", commitIndex: 13 },
  { source: "src/routes/dashboard.tsx", target: "src/components/live-cursor.tsx", kind: "import", commitIndex: 13 },
  { source: "src/components/task-card.tsx", target: "src/hooks/use-realtime.ts", kind: "call", commitIndex: 13 },
  { source: "src/store/task-store.ts", target: "src/hooks/use-tasks.ts", kind: "call", commitIndex: 13 },
];

export const mockRepoGraph: RepoGraphData = {
  repo: {
    name: "orbit",
    owner: "acme",
    branch: "main",
    lastSyncedAt: "2026-07-08T09:14:00Z",
  },
  commits,
  nodes,
  edges,
};
