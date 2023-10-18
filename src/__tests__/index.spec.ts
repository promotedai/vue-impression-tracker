import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MockLayout from "./mockLayout.vue";
import { beforeEach, vi } from "vitest";
import { v4 as uuid } from "uuid";

let onChange: IntersectionOnChange | null = null;

const IntersectionObserverMock = vi.fn((_onChange) => {
  onChange = _onChange;
  return {
    disconnect: vi.fn(),
    observe: vi.fn(),
    takeRecords: vi.fn(),
    unobserve: vi.fn(),
  };
});

const mockIntersectionEntry = {
  intersectionRatio: 1,
  time: 0,
  target: document.body,
  boundingClientRect: {
    bottom: 1,
    height: 1,
    left: 1,
    right: 1,
    top: 1,
    width: 1,
    x: 1,
    y: 1,
    toJSON: vi.fn(),
  },
  intersectionRect: { bottom: 1, height: 1, left: 1, right: 1, top: 1, width: 1, x: 1, y: 1, toJSON: vi.fn() },
  isIntersecting: true,
  rootBounds: null,
};

type IntersectionOnChange = (entry: IntersectionObserverEntry[]) => void;

vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);

describe("impressions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("fires after duration", () => {
    const logImpression = vi.fn();
    mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        logImpression,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    onChange([{ ...mockIntersectionEntry, intersectionRatio: 0 }]);
    expect(logImpression).not.toBeCalled();

    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    expect(logImpression).toBeCalledTimes(1);
    expect(logImpression).toBeCalledWith({
      contentId: "some-content-id",
      impressionId: "test-impression-id",
      sourceType: 1,
    });
  });

  it("with insertionId", () => {
    const logImpression = vi.fn();
    mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        insertionId: "test-insertion-id",
        logImpression,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    onChange([{ ...mockIntersectionEntry, intersectionRatio: 0 }]);
    expect(logImpression).not.toBeCalled();

    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    expect(logImpression).toBeCalledTimes(1);
    expect(logImpression).toBeCalledWith({
      contentId: "some-content-id",
      impressionId: "test-impression-id",
      insertionId: "test-insertion-id",
      sourceType: 1,
    });
  });

  it("only fires onces for multiple views", () => {
    const logImpression = vi.fn();
    mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        logImpression,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    onChange([{ ...mockIntersectionEntry }]);
    onChange([{ ...mockIntersectionEntry, intersectionRatio: 0 }]);
    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    expect(logImpression).toBeCalledTimes(1);

    onChange([{ ...mockIntersectionEntry, intersectionRatio: 0 }]);
    vi.runOnlyPendingTimers();
    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    expect(logImpression).toBeCalledTimes(1);
  });

  it("no IDs - do nothing", () => {
    const logImpression = vi.fn();
    mount(MockLayout, {
      propsData: { logImpression },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    expect(logImpression).not.toBeCalled();
  });

  it("don't allow changing contentId", async () => {
    const logImpression = vi.fn();
    const wrapper = mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        logImpression,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    await wrapper.setProps({
      uuid,
      contentId: "some-new-content-id",
    });
    onChange([{ ...mockIntersectionEntry }]);

    vi.runOnlyPendingTimers();
    expect(logImpression).not.toBeCalled();
  });

  it("logImpressionFunctor only triggers logImpression once", async () => {
    const logImpression = vi.fn();
    const component = mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        logImpression,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    onChange([{ ...mockIntersectionEntry }]);
    vi.runOnlyPendingTimers();
    // @ts-ignore
    component.vm.logImpressionFunctor();
    expect(logImpression).toBeCalledTimes(1);
  });

  it("click action", () => {
    const logImpression = vi.fn();
    const logAction = vi.fn();
    const component = mount(MockLayout, {
      propsData: {
        uuid,
        contentId: "some-content-id",
        impressionId: "test-impression-id",
        logImpression,
        logAction,
      },
    });

    if (!onChange) {
      throw new Error("IntersectionObserver onChange not mocked");
    }

    // @ts-ignore
    component.vm.logActionFunctor();
    expect(logImpression).not.toBeCalled();
    expect(logAction).toBeCalledWith({
      contentId: "some-content-id",
      impressionId: "test-impression-id",
      sourceType: 1,
    });
  });
});
