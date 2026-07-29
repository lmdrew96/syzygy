"use client";

import Link from "next/link";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

export function TopBar() {
  return (
    <div className="flex items-center justify-between px-6 py-4 text-sm">
      <Logo />
      {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && <TopBarAuth />}
    </div>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-display text-lg tracking-wide text-starlight-lilac transition-colors hover:text-star-gold"
    >
      <span aria-hidden>☌</span>
      Syzygy
    </Link>
  );
}

function TopBarAuth() {
  const { isLoaded, isSignedIn } = useUser();
  if (!isLoaded) return null;

  return (
    <div className="flex items-center gap-4">
      {isSignedIn ? (
        <>
          <Link
            href="/profile"
            className="text-celestial-silver transition-colors hover:text-aged-parchment"
          >
            Birth data
          </Link>
          <Link
            href="/chart"
            className="text-celestial-silver transition-colors hover:text-aged-parchment"
          >
            My Chart
          </Link>
          <Link
            href="/reading/saved"
            className="text-celestial-silver transition-colors hover:text-aged-parchment"
          >
            Saved readings
          </Link>
          <UserButton />
        </>
      ) : (
        <SignInButton mode="modal">
          <button
            type="button"
            className="text-celestial-silver transition-colors hover:text-aged-parchment"
          >
            Sign in
          </button>
        </SignInButton>
      )}
    </div>
  );
}
