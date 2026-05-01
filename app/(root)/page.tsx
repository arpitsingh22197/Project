import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen py-10">
      
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center gap-6">
        <Image
          src="/hero.svg"
          alt="Hero Section"
          width={400}
          height={400}
          className="w-[300px] sm:w-[400px] md:w-[500px]"
        />

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-rose-500 via-red-500 to-pink-500 dark:from-rose-400 dark:via-red-400 dark:to-pink-400 leading-tight">
          AI-CODE With Intelligence
        </h1>
      </div>

      {/* Description */}
      <p className="mt-6 text-base sm:text-lg text-center text-gray-600 dark:text-gray-400 px-6 max-w-2xl">
        AI-CODE Editor is a powerful and intelligent code editor that enhances
        your coding experience with advanced features and seamless integration.
        It helps you write, debug, and optimize your code efficiently.
      </p>

      {/* Button */}
      <Link href="/dashboard" className="mt-6">
        <Button variant="brand" size="lg" className="flex items-center gap-2">
          Get Started
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </Link>

    </div>
  );
}