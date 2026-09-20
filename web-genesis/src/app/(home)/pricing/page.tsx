"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PricingTable, useUser, useClerk } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ErrorBoundary } from "react-error-boundary";
import { CheckIcon, SparklesIcon, ZapIcon, ExternalLinkIcon, ShieldCheckIcon } from "lucide-react";

import { useCurrentTheme } from "@/hooks/current-theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FallbackPricingProps {
  error?: Error;
}

const CustomPricingTable = ({ error }: FallbackPricingProps) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const { isSignedIn } = useUser();
  const clerk = useClerk();

  const handleAction = () => {
    if (!isSignedIn) {
      clerk.openSignIn();
    }
  };

  const isBillingDisabledNotice =
    error?.message?.includes("cannot_render_billing_disabled") ||
    error?.message?.includes("billing is disabled");

  return (
    <div className="w-full space-y-8">
      {/* Dev notice banner if Clerk billing is disabled */}
      {isBillingDisabledNotice && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-600 dark:text-amber-400 flex items-start justify-between gap-3 text-left">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <span>🔒 Clerk Billing Disabled in Development</span>
            </p>
            <p className="text-muted-foreground">
              Clerk&apos;s automated checkout table is hidden because billing isn&apos;t enabled in your Clerk dashboard yet. 
              Showing standard pricing tiers below.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1 shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <a
              href="https://dashboard.clerk.com/last-active?path=billing/settings"
              target="_blank"
              rel="noreferrer"
            >
              Enable in Clerk <ExternalLinkIcon className="size-3" />
            </a>
          </Button>
        </div>
      )}

      {/* Monthly / Annual Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span
          className={`text-xs font-medium cursor-pointer transition-colors ${
            !isAnnual ? "text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => setIsAnnual(false)}
        >
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isAnnual}
          onClick={() => setIsAnnual((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isAnnual ? "bg-primary" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none inline-block size-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
              isAnnual ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
        <span
          className={`text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
            isAnnual ? "text-foreground" : "text-muted-foreground"
          }`}
          onClick={() => setIsAnnual(true)}
        >
          Annual
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            Save 20%
          </Badge>
        </span>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Starter Free Tier */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-xs relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Starter</span>
              <Badge variant="outline" className="text-[11px]">Free</Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-foreground">$0</span>
              <span className="text-xs text-muted-foreground"> / month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Ideal for exploring AI-powered web generation and prototyping ideas.
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>5 AI web syntheses per day</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Next.js App Router live preview</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Basic design variation presets</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Community template library</span>
              </li>
            </ul>
          </div>
          <Button asChild variant="outline" className="w-full text-xs">
            <Link href="/">Current Plan</Link>
          </Button>
        </div>

        {/* Pro Tier (Popular) */}
        <div className="rounded-2xl border-2 border-primary bg-card p-6 flex flex-col justify-between shadow-lg relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-0.5 shadow-sm">
              <SparklesIcon className="size-3 mr-1" /> Most Popular
            </Badge>
          </div>
          <div>
            <div className="flex items-center justify-between mb-4 pt-1">
              <span className="text-sm font-semibold text-primary">Pro</span>
              <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                Turbo
              </Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-foreground">
                ${isAnnual ? "15" : "19"}
              </span>
              <span className="text-xs text-muted-foreground"> / month</span>
              {isAnnual && (
                <span className="block text-[11px] text-muted-foreground mt-0.5">
                  Billed annually ($180/yr)
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              For builders and developers shipping production apps with AI.
            </p>
            <ul className="space-y-2.5 text-xs text-foreground/90 mb-6">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span className="font-medium">Unlimited AI web generation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span>Priority Groq Turbo inference</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span>1-Click Full Project ZIP Export</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span>Multi-Device Preview (Desktop, Tablet, Mobile)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span>Warm E2B sandbox instant reconnection</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-primary shrink-0" />
                <span>All design presets & style iterations</span>
              </li>
            </ul>
          </div>
          <Button onClick={handleAction} className="w-full text-xs font-semibold gap-1.5 shadow-md">
            <ZapIcon className="size-3.5" /> Upgrade to Pro
          </Button>
        </div>

        {/* Enterprise Tier */}
        <div className="rounded-2xl border bg-card p-6 flex flex-col justify-between shadow-xs relative">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-muted-foreground">Enterprise</span>
              <Badge variant="outline" className="text-[11px]">Custom</Badge>
            </div>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-foreground">
                ${isAnnual ? "65" : "79"}
              </span>
              <span className="text-xs text-muted-foreground"> / month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Dedicated infrastructure for teams, agencies, and high volume.
            </p>
            <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Dedicated cloud sandbox cluster</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Custom domain deployments</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>Team collaboration & workspace sharing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="size-3.5 text-emerald-500 shrink-0" />
                <span>24/7 dedicated support</span>
              </li>
            </ul>
          </div>
          <Button asChild variant="outline" className="w-full text-xs">
            <a href="mailto:support@webgenesis.ai?subject=Enterprise%20Inquiry">
              <ShieldCheckIcon className="size-3.5 mr-1" /> Contact Sales
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

const Page = () => {
  const currentTheme = useCurrentTheme();

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full px-4 pb-20">
      <section className="space-y-6 pt-[10vh] 2xl:pt-28 flex flex-col items-center">
        <div className="flex flex-col items-center">
          <Image
            src="/logo.svg"
            alt="WebGenesis"
            width={48}
            height={48}
            className="hidden md:block transition-transform hover:scale-105"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-muted/40 text-xs text-muted-foreground">
          <SparklesIcon className="size-3.5 text-primary" />
          <span>Simple, Transparent Pricing</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-center tracking-tight">
          Supercharge Your Web Development
        </h1>
        <p className="text-muted-foreground text-center text-sm md:text-base max-w-lg">
          Choose a plan that fits your ambition. From quick prototypes to production SaaS applications.
        </p>

        {/* Render Clerk's PricingTable only when billing is explicitly enabled, avoiding dev runtime throw */}
        <div className="w-full pt-4">
          {process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true" ? (
            <ErrorBoundary
              fallbackRender={({ error }) => <CustomPricingTable error={error} />}
            >
              <PricingTable
                appearance={{
                  elements: {
                    baseTheme: currentTheme === "dark" ? dark : undefined,
                    pricingTableCard: "border! shadow-none! rounded-2xl!",
                  },
                }}
              />
            </ErrorBoundary>
          ) : (
            <CustomPricingTable />
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;
