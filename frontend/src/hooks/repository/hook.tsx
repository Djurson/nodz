import { createContext, useContext, type ReactNode } from "react";
import { CloseRepository, OpenRepositoryFile, OpenRepositoryInEditor } from "../../../wailsjs/go/main/App";
import { reportError } from "@/lib/error-reporting";
import { RepositoryContextProps } from "./types";
import { useAppContext } from "../app/hook";

export const RepositoryContext = createContext<RepositoryContextProps | undefined>(undefined);

export function useRepositoryContext() {
  const ctx = useContext(RepositoryContext);
  if (ctx === undefined) throw new Error("useRepositoryContext must be used within a RepositoryProvider");
  return ctx;
}

// Seeded from ApplicationContext.selectedRepo, not fetched here: App.tsx
// only switches to the "repository" view (mounting this provider) after
// selectRepository has already awaited both OpenRepository and
// GetSelectedRepo, so the data is guaranteed to be in hand by mount time.
// A separate mount-time fetch here would race the loading overlay, which
// hides as soon as that same selectRepository call resolves — leaving a
// window where this provider's repo is still null but nothing is covering
// the screen.
export function RepositoryProvider({ children }: { children: ReactNode }) {
  const { selectedRepo: repo, switchView } = useAppContext();

  async function openInEditor() {
    try {
      await OpenRepositoryInEditor();
    } catch (err) {
      reportError("Failed to open in editor", err);
    }
  }

  async function openFile() {
    try {
      await OpenRepositoryFile();
    } catch (err) {
      reportError("Failed to open file", err);
    }
  }

  async function closeRepository() {
    try {
      await CloseRepository();
    } catch (err) {
      reportError("Failed to close repository", err);
    } finally {
      switchView("startup");
    }
  }

  const value: RepositoryContextProps = {
    repo,
    loading: false,
    error: null,
    openInEditor,
    openFile,
    closeRepository,
  };

  return <RepositoryContext.Provider value={value}>{children}</RepositoryContext.Provider>;
}
