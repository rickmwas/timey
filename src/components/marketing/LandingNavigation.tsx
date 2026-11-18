"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

const sectionLinks = [
  { href: "#overview", label: "Overview" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faqs", label: "FAQs" },
] as const;

const focusSection = (id: string) => {
  const section = document.getElementById(id);
  if (!section) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  window.history.pushState(null, "", `#${id}`);
  section.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
  section.focus({ preventScroll: true });
};

export function LandingNavigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  function handleEscape(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key !== "Escape" || !menuOpen) return;

    setMenuOpen(false);
    menuButtonRef.current?.focus();
  }

  function handleSectionClick(
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) {
    event.preventDefault();
    setMenuOpen(false);
    focusSection(href.slice(1));
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
      onKeyDown={handleEscape}
    >
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="relative block h-14 w-44 shrink-0 overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-500 sm:h-18 sm:w-56"
          aria-label="Timy home"
        >
          <Image
            src="/images/landing/logo4.png"
            alt="Timy, Kisii University"
            fill
            priority
            sizes="(max-width: 639px) 176px, 224px"
            className="object-cover object-center"
          />
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-6 lg:flex lg:gap-10"
        >
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleSectionClick(event, link.href)}
              className="rounded-sm text-base font-semibold text-slate-700 transition-colors hover:text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-500"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-base font-semibold text-navy-900 transition-colors hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy-900 px-6 text-base font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
          >
            Sign Up
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          type="button"
          className="grid size-12 shrink-0 place-items-center rounded-full border border-slate-300 text-navy-900 transition-colors hover:bg-navy-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500 lg:hidden"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden="true" size={20} />
          ) : (
            <Menu aria-hidden="true" size={22} />
          )}
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={
          menuOpen
            ? "border-t border-slate-200 bg-white px-4 py-4 shadow-lg lg:hidden"
            : "hidden"
        }
      >
        <nav aria-label="Mobile navigation" className="mx-auto grid max-w-7xl">
          {sectionLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => handleSectionClick(event, link.href)}
              className="flex min-h-12 items-center border-b border-slate-100 px-2 text-base font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-navy-500"
            >
              {link.label}
            </a>
          ))}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-navy-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy-900 px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
