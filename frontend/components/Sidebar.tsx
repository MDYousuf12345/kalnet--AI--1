"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Mail,
  FileText,
  Clock,
  BarChart2,
  Settings,
  Sparkles,
  Send,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menu = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Lead Researcher",
      href: "/lead-researcher",
      icon: Search,
    },
    {
      title: "Email Generator",
      href: "/email-generator",
      icon: Mail,
    },
    {
      title: "Proposal Generator",
      href: "/proposal-generator",
      icon: FileText,
    },
    {
      title: "Batch Emailer",
      href: "/batch-emailer",
      icon: Send,
    },
    {
      title: "History",
      href: "/history",
      icon: Clock,
    },
    {
      title: "Analytics",
      href: "/analytics",
      icon: BarChart2,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <aside className="
      w-[280px]
      h-screen
      bg-[#060814]
      text-white
      flex
      flex-col
      justify-between
      px-5
      py-6
      border-r
      border-slate-900/50
      shadow-2xl
      z-50
      relative
    ">
      {/* TOP SECTION */}
      <div>
        {/* LOGO */}
        <div className="
          flex
          items-center
          gap-3.5
          mb-8
          mt-1
          px-2
        ">
          <div className="
            w-11
            h-11
            rounded-xl
            bg-gradient-to-br
            from-[#9D4EDD]
            via-[#7B2CBF]
            to-[#5A189A]
            flex
            items-center
            justify-center
            shadow-lg
            shadow-purple-600/30
          ">
            <Sparkles className="
              w-6
              h-6
              text-white
            " />
          </div>

          <div>
            <h1 className="
              text-[22px]
              font-extrabold
              tracking-tight
              leading-none
              bg-clip-text
              bg-gradient-to-r
              from-white
              to-slate-100
            ">
              KALNET AI
            </h1>
            <p className="
              text-slate-400
              text-[11.5px]
              font-medium
              mt-1.5
              tracking-wider
            ">
              Intelligent Outreach System
            </p>
          </div>
        </div>

        {/* MENU */}
        <div className="space-y-1.5">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.title}
                href={item.href}
                className="block"
              >
                <div className={`
                  group
                  flex
                  items-center
                  gap-3.5
                  px-4
                  py-3.5
                  rounded-xl
                  transition-all
                  duration-200
                  cursor-pointer
                  ${
                    active
                      ? "bg-gradient-to-r from-[#6D5EF9] to-[#5849E8] text-white shadow-lg shadow-violet-600/35 font-semibold"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}>
                  <Icon className={`
                    w-5
                    h-5
                    transition-all
                    ${
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-slate-200"
                    }
                  `} />

                  <span className={`
                    text-[15px]
                    transition-all
                    ${
                      active
                        ? "text-white font-semibold"
                        : "text-slate-300 group-hover:text-white"
                    }
                  `}>
                    {item.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>


    </aside>
  );
}
