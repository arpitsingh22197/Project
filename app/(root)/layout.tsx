import { cn } from "@/lib/utils";
import Footer from "@/modules/home/footer";
import Header from "@/modules/home/header";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Code with AI",
  description: "AI-CODE - Your Ultimate AI Coding Companion",
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />

      {/* Background Grid Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 bottom-0 z-0",
          "[background-size:40px_40px]",
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />

      {/* Radial Highlight / Blue Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-400 via-blue-300 to-indigo-500 opacity-20 blur-3xl animate-pulse" />
      </div>

      {/* Optional Mask for Depth */}
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] z-5" />

      {/* Main Content */}
      <main className="relative z-20 w-full pt-0">{children}</main>

      {/* Footer */}
      <Footer />
    </>
  );
}
