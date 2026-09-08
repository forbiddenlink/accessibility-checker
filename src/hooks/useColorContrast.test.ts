import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import useColorContrast from "./useColorContrast";

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useColorContrast", () => {
  it("calculates the real contrast and settles without repeated renders", () => {
    const { result, rerender } = renderHook(() => useColorContrast());
    expect(result.current.results?.contrast).toBe(21);
    expect(result.current.results?.AA.normal).toBe(true);
    const settledResults = result.current.results;
    rerender();
    expect(result.current.results).toBe(settledResults);
    expect(result.current.loading.colorCheck).toBe(false);
  });

  it("normalizes inputs and recalculates contrast", () => {
    const { result } = renderHook(() => useColorContrast());
    act(() => result.current.setForegroundColor("fff"));
    expect(result.current.foregroundColor).toBe("#FFFFFF");
    expect(result.current.results?.contrast).toBe(1);
    expect(result.current.results?.AA.normal).toBe(false);
    act(() => result.current.setForegroundColor("invalid"));
    expect(result.current.error.type).toBe("INVALID_COLOR");
  });

  it("loads valid URL colors and ignores invalid ones", () => {
    window.history.replaceState({}, "", "/?fg=%23FF0000&bg=invalid");
    const { result } = renderHook(() => useColorContrast());
    expect(result.current.foregroundColor).toBe("#FF0000");
    expect(result.current.backgroundColor).toBe("#FFFFFF");
  });

  it("debounces URL writes to the latest valid colors", () => {
    const { result } = renderHook(() => useColorContrast());
    const replace = vi.spyOn(window.history, "replaceState");
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.setForegroundColor("abc");
    });
    act(() => vi.advanceTimersByTime(999));
    expect(replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(new URLSearchParams(window.location.search).get("fg")).toBe(
      "#AABBCC",
    );
  });

  it("cancels pending URL writes when unmounted", () => {
    const { unmount } = renderHook(() => useColorContrast());
    const replace = vi.spyOn(window.history, "replaceState");
    unmount();
    act(() => vi.runAllTimers());
    expect(replace).not.toHaveBeenCalled();
  });
});
