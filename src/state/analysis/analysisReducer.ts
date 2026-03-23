import type { AnalysisAction, AnalysisLifecycleState } from "./types";

export const initialAnalysisState: AnalysisLifecycleState = {
  status: "idle",
  password: "",
  confirmPassword: undefined,
};

export function analysisReducer(
  state: AnalysisLifecycleState,
  action: AnalysisAction,
): AnalysisLifecycleState {
  switch (action.type) {
    case "inputChanged": {
      return {
        status: "editing",
        password: action.password,
        confirmPassword: action.confirmPassword,
      };
    }
    case "validateStart": {
      if (state.status === "validating") return state;
      return {
        status: "validating",
        password: state.password,
        confirmPassword: state.confirmPassword,
      };
    }
    case "validateSuccess": {
      return {
        status: "success",
        password: state.password,
        confirmPassword: state.confirmPassword,
        report: action.report,
      };
    }
    case "validateError": {
      return {
        status: "error",
        password: state.password,
        confirmPassword: state.confirmPassword,
        message: action.message,
      };
    }
    case "resetToEditing": {
      if (state.status === "editing") return state;
      return {
        status: "editing",
        password: state.password,
        confirmPassword: state.confirmPassword,
      };
    }
    default: {
      // Exhaustiveness check.
      const _exhaustive: never = action;
      return state;
    }
  }
}

