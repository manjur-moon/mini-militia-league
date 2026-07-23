import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AIInsightCard } from "./ai-insight-card.jsx";

const insight = {
  label: "AI-generated analysis",
  provider: "deterministic",
  model: null,
  isFallback: true,
  cacheHit: true,
  content: "Verified weekly summary.",
  structuredContent: {
    headline: "Alpha leads the week",
    summary: "Verified weekly summary.",
    highlights: ["Five verified matches were included."],
    watchNext: ["Watch the current leader's next verified sample."],
    disclaimer: "Official statistics remain unchanged.",
  },
};

describe("AIInsightCard", () => {
  it("marks fallback content and its official-data boundary", () => {
    render(<AIInsightCard insight={insight} title="Weekly insight" />);
    expect(screen.getByText("Alpha leads the week")).toBeInTheDocument();
    expect(screen.getByText("Statistics fallback")).toBeInTheDocument();
    expect(screen.getByText("Cached")).toBeInTheDocument();
    expect(screen.getByText("Highlights")).toBeInTheDocument();
    expect(screen.getByText("What to watch")).toBeInTheDocument();
    expect(
      screen.getByText("Official statistics remain unchanged."),
    ).toBeInTheDocument();
  });

  it("supports compact provider content without expanded lists", () => {
    render(
      <AIInsightCard
        compact
        title="Player analysis"
        insight={{
          ...insight,
          isFallback: false,
          cacheHit: false,
          provider: "openai",
          model: "configured-model",
          structuredContent: {
            title: "Training focus",
            caption: "Use only verified structured data.",
            trainingFocus: ["Improve survival."],
          },
        }}
      />,
    );

    expect(screen.getByText("Training focus")).toBeInTheDocument();
    expect(screen.getByText("configured-model")).toBeInTheDocument();
    expect(screen.queryByText("Highlights")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "AI-generated content is descriptive only and does not change official statistics.",
      ),
    ).toBeInTheDocument();
  });

  it("renders nothing when no insight is available", () => {
    const { container } = render(<AIInsightCard insight={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
