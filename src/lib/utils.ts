import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function sshToHttps(remoteUrl: string): string | null {
  // git@github.com:owner/repo.git or git@host:owner/repo
  const sshMatch = remoteUrl.match(/^git@([\w.-]+):(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return `https://${sshMatch[1]}/${sshMatch[2]}`;
  }
  // Already https or http
  if (remoteUrl.startsWith("https://") || remoteUrl.startsWith("http://")) {
    return remoteUrl.replace(/\.git$/, "");
  }
  return null;
}

export function remoteShortName(remoteUrl: string): string {
  const parts = remoteUrl.replace(/\.git$/, "").split(/[/:]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  }
  return parts[parts.length - 1] ?? remoteUrl;
}
