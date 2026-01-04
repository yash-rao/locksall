"use client";

import type React from "react";
import { useRef, useState } from "react";

type SectionKey = "features" | "useCases" | "faq";

type MouseVector = { x: number; y: number };

/** Abstract animated security background (grid + glowing orbs + nodes) */
function SecurityBackground({ mouse }: { mouse: MouseVector }) {
  // small parallax offsets based on mouse position
  const orb1Style = {
    transform: `translate3d(${mouse.x * 40}px, ${mouse.y * 30}px, 0)`,
  };
  const orb2Style = {
    transform: `translate3d(${mouse.x * -50}px, ${mouse.y * 25}px, 0)`,
  };
  const orb3Style = {
    transform: `translate3d(${mouse.x * 30}px, ${mouse.y * -40}px, 0)`,
  };

  const node1Style = {
    transform: `translate3d(${mouse.x * 25}px, ${mouse.y * -10}px, 0)`,
  };
  const node2Style = {
    transform: `translate3d(${mouse.x * -20}px, ${mouse.y * 15}px, 0)`,
  };
  const node3Style = {
    transform: `translate3d(${mouse.x * 18}px, ${mouse.y * 10}px, 0)`,
  };
  const node4Style = {
    transform: `translate3d(${mouse.x * -22}px, ${mouse.y * -18}px, 0)`,
  };

  return (
    <div className="la-bg">
      {/* subtle moving grid */}
      <div className="la-bg-grid" />

      {/* glowing security “zones” */}
      <div className="la-bg-orb orb-1" style={orb1Style} />
      <div className="la-bg-orb orb-2" style={orb2Style} />
      <div className="la-bg-orb orb-3" style={orb3Style} />

      {/* abstract nodes that hint at devices / cards / locks */}
      <div className="la-bg-node node-1" style={node1Style} />
      <div className="la-bg-node node-2" style={node2Style} />
      <div className="la-bg-node node-3" style={node3Style} />
      <div className="la-bg-node node-4" style={node4Style} />
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUseCase, setActiveUseCase] =
    useState<SectionKey>("features");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // mouse position (normalized -0.5 .. 0.5)
  const [mouse, setMouse] = useState<MouseVector>({ x: 0, y: 0 });

  const featuresRef = useRef<HTMLElement | null>(null);
  const useCasesRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const handleScrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / innerWidth; // ~ -0.5 .. 0.5
    const y = (e.clientY - innerHeight / 2) / innerHeight;
    setMouse({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Failed to subscribe");
      }

      setSubmitted(true);
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong, please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqItems = [
    {
      q: "What is LocksAll?",
      a: "LocksAll is a unified security platform concept that connects digital identity with physical and digital access — think of it as a smart layer between people, devices, and locks.",
    },
    {
      q: "Is this a live product?",
      a: "Right now, this is an early prototype and concept preview. The full feature set, integrations, and pricing are still under active design.",
    },
    {
      q: "Who is LocksAll for?",
      a: "Tech-savvy individuals, startups, and organizations who care about secure access, audit trails, and centralized control for their devices and environments.",
    },
    {
      q: "How can I get early access?",
      a: "Drop your email in the early-access form above. When a private beta or demo is ready, we’ll reach out.",
    },
  ];

  return (
    <main className="la-page" onMouseMove={handleMouseMove}>
      {/* interactive animated background */}
      <SecurityBackground mouse={mouse} />

      {/* all real content lives above the background */}
      <div className="la-content">
        {/* NAVBAR */}
        <header className="la-nav">
          <div className="la-logo">
            Locks<span>All</span>
          </div>
          <nav className="la-nav-links">
            <button onClick={() => handleScrollTo(featuresRef)}>
              Features
            </button>
            <button onClick={() => handleScrollTo(useCasesRef)}>
              Use cases
            </button>
            <button onClick={() => handleScrollTo(faqRef)}>FAQ</button>
          </nav>
        </header>

        {/* HERO */}
        <section className="la-hero">
          <div className="la-hero-inner">
            <h1>Secure access for a world of locks & identities.</h1>
            <p>
              LocksAll is your unified access layer — one place to manage who
              can open what, when, and from where. Designed for the next
              generation of smart homes, teams, and connected spaces.
            </p>

            {!submitted ? (
              <>
                <form className="la-cta-form" onSubmit={handleSubmit}>
                  <input
                    type="email"
                    required
                    placeholder="Your best email for early access"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Request Invite"}
                  </button>
                </form>
                {error && <p className="la-cta-error">{error}</p>}
              </>
            ) : (
              <p className="la-cta-thanks">
                🎉 Thanks! You’re on the early-access list.
              </p>
            )}

            <div className="la-hero-meta">
              <span>🔐 Identity-aware access</span>
              <span>🌐 Built for distributed teams</span>
              <span>⚡ Prototype preview</span>
            </div>
          </div>

          <div className="la-hero-card">
            <div className="la-hero-card-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="la-hero-card-body">
              <p className="la-hero-card-label">Live activity</p>
              <div className="la-hero-events">
                <div className="la-hero-event">
                  <span className="pill pill-green">Granted</span>
                  <div>
                    <strong>Yash</strong> entered <b>Workspace Door</b>
                    <div className="muted">
                      2 minutes ago · via Mobile App
                    </div>
                  </div>
                </div>
                <div className="la-hero-event">
                  <span className="pill pill-amber">Review</span>
                  <div>
                    <strong>API key</strong> requested access to{" "}
                    <b>Admin Console</b>
                    <div className="muted">Needs approval</div>
                  </div>
                </div>
                <div className="la-hero-event">
                  <span className="pill pill-red">Blocked</span>
                  <div>
                    <strong>Unknown device</strong> tried unlocking{" "}
                    <b>Garage</b>
                    <div className="muted">
                      Location mismatch · Logged
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section ref={featuresRef} className="la-section">
          <h2>Why LocksAll?</h2>
          <p className="la-section-subtitle">
            A single control plane for access, logs, and automation.
          </p>

          <div className="la-features-grid">
            <div className="la-feature-card">
              <h3>Centralized access graph</h3>
              <p>
                Model people, devices, doors, and data as nodes in a single
                graph. See who can access what in seconds, not hours.
              </p>
            </div>
            <div className="la-feature-card">
              <h3>Context-aware policies</h3>
              <p>
                Define rules based on role, device trust, time of day, or
                geolocation. Auto-lock, auto-expire, auto-audit.
              </p>
            </div>
            <div className="la-feature-card">
              <h3>Audit-ready history</h3>
              <p>
                Every access event is logged, signed, and ready for compliance
                reviews or incident investigations.
              </p>
            </div>
          </div>
        </section>

        {/* USE CASES (TABS) */}
        <section ref={useCasesRef} className="la-section">
          <h2>Made for real-world scenarios</h2>

          <div className="la-tabs">
            <button
              className={
                activeUseCase === "features" ? "la-tab active" : "la-tab"
              }
              onClick={() => setActiveUseCase("features")}
            >
              Startup office
            </button>
            <button
              className={
                activeUseCase === "useCases" ? "la-tab active" : "la-tab"
              }
              onClick={() => setActiveUseCase("useCases")}
            >
              Remote teams
            </button>
            <button
              className={
                activeUseCase === "faq" ? "la-tab active" : "la-tab"
              }
              onClick={() => setActiveUseCase("faq")}
            >
              Smart home
            </button>
          </div>

          <div className="la-tab-panel">
            {activeUseCase === "features" && (
              <>
                <h3>Startup office — zero-friction access</h3>
                <ul>
                  <li>Issue digital keys to new hires in seconds.</li>
                  <li>Instantly revoke access when someone leaves.</li>
                  <li>
                    Temporary guest passes for visitors & contractors.
                  </li>
                </ul>
              </>
            )}
            {activeUseCase === "useCases" && (
              <>
                <h3>Remote teams — security that travels</h3>
                <ul>
                  <li>Gate admin tools behind identity and device posture.</li>
                  <li>
                    Enforce location-based policies for sensitive actions.
                  </li>
                  <li>
                    Keep a unified audit trail across apps and devices.
                  </li>
                </ul>
              </>
            )}
            {activeUseCase === "faq" && (
              <>
                <h3>Smart home — unified control center</h3>
                <ul>
                  <li>One place to manage locks, cameras, and alerts.</li>
                  <li>
                    Family, guests, and cleaning crew with scoped access.
                  </li>
                  <li>Automation rules to lock, notify, and monitor.</li>
                </ul>
              </>
            )}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section ref={faqRef} className="la-section la-faq-section">
          <h2>Questions, meet answers.</h2>
          <div className="la-faq-list">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className={
                  openFaqIndex === index ? "la-faq-item open" : "la-faq-item"
                }
              >
                <button
                  className="la-faq-question"
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                  }
                >
                  <span>{item.q}</span>
                  <span>{openFaqIndex === index ? "−" : "+"}</span>
                </button>
                {openFaqIndex === index && (
                  <p className="la-faq-answer">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER / FINAL CTA */}
        <footer className="la-footer">
          <div>
            <div className="la-logo">
              Locks<span>All</span>
            </div>
            <p className="la-footer-text">
              Prototype preview of a unified access platform. Built with
              Next.js.
            </p>
          </div>
          <div className="la-footer-right">
            {!submitted ? (
              <>
                <p className="la-footer-text">
                  Be the first to know when we launch something real.
                </p>
                <button
                  className="la-footer-button"
                  onClick={() => handleScrollTo(featuresRef)}
                >
                  Explore the vision
                </button>
              </>
            ) : (
              <p className="la-footer-text">
                Thanks for being part of the earliest supporters.
              </p>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
