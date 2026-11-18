import type { Metadata } from "next";
import { LoginPage } from "@/legacy-pages/LoginPage";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your existing Timy account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <LoginPage />;
}
