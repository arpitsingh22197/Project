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
    <div className="relative min-h-screen overflow-hidden">
      <Header />

      {/* Background Grid Overlay (FULL HEIGHT FIXED) */}
      <div
        className={cn(
          "absolute inset-0 z-0", // 🔥 full coverage fix
          "[background-size:50px_50px]", // adjust grid size
          "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          "dark:[background-image:linear-gradient(to_right,#262626_1px,transparent_1px),linear-gradient(to_bottom,#262626_1px,transparent_1px)]"
        )}
      />

      {/* Radial Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-400 via-blue-300 to-indigo-500 opacity-20 blur-3xl animate-pulse" />
      </div>

      {/* Mask for depth */}
      <div className="pointer-events-none absolute inset-0 bg-white dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] z-[5]" />

      {/* Main Content */}
      <main className="relative z-20 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}