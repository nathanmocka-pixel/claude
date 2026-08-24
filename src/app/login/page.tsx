import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center px-5 bg-cream">
      <div className="w-full max-w-sm bg-white border border-border rounded-2xl p-6 shadow-sm">
        <div className="mb-5">
          <div className="font-display font-extrabold text-lg tracking-tight text-navy">
            Nathan Mocka
          </div>
          <div className="text-xs text-[#8A8F98] font-medium">Prospection</div>
        </div>
        <LoginForm next={params.next} initialError={params.error} />
        <p className="mt-4 text-[11px] text-[#B4B7BD]">
          Accès sur invitation. Contactez l&apos;admin pour créer un compte.
        </p>
      </div>
    </div>
  );
}
