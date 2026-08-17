import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/hooks/app/hook";
import { cn, slugify } from "@/lib/utils";
import { ReactNode, useState } from "react";
import { ChooseDirectory, CreateNewRepository } from "../../../../wailsjs/go/main/App";
import { reportError } from "@/lib/error-reporting";
import { FolderOpenIcon } from "@phosphor-icons/react";

interface CreateRepoDialogProps {
  children: ReactNode;
  rescanRepoList: () => void;
}
type NewRepository = { name: string; path: string };

// Live-typing variants of slugify: same char rules, but no edge-trim. Trimming
// a trailing "-" on every keystroke would eat the dash right as the user
// types the space that produced it, so the next character they type would
// glue onto the previous word with no separator at all. Edges only get
// trimmed once, via slugify(), at the point a value is actually used (path
// construction, the disabled check, submission).
const slugifyNameLive = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
const slugifyPathLive = (value: string) => value.toLowerCase().replace(/[^a-z0-9/]+/g, "-");

export function CreateRepositoryDialog({ children, rescanRepoList }: CreateRepoDialogProps) {
  const { baseDirectory } = useAppContext();
  const [open, setOpen] = useState<boolean>(false);
  const [newRepo, setNewRepo] = useState<NewRepository>({ name: "", path: baseDirectory ?? "" });

  async function createNewRepository() {
    try {
      await CreateNewRepository(slugify(newRepo.name), newRepo.path);
      setOpen(false);
      await rescanRepoList();
    } catch (err) {
      reportError("Failed to create repository", err);
    }
  }

  async function pickPath() {
    try {
      const path = await ChooseDirectory();
      if (path) setNewRepo((prev) => ({ ...prev, path }));
    } catch (err) {
      reportError("Failed to open the folder picker", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create repository</DialogTitle>
          <DialogDescription>Initializes a new git repository inside your code directory.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-repo-name">Name</Label>
          <Input id="new-repo-name" autoFocus placeholder="my-project" value={newRepo.name} onChange={(e) => setNewRepo((prev) => ({ ...prev, name: slugifyNameLive(e.target.value) }))} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-repo-path">Path</Label>
          <div className="flex items-center gap-1.5">
            <div className="flex h-8 w-full min-w-0 items-center rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 md:text-sm dark:bg-input/30">
              <input
                id="new-repo-path"
                placeholder={baseDirectory ?? ""}
                value={newRepo.path}
                onChange={(e) => setNewRepo((prev) => ({ ...prev, path: slugifyPathLive(e.target.value) }))}
                onKeyDown={(e) => e.key === "Enter" && createNewRepository()}
                className="min-w-0 max-w-full shrink border-0 bg-transparent p-0 text-base outline-none field-sizing-content placeholder:text-muted-foreground md:text-sm"
              />
              <span className={cn("min-w-0 shrink-0 truncate select-none", newRepo.path && "text-muted-foreground")}>/{slugify(newRepo.name) || "my-project"}</span>
            </div>
            <Button type="button" variant="outline" size="icon-sm" aria-label="Choose folder" onClick={pickPath} className="shrink-0">
              <FolderOpenIcon />
            </Button>
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={createNewRepository} disabled={!slugify(newRepo.name)}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
