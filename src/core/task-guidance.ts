export function logRecommendation(task?: string): string {
  if (
    /\b(error|errors|fail|failure|failed|bug|debug|crash|exception|timeout|diagnos\w*)\b/i.test(
      task ?? "",
    )
  ) {
    return "For this diagnostic task, keep failure lines, stack traces, and nearby context; filter routine success output upstream.";
  }
  if (
    /\b(success|successful|succeeded|completed|throughput|performance|latency)\b/i.test(
      task ?? "",
    )
  ) {
    return "For this success or performance task, keep aggregate counts, timings, and representative lines; filter repetitive per-request entries upstream.";
  }
  return "Keep failures, stack traces, and nearby context; filter routine success output upstream.";
}

export function jsonRecommendation(task?: string): string {
  if (
    /\b(count|total|how many|average|sum|aggregate|statistics)\b/i.test(
      task ?? "",
    )
  ) {
    return "For this aggregate task, compute the requested count or statistic upstream when possible and keep fields needed to verify it; PARE will not remove JSON values automatically.";
  }
  if (/\b(find|locate|search|filter|specific|matching)\b/i.test(task ?? "")) {
    return "For this lookup task, filter records upstream and keep fields needed to identify the match; PARE will not remove JSON values automatically.";
  }
  return "Select required fields or paginate upstream; PARE will not remove JSON values automatically.";
}
