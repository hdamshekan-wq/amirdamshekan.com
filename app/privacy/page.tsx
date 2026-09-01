import type { Metadata } from "next";
import UserSession from "@/components/UserSession";

export const metadata: Metadata = {
  title: "Privacy Policy | Amir Damshekan",
  description: "Privacy information for amirdamshekan.com and MarineStruc customer services.",
};

export default function PrivacyPage() {
  return (
    <main className="legal-page">
      <nav className="legal-nav">
        <a href="/">&larr; Home</a>
        <div className="legal-nav-right">
          <a href="/terms">Terms</a>
          <UserSession />
        </div>
      </nav>

      <article className="legal-card">
        <span className="eyebrow">PRIVACY</span>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: September 1, 2026</p>

        <p>
          This policy explains how information is handled when you use amirdamshekan.com,
          submit a project enquiry, create an account, purchase MarineStruc, or use protected
          customer services.
        </p>

        <h2>Information collected</h2>
        <p>
          Information may include your name, email address, company or organization, enquiry
          details, account information, purchase and license records, and technical records needed
          for account security and protected downloads. Payment-card information is handled by
          Stripe and is not stored directly by this website.
        </p>

        <h2>How information is used</h2>
        <p>
          Information is used to respond to enquiries, manage customer accounts, process software
          purchases, issue and maintain licenses, provide invoices and downloads, prevent abuse,
          and operate and improve the website and related services.
        </p>

        <h2>Service providers</h2>
        <p>
          The website may use service providers including Vercel for hosting, Supabase for account
          and application data, Stripe for payments, and an email-delivery provider when enabled.
          These providers process information only as needed to provide their respective services.
        </p>

        <h2>Cookies and visitor count</h2>
        <p>
          Authentication and security features may use cookies. A small first-party cookie is also
          used so the public visitor counter does not repeatedly count the same browser on every
          page load. The counter stores an aggregate number and is not intended to identify visitors.
        </p>

        <h2>Retention and access</h2>
        <p>
          Records are retained for as long as reasonably needed for enquiries, account operation,
          licensing, invoicing, security, legal obligations, and business records. You may contact
          info@amirdamshekan.com to request access, correction, or deletion where applicable.
        </p>

        <h2>Contact</h2>
        <p>
          Privacy questions may be sent to <a href="mailto:info@amirdamshekan.com">info@amirdamshekan.com</a>.
        </p>
      </article>
    </main>
  );
}
