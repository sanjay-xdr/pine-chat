"use client";
import ChatList from "@/components/ChatList"; 
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatBubbleLeftEllipsisIcon as AppLogoIcon,
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  PaperAirplaneIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  QuestionMarkCircleIcon,
  Bars3Icon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  BookmarkIcon, 
  ClockIcon,    
  AtSymbolIcon, 
  CreditCardIcon, 
  ListBulletIcon, 
} from '@heroicons/react/24/outline';

const leftNavItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Home" },
  { href: "/dashboard/chats", icon: ChatBubbleLeftRightIcon, label: "Chats" }, 
  { href: "/dashboard/groups", icon: UserGroupIcon, label: "Groups" },
  { href: "/dashboard/broadcasts", icon: PaperAirplaneIcon, label: "Broadcasts" },
];

const rightNavIcons = [
    { icon: PlusIcon, label: "Add" },
    { icon: BookmarkIcon, label: "Bookmarks" },
    { icon: ClockIcon, label: "History" },
    { icon: AtSymbolIcon, label: "Mentions" },
    { icon: CreditCardIcon, label: "Payments" },
    { icon: ListBulletIcon, label: "Tasks" },
];


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 antialiased">
      <aside className="w-18 md:w-20 bg-white border-r border-gray-200 flex flex-col items-center py-5 space-y-7 shadow-sm">
        <Link href="/dashboard" className="p-2 bg-green-500 rounded-lg">
          <AppLogoIcon className="h-7 w-7 text-white" />
        </Link>
        <nav className="flex flex-col space-y-3 items-center">
          {leftNavItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`p-2.5 rounded-lg transition-colors duration-150
                ${pathname === item.href || (item.href === "/dashboard/chats" && pathname.startsWith("/dashboard/chat"))
                  ? "bg-green-100 text-green-600"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col space-y-3 items-center">
          <button title="Notifications" className="p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg">
            <BellIcon className="h-6 w-6" />
          </button>
          <button title="Settings" className="p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg">
            <Cog6ToothIcon className="h-6 w-6" />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[60px] bg-white border-b border-gray-200 flex items-center justify-between px-5 shadow-sm">
          <div className="flex items-center">
            <AppLogoIcon className="h-6 w-6 text-green-500 mr-2.5" />
            <h1 className="text-xl font-semibold text-gray-700">chats</h1>
          </div>
          <div className="flex items-center space-x-3 md:space-x-4">
            <button className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
              <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Refresh
            </button>
            <button className="flex items-center text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors">
              <QuestionMarkCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1" /> Help
            </button>
            <span className="text-xs sm:text-sm text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-md font-medium">● 5/6 phones</span>
        
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <PlusIcon className="h-5 w-5" />
            </button>
            <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md hidden sm:block transition-colors">
                <Bars3Icon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-[320px] md:w-[360px] bg-white border-r border-gray-200 flex flex-col">
            <div className="p-3 border-b border-gray-200 flex items-center space-x-2 sticky top-0 bg-white z-10">
              <button className="px-2.5 py-1.5 text-xs sm:text-sm bg-green-100 text-green-700 rounded-md flex items-center hover:bg-green-200 transition-colors">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1"/> Custom filter
              </button>
              <button className="px-2.5 py-1.5 text-xs sm:text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                Save
              </button>
              <div className="flex-grow relative">
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
                <input type="text" placeholder="Search" className="w-full pl-8 pr-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500 transition-colors"/>
              </div>
              <button className="flex items-center text-xs sm:text-sm text-green-600 hover:text-green-800 transition-colors">
                <FunnelIcon className="h-4 w-4 mr-1"/> Filtered
                <span className="ml-1 h-1.5 w-1.5 bg-green-500 rounded-full"></span>
              </button>
            </div>
            <div className="flex-grow overflow-y-auto">
              <Suspense fallback={
                <div className="p-4 text-center text-gray-500">
                  <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto mb-2"/>
                  Loading chats...
                </div>
              }>
                <ChatList />
              </Suspense>
            </div>
          </aside>

          <main className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
            {children}
          </main>

          <aside className="w-16 md:w-18 bg-white border-l border-gray-200 flex-col items-center py-5 space-y-4 hidden sm:flex">
            {rightNavIcons.map((item) => (
                <button
                key={item.label}
                title={item.label}
                className="p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-lg transition-colors"
                >
                <item.icon className="h-5 w-5" />
                </button>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}