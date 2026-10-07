import type { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return <SignUpForm google={Boolean(process.env.GOOGLE_CLIENT_ID)} />;
}
