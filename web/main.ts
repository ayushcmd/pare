import type { AnalysisResult, SourceKind } from "../src/core/contracts";

const form = requireElement<HTMLFormElement>("analyze-form");
const textArea = requireElement<HTMLTextAreaElement>("source-text");
const fileInput = requireElement<HTMLInputElement>("file-input");
const sourceKind = requireElement<HTMLSelectElement>("source-kind");
const taskInput = requireElement<HTMLInputElement>("task-text");
const inputStats = requireElement<HTMLElement>("input-stats");
const results = requireElement<HTMLElement>("results");

const kindByExtension: Record<string, string> = {
  txt: "plain_text",
  md: "markdown",
  json: "json",
  js: "javascript",
  ts: "typescript",
  py: "python",
  log: "log",
};

textArea.addEventListener("input", updateStats);
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  textArea.value = await file.text();
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && kindByExtension[extension])
    sourceKind.value = kindByExtension[extension];
  updateStats();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  void runAnalysis();
});

async function runAnalysis(): Promise<void> {
  form.setAttribute("aria-busy", "true");
  results.replaceChildren(
    element(
      "div",
      "result-card",
      "Loading the local tokenizer and analyzing context…",
    ),
  );
  try {
    const { analyzeContext } = await import("../src/core/analyze");
    const result = analyzeContext({
      text: textArea.value,
      sourceKind: sourceKind.value as SourceKind,
      task: taskInput.value || undefined,
      includeDraft: true,
    });
    renderResult(result);
  } catch (error) {
    renderError(
      error instanceof Error
        ? error.message
        : "PARE could not analyze this input.",
    );
  } finally {
    form.removeAttribute("aria-busy");
  }
}

function updateStats(): void {
  const characters = textArea.value.length;
  inputStats.textContent = `${characters.toLocaleString()} ${characters === 1 ? "character" : "characters"}`;
}

function renderResult(result: AnalysisResult): void {
  results.replaceChildren();
  const summary = element("div", "result-card summary-card");
  summary.append(
    element("p", "result-label", "Selected encoding"),
    element("strong", "token-total", result.original.tokens.toLocaleString()),
    element(
      "p",
      "result-caption",
      `tokens · ${result.original.lines.toLocaleString()} lines · ${formatBytes(result.original.bytes)}`,
    ),
  );
  results.append(summary);

  const findingCard = element("div", "result-card");
  findingCard.append(element("h3", "", `Findings (${result.findings.length})`));
  if (result.findings.length === 0) {
    findingCard.append(
      element(
        "p",
        "muted",
        "No clear structural waste was detected. This does not mean the input is optimal for every task.",
      ),
    );
  } else {
    const list = element("div", "finding-list");
    for (const finding of result.findings) {
      const item = element("article", "finding");
      item.append(
        element("span", `risk risk-${finding.risk}`, finding.risk),
        element("h4", "", finding.title),
        element("p", "", finding.message),
        element("p", "recommendation", finding.recommendation),
      );
      list.append(item);
    }
    findingCard.append(list);
  }
  results.append(findingCard);

  if (result.draft) {
    const draftCard = element("div", "result-card draft-card");
    draftCard.append(
      element("p", "result-label", "Review-required draft"),
      element(
        "h3",
        "",
        `${result.draft.savedTokens.toLocaleString()} fewer tokens`,
      ),
      element(
        "p",
        "muted",
        `${result.draft.reductionPercent.toFixed(1)}% measured reduction using the same encoding.`,
      ),
    );
    const review = document.createElement("details");
    review.className = "draft-review";
    review.append(
      element(
        "summary",
        "",
        `Review ${result.draft.changes.length} proposed change${result.draft.changes.length === 1 ? "" : "s"}`,
      ),
    );
    const draftText = document.createElement("pre");
    draftText.textContent = result.draft.text;
    review.append(draftText);
    const acknowledge = document.createElement("label");
    acknowledge.className = "acknowledge";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    acknowledge.append(
      checkbox,
      document.createTextNode(" I reviewed the complete draft."),
    );
    const copy = element(
      "button",
      "secondary-button",
      "Copy reviewed draft",
    ) as HTMLButtonElement;
    copy.type = "button";
    copy.disabled = true;
    checkbox.addEventListener("change", () => {
      copy.disabled = !checkbox.checked || !review.open;
    });
    review.addEventListener("toggle", () => {
      if (!review.open) checkbox.checked = false;
      copy.disabled = !checkbox.checked || !review.open;
    });
    copy.addEventListener("click", async () => {
      await navigator.clipboard.writeText(result.draft?.text ?? "");
      copy.textContent = "Copied";
    });
    draftCard.append(review, acknowledge, copy);
    results.append(draftCard);
  }

  results.append(
    element(
      "p",
      "result-warning",
      result.warnings[0] ?? "Review all recommendations before use.",
    ),
  );
}

function renderError(message: string): void {
  results.replaceChildren(element("div", "result-card error-card", message));
}

function element(tag: string, className = "", text = ""): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function requireElement<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KiB`;
}
