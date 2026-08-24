import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getPrompts } from "@/lib/prompts-server";
import { PromptEditor } from "./prompt-editor";

export default async function PromptPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const prompts = await getPrompts(user.id);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-lg mb-1">Prompts</h1>
        <p className="text-sm text-[#8A8F98]">
          Ces textes sont assemblés à chaque fois que vous copiez un prompt, dans la fiche
          prospect comme dans le studio contenu. Ils vous appartiennent : chaque compte a les
          siens.
        </p>
      </div>
      <PromptEditor initial={prompts} />
    </div>
  );
}
