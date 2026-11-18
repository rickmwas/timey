import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Learn how to request access to the Timy university system.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-sm font-semibold text-navy-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-navy-500"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Back to Timy
        </Link>

        <div className="mt-10 grid overflow-hidden rounded-3xl bg-white shadow-xl shadow-navy-900/5 md:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-between bg-navy-950 p-7 text-white sm:p-10">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-white/10">
                <ClipboardList aria-hidden="true" size={22} />
              </span>
              <span className="font-display text-2xl">Timy</span>
            </div>
            <div className="mt-12">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">
                University access
              </p>
              <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
                Your academic schedule, all in one place.
              </h1>
              <p className="mt-5 leading-7 text-blue-100">
                Timy accounts are provided by the university so each person can
                access the right tools for their role.
              </p>
            </div>
            <Link
              href="/"
              className="mt-12 inline-flex w-fit min-h-11 items-center gap-2 rounded-sm text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Learn about Timy
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>

          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-navy-600">
              Request an account
            </p>
            <h2 className="mt-4 font-display text-3xl text-navy-950 sm:text-4xl">
              Get started with Timy
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              New accounts are managed by your university. Contact your
              department administrator or the university office responsible for
              academic timetables to request access.
            </p>
            <ol className="mt-8 space-y-5">
              {[
                {
                  title: "Request access",
                  detail:
                    "Ask your university administrator for a Timy account.",
                },
                {
                  title: "Receive your sign in details",
                  detail:
                    "The university will provide the account details you need.",
                },
                {
                  title: "Sign in to your role",
                  detail:
                    "Use your account to open the Timy portal for your role.",
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-sm font-bold text-navy-800">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {step.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <Link
              href="/login"
              className="mt-9 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-navy-900 px-6 text-sm font-bold text-white transition-colors hover:bg-navy-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
            >
              Go to Sign In
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
            <p className="mt-4 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-navy-800 underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
