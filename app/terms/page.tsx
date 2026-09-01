import type { Metadata } from "next";
import UserSession from "@/components/UserSession";

export const metadata: Metadata = {
  title: "Website Terms | Amir Damshekan",
  description: "Terms for use of amirdamshekan.com and its public engineering content.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav">
        <a href="/">&larr; Home</a>
        <div className="legal-nav-right">
          <a href="/privacy">Privacy</a>
          <UserSession />
        </div>
      </nav>

      <article className="legal-card">
        <span className="eyebrow">TERMS</span>
        <h1>Website Terms of Use</h1>
        <p className="legal-updated">Last updated: September 1, 2026</p>

        <h2>General information</h2>
        <p>
          Content on this website is provided for general professional, portfolio, educational and
          informational purposes. Viewing the website or sending an enquiry does not by itself
          create an engineer-client, consultant-client, contractual or other professional relationship.
        </p>

        <h2>Engineering information</h2>
        <p>
          Engineering examples, articles, drawings, software demonstrations and technical material
          must not be relied upon as project-specific engineering advice. Project requirements,
          codes, site conditions, loads, fabrication constraints and professional responsibilities
          must be independently reviewed for each application.
        </p>

        <h2>MarineStruc</h2>
        <p>
          MarineStruc software purchases, licensing, permitted use, updates and engineering-output
          responsibilities are governed by the applicable MarineStruc license policy presented during
          purchase. MarineStruc is an independent third-party product and is not affiliated with,
          sponsored by, endorsed by, or supported by Autodesk.
        </p>

        <h2>Intellectual property</h2>
        <p>
          Unless otherwise stated, website text, graphics, branding, software descriptions and
          original technical content may not be copied, republished or redistributed for commercial
          use without permission. Third-party trademarks remain the property of their respective owners.
        </p>

        <h2>Availability and changes</h2>
        <p>
          Website content, features, downloads and services may be corrected, updated, suspended or
          changed without notice. Reasonable efforts are made to keep information accurate, but no
          guarantee is made that every page or service will always be error-free or continuously available.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these terms may be sent to <a href="mailto:info@amirdamshekan.com">info@amirdamshekan.com</a>.
        </p>
      </article>
    </main>
  );
}
