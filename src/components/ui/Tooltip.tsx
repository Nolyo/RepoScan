import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useEffect, useState, type ReactNode } from "react";

interface Props {
  content: ReactNode;
  children: ReactNode;
  delayDuration?: number;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

function useAppContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setContainer(document.querySelector<HTMLElement>(".rs-app"));
  }, []);
  return container;
}

export function Tooltip({
  content,
  children,
  delayDuration = 250,
  side = "top",
  align = "center",
}: Props) {
  const container = useAppContainer();
  if (content === null || content === undefined || content === "") {
    return <>{children}</>;
  }
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal container={container}>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className="rs-tooltip"
        >
          {content}
          <RadixTooltip.Arrow className="rs-tooltip-arrow" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
