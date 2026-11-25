import { AppLogo } from "@/components/app-logo";
import { HomeView } from "@/components/home/home-view";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
          <AppLogo />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex-1">
        <HomeView />
      </main>
    </div>
  );
}
