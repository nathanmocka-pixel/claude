import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewProspectForm } from "./new-form";

export default function NewProspectPage() {
  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/app"
        className="inline-flex items-center gap-1 text-sm text-[#8A8F98] hover:text-navy mb-3"
      >
        <ChevronLeft size={16} /> Retour
      </Link>
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="font-display font-bold mb-4">Nouveau prospect</div>
        <NewProspectForm />
      </div>
    </div>
  );
}
