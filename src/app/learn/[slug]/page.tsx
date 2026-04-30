import { notFound } from "next/navigation";
import { getSourceBySlug, getSourceFiles } from "@/lib/sources";
import LearnPageClient from "./LearnPageClient";

export function generateStaticParams() {
  return getSourceFiles().map((f) => ({ slug: f.slug }));
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const source = getSourceBySlug(slug);

  if (!source) {
    notFound();
  }

  return <LearnPageClient source={source} />;
}
