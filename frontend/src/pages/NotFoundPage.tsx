import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">Page not found</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground no-underline hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}
