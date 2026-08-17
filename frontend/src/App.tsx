import StartupView from "./views/startup";
import RepositoryLayout from "./views/repository";
import { Toaster } from "@/components/ui/toast";
import { RepositoryProvider } from "./hooks/repository/hook";
import { useAppContext } from "./hooks/app/hook";
import { OpeningRepositoryOverlay } from "@/components/repository/opening-repository-overlay";

export default function App() {
  const { view } = useAppContext();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {view === "startup" ? (
        <StartupView />
      ) : (
        <RepositoryProvider>
          <RepositoryLayout />
        </RepositoryProvider>
      )}
      <OpeningRepositoryOverlay />
      <Toaster />
    </div>
  );
}
