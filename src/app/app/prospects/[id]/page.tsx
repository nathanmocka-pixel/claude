import { notFound } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { MessageHist, Prospect } from "@/lib/domain";
import { ProspectView } from "./prospect-view";

export default async function ProspectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
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

  return (
    <ProspectView
      prospect={prospect as Prospect}
      historique={(historique ?? []) as MessageHist[]}
    />
  );
}
