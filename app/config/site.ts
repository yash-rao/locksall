export type UseCaseKey = "features" | "useCases" | "faq";

export const siteConfig = {
  brand: {
    primary: "Locks",
    accent: "All",
  },
  navigation: [
    { label: "Features", section: "features" },
    { label: "Use cases", section: "useCases" },
    { label: "FAQ", section: "faq" },
  ],
  hero: {
    title: "Secure access for a world of locks & identities.",
    subtitle:
      "LocksAll is your unified access layer — one place to manage who can open what, when, and from where. Designed for the next generation of smart homes, teams, and connected spaces.",
    meta: [
      "🔐 Identity-aware access",
      "🌐 Built for distributed teams",
      "⚡ Prototype preview",
    ],
  },
  earlyAccess: {
    inputPlaceholder: "Your best email for early access",
    submitLabel: "Request Invite",
    submittingLabel: "Sending...",
    helperText: "We’ll only use this to share launch updates. No spam.",
    emptyEmailMessage: "Please enter an email address to continue.",
    thankYouMessage: "🎉 Thanks! You’re on the early-access list.",
  },
  heroCard: {
    label: "Live activity",
    events: [
      {
        status: "Granted",
        tone: "green",
        title: "Yash",
        action: "entered",
        emphasis: "Workspace Door",
        detail: "2 minutes ago · via Mobile App",
      },
      {
        status: "Review",
        tone: "amber",
        title: "API key",
        action: "requested access to",
        emphasis: "Admin Console",
        detail: "Needs approval",
      },
      {
        status: "Blocked",
        tone: "red",
        title: "Unknown device",
        action: "tried unlocking",
        emphasis: "Garage",
        detail: "Location mismatch · Logged",
      },
    ],
  },
  sections: {
    features: {
      title: "Why LocksAll?",
      subtitle: "A single control plane for access, logs, and automation.",
    },
    useCases: {
      title: "Made for real-world scenarios",
    },
    faq: {
      title: "Questions, meet answers.",
    },
  },
  features: [
    {
      title: "Centralized access graph",
      description:
        "Model people, devices, doors, and data as nodes in a single graph. See who can access what in seconds, not hours.",
    },
    {
      title: "Context-aware policies",
      description:
        "Define rules based on role, device trust, time of day, or geolocation. Auto-lock, auto-expire, auto-audit.",
    },
    {
      title: "Audit-ready history",
      description:
        "Every access event is logged, signed, and ready for compliance reviews or incident investigations.",
    },
  ],
  useCases: [
    {
      key: "features",
      label: "Startup office",
      title: "Startup office — zero-friction access",
      bullets: [
        "Issue digital keys to new hires in seconds.",
        "Instantly revoke access when someone leaves.",
        "Temporary guest passes for visitors & contractors.",
      ],
    },
    {
      key: "useCases",
      label: "Remote teams",
      title: "Remote teams — security that travels",
      bullets: [
        "Gate admin tools behind identity and device posture.",
        "Enforce location-based policies for sensitive actions.",
        "Keep a unified audit trail across apps and devices.",
      ],
    },
    {
      key: "faq",
      label: "Smart home",
      title: "Smart home — unified control center",
      bullets: [
        "One place to manage locks, cameras, and alerts.",
        "Family, guests, and cleaning crew with scoped access.",
        "Automation rules to lock, notify, and monitor.",
      ],
    },
  ],
  faq: [
    {
      question: "What is LocksAll?",
      answer:
        "LocksAll is a unified security platform concept that connects digital identity with physical and digital access — think of it as a smart layer between people, devices, and locks.",
    },
    {
      question: "Is this a live product?",
      answer:
        "Right now, this is an early prototype and concept preview. The full feature set, integrations, and pricing are still under active design.",
    },
    {
      question: "Who is LocksAll for?",
      answer:
        "Tech-savvy individuals, startups, and organizations who care about secure access, audit trails, and centralized control for their devices and environments.",
    },
    {
      question: "How can I get early access?",
      answer:
        "Drop your email in the early-access form above. When a private beta or demo is ready, we’ll reach out.",
    },
  ],
  footer: {
    summary: "Prototype preview of a unified access platform. Built with Next.js.",
    ctaPrompt: "Be the first to know when we launch something real.",
    ctaButton: "Explore the vision",
    thankYou: "Thanks for being part of the earliest supporters.",
  },
} as const;
