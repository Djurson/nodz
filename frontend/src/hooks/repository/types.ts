import { reposcan } from "../../../wailsjs/go/models";

export type RepositoryContextProps = SelectedRepository & {
  openInEditor: () => void;
  openFile: () => void;
  closeRepository: () => void;
};

// repo is always already there the way the old mock-data props did.
export type SelectedRepository = {
  repo: reposcan.DetailedRepository | null;
  loading: boolean;
  error: string | null;
};
