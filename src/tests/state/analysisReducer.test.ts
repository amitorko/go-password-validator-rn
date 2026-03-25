import { analysisReducer, initialAnalysisState } from "../../state/analysis/analysisReducer";
import type { PasswordAnalysisReport } from "../../domain/password/models";

function makeReport(): PasswordAnalysisReport {
  return {
    state: "success",
    results: [],
    strength: { score: 50, category: "Medium" },
    passStatus: {
      passed: true,
      hardFailures: [],
      enabledRulesCount: 1,
      enabledPassedRulesCount: 1,
      reason: "ok",
    },
    warnings: [],
    suggestions: [],
  };
}

describe("analysisReducer", () => {
  test("idle -> editing on inputChanged", () => {
    const next = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "x",
      confirmPassword: undefined,
    });
    expect(next.status).toBe("editing");
    expect(next.password).toBe("x");
  });

  test("editing -> validating on validateStart", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "secret",
      confirmPassword: undefined,
    });
    const next = analysisReducer(editing, { type: "validateStart" });
    expect(next.status).toBe("validating");
  });

  test("validating -> success on validateSuccess", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "secret",
      confirmPassword: undefined,
    });
    const validating = analysisReducer(editing, { type: "validateStart" });
    const report = makeReport();
    const next = analysisReducer(validating, { type: "validateSuccess", report });
    expect(next.status).toBe("success");
    if (next.status === "success") {
      expect(next.report).toBe(report);
    }
  });

  test("validating -> error on validateError", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "secret",
      confirmPassword: undefined,
    });
    const validating = analysisReducer(editing, { type: "validateStart" });
    const next = analysisReducer(validating, {
      type: "validateError",
      message: "InvalidRulesConfigError",
    });
    expect(next.status).toBe("error");
    if (next.status === "error") {
      expect(next.message).toBe("InvalidRulesConfigError");
    }
  });

  test("validateStart is ignored when already validating (no-op)", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "a",
      confirmPassword: undefined,
    });
    const validating = analysisReducer(editing, { type: "validateStart" });
    const again = analysisReducer(validating, { type: "validateStart" });
    expect(again).toBe(validating);
  });

  test("resetToEditing from success returns editing with preserved fields", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "keep",
      confirmPassword: "keep",
    });
    const validating = analysisReducer(editing, { type: "validateStart" });
    const success = analysisReducer(validating, { type: "validateSuccess", report: makeReport() });
    const reset = analysisReducer(success, { type: "resetToEditing" });
    expect(reset.status).toBe("editing");
    expect(reset.password).toBe("keep");
    if (reset.status === "editing") {
      expect(reset.confirmPassword).toBe("keep");
    }
  });

  test("resetToEditing when already editing is no-op", () => {
    const editing = analysisReducer(initialAnalysisState, {
      type: "inputChanged",
      password: "x",
      confirmPassword: undefined,
    });
    const again = analysisReducer(editing, { type: "resetToEditing" });
    expect(again).toBe(editing);
  });
});
