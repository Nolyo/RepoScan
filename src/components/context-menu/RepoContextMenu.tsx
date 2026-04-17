import * as ContextMenu from "@radix-ui/react-context-menu";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  FolderOpen, Code, Globe, Copy, Terminal, RefreshCw, Download
} from "lucide-react";
import type { RepoInfo, Editor } from "../../bindings";
import { commands } from "../../bindings";
import { useInvalidateRepos } from "../../hooks/useRepos";
import { unwrap } from "../../lib/api";
import { cn } from "../../lib/utils";
import i18n from "../../i18n";

interface Props {
  repo: RepoInfo;
  editors: Editor[];
  children: React.ReactNode;
}

const EDITOR_LABELS: Record<string, string> = {
  vsCode: "VS Code",
  vsCodeInsiders: "VS Code Insiders",
  cursor: "Cursor",
  zed: "Zed",
  intelliJ: "IntelliJ IDEA",
  webStorm: "WebStorm",
  pyCharm: "PyCharm",
  rider: "Rider",
  fleet: "Fleet",
  sublime: "Sublime Text",
  neovim: "Neovim",
  vim: "Vim",
};

export default function RepoContextMenu({ repo, editors, children }: Props) {
  const invalidateRepos = useInvalidateRepos();
  const { t } = useTranslation();
  const isFolder = repo.kind === "parentFolder";

  const openExplorer = () => {
    commands.openInExplorer(repo.path).catch((e) => toast.error(String(e)));
  };

  const openEditor = async (editor: Editor) => {
    try {
      unwrap(await commands.openInEditor(repo.path, editor));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const openRemote = async () => {
    if (!repo.remoteUrl) return;
    try {
      unwrap(await commands.openRemoteUrl(repo.remoteUrl));
      toast.success(i18n.t("contextMenu.openedBrowser"));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const copyPath = async () => {
    try {
      unwrap(await commands.copyPath(repo.path));
      toast.success(i18n.t("contextMenu.pathCopied"));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const copyCodeCmd = async () => {
    try {
      unwrap(await commands.copyCodeCommand(repo.path));
      toast.success(i18n.t("contextMenu.commandCopied"));
    } catch (e) {
      toast.error(String(e));
    }
  };

  const refresh = () => {
    commands.refreshRepo(repo.path).then(() => invalidateRepos());
  };

  const fetchRepo = () => {
    toast.promise(
      (async () => unwrap(await commands.fetchRepo(repo.path)))(),
      {
        loading: `Fetch ${repo.name}…`,
        success: (r) => {
          invalidateRepos();
          return r.message || i18n.t("contextMenu.repoUpdated", { name: repo.name });
        },
        error: (e) => String(e),
      },
    );
  };

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>
      <ContextMenu.Portal>
        <ContextMenu.Content
          className="z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md text-popover-foreground text-sm"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <MenuItem icon={FolderOpen} label={t("contextMenu.openExplorer")} onSelect={openExplorer} />

          {!isFolder && editors.length > 0 && (
            <>
              <ContextMenu.Separator className="my-1 h-px bg-muted" />
              {editors.slice(0, 5).map((editor) => (
                <MenuItem
                  key={editor}
                  icon={Code}
                  label={t("contextMenu.openEditor", { editor: EDITOR_LABELS[editor] ?? editor })}
                  onSelect={() => openEditor(editor)}
                />
              ))}
            </>
          )}

          {!isFolder && repo.remoteUrl && (
            <>
              <ContextMenu.Separator className="my-1 h-px bg-muted" />
              <MenuItem icon={Globe} label={t("contextMenu.openGithub")} onSelect={openRemote} />
            </>
          )}

          <ContextMenu.Separator className="my-1 h-px bg-muted" />
          <MenuItem icon={Copy} label={t("contextMenu.copyPath")} onSelect={copyPath} />
          {!isFolder && (
            <MenuItem icon={Terminal} label={t("contextMenu.copyCommand")} onSelect={copyCodeCmd} />
          )}

          {!isFolder && (
            <>
              <ContextMenu.Separator className="my-1 h-px bg-muted" />
              <MenuItem icon={RefreshCw} label={t("contextMenu.refresh")} onSelect={refresh} />
              <MenuItem icon={Download} label={t("contextMenu.fetch")} onSelect={fetchRepo} />
            </>
          )}
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onSelect,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <ContextMenu.Item
      onSelect={onSelect}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded px-2 py-1.5 cursor-default select-none outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        disabled && "opacity-50 pointer-events-none",
      )}
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      {label}
    </ContextMenu.Item>
  );
}
