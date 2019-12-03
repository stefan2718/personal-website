import { ITestControlsStateNumbers, ITestSummary } from "../src/util/interfaces";

export interface WasmTestRequest extends ITestControlsStateNumbers {
  gridSize: number;
  wasmResults: ITestSummary[];
  mcpResults: ITestSummary[];
}

export interface WasmTestResult extends WasmTestRequest {
  id: string;
  userAgent: string;
}