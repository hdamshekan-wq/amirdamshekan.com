import type { Metadata } from "next";
import Image from "next/image";
import UserSession from "@/components/UserSession";

export const metadata: Metadata = {
  title: "About Amir Damshekan | Civil Engineer",
  description:
    "Civil engineer and structural designer with more than 15 years of experience across structural, marine, construction, project management and surveying work.",
};

const expertise = [
  {
    code: "01",
    title: "Structural Engineering",
    text: "Steel and reinforced-concrete design development, detailing coordination, constructability and technical documentation.",
  },
  {
    code: "02",
    title: "Marine Engineering",
    text: "Marine access structures, floating systems, waterfront works, rehabilitation and field-focused engineering coordination.",
  },
  {
    code: "03",
    title: "Construction",
    text: "Site execution, supervision, fabrication coordination, inspections and practical resolution of field conditions.",
  },
  {
    code: "04",
    title: "Project Management",
    text: "Technical planning, procurement support, multidisciplinary coordination, progress tracking and project delivery.",
  },
  {
    code: "05",
    title: "Surveying",
    text: "Construction layout, control, topographic measurement, field verification and as-built support using Total Station workflows.",
  },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <nav className="about-page-nav" aria-label="About navigation">
        <a href="/" className="about-brand" aria-label="Amir Damshekan home">
          <Image src="/ad-logo.png" alt="" width={46} height={46} />
          <div>
            <strong>Amir Damshekan</strong>
            <span>CIVIL ENGINEER</span>
          </div>
        </a>

        <div className="about-nav-actions">
          <a className="about-back" href="/">&larr; Home</a>
          <UserSession />
          <a className="btn primary compact" href="/#project-enquiry">Project Enquiry</a>
        </div>
      </nav>

      <section className="about-page-hero">
        <div>
          <span className="eyebrow">ABOUT AMIR DAMSHEKAN</span>
          <h1>Civil engineering with a practical field perspective.</h1>
          <p>
            I work across structural, marine and construction projects, connecting design intent
            with fabrication, site conditions and execution. My background combines structural
            design, project coordination, technical drafting, surveying and hands-on construction
            experience.
          </p>

          <div className="about-page-tags" aria-label="Areas of practice">
            <span>Structural</span>
            <span>Marine</span>
            <span>Construction</span>
            <span>Project Management</span>
            <span>Surveying</span>
          </div>

          <div className="about-hero-actions">
            <a
              className="btn primary"
              href="/Amir_Damshekan_Civil_Engineer_Resume.pdf"
              download
            >
              Download Resume <span>&darr;</span>
            </a>
            <a className="btn secondary" href="/#project-enquiry">
              Discuss a Project <span>&rarr;</span>
            </a>
          </div>
        </div>

        <div className="about-page-photo" aria-label="Portrait of Amir Damshekan">
          <Image
            src="/amir-engineer.png"
            alt="Amir Damshekan, Civil Engineer"
            width={760}
            height={980}
            priority
          />
        </div>
      </section>

      <section className="about-detail-section">
        <div className="about-detail-heading">
          <span className="eyebrow">PROFESSIONAL PROFILE</span>
          <h2>Design knowledge grounded in construction.</h2>
        </div>

        <div className="about-detail-copy">
          <p>
            Civil Engineer and Structural Designer with more than 15 years of experience in civil
            infrastructure, steel and reinforced-concrete structures, marine construction and
            multidisciplinary project delivery. My work includes engineering drawings, 3D models,
            shop drawings, construction documentation and coordination between engineers,
            contractors and fabrication teams.
          </p>
          <p>
            My practice also includes Civil 3D layouts and grading work, quantity take-offs, cost
            estimation, project scheduling, construction surveying and field verification. The
            objective is consistent: clear documentation, practical engineering decisions and
            solutions that can be fabricated, built and verified efficiently.
          </p>
        </div>
      </section>

      <section className="about-expertise">
        <div className="about-detail-heading">
          <span className="eyebrow">CORE EXPERTISE</span>
          <h2>Engineering across design, coordination and execution.</h2>
        </div>

        <div className="about-expertise-grid">
          {expertise.map((item) => (
            <article key={item.title}>
              <span>{item.code}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-two-col">
        <div>
          <span className="eyebrow">EXPERIENCE</span>
          <h2>Professional practice</h2>
          <p>
            Since 2024, I have worked with Blue Water Systems Ltd. in Greater Vancouver as a
            Structural Designer / Project Manager, supporting marine infrastructure and
            construction projects through drawings, modeling, project documentation, quantity
            take-offs and technical coordination.
          </p>
          <p>
            From 2012 to 2024, I worked as a Project Manager / Structural Designer with Artiman
            Consulting Engineers in Tehran, designing and coordinating structural systems for
            residential, commercial and industrial buildings and supervising construction
            activities against engineering drawings and specifications.
          </p>
        </div>

        <div>
          <span className="eyebrow">TOOLS & WORKFLOWS</span>
          <h2>Technical capabilities</h2>
          <p>
            Design and drafting workflows include AutoCAD, Civil 3D and Tekla Structures.
            Structural analysis experience includes ETABS, SAFE and SAP2000, with project planning
            and tracking through Microsoft Project, Primavera P6 and Excel.
          </p>
          <p>
            Surveying experience includes Total Station control, construction layout, topographic
            measurement, site verification and UTM-based drawing preparation. I also develop
            engineering software and automation tools focused on repeatable technical workflows.
          </p>
        </div>
      </section>

      <section className="about-credentials">
        <div className="about-detail-heading">
          <span className="eyebrow">EDUCATION & PROFESSIONAL BACKGROUND</span>
          <h2>Qualifications</h2>
        </div>

        <div className="credential-grid credential-grid-four">
          <article>
            <span className="credential-label">EDUCATION</span>
            <h3>Bachelor of Civil Engineering</h3>
            <p>Academic foundation in civil and structural engineering.</p>
          </article>

          <article>
            <span className="credential-label">ENGINEERING REGISTRATION</span>
            <h3>Tehran Engineering Organization</h3>
            <p>
              Licensed member with Grade 1 certification in structural design, supervision and
              execution of construction projects.
            </p>
          </article>

          <article className="credential-coming-soon">
            <span className="credential-label">CANADA</span>
            <h3>Professional Engineer (P.Eng.)</h3>
            <p><strong>Coming Soon</strong></p>
          </article>

          <article>
            <span className="credential-label">LOCATION</span>
            <h3>Greater Vancouver, BC</h3>
            <p>Engineering and project work based in British Columbia, Canada.</p>
          </article>
        </div>

        <div className="about-resume-row">
          <div>
            <strong>Detailed experience, software skills and project capabilities</strong>
            <span>Available in the Civil Engineering resume.</span>
          </div>
          <a
            className="btn primary"
            href="/Amir_Damshekan_Civil_Engineer_Resume.pdf"
            download
          >
            Download Resume <span>&darr;</span>
          </a>
        </div>
      </section>

      <section className="about-page-cta">
        <div>
          <span className="eyebrow">PROJECT ENQUIRIES</span>
          <h2>Have an engineering or construction challenge?</h2>
          <p>Share the project scope, location and technical support you need.</p>
        </div>
        <a className="btn contact-btn" href="/#project-enquiry">
          Start an Enquiry <span>&rarr;</span>
        </a>
      </section>
    </main>
  );
}
