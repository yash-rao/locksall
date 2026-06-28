"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PrototypePanel from "@/components/PrototypePanel";

type MouseVector = { x: number; y: number };
type UseCaseKey = "lostWallet" | "family" | "business";

const trustStats = [
  { value: "60 sec", label: "target emergency response" },
  { value: "0", label: "full card numbers shown" },
  { value: "24/7", label: "incident-ready workflow" },
];

const features = [
  {
    title: "Emergency card freeze",
    body: "Give users one authenticated place to pause every registered card when a wallet, phone, or account looks compromised.",
    stat: "Rapid lock",
  },
  {
    title: "Issuer-aware routing",
    body: "Prepare each request for the right bank, card network, or issuer connector while showing the result for every card.",
    stat: "Multi-issuer",
  },
  {
    title: "Audit-grade timeline",
    body: "Capture who acted, what changed, provider responses, and timestamps so support, disputes, and reviews have context.",
    stat: "Traceable",
  },
  {
    title: "Controlled recovery",
    body: "Restore access only after the user confirms the risk is resolved, with a clean path for admin approval in business accounts.",
    stat: "Reversible",
  },
  {
    title: "Privacy-first card vault",
    body: "Use masked card references and account-level permissions so sensitive payment details stay out of the interface.",
    stat: "Masked data",
  },
  {
    title: "Operational risk view",
    body: "Show finance teams which cards are active, blocked, pending, or need manual follow-up without digging through issuer portals.",
    stat: "Live status",
  },
];

const businessPoints = [
  {
    title: "For consumers",
    body: "A calmer way to react when cards are lost, stolen, or exposed during travel, phishing, or device theft.",
  },
  {
    title: "For families",
    body: "Shared emergency visibility for parents, students, and caregivers without revealing full payment credentials.",
  },
  {
    title: "For teams",
    body: "A lightweight control layer for employee card incidents, offboarding, misuse concerns, and finance operations reviews.",
  },
];

const workflowSteps = [
  "Verify the user session before any financial control is shown.",
  "Display masked cards and current issuer status in one place.",
  "Send block or unblock requests through provider-specific paths.",
  "Record the event trail for later support, dispute, or compliance needs.",
];

const useCases: Record<UseCaseKey, { label: string; title: string; points: string[] }> = {
  lostWallet: {
    label: "Lost wallet",
    title: "Stop exposure before calling every issuer",
    points: [
      "Freeze all registered cards in one authenticated action.",
      "See which providers accepted the request and which need a retry.",
      "Keep a timeline for support calls, disputes, and follow-up checks.",
    ],
  },
  family: {
    label: "Family safety",
    title: "Give households a shared emergency control",
    points: [
      "Help a parent, student, or traveler respond quickly when cards go missing.",
      "Centralize card status without exposing full card numbers.",
      "Create a clear recovery path once accounts are safe.",
    ],
  },
  business: {
    label: "Business cards",
    title: "Reduce operational risk for small teams",
    points: [
      "Pause employee cards after device loss, termination, or suspected misuse.",
      "Show a simple status board for finance or operations leads.",
      "Capture audit evidence for internal reviews.",
    ],
  },
};

const faqItems = [
  {
    q: "What is LocksAll?",
    a: "LocksAll is a financial safety prototype for blocking and unblocking linked payment cards from one authenticated control panel.",
  },
  {
    q: "Is this connected to real banks yet?",
    a: "No. The current dashboard uses mocked provider calls so the flow, audit trail, and error handling can be tested safely before live issuer integrations.",
  },
  {
    q: "What makes this finance/security focused?",
    a: "The product is designed around authentication, masked card data, provider status, incident timelines, and controlled recovery instead of a basic card list.",
  },
  {
    q: "Who is the first version for?",
    a: "The first version is aimed at individuals, families, and small teams that need a faster response when cards may be compromised.",
  },
  {
    q: "What happens after I request access?",
    a: "Your email is stored for early-access follow-up. If email is configured, you will receive an acknowledgement message.",
  },
];

function SecurityBackground({ mouse }: { mouse: MouseVector }) {
  const layerStyle = {
    transform: `translate3d(${mouse.x * 22}px, ${mouse.y * 16}px, 0)`,
  };

  return (
    <div className="la-bg" aria-hidden="true">
      <div className="la-bg-grid" />
      <div className="la-bg-ledger" />
      <div className="la-bg-signal" style={layerStyle}>
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} className={`la-bg-cell cell-${index + 1}`} />
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [earlyAccessMessage, setEarlyAccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUseCase, setActiveUseCase] = useState<UseCaseKey>("lostWallet");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [mouse, setMouse] = useState<MouseVector>({ x: 0, y: 0 });

  const featuresRef = useRef<HTMLElement | null>(null);
  const useCasesRef = useRef<HTMLElement | null>(null);
  const faqRef = useRef<HTMLElement | null>(null);

  const handleScrollTo = (ref: React.RefObject<HTMLElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === "undefined") return;
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX - innerWidth / 2) / innerWidth;
    const y = (e.clientY - innerHeight / 2) / innerHeight;
    setMouse({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      setError(null);
      setEarlyAccessMessage("");

      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to subscribe");
      }

      setSubmitted(true);
      setEarlyAccessMessage(data?.message || "Thanks. You are on the early-access list.");
      setEmail("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPrototype = () => {
    if (status === "authenticated") {
      document.getElementById("prototype")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push("/login?callbackUrl=/#prototype");
    }
  };

  const activeCase = useCases[activeUseCase];

  return (
    <main className="la-page" onMouseMove={handleMouseMove}>
      <SecurityBackground mouse={mouse} />

      <div className="la-content">
        <header className="la-nav">
          <button className="la-logo" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Locks<span>All</span>
          </button>
          <nav className="la-nav-links" aria-label="Primary navigation">
            <button onClick={() => handleScrollTo(featuresRef)}>Platform</button>
            <button onClick={() => handleScrollTo(useCasesRef)}>Use cases</button>
            <button onClick={() => handleScrollTo(faqRef)}>FAQ</button>
            <button className="la-nav-cta" onClick={goToPrototype}>Prototype</button>
          </nav>
        </header>

        <section className="la-hero">
          <div className="la-hero-inner">
            <p className="la-kicker">Financial security command center</p>
            <h1>Lock payment risk before it spreads.</h1>
            <p className="la-hero-copy">
              LocksAll gives people and finance teams one authenticated control point to freeze linked cards,
              monitor issuer responses, and recover with a complete incident record.
            </p>

            <div className="la-hero-actions">
              <button className="la-primary-button" onClick={goToPrototype}>View Prototype</button>
              <button className="la-secondary-button" onClick={() => handleScrollTo(featuresRef)}>
                Explore platform
              </button>
            </div>

            <div className="la-hero-meta" aria-label="Prototype highlights">
              <span>Masked card data</span>
              <span>Authenticated controls</span>
              <span>Audit-ready timeline</span>
            </div>

            <div className="la-trust-strip" aria-label="LocksAll trust metrics">
              {trustStats.map((item) => (
                <div key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            {!submitted ? (
              <form className="la-cta-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Work or personal email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Request invite"}
                </button>
              </form>
            ) : (
              <p className="la-cta-thanks">{earlyAccessMessage}</p>
            )}
            {error && <p className="la-cta-error">{error}</p>}
          </div>

          <aside className="la-hero-card" aria-label="LocksAll dashboard preview">
            <div className="la-hero-card-header">
              <span>Incident console</span>
              <strong>Risk level: Elevated</strong>
            </div>
            <div className="la-risk-banner">
              <span>Compromised wallet reported</span>
              <strong>Action recommended</strong>
            </div>
            <div className="la-lock-panel">
              <div className="la-lock-dial">
                <span>3</span>
                <small>linked cards</small>
              </div>
              <div className="la-lock-actions">
                <button>Block all cards</button>
                <button>Start recovery review</button>
              </div>
            </div>
            <div className="la-hero-events">
              <div className="la-hero-event">
                <span className="pill pill-green">MASKED</span>
                <div>
                  <strong>Visa ending 1042</strong>
                  <p>Only safe identifiers visible to the user</p>
                </div>
              </div>
              <div className="la-hero-event">
                <span className="pill pill-amber">PENDING</span>
                <div>
                  <strong>Issuer confirmation</strong>
                  <p>Connector response and latency tracked</p>
                </div>
              </div>
              <div className="la-hero-event">
                <span className="pill pill-red">AUDIT</span>
                <div>
                  <strong>Incident record</strong>
                  <p>Action, actor, and timestamp preserved</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section className="la-business-band" aria-label="LocksAll business positioning">
          {businessPoints.map((point) => (
            <article key={point.title}>
              <h2>{point.title}</h2>
              <p>{point.body}</p>
            </article>
          ))}
        </section>

        <section id="features" ref={featuresRef} className="la-section">
          <div className="la-section-heading">
            <p className="la-kicker">Platform capabilities</p>
            <h2>Designed for the first stressful minutes of a financial incident.</h2>
            <p className="la-section-subtitle">
              LocksAll focuses on a narrow, high-pressure workflow: act quickly, protect sensitive card data,
              understand issuer status, and keep recovery controlled.
            </p>
          </div>
          <div className="la-features-grid">
            {features.map((feature) => (
              <article className="la-feature-card" key={feature.title}>
                <span>{feature.stat}</span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="la-section la-workflow-section">
          <div className="la-section-heading">
            <p className="la-kicker">Security workflow</p>
            <h2>Every action should be verified, visible, and reversible.</h2>
          </div>
          <div className="la-workflow-grid">
            {workflowSteps.map((step, index) => (
              <article className="la-workflow-card" key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="usecases" ref={useCasesRef} className="la-section la-usecase-section">
          <div className="la-section-heading">
            <p className="la-kicker">Use cases</p>
            <h2>One control pattern, several real-world responses.</h2>
          </div>
          <div className="la-tabs" role="tablist" aria-label="LocksAll use cases">
            {(Object.keys(useCases) as UseCaseKey[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeUseCase === key}
                className={`la-tab ${activeUseCase === key ? "active" : ""}`}
                onClick={() => setActiveUseCase(key)}
              >
                {useCases[key].label}
              </button>
            ))}
          </div>
          <div className="la-tab-panel">
            <h3>{activeCase.title}</h3>
            <ul>
              {activeCase.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="faq" ref={faqRef} className="la-section la-faq-section">
          <div className="la-section-heading">
            <p className="la-kicker">FAQ</p>
            <h2>Clear answers for a trust-first product.</h2>
          </div>
          <div className="la-faq-list">
            {faqItems.map((item, index) => {
              const open = openFaqIndex === index;
              return (
                <article className={`la-faq-item ${open ? "open" : ""}`} key={item.q}>
                  <button className="la-faq-question" onClick={() => setOpenFaqIndex(open ? null : index)}>
                    <span>{item.q}</span>
                    <strong>{open ? "-" : "+"}</strong>
                  </button>
                  {open && <p className="la-faq-answer">{item.a}</p>}
                </article>
              );
            })}
          </div>
        </section>

        <PrototypePanel />

        <footer className="la-footer">
          <div>
            <strong>LocksAll</strong>
            <p className="la-footer-text">Prototype for centralized card lock, incident response, and recovery workflows.</p>
          </div>
          <div className="la-footer-right">
            <button className="la-footer-button" onClick={goToPrototype}>Open prototype</button>
          </div>
        </footer>
      </div>
    </main>
  );
}
