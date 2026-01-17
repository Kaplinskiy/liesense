export interface DuelSummary {
  status: "open" | "completed" | "expired";
  questionSetId: string;
  creatorScore?: number;
  opponentScore?: number;
}
