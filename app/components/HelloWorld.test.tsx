import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import HelloWorld from "~/components/HelloWorld";

describe("HelloWorld component", () => {
  it("renders 'Hello, World!' by default", () => {
    render(<HelloWorld />);
    expect(screen.getByRole("heading", { name: /Hello, World!/i })).toBeInTheDocument();
  });

  it("renders with a custom name", () => {
    render(<HelloWorld name="Gemini" />);
    expect(screen.getByRole("heading", { name: /Hello, Gemini!/i })).toBeInTheDocument();
  });
});