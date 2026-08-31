import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/contact/ContactForm";
import { contact, meta, portal } from "@/lib/site-content";
import { container, paragraph, sectionGrid, sectionHeading, sectionLabel } from "@/lib/ui";

// /contact：ページ自体は SSG、送信のみ Server Action（SSR）＝ §2・§5。
export const metadata: Metadata = pageMetadata({
  title: meta.contact.title,
  description: meta.contact.description,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="pt-13 pb-16 lg:pt-24 lg:pb-28">
      <div className={container}>
        <div className={sectionGrid}>
          <header className="mb-9 lg:mb-0">
            <p className={sectionLabel}>{contact.label}</p>
            <h1 className={`${sectionHeading} text-[25px] lg:text-[28px]`}>{contact.heading}</h1>
          </header>

          <div className="lg:max-w-[660px]">
            {/* 役割分担の明示（§5）：アプリの不具合・要望は「とりあえず47」の窓口へ流す。 */}
            <p className={`mb-10 text-pretty lg:mb-12 ${paragraph}`}>
              {contact.lead.before}
              <a
                href={portal.contactHref}
                className="border-b border-accent text-accent transition-opacity hover:opacity-70"
              >
                {contact.lead.linkLabel}
              </a>
              {contact.lead.after}
            </p>

            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
