import type { PasswordAnalysisReport } from "../../domain/password/models";

export type AnalysisLifecycleState =
  | { status: "idle"; password: string; confirmPassword?: string }
  | { status: "editing"; password: string; confirmPassword?: string }
  | { status: "validating"; password: string; confirmPassword?: string }
  | {
      status: "success";
      password: string;
      confirmPassword?: string;
      report: PasswordAnalysisReport;
    }
  | {
      status: "error";
      password: string;
      confirmPassword?: string;
      message: string;
    };

export type AnalysisAction =
  | {
      type: "inputChanged";
      password: string;
      confirmPassword?: string;
    }
  | {
      type: "validateStart";
    }
  | {
      type: "validateSuccess";
      report: PasswordAnalysisReport;
    }
  | {
      type: "validateError";
      message: string;
    }
  | {
      type: "resetToEditing";
    };

