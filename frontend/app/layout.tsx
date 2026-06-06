import type { Metadata } from "next";

import "./globals.css";

import Sidebar from "@/components/Sidebar";
import Providers from "@/components/Providers";

export const metadata: Metadata = {

  title: "KALNET AI",

  description:
    "Enterprise AI Outreach Suite",

  keywords: [
    "AI",
    "KALNET",
    "Lead Research",
    "Proposal Generator",
    "Email Generator",
    "Enterprise SaaS",
  ],

  authors: [
    {
      name: "KALNET AI",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (

    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >

      <body className="
        min-h-screen
        bg-[#F4F7FB]
        text-slate-900
        antialiased
      ">

        {/* APP WRAPPER */}

        <div className="
          flex
          min-h-screen
          w-full
        ">

          {/* SIDEBAR */}

          <aside className="
            hidden
            lg:block
            fixed
            left-0
            top-0
            z-50
            h-screen
            w-[280px]
          ">

            <Sidebar />

          </aside>

          {/* MAIN CONTENT */}

          <main className="
            flex-1
            lg:ml-[280px]
            min-h-screen
            bg-[#F4F7FB]
            overflow-y-auto
          ">

            <div className="
              min-h-screen
              w-full
              fade-in
            ">

              <Providers>
                {children}
              </Providers>

            </div>

          </main>

        </div>

      </body>

    </html>
  );
}
