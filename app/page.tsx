"use client";

import type React from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PrototypePanel from "@/components/PrototypePanel";

type SectionKey = "features" | "useCases" | "faq";
type MouseVector = { x: number; y: number };
type UseCaseKey = "lostWallet" | "family" | "business";

const features = [
  {
    title: "Emergency card freeze",
    body: "Block every linked card from one command when a wallet, phone, or account is at risk.",
    stat: "1 action",
  },
  {
    title: "Provider-aware routing",
    body: "Route requests to each bank or issuer connector while showing clear status for every card.",
    stat: "Multi-bank",
  },
  {
    title: "Audit timeline",
    body: "Keep a visible record of requests, provider responses, timing, and recovery actions.",
    stat: "Live log",
  },
  {
    title: "Controlled recovery",
    body: "Unblock cards only after the user confirms the threat has passed or an admin approves the action.",
    stat: "Reversible",
  },
  {
    title: "Secure prototype access",
    body: "Credentials protect the dashboard so only approved testers can trigger block and unblock actions.",
    stat: "Auth gated",
  },
  {
    title: "Incident-ready UX",
    body: "Important controls stay obvious under pressure, with status chips and readable failure states.",
    stat: "Fast response",
  },
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
    a: "No. The current dashboard uses mocked provider calls so the flow, audit trail, and error handling can be tested safely.",
  },
  {
    q: "Who is the first version for?",
    a: "The first version is aimed at individuals, families, and small teams that need a faster response when cards may be compromised.",
  },
  {
    q: "What happens after I request access?",
    a: "Your email is stored for early-access follow-up. Prototype access still requires separate test credentials.",
  },
];

function SecurityBackground({ mouse }: { mouse: MouseVector }) {
  const layerStyle = {
    transform: `translate3d(${mouse.x * 22}px, ${mouse.y * 16}px, 0)`,
  };

  return (
    <div className="la-bg" aria-hidden="true">
      <div className="la-bg-grid" />
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
            <button onClick={() => handleScrollTo(featuresRef)}>Features</button>
            <button onClick={() => handleScrollTo(useCasesRef)}>Use cases</button>
            <button onClick={() => handleScrollTo(faqRef)}>FAQ</button>
            <button className="la-nav-cta" onClick={goToPrototype}>Prototype</button>
          </nav>
        </header>

        <section className="la-hero">
          <div className="la-hero-inner">
            <p className="la-kicker">Financial access control for emergencies</p>
            <h1>LocksAll</h1>
            <p className="la-hero-copy">
              A single authenticated dashboard to block every linked card, review provider responses,
              and recover safely when the risk is under control.
            </p>

            <div className="la-hero-actions">
              <button className="la-primary-button" onClick={goToPrototype}>View Prototype</button>
              <button className="la-secondary-button" onClick={() => handleScrollTo(featuresRef)}>
                See features
              </button>
            </div>

            <div className="la-hero-meta" aria-label="Prototype highlights">
              <span>Mock bank connectors</span>
              <span>Authenticated controls</span>
              <span>Live audit trail</span>
            </div>

            {!submitted ? (
              <form className="la-cta-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  required
                  placeholder="Email for early access"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Request invite"}
                </button>
              </form>
            ) : (
              <p className="la-cta-thanks">Thanks. You are on the early-access list.</p>
            )}
            {error && <p className="la-cta-error">{error}</p>}
          </div>

          <aside className="la-hero-card" aria-label="LocksAll dashboard preview">
            <div className="la-hero-card-header">
              <span>Emergency control</span>
              <strong>Live prototype</strong>
            </div>
            <div className="la-lock-panel">
              <div className="la-lock-dial">
                <span>3</span>
                <small>linked cards</small>
              </div>
              <div className="la-lock-actions">
                <button>Block all</button>
                <button>Unblock all</button>
              </div>
            </div>
            <div className="la-hero-events">
              <div className="la-hero-event">
                <span className="pill pill-green">ACTIVE</span>
                <div>
                  <strong>Amex Gold</strong>
                  <p>Ready for emergency freeze</p>
                </div>
              </div>
              <div className="la-hero-event">
                <span className="pill pill-amber">PENDING</span>
                <div>
                  <strong>Provider request</strong>
                  <p>Simulated connector latency tracked</p>
                </div>
              </div>
              <div className="la-hero-event">
                <span className="pill pill-red">AUDIT</span>
                <div>
                  <strong>Timeline saved</strong>
                  <p>Every action keeps a timestamped record</p>
                </div>
              </div>
            </div>
          </aside>
        </section>

        <section id="features" ref={featuresRef} className="la-section">
          <div className="la-section-heading">
            <p className="la-kicker">Core capabilities</p>
            <h2>Built for the first stressful minutes.</h2>
            <p className="la-section-subtitle">
              LocksAll focuses on a narrow, high-pressure workflow: act quickly, know what happened,
              and keep recovery controlled.
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

        <section id="usecases" ref={useCasesRef} className="la-section la-usecase-section">
          <div className="la-section-heading">
            <p className="la-kicker">Use cases</p>
            <h2>One pattern, several real-world responses.</h2>
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
            <h2>Questions, meet answers.</h2>
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
            <p className="la-footer-text">Prototype for centralized card lock and recovery workflows.</p>
          </div>
          <div className="la-footer-right">
            <button className="la-footer-button" onClick={goToPrototype}>Open prototype</button>
          </div>
        </footer>
      </div>
    </main>
  );
}
