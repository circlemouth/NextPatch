import type { WorkItemType } from "@/server/types";

export function defaultStatus(type: WorkItemType) {
  switch (type) {
    case "bug":
      return "unconfirmed";
    case "memo":
      return "unreviewed";
    case "idea":
      return "unreviewed";
    default:
      return "todo";
  }
}
