"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Users, Trophy, BarChart3, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import LoginForm from "@/components/auth/login-form";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Players", href: "/players", icon: Users },
  { name: "Tests", href: "/tests", icon: Trophy },
];

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const user = session?.user || null;
  const logout = async () => {
    await authClient.signOut();
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <nav className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8" aria-label="Top">
        <div className="flex w-full items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image src="/logo.png" alt="Rowad Club" width={60} height={60} />
              <div className="hidden sm:block">
                <Image
                  src="/logo-text.png"
                  alt="Rowad Speedball Team"
                  width={120}
                  height={20}
                />
              </div>
              <div className="sm:hidden">
                <span className="text-xl font-bold text-gray-900">
                  SpeedballHub
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-rowad-100 text-rowad-700"
                      : "text-gray-600 hover:text-rowad-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Admin Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
                <Link href="/admin">
                  <Button size="sm" className="bg-rowad-600 hover:bg-rowad-700">
                    Admin Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    Admin Login
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <LoginForm
                    onSuccess={() => setLoginDialogOpen(false)}
                    onCancel={() => setLoginDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t pt-4 pb-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors",
                      isActive
                        ? "bg-rowad-100 text-rowad-700"
                        : "text-gray-600 hover:text-rowad-600 hover:bg-gray-50"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              {user ? (
                <>
                  <span className="text-sm text-gray-600 px-3">
                    Welcome, {user.email}
                  </span>
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      size="sm"
                      className="w-full bg-rowad-600 hover:bg-rowad-700"
                    >
                      Admin Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </>
              ) : (
                <Dialog
                  open={loginDialogOpen}
                  onOpenChange={setLoginDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      Admin Login
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <LoginForm
                      onSuccess={() => {
                        setLoginDialogOpen(false);
                        setMobileMenuOpen(false);
                      }}
                      onCancel={() => setLoginDialogOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
