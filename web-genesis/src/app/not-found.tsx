"use client";
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gray-900">404</h1>

        <p className="mt-4 text-xl font-semibold text-gray-800">
          Page not found
        </p>

        <p className="mt-2 text-sm text-gray-600">
          Sorry, the page you’re looking for doesn’t exist or may have been
          moved.
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Home size={16} />
            Go to Home Page
          </Link>

          <button
            onClick={() => history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
