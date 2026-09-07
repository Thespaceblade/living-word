import Link from "next/link";
import { notFound } from "next/navigation";
import { PlanDetail } from "@/components/PlanDetail";
import { getCatalog } from "@/lib/content";
import { getPlan, READING_PLANS } from "@/lib/plans-data";

type Props = {
  params: Promise<{ planId: string }>;
};

export function generateStaticParams() {
  return READING_PLANS.map((plan) => ({ planId: plan.id }));
}

export default async function PlanPage({ params }: Props) {
  const { planId } = await params;
  const plan = getPlan(planId);
  if (!plan) notFound();
  const version = getCatalog().versions[0]?.id ?? "kjv";

  return (
    <main className="plan-page">
      <PlanDetail plan={plan} version={version} />
      <p className="plan-page__back">
        <Link href="/">← Back home</Link>
      </p>
    </main>
  );
}
