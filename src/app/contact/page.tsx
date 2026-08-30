import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/contact/ContactForm";
import { contact, meta, portal } from "@/lib/site-content";
import { container, paragraph, sectionHeading, sectionLabel } from "@/lib/ui";

// /contact：ページ自体は SSG、送信のみ Server Action（SSR）＝ §2・§5。
export const metadata: Metadata = pageMetadata({
  title: meta.contact.title,
  description: meta.contact.description,
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="py-16 sm:py-20">
      <div className={container}>
        <header className="mb-10 sm:mb-12">
          <p className={sectionLabel}>{contact.label}</p>
          <h1 className={sectionHeading}>{contact.heading}</h1>
          {/* 役割分担の明示（§5）：アプリの不具合・要望は「とりあえず47」の窓口へ流す。 */}
          <p className={`mt-6 max-w-[46ch] ${paragraph}`}>
            {contact.lead.before}
            <a
              href={portal.contactHref}
              className="text-accent-600 underline decoration-accent-100 decoration-1 underline-offset-4 transition-colors hover:text-accent-700 hover:decoration-accent-600"
            >
              {contact.lead.linkLabel}
            </a>
            {contact.lead.after}
          </p>
        </header>

        <div className="max-w-[36rem]">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
