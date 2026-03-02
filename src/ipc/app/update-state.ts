export type UpdateStatusStage =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloaded"
  | "error";

export interface UpdateStatus {
  stage: UpdateStatusStage;
  message: string | null;
  updatedAt: number;
}

let currentUpdateStatus: UpdateStatus = {
  stage: "idle",
  message: null,
  updatedAt: Date.now(),
};

function setUpdateStatus(
  stage: UpdateStatusStage,
  message: string | null = null,
) {
  currentUpdateStatus = {
    stage,
    message,
    updatedAt: Date.now(),
  };
}

function getUpdateStatus(): UpdateStatus {
  return currentUpdateStatus;
}

export { setUpdateStatus, getUpdateStatus };
