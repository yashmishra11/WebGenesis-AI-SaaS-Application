"use client";
import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { ProjectsList } from "@/modules/home/ui/components/project-lists";
import Image from "next/image";
import { SparklesIcon } from "lucide-react";

const page = () => {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Ambient background glow */}
      <div className="absolute top-28 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-primary/15 via-indigo-500/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <section className="space-y-6 py-[12vh] 2xl:py-36 flex flex-col items-center">
        {/* Modern Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border bg-background/80 backdrop-blur-xs text-xs font-medium text-muted-foreground shadow-xs">
          <SparklesIcon className="size-3.5 text-primary" />
          <span>Next-Gen Full-Stack AI Web Synthesis</span>
        </div>

        <div className="flex flex-col items-center">
          <Image
            src={"/logo.svg"}
            alt="WebGenesis"
            width={52}
            height={52}
            className="hidden md:block transition-transform hover:scale-105 duration-300"
          />
        </div>

        <h1 className="text-3xl font-extrabold md:text-6xl text-center tracking-tight max-w-3xl leading-[1.15]">
          Build Production Apps at the{" "}
          <span className="bg-gradient-to-r from-primary via-indigo-500 to-primary/80 bg-clip-text text-transparent">
            Speed of Thought
          </span>
        </h1>

        <p className="text-base md:text-xl text-muted-foreground text-center max-w-2xl leading-relaxed">
          Describe any idea to synthesize full Next.js applications, responsive components, and interactive live previews in real time.
        </p>

        <div className="max-w-3xl mx-auto w-full pt-2">
          <ProjectForm />
        </div>
      </section>

      <ProjectsList />
    </div>
  );
};

export default page;
