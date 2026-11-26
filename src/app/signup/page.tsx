import type { Metadata } from "next";
import { SignupPage } from "@/legacy-pages/SignupPage";

export const metadata: Metadata = {
  title: "Student Registration | Timy Kisii University",
  description: "Create your student portal and connect to the live academic schedule pilot.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SignupPage />;
}
