import Image from "next/image";

const services = [
  {
    icon: "structure",
    title: "Structural Engineering",
    subtitle: "Steel & Concrete Structures",
    text: "Structural concepts, design development, member and connection coordination, constructability review and detailing support for practical building solutions.",
    bullets: ["Steel structures", "Concrete structures", "Design & detailing coordination"],
    href: "#structural",
  },
  {
    icon: "marine",
    title: "Marine Engineering",
    subtitle: "Marine & Waterfront Structures",
    text: "Engineering support for docks, walkways, floating systems, waterfront structures and marine construction where design decisions must work in real field conditions.",
    bullets: ["Marine structures", "Waterfront works", "Floating systems"],
    href: "#marine",
  },
  {
    icon: "construction",
    title: "Construction",
    subtitle: "Site Supervision & Execution",
    text: "Field-driven engineering support focused on constructability, coordination, inspections, site decisions and translating drawings into safe, buildable work.",
    bullets: ["Site supervision", "Constructability", "Technical coordination"],
    href: "#construction",
  },
  {
    icon: "management",
    title: "Project Management",
    subtitle: "Planning, Coordination & Delivery",
    text: "Technical project coordination from scope definition through procurement, fabrication, construction and closeout with attention to schedule, quality and communication.",
    bullets: ["Planning & coordination", "Technical delivery", "Quality & closeout"],
    href: "#management",
  },
  {
    icon: "survey",
    title: "Surveying",
    subtitle: "Construction & Engineering Surveying",
    text: "Construction layout, control, verification and field measurement workflows that connect design information with accurate site execution.",
    bullets: ["Control & layout", "Field verification", "As-built support"],
    href: "#surveying",
  },
];

const projects = [
  {
    type: "marine",
    category: "MARINE / WATERFRONT",
    title: "Marine & Waterfront Structures",
    text: "Selected engineering and construction work for waterfront environments, floating systems, docks and marine access structures.",
  },
  {
    type: "steel",
    category: "STRUCTURAL / INDUSTRIAL",
    title: "Steel Structures",
    text: "Structural work developed with fabrication, erection and field constructability in mind.",
  },
  {
    type: "concrete",
    category: "CONCRETE / CONSTRUCTION",
    title: "Concrete Structures",
    text: "Concrete structural solutions coordinated from design intent through site execution and verification.",
  },
];

const academy = [
  {
    icon: "△",
    title: "Structural Design",
    text: "Design concepts, practical detailing, steel and concrete topics explained with a field perspective.",
  },
  {
    icon: "⌖",
    title: "Construction & Surveying",
    text: "Field methods, layout, control, constructability and lessons from real construction workflows.",
  },
  {
    icon: "≡",
    title: "Technical Articles",
    text: "Engineering notes, references, checklists and practical guidance organized for quick use.",
  },
];

function ServiceIcon({ name }: { name: string }) {
  if (name === "structure") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 39h32M12 39V14h24v25M12 21h24M18 14V9h12v5M18 21v18M30 21v18M18 29h12" />
      </svg>
    );
  }
  if (name === "marine") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M6 20c4 0 4 4 8 4s4-4 8-4 4 4 8 4 4-4 8-4 4 4 4 4M6 29c4 0 4 4 8 4s4-4 8-4 4 4 8 4 4-4 8-4 4 4 4 4M12 15h24M16 15V9M24 15V7M32 15v-4" />
      </svg>
    );
  }
  if (name === "construction") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M8 38h32M13 38V24h22v14M18 24v-8h12v8M24 16V8M17 10h14M10 30h28" />
        <path d="m34 11 6 4-6 4" />
      </svg>
    );
  }
  if (name === "management") {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="16" cy="16" r="5" />
        <circle cx="32" cy="16" r="5" />
        <circle cx="24" cy="31" r="5" />
        <path d="M20 17h8M18 20l4 7M30 20l-4 7M8 39c1-6 5-9 10-9M40 39c-1-6-5-9-10-9M16 39c1-6 4-9 8-9s7 3 8 9" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="10" />
      <path d="M24 5v8M24 35v8M5 24h8M35 24h8M10.5 10.5l5.7 5.7M31.8 31.8l5.7 5.7M37.5 10.5l-5.7 5.7M16.2 31.8l-5.7 5.7" />
      <circle cx="24" cy="24" r="2" />
    </svg>
  );
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`wordmark ${compact ? "compact" : ""}`}>
      <Image src="/ad-logo.png" alt="Amir Damshekan" width={180} height={180} priority={!compact} />
      <div>
        <strong>Amir Damshekan</strong>
        <span>CIVIL ENGINEER</span>
      </div>
    </div>
  );
}

function HelmetBadge() {
  return null;
}

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <a href="#home" className="brand-link" aria-label="Amir Damshekan home">
          <Wordmark />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <a className="active" href="#home">Home</a>
          <details>
            <summary>Engineering <span>⌄</span></summary>
            <div className="nav-menu">
              <a href="#structural">Structural Engineering</a>
              <a href="#marine">Marine Engineering</a>
              <a href="#construction">Construction & Supervision</a>
              <a href="#management">Project Management</a>
              <a href="#surveying">Surveying</a>
            </div>
          </details>
          <details>
            <summary>Projects <span>⌄</span></summary>
            <div className="nav-menu small">
              <a href="#projects">Featured Projects</a>
              <a href="#projects">Structural</a>
              <a href="#projects">Marine</a>
              <a href="#projects">Construction</a>
            </div>
          </details>
          <details>
            <summary>Academy <span>⌄</span></summary>
            <div className="nav-menu small">
              <a href="#academy">Structural Design</a>
              <a href="#academy">Construction & Surveying</a>
              <a href="#academy">Technical Articles</a>
            </div>
          </details>
          <details>
            <summary>Software <span>⌄</span></summary>
            <div className="nav-menu small">
              <a href="#software">MarineStruc</a>
              <a href="#software">Documentation</a>
              <a href="#software">Licensing & Releases</a>
            </div>
          </details>
          <a href="/about">About</a>
        </nav>

        <a className="contact-pill" href="#contact">Contact <span>→</span></a>

        <details className="mobile-menu">
          <summary aria-label="Open navigation">☰</summary>
          <div className="mobile-menu-panel">
            <a href="#home">Home</a>
            <a href="#engineering">Engineering</a>
            <a href="#projects">Projects</a>
            <a href="#academy">Academy</a>
            <a href="#software">Software</a>
            <a href="/about">About</a>
            <a href="#contact">Contact</a>
          </div>
        </details>
      </header>

      <section className="hero" id="home">
        <div className="hero-left">
          <div className="hero-kicker"><span>CIVIL ENGINEER</span><i /> <span>VANCOUVER, BC</span></div>
          <h1>Engineering from <em>design to delivery.</em></h1>
          <p>
            Civil engineering across structural, marine, construction, project management and surveying — with a strong focus on practical execution.
          </p>
          <div className="hero-actions">
            <a href="#engineering" className="btn primary">Explore Engineering <span>→</span></a>
            <a href="#projects" className="btn secondary">View Projects <span>→</span></a>
          </div>
          <div className="hero-tags" aria-label="Core expertise">
            <span><b>▦</b> Structural</span>
            <span><b>≈</b> Marine</span>
            <span><b>⌂</b> Construction</span>
            <span><b>◫</b> Management</span>
            <span><b>⌖</b> Surveying</span>
          </div>
        </div>

        <div className="hero-scene hero-scene-simple" aria-label="Civil engineering portrait">
          <div className="portrait-halo-simple" aria-hidden="true" />
          <div className="portrait-wrap portrait-wrap-simple">
            <Image
              src="/amir-engineer.png"
              alt="Civil engineer wearing construction safety gear"
              width={760}
              height={980}
              className="hero-person"
              priority
            />
          </div>
          <div className="hero-quote">
            <span className="quote-mark">“</span>
            <div>
              <strong>Safe. Practical. Built to Last.</strong>
              <small>Engineering with a field perspective.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="section services-section" id="engineering">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">ENGINEERING SERVICES</span>
            <h2>What I Do</h2>
          </div>
          <p>Delivering reliable engineering solutions for land and marine environments, from concept to construction.</p>
          <a className="section-link" href="#contact">Discuss a Project <span>→</span></a>
        </div>

        <div className="service-cards">
          {services.map((service, index) => (
            <article className="service-card" id={service.href.slice(1)} key={service.title}>
              <div className={`service-art service-art-${index + 1}`}>
                <span className="art-grid" />
                <span className="art-line line-a" />
                <span className="art-line line-b" />
                <span className="art-line line-c" />
              </div>
              <div className="service-icon"><ServiceIcon name={service.icon} /></div>
              <div className="service-body">
                <h3>{service.title}</h3>
                <strong>{service.subtitle}</strong>
                <p>{service.text}</p>
                <ul>
                  {service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <a href="#contact">Learn More <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section projects-section" id="projects">
        <div className="section-title-row compact-row">
          <div>
            <span className="eyebrow">RECENT WORK</span>
            <h2>Featured Projects</h2>
          </div>
          <p>A portfolio framework for structural, marine and construction work. Individual case studies can be added as projects are selected for publication.</p>
          <a className="section-link" href="#contact">Project Enquiries <span>→</span></a>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article className={`project-card project-${project.type}`} key={project.title}>
              <div className="project-visual" aria-hidden="true">
                <span className="project-gridlines" />
                <span className="project-silhouette" />
                <span className="project-silhouette second" />
              </div>
              <div className="project-content">
                <small>{project.category}</small>
                <h3>{project.title}</h3>
                <p>{project.text}</p>
                <a href="#contact" aria-label={`View ${project.title}`}>→</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="software-section" id="software">
        <div className="section-title-row software-title-row">
          <div>
            <span className="eyebrow">DEVELOPMENT & TOOLS</span>
            <h2>Engineering Software</h2>
          </div>
          <p>Professional tools developed around real engineering workflows, documentation and repeatable technical output.</p>
          <a className="section-link light-link" href="#contact">Product Enquiries <span>→</span></a>
        </div>

        <div className="software-feature">
          <div className="software-device" aria-hidden="true">
            <div className="device-screen">
              <div className="device-topbar"><i /><i /><i /></div>
              <div className="model-wireframe">
                <span /><span /><span /><span /><span />
              </div>
              <b>MarineStruc</b>
            </div>
          </div>
          <div className="software-info">
            <div className="marine-mark"><span>≈</span></div>
            <div>
              <span className="product-label">FEATURED PRODUCT</span>
              <h3>MarineStruc</h3>
              <strong>Marine Engineering Design & Drafting Automation</strong>
              <p>Specialized engineering software for marine structures, floating systems, walkways and related design workflows.</p>
              <div className="software-points">
                <span>Workflow automation</span>
                <span>Engineering drawing support</span>
                <span>Project-focused tools</span>
              </div>
              <div className="software-actions">
                <a className="btn primary compact" href="#contact">Learn More</a>
                <a className="btn secondary compact" href="#contact">Licensing & Releases</a>
              </div>
            </div>
          </div>
          <div className="wireframe-bg" aria-hidden="true" />
        </div>
      </section>

      <section className="section academy-section" id="academy">
        <div className="section-title-row compact-row">
          <div>
            <span className="eyebrow">LEARN & SHARE</span>
            <h2>Engineering Academy</h2>
          </div>
          <p>Practical knowledge, tutorials and technical resources organized around engineering work rather than software alone.</p>
          <a className="section-link" href="#contact">Explore Academy <span>→</span></a>
        </div>

        <div className="academy-grid">
          {academy.map((item, index) => (
            <article className="academy-card" key={item.title}>
              <div className={`academy-art academy-art-${index + 1}`}><span>{item.icon}</span></div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <a href="#contact">Explore <span>→</span></a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-heading">
          <span className="eyebrow">MEET THE ENGINEER</span>
          <h2>About Amir</h2>
        </div>
        <div className="about-copy">
          <p>
            Civil engineering practice centered on structural, marine and construction work — connecting design intent, field conditions and practical execution.
          </p>
          <p>
            The objective is clear engineering, efficient coordination and solutions that can be understood, fabricated and built.
          </p>
          <div className="about-tags">
            <span>Structural</span><span>Marine</span><span>Construction</span><span>Management</span><span>Surveying</span>
          </div>
          <div className="about-actions"><a className="btn primary compact" href="/about">Read More <span>→</span></a><a className="about-enquiry-link" href="#project-enquiry">Submit an Enquiry</a></div>
        </div>
        <div className="about-profile">
          <div className="about-portrait-wrap">
            <Image src="/amir-engineer.png" alt="Amir Damshekan" width={260} height={330} className="about-person" />
            <HelmetBadge />
          </div>
          <div className="signature">Amir Damshekan</div>
          <strong>Civil Engineer</strong>
          <span>⌖ Greater Vancouver, BC</span>
        </div>
      </section>

      <section className="enquiry-section" id="project-enquiry">
        <div className="enquiry-intro">
          <span className="eyebrow">PROJECT & GENERAL ENQUIRIES</span>
          <h2>Tell me what you’re working on.</h2>
          <p>Choose the type of enquiry and provide a few project details. This form is ready for the final mail-delivery connection when the domain mailboxes are activated.</p>
          <div className="contact-channels">
            <a href="mailto:info@amirdamshekan.com"><strong>General & Projects</strong><span>info@amirdamshekan.com</span></a>
            <a href="mailto:license@amirdamshekan.com"><strong>Software Licensing</strong><span>license@amirdamshekan.com</span></a>
          </div>
        </div>
        <form className="enquiry-form" action="mailto:info@amirdamshekan.com" method="post" encType="text/plain">
          <label><span>Name</span><input name="Name" type="text" placeholder="Your name" required /></label>
          <label><span>Email</span><input name="Email" type="email" placeholder="you@company.com" required /></label>
          <label><span>Company / Organization</span><input name="Company" type="text" placeholder="Optional" /></label>
          <label><span>Enquiry Type</span><select name="Enquiry Type" defaultValue="Engineering Project"><option>Engineering Project</option><option>Consultation</option><option>MarineStruc & Software</option><option>Licensing</option><option>Training / Academy</option><option>Other</option></select></label>
          <label className="full"><span>Project / Request Details</span><textarea name="Details" rows={5} placeholder="Briefly describe the project, location, scope, schedule or the support you need." required /></label>
          <label className="full"><span>Preferred Contact</span><select name="Preferred Contact" defaultValue="Email"><option>Email</option><option>Phone</option><option>Video Meeting</option></select></label>
          <button className="btn primary enquiry-submit" type="submit">Prepare Enquiry <span>→</span></button>
        </form>
      </section>

      <section className="contact-banner" id="contact">
        <div className="contact-icon">◌</div>
        <div>
          <h2>Have a project or engineering challenge?</h2>
          <p>Engineering enquiries: info@amirdamshekan.com · Software licensing: license@amirdamshekan.com</p>
        </div>
        <a className="btn contact-btn" href="#project-enquiry">Start an Enquiry <span>→</span></a>
      </section>

      <footer className="site-footer">
        <div className="footer-brand-col">
          <Wordmark compact />
          <p>Civil engineering from design through field execution.</p>
        </div>
        <div className="footer-links">
          <h3>Quick Links</h3>
          <div>
            <a href="#home">Home</a>
            <a href="#engineering">Engineering</a>
            <a href="#projects">Projects</a>
            <a href="#academy">Academy</a>
            <a href="#software">Software</a>
            <a href="/about">About</a>
          </div>
        </div>
        <div className="footer-location">
          <h3>Location</h3>
          <p>⌖ Greater Vancouver, BC<br />Canada</p>
        </div>
        <div className="footer-connect">
          <h3>Connect</h3>
          <a href="mailto:info@amirdamshekan.com">info@amirdamshekan.com</a>
          <a href="#contact">Project Enquiry</a>
          <a href="#software">Software</a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Amir Damshekan. All rights reserved.</span>
          <b>ENGINEERING &nbsp; • &nbsp; INTEGRITY &nbsp; • &nbsp; RESULTS</b>
        </div>
      </footer>
    </main>
  );
}
