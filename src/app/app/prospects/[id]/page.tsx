import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getPrompts } from "@/lib/prompts-server";
import type { Membre, MessageHist, Prospect } from "@/lib/domain";
import { ProspectView } from "./prospect-view";

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: prospect } = await supabase
    .from("prospects")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!prospect) notFound();

  const { data: historique } = await supabase
    .from("messages_historique")
    .select("*")
    .eq("prospect_id", id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  const prompts = await getPrompts(user.id);

  const { data: membresRows } = await supabase.from("profiles").select("id, email, avatar_url");
  const membres = (membresRows ?? []) as Membre[];

  return (
    <ProspectView
      prospect={prospect as Prospect}
      historique={(historique ?? []) as MessageHist[]}
      prompts={prompts}
      membres={membres}
      currentUserId={user.id}
    />
  );
}
