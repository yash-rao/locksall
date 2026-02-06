import path from "path";

export const serverConfig = {
  earlyAccess: {
    storagePath:
      process.env.EARLY_ACCESS_STORAGE_PATH ??
      path.join(process.cwd(), "data", "early-access.json"),
    emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    invalidPayloadMessage: "Invalid email",
    duplicateMessage: "That email is already on the list.",
    invalidMessage: "Please enter a valid email address.",
  },
} as const;
