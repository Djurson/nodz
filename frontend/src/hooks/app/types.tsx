import { reposcan } from "../../../wailsjs/go/models";

export type ApplicationView = "startup" | "repository";

export type ScanProgress = { done: number; total: number };

export type ApplicationState = {
  baseDirectory: string | null;
  view: ApplicationView;
  loading: {
    directories: boolean;
    selectedDirectory: boolean;
  };
  // Set from the backend's repo:scan-progress events while
  // loading.selectedDirectory is true; null once done or before any event
  // has arrived yet (repo could still be small/fast enough for none to fire).
  scanProgress: ScanProgress | null;
  editor: string;
  // Fetched by selectRepository once OpenRepository finishes, before view
  // ever flips to "repository" — so by the time RepositoryProvider mounts,
  // this is already populated and it can seed its state synchronously
  // instead of racing its own fetch against the loading overlay.
  selectedRepo: reposcan.DetailedRepository | null;
};

export type ApplicationContextProps = ApplicationState & {
  changeEditor: (value: string) => void;
  chooseBaseDirectory: () => void;
  selectRepository: (path: string) => void;
  switchView: (view: ApplicationView) => void;
};
