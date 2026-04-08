import { Link } from 'react-router-dom';
import { Moon, Sun, Activity } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function Header() {
  const { dark, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground no-underline">
          <Activity className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">HealthDash</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground no-underline">
            Dashboard
          </Link>
          <Link to="/patients" className="text-sm text-muted-foreground hover:text-foreground no-underline">
            Patients
          </Link>
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </nav>
      </div>
    </header>
  );
}
