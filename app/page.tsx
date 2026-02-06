"use client";

import type React from "react";
import { useRef, useState } from "react";

import { siteConfig, type UseCaseKey } from "@/app/config";

type MouseVector = { x: number; y: number };

/** Abstract animated security background (grid + glowing orbs + nodes) */
function SecurityBackground({ mouse }: { mouse: MouseVector }) {
  // positions are static; movement comes from a wrapper parallax transform
  const layerStyle = {
    transform: `translate3d(${mouse.x * 35}px, ${mouse.y * 25}px, 0)`,
  };

  // Abstract node positions (percent-based)
  const nodes = [
    { top: "14%", left: "18%" },
    { top: "22%", left: "42%" },
    { top: "16%", left: "72%" },
    { top: "33%", left: "60%" },
    { top: "38%", left: "25%" },
    { top: "48%", left: "45%" },
    { top: "52%", left: "78%" },
    { top: "62%", left: "18%" },
    { top: "66%", left: "55%" },
    { top: "74%", left: "35%" },
    { top: "78%", left: "82%" },
    { top: "86%", left: "58%" },
  ];

  return (
    <div className="la-bg">
      <div className="la-bg-grid" />

      {/* Orbs are separate so they feel “deeper” */}
      <div className="la-bg-orb orb-1" />
      <div className="la-bg-orb orb-2" />
      <div className="la-bg-orb orb-3" />

      {/* Network layer: nodes + lines move slightly with cursor */}
      <div className="la-bg-network" style={layerStyle}>
        <div className="la-bg-lines line-a" />
        <div className="la-bg-lines line-b" />
        <div className="la-bg-lines line-c" />

        {nodes.map((n, i) => (
          <div
            key={i}
            className="la-bg-node2"
            style={{ top: n.top, left: n.left }}
          >
            <span className="la-bg-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}


export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUseCase, setActiveUseCase] =
    useState<UseCaseKey>("features");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // mouse position (normalized -0.5 .. 0.5)
  const [mouse, setMouse] = useState<MouseVector>({ x: 0, y: 0 });

  const featuresRef = useRef<HTMLElement | null>(null);
  const useCasesRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const {
    hero,
    earlyAccess,
    features,
    useCases,
    faq,
    footer,
    navigation,
    heroCard,
    sections,
  } = siteConfig;

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
    if (!email) {
      setError(earlyAccess.emptyEmailMessage);
      return;
    }

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

  return (
    <main className="la-page" onMouseMove={handleMouseMove}>
      {/* interactive animated background */}
      <SecurityBackground mouse={mouse} />

      {/* all real content lives above the background */}
      <div className="la-content">
        {/* NAVBAR */}
        <header className="la-nav">
          <div className="la-logo">
            {siteConfig.brand.primary}
            <span>{siteConfig.brand.accent}</span>
          </div>
          <nav className="la-nav-links">
            {navigation.map((item) => {
              const targetRef =
                item.section === "features"
                  ? featuresRef
                  : item.section === "useCases"
                    ? useCasesRef
                    : faqRef;

              return (
                <button
                  key={item.section}
                  onClick={() => handleScrollTo(targetRef)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* HERO */}
        <section className="la-hero">
          <div className="la-hero-inner">
            <h1>{hero.title}</h1>
            <p>{hero.subtitle}</p>

            {!submitted ? (
              <>
                <form className="la-cta-form" onSubmit={handleSubmit}>
                  <label className="sr-only" htmlFor="early-access-email">
                    Email address
                  </label>
                  <input
                    id="early-access-email"
                    type="email"
                    required
                    placeholder={earlyAccess.inputPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={Boolean(error)}
                    aria-describedby="early-access-helper"
                  />
                  <button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? earlyAccess.submittingLabel
                      : earlyAccess.submitLabel}
                  </button>
                </form>
                <p
                  id="early-access-helper"
                  className="la-cta-helper"
                >
                  {earlyAccess.helperText}
                </p>
                {error && (
                  <p className="la-cta-error" role="alert">
                    {error}
                  </p>
                )}
              </>
            ) : (
              <p className="la-cta-thanks">
                {earlyAccess.thankYouMessage}
              </p>
            )}

            <div className="la-hero-meta">
              {hero.meta.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="la-hero-card">
            <div className="la-hero-card-header">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <div className="la-hero-card-body">
              <p className="la-hero-card-label">{heroCard.label}</p>
              <div className="la-hero-events">
                {heroCard.events.map((event) => (
                  <div
                    key={`${event.status}-${event.title}-${event.emphasis}`}
                    className="la-hero-event"
                  >
                    <span className={`pill pill-${event.tone}`}>
                      {event.status}
                    </span>
                    <div>
                      <strong>{event.title}</strong> {event.action}{" "}
                      <b>{event.emphasis}</b>
                      <div className="muted">{event.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section ref={featuresRef} className="la-section">
          <h2>{sections.features.title}</h2>
          <p className="la-section-subtitle">{sections.features.subtitle}</p>

          <div className="la-features-grid">
            {features.map((feature) => (
              <div key={feature.title} className="la-feature-card">
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* USE CASES (TABS) */}
        <section ref={useCasesRef} className="la-section">
          <h2>{sections.useCases.title}</h2>

          <div className="la-tabs">
            {useCases.map((useCase) => (
              <button
                key={useCase.key}
                className={
                  activeUseCase === useCase.key
                    ? "la-tab active"
                    : "la-tab"
                }
                onClick={() => setActiveUseCase(useCase.key)}
              >
                {useCase.label}
              </button>
            ))}
          </div>

          <div className="la-tab-panel">
            {useCases
              .filter((useCase) => useCase.key === activeUseCase)
              .map((useCase) => (
                <div key={useCase.key}>
                  <h3>{useCase.title}</h3>
                  <ul>
                    {useCase.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        </section>

        {/* FAQ ACCORDION */}
        <section ref={faqRef} className="la-section la-faq-section">
          <h2>{sections.faq.title}</h2>
          <div className="la-faq-list">
            {faq.map((item, index) => (
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
                  <span>{item.question}</span>
                  <span>{openFaqIndex === index ? "−" : "+"}</span>
                </button>
                {openFaqIndex === index && (
                  <p className="la-faq-answer">{item.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER / FINAL CTA */}
        <footer className="la-footer">
          <div>
            <div className="la-logo">
              {siteConfig.brand.primary}
              <span>{siteConfig.brand.accent}</span>
            </div>
            <p className="la-footer-text">
              {footer.summary}
            </p>
          </div>
          <div className="la-footer-right">
            {!submitted ? (
              <>
                <p className="la-footer-text">{footer.ctaPrompt}</p>
                <button
                  className="la-footer-button"
                  onClick={() => handleScrollTo(featuresRef)}
                >
                  {footer.ctaButton}
                </button>
              </>
            ) : (
              <p className="la-footer-text">{footer.thankYou}</p>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}
