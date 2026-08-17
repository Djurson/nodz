import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ChooseCodeDirectory, GetConfig, GetSelectedRepo, OpenRepository, SetEditor } from "../../../wailsjs/go/main/App";
import { EventsOn } from "../../../wailsjs/runtime/runtime";
import { ApplicationContextProps, ApplicationState, ApplicationView } from "./types";
import { reportError } from "@/lib/error-reporting";

// Matches the Go-side scanProgressEvent constant (app_repository.go).
const SCAN_PROGRESS_EVENT = "repo:scan-progress";

const INIT: ApplicationContextProps = {
  loading: { directories: true, selectedDirectory: false },
  scanProgress: null,
  editor: "",
  view: "startup",
  baseDirectory: null,
  selectedRepo: null,
  changeEditor: () => {},
  chooseBaseDirectory: () => {},
  selectRepository: () => {},
  switchView: () => {},
};

export const ApplicationContext = createContext<ApplicationContextProps>(INIT);

export function useAppContext() {
  const context = useContext(ApplicationContext);
  if (!context) throw new Error("useAppContext must be used within a ApplicationProvider");
  return context;
}

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState<ApplicationState>({ ...INIT });

  // Restore the base directory / editor chosen in a previous session, if any.
  useEffect(() => {
    GetConfig()
      .then((cfg) => {
        setAppState((prev) => ({ ...prev, baseDirectory: cfg.baseDirectory || prev.baseDirectory, editor: cfg.editor }));
      })
      .catch((err) => reportError("Failed to load saved config", err));
  }, []);

  // OpenRepository is a single blocking call with nothing else to show
  // progress from, so the backend emits SCAN_PROGRESS_EVENT as it walks a
  // large repo's files. EventsOn returns its own unsubscribe function.
  useEffect(() => {
    return EventsOn(SCAN_PROGRESS_EVENT, (done: number, total: number) => {
      setAppState((prev) => ({ ...prev, scanProgress: { done, total } }));
    });
  }, []);

  function switchView(view: ApplicationView) {
    setAppState((prev) => ({ ...prev, view }));
  }

  async function changeEditor(value: string) {
    try {
      await SetEditor(value);
      setAppState((prev) => ({ ...prev, editor: value }));
    } catch (err) {
      reportError("Failed to save editor", err);
    }
  }

  async function chooseBaseDirectory() {
    setAppState((prev) => ({ ...prev, loading: { ...prev.loading, directories: true } }));
    try {
      const picked = await ChooseCodeDirectory();
      // Wails returns "" (not an error) when the user cancels the dialog.
      if (picked) setAppState((prev) => ({ ...prev, baseDirectory: picked }));
    } catch (err) {
      reportError("Failed to open the directory picker", err);
    } finally {
      setAppState((prev) => ({ ...prev, loading: { ...prev.loading, directories: false } }));
    }
  }

  async function selectRepository(path: string) {
    setAppState((prev) => ({ ...prev, loading: { ...prev.loading, selectedDirectory: true }, scanProgress: null }));
    try {
      await OpenRepository(path);
      // Fetched here, before view flips to "repository", so the loading
      // overlay (bound to loading.selectedDirectory) stays up for this
      // fetch too, not just the OpenRepository scan. Otherwise there's a
      // window where the repository view is mounted with no repo data yet.
      const repo = await GetSelectedRepo();
      setAppState((prev) => ({ ...prev, view: "repository", selectedRepo: repo }));
    } catch (err) {
      reportError("Failed to open repository", err);
    } finally {
      setAppState((prev) => ({ ...prev, loading: { ...prev.loading, selectedDirectory: false }, scanProgress: null }));
    }
  }

  const value: ApplicationContextProps = {
    ...appState,
    chooseBaseDirectory,
    changeEditor,
    selectRepository,
    switchView,
  };

  return <ApplicationContext.Provider value={value}>{children}</ApplicationContext.Provider>;
}
