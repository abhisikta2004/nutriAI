import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-widest text-sage">Off the path</p>
        <h1 className="mt-4 text-7xl italic md:text-8xl">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">This page was never planted.</p>
        <Link
          to="/"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm uppercase tracking-widest text-primary-foreground transition-colors duration-300 hover:bg-terracotta"
        >
          Return home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
