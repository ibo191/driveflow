export function trackCourseFinderEvent(eventName, payload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("driveflow:analytics", {
      detail: { eventName, payload }
    })
  );

  window.driveflowAnalytics?.track?.(eventName, payload);
}
