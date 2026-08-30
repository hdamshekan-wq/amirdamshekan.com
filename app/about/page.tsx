import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Amir Damshekan, a civil engineer working across structural, marine, construction, project management and surveying in Vancouver, BC.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Amir Damshekan | Civil Engineer",
    description:
      "Civil engineering with a practical field perspective across structural, marine and construction projects.",
    url: "/about",
  },
};

const expertise = [
  ["Structural Engineering", "Steel and concrete structures with an emphasis on practical design development, detailing coordination and constructability."],
  ["Marine & Waterfront", "Marine structures, floating systems, docks, access structures and waterfront construction support."],
  ["Construction & Supervision", "Field coordination, site supervision, constructability review, inspections and execution-focused engineering support."],
  ["Project Management", "Technical planning, coordination, procurement/fabrication interfaces, schedule awareness and project delivery."],
  ["Surveying", "Construction control, layout, verification and field measurement workflows supporting accurate execution."],
];

export default function AboutPage() {
  return <main className="about-page">
    <header className="about-page-nav"><Link href="/" className="about-back">← Home</Link><Link href="/#project-enquiry" className="btn primary compact">Project Enquiry →</Link></header>
    <section className="about-page-hero">
      <div><span className="eyebrow">ABOUT AMIR DAMSHEKAN</span><h1>Civil engineering with a practical field perspective.</h1><p>I work across structural, marine and construction projects, connecting design intent with fabrication, site conditions and execution.</p><div className="about-page-tags"><span>Structural</span><span>Marine</span><span>Construction</span><span>Project Management</span><span>Surveying</span></div></div>
      <div className="about-page-photo"><Image src="/amir-engineer.png" alt="Amir Damshekan, Civil Engineer" width={600} height={800} priority /></div>
    </section>
    <section className="about-detail-section"><span className="eyebrow">PROFESSIONAL PROFILE</span><h2>From engineering concepts to buildable outcomes.</h2><div className="about-detail-copy"><p>My approach is centered on clear engineering, practical coordination and details that can be understood, fabricated and built. I value the connection between office engineering and field reality.</p><p>Project work may involve design development, drawing and technical coordination, construction support, surveying, site verification and communication between owners, consultants, fabricators and field teams.</p></div></section>
    <section className="about-expertise"><div className="about-detail-heading"><span className="eyebrow">AREAS OF EXPERTISE</span><h2>Core engineering practice</h2></div><div className="about-expertise-grid">{expertise.map(([t,d],i)=><article key={t}><span>0{i+1}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>
    <section className="about-two-col"><div><span className="eyebrow">ENGINEERING APPROACH</span><h2>Design → Coordination → Construction</h2><p>Engineering decisions are strongest when design requirements, fabrication constraints, construction sequencing and site conditions are considered together.</p></div><div><span className="eyebrow">TECHNOLOGY & DEVELOPMENT</span><h2>Engineering tools that support the work.</h2><p>Alongside engineering practice, I develop workflow and drafting automation tools, including MarineStruc, to improve repeatability and technical output for marine-structure work.</p></div></section>
    <section className="about-credentials"><span className="eyebrow">PROFILE DETAILS</span><div className="credential-grid"><article><h3>Education & Certifications</h3><p>This section is reserved for verified education, professional registrations and certifications you choose to publish.</p></article><article><h3>Project Background</h3><p>Selected structural, marine, infrastructure and construction experience can be added here as individual public case studies are approved.</p></article><article><h3>Technical Tools</h3><p>Engineering drafting, surveying, field data, documentation and software-development tools are presented as supporting capabilities rather than the identity of the practice.</p></article></div></section>
    <section className="about-page-cta"><div><span className="eyebrow">WORK WITH ME</span><h2>Have a project or technical request?</h2><p>Send the project type, location, scope and required support.</p></div><Link className="btn primary" href="/#project-enquiry">Submit an Enquiry →</Link></section>
  </main>
}
