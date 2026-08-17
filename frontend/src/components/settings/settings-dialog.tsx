import { useEffect, useState } from "react";
import { FolderIcon, GithubLogoIcon } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTheme, type Theme } from "@/hooks/use-theme";
import type { EdgeKind } from "@/types/repo-graph";
import type { GraphSettings, LabelSize } from "@/types/graph-settings";
import { useAppContext } from "@/hooks/app/hook";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings?: GraphSettings;
  onSettingsChange?: (settings: GraphSettings) => void;
}

const EDGE_KIND_LABELS: Record<EdgeKind, string> = {
  import: "Imports",
  call: "Calls",
  class: "Class usage",
};

const LABEL_SIZES: { value: LabelSize; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

const SPREAD_LABELS: { max: number; label: string }[] = [
  { max: 0.34, label: "Compact" },
  { max: 0.67, label: "Balanced" },
  { max: Infinity, label: "Spacious" },
];

function spreadLabel(spread: number) {
  return SPREAD_LABELS.find(({ max }) => spread <= max)!.label;
}

export function SettingsDialog({ open, onOpenChange, settings, onSettingsChange }: SettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const { editor, changeEditor, baseDirectory, chooseBaseDirectory, loading } = useAppContext();
  const [editorDraft, setEditorDraft] = useState(editor);

  useEffect(() => setEditorDraft(editor), [editor]);

  function saveEditor() {
    const trimmed = editorDraft.trim();
    setEditorDraft(trimmed);
    if (trimmed !== editor) changeEditor(trimmed);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Controls how the app looks, where it looks for code, and how the graph view renders. Theme and base code directory persist across restarts; graph display settings do not yet.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" orientation="vertical" className="flex-row gap-6">
          <TabsList variant="line" className="w-36 shrink-0">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            {settings && onSettingsChange && <TabsTrigger value="graph">Graph</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Base code directory</span>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <FolderIcon className="size-5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-sm font-medium text-foreground">{baseDirectory ?? "Not set"}</span>
                </div>
                <Button size="sm" variant="outline" onClick={chooseBaseDirectory} disabled={loading.directories} className="shrink-0">
                  {loading.directories ? "Scanning…" : baseDirectory ? "Change" : "Choose"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">The parent folder Nodz scans for git repositories to list on the picker screen, e.g. the folder that holds all your projects, not a repository itself. Saved across restarts.</p>
            </section>

            <section className="flex flex-col gap-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Code editor</span>
              <div className="flex items-center gap-2">
                <Input value={editorDraft} onChange={(e) => setEditorDraft(e.target.value)} onBlur={saveEditor} onKeyDown={(e) => e.key === "Enter" && saveEditor()} placeholder="code, cursor, subl, zed…" />
                <Button size="sm" variant="outline" onClick={saveEditor} disabled={editorDraft.trim() === editor} className="shrink-0">
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">The CLI command for your editor, must be on PATH. Used when opening a file from Structure, and by the top bar repo-open button. Saved across restarts.</p>
            </section>
          </TabsContent>

          <TabsContent value="account" className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">GitHub</span>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <GithubLogoIcon className="size-5 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">Not connected</span>
                    <span className="text-xs text-muted-foreground">Resolves real commit authors once repo analysis exists</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled>
                  Connect
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Commit authors shown today (e.g. in History) come from mock data. Signing in with GitHub will let Nodz attribute real commits and, later, open private repos, not wired up yet since no backend exists to authenticate against.
              </p>
            </section>
          </TabsContent>

          <TabsContent value="appearance" className="flex flex-col gap-6">
            <section className="flex flex-col gap-3">
              <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Theme</span>
              <div className="flex gap-1">
                {THEMES.map(({ value, label }) => (
                  <Button key={value} size="sm" variant={theme === value ? "secondary" : "ghost"} className="flex-1" onClick={() => setTheme(value)}>
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Light or dark colors, or follow your OS setting. Saved across restarts.</p>
            </section>

            {settings && onSettingsChange && (
              <section className="flex flex-col gap-3">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Label size</span>
                <div className="flex gap-1">
                  {LABEL_SIZES.map(({ value, label }) => (
                    <Button key={value} size="sm" variant={settings.labelSize === value ? "secondary" : "ghost"} className="flex-1" onClick={() => onSettingsChange({ ...settings, labelSize: value })}>
                      {label}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Text size for file names shown under each node in the graph view.</p>
              </section>
            )}
          </TabsContent>

          {settings && onSettingsChange && (
            <TabsContent value="graph" className="flex flex-col gap-6">
              <section className="flex flex-col gap-3">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Edge types</span>
                <p className="text-xs text-muted-foreground">Which kinds of relationships draw as lines between nodes. Turn a type off to declutter a dense graph.</p>
                <div className="flex flex-col gap-2.5">
                  {(Object.keys(EDGE_KIND_LABELS) as EdgeKind[]).map((kind) => (
                    <div key={kind} className="flex items-center justify-between">
                      <Label htmlFor={`edge-${kind}`} className="font-normal text-foreground">
                        {EDGE_KIND_LABELS[kind]}
                      </Label>
                      <Switch id={`edge-${kind}`} checked={settings.visibleEdgeKinds[kind]} onCheckedChange={(checked) => onSettingsChange({ ...settings, visibleEdgeKinds: { ...settings.visibleEdgeKinds, [kind]: checked } })} />
                    </div>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Layout spread</span>
                  <span className="text-xs text-muted-foreground">{spreadLabel(settings.spread)}</span>
                </div>
                <Slider value={[settings.spread]} min={0} max={1} step={0.01} onValueChange={(v) => onSettingsChange({ ...settings, spread: Array.isArray(v) ? v[0] : v })} />
                <p className="text-xs text-muted-foreground">How far apart nodes push away from each other in the force layout, compact keeps clusters tight, spacious gives dense graphs more room to breathe.</p>
              </section>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
