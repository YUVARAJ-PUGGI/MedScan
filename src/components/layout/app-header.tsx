
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Hospital, Home, UserPlus, ScanFace, LayoutDashboard, LogIn, LogOut, Bot } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext'; 
import { ThemeToggleButton } from './theme-toggle-button';

const loggedOutNavItems = [
  { href: '/', label: 'Home', icon: Home },
];

const loggedInNavItems = [
  { href: '/dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
  { href: '/register', label: 'Register Patient', icon: UserPlus },
  { href: '/face-scan', label: 'Face Scan', icon: ScanFace },
];

export function AppHeader() {
  const pathname = usePathname();
  const { isLoggedIn, login, logout } = useAuth(); 

  const currentNavItems = isLoggedIn ? loggedInNavItems : loggedOutNavItems;
  const mainSiteNameLink = isLoggedIn ? '/dashboard' : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-screen-2xl">
        <Link href={mainSiteNameLink} className="flex items-center gap-2 text-xl font-bold text-primary">
          <Hospital className="h-7 w-7" />
          <span>MedScan360</span>
        </Link>
        
        <div className="flex items-center"> {/* Wrapper for nav and theme toggle */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md",
                  pathname?.startsWith(item.href) && item.href !== '/' ? "text-primary bg-primary/10" : pathname === item.href ? "text-primary bg-primary/10" : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={logout} className="ml-2">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            ) : (
              <>
                 <Button 
                  variant="secondary" 
                  size="sm" 
                  className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md transform hover:scale-105 transition-transform duration-150"
                  asChild
                >
                  <Link href="/user-dashboard">
                    <Bot className="mr-2 h-4 w-4" /> Try MedScan AI
                  </Link>
                </Button>
                <Button variant="outline" size="sm" asChild className="ml-2">
                  <Link href="/register"><UserPlus className="mr-2 h-4 w-4" />Sign Up</Link>
                </Button>
                <Button size="sm" onClick={login}>
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
              </>
            )}
          </nav>
          <ThemeToggleButton /> {/* Added theme toggle button for desktop */}
        </div>

        <div className="md:hidden flex items-center"> {/* Wrapper for mobile menu and theme toggle */}
          <ThemeToggleButton /> {/* Added theme toggle button for mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="ml-2"> {/* Added ml-2 for spacing */}
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href={mainSiteNameLink} className="mb-6 flex items-center gap-2 text-lg font-bold text-primary">
                <Hospital className="h-6 w-6" />
                <span>MedScan360</span>
              </Link>
              <nav className="flex flex-col space-y-2">
                {currentNavItems.map((item) => (
                  <SheetTrigger asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors",
                      pathname?.startsWith(item.href) && item.href !== '/' ? "bg-accent text-accent-foreground" : pathname === item.href ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                  </SheetTrigger>
                ))}
                 {isLoggedIn ? (
                    <SheetTrigger asChild>
                      <Button variant="outline" onClick={logout} className="mt-4 justify-start">
                          <LogOut className="mr-2 h-5 w-5" /> Logout
                      </Button>
                    </SheetTrigger>
                  ) : (
                    <>
                       <SheetTrigger asChild>
                         <Button variant="outline" asChild className="mt-4 justify-start">
                           <Link href="/user-dashboard"><Bot className="mr-2 h-5 w-5" /> MedScan AI</Link>
                         </Button>
                       </SheetTrigger>
                       <SheetTrigger asChild>
                         <Button variant="outline" asChild className="mt-2 justify-start">
                           <Link href="/register"><UserPlus className="mr-2 h-5 w-5" />Sign Up</Link>
                         </Button>
                       </SheetTrigger>
                       <SheetTrigger asChild>
                         <Button onClick={login} className="justify-start">
                           <LogIn className="mr-2 h-5 w-5" /> Login
                         </Button>
                       </SheetTrigger>
                    </>
                  )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
