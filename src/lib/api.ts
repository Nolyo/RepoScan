import type { Result } from "../bindings";

export function unwrap<T, E>(r: Result<T, E>): T {
  if (r.status === "error") {
    throw new Error(typeof r.error === "string" ? r.error : JSON.stringify(r.error));
  }
  return r.data;
}
