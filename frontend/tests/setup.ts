import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest kör utan globals, så Testing Library städar inte själv mellan testerna
afterEach(() => cleanup());
