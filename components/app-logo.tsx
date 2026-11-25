import { ClapperboardIcon } from "lucide-react";
import Link from "next/link";

export function AppLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <ClapperboardIcon className="size-4" aria-hidden />
      </span>
      <span>Bida Script Reader</span>
    </Link>
  );
}
