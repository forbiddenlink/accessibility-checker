import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SemanticStructureAnalyzer from "./SemanticStructureAnalyzer";

async function analyze(html: string) {
  render(<SemanticStructureAnalyzer />);
  const textarea = screen.getByLabelText("HTML code to analyze");
  fireEvent.change(textarea, { target: { value: html } });
  fireEvent.click(screen.getByRole("button", { name: /Analyze Structure/ }));
  // Issue list renders synchronously after the click handler runs.
  return screen.findByText(/Errors/);
}

describe("SemanticStructureAnalyzer landmark detection", () => {
  it("does not report a missing nav landmark when <nav> is nested inside another element", async () => {
    await analyze('<main><h1>Page</h1><nav><a href="#">Home</a></nav></main>');
    expect(screen.queryByText("No navigation landmark found")).toBeNull();
  });

  it('does not report a missing nav landmark when role="navigation" is nested', async () => {
    await analyze(
      '<main><h1>Page</h1><div role="navigation"><a href="#">Home</a></div></main>',
    );
    expect(screen.queryByText("No navigation landmark found")).toBeNull();
  });

  it("still reports a missing nav landmark when neither <nav> nor role=navigation exists", async () => {
    await analyze("<main><h1>Page</h1><p>No nav here</p></main>");
    expect(screen.getByText("No navigation landmark found")).toBeTruthy();
  });

  it("does not report a missing main landmark when <main> is nested inside another element", async () => {
    await analyze('<div id="app"><main><h1>Page</h1></main></div>');
    expect(screen.queryByText("No main landmark found")).toBeNull();
  });

  it("does not report a missing header/banner landmark when <header> is nested", async () => {
    await analyze(
      "<div><header><h1>Title</h1></header><main><p>Body</p></main></div>",
    );
    expect(screen.queryByText("No header landmark found")).toBeNull();
  });

  it("reports a missing header/banner landmark when neither exists", async () => {
    await analyze("<main><p>Body</p></main>");
    expect(screen.getByText("No header landmark found")).toBeTruthy();
  });

  it("does not report a missing footer/contentinfo landmark when <footer> is nested", async () => {
    await analyze(
      "<div><main><p>Body</p></main><footer><p>Copyright</p></footer></div>",
    );
    expect(screen.queryByText("No footer landmark found")).toBeNull();
  });

  it("reports a missing footer/contentinfo landmark when neither exists", async () => {
    await analyze("<main><p>Body</p></main>");
    expect(screen.getByText("No footer landmark found")).toBeTruthy();
  });
});
