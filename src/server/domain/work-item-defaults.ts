export function defaultStatus(type: string) {
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
