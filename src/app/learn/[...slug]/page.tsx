import { notFound } from "next/navigation";
import { getSourceBySlug, getSourceFiles } from "@/lib/sources";
import LearnPageClient from "./LearnPageClient";

export function generateStaticParams() {
  return getSourceFiles().map((f) => ({ slug: f.slug.split("/") }));
}

export default async function LearnPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const source = getSourceBySlug(fullSlug);

  if (!source) {
    notFound();
  }

  return <LearnPageClient source={source} />;
}
