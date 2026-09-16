"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

function EmailIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7">
      <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.8 12.23c0-.7-.06-1.37-.18-2H12v3.77h5.5a4.7 4.7 0 0 1-2.04 3.08v2.52h3.24c1.9-1.75 3.1-4.34 3.1-7.37Z" />
      <path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.7-2.4l-3.24-2.52c-.9.6-2.05.96-3.46.96-2.65 0-4.9-1.79-5.7-4.2H3.96v2.6A10.12 10.12 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.3 13.84a6.1 6.1 0 0 1 0-3.68V7.57H3.96a10 10 0 0 0 0 8.86l2.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.53 0 2.9.53 3.98 1.57l2.98-2.98C17.05 2.77 14.74 2 12 2a10.12 10.12 0 0 0-8.04 5.57L6.3 10.16c.8-2.41 3.05-4.2 5.7-4.2Z" />
    </svg>
  );
}

export default function ConnexionPage() {
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    router.push("/");
  }

  return (
    <main className="h-dvh overflow-hidden bg-black text-white lg:grid lg:grid-cols-[43.2%_56.8%]">
      <section className="flex h-dvh items-center justify-center overflow-hidden bg-black px-7 py-12 sm:px-12 lg:px-16 xl:px-20">
        <div className="w-full max-w-[420px]">
          <Image
            src="/logoAudiva4.png"
            alt="Audiva"
            width={1254}
            height={1254}
            priority
            className="mx-auto mb-10 h-auto w-48 sm:mb-12 sm:w-56"
          />

          <h1 className="font-serif text-4xl font-bold tracking-tight sm:text-5xl">Welcome Back!</h1>
          <p className="mt-5 max-w-md text-center text-base leading-6 text-white/90 sm:text-left">
            Connectez-vous à votre compte pour retrouver votre bibliothèque, vos playlists et vos amis. Vous n&apos;avez pas encore de compte ? Inscrivez-vous dès aujourd&apos;hui pour profiter pleinement de l&apos;expérience Audiva !
          </p>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <label className="block text-base font-semibold">
              <span className="mb-3 block">Email</span>
              <span className="flex items-center gap-3 rounded-full bg-white px-5 py-4 text-[#ad89a6] shadow-sm">
                <EmailIcon />
                <input type="email" name="email" autoComplete="email" placeholder="Enter your email" className="w-full bg-transparent text-base outline-none placeholder:text-[#ad89a6]" />
              </span>
            </label>

            <label className="block text-base font-semibold">
              <span className="mb-3 block">Password</span>
              <span className="flex items-center gap-3 rounded-full bg-white px-5 py-4 text-[#ad89a6] shadow-sm">
                <input type="password" name="password" autoComplete="current-password" placeholder="Enter your password" className="w-full bg-transparent text-base outline-none placeholder:text-[#ad89a6]" />
                <EyeIcon />
              </span>
            </label>

            <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#862eff] to-[#9d30f5] px-6 py-4 font-serif text-lg font-bold transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-black">
              Login <span aria-hidden="true" className="text-2xl leading-none">→</span>
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-white/45">
            <span className="h-px flex-1 bg-white/15" />
            <span>OR</span>
            <span className="h-px flex-1 bg-white/15" />
          </div>

          <button type="button" className="flex w-full items-center justify-center gap-3 rounded-full border border-white/25 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70">
            <GoogleIcon />
            Continue with Google
          </button>

          <p className="mt-5 text-center text-base text-[#ad89a6]">
            Don&apos;t have an account yet?{" "}
            <Link href="/authentification/inscription" className="font-serif font-bold text-[#9a37ff] hover:text-[#b36cff]">
              Sign up <span aria-hidden="true" className="text-xl">→</span>
            </Link>
          </p>
        </div>
      </section>

      <section className="relative hidden h-dvh overflow-hidden lg:block">
        <Image src="/image-login.jpg" alt="Auditrice tenant un vinyle" fill priority sizes="57vw" className="object-cover object-center" />
      </section>
    </main>
  );
}
