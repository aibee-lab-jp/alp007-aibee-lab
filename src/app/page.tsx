import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { Hero } from "@/components/home/Hero";
import { Services } from "@/components/home/Services";
import { Works } from "@/components/home/Works";
import { History } from "@/components/home/History";
import { About } from "@/components/home/About";
import { meta } from "@/lib/site-content";

// トップ（SSG）。セクション順は「訪問者の疑問に答える順」（何者か → 何をしているか →
// 信頼できるか → 実在するか）＝ §2・ブリーフ §4.1。
export const metadata: Metadata = pageMetadata({
  title: meta.home.title,
  description: meta.home.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <Hero />
      <Services />
      <Works />
      <History />
      <About />
    </>
  );
}
