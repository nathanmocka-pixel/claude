import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getPrompts } from "@/lib/prompts-server";
import { ContenuStudio } from "./contenu-studio";

export default async function ContenuPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prompts = await getPrompts(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-lg mb-1">Studio contenu</h1>
        <p className="text-sm text-[#8A8F98]">
          Prépare le prompt d&apos;un post, d&apos;un commentaire d&apos;engagement ou d&apos;un
          carrousel. Copiez, collez dans Claude.ai, validez avant de publier.
        </p>
      </div>
      <ContenuStudio prompts={prompts} />
    </div>
  );
}
