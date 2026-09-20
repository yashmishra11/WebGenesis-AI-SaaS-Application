"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary">404</h1>

        <p className="mt-4 text-2xl font-semibold text-foreground">
          Page not found
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          Sorry, the page you’re looking for doesn’t exist or may have been
          moved.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="default" className="gap-2">
            <Link href="/">
              <Home className="size-4" />
              Go to Home Page
            </Link>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => history.back()}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
