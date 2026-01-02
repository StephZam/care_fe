import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

function TwoColumnLayout({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "fixed right-0 bottom-0 m-1 mr-3 mb-3 rounded",
        "transition-[left] duration-200 ease-linear",
        "flex flex-col",
        "left-2",
        isMobile ? "top-18 m-0" : "top-2 md:top-2",
        isCollapsed
          ? "md:left-(--sidebar-width-icon)"
          : "md:left-[calc(var(--sidebar-width)+0.5rem)]",
        className,
      )}
    >
      {title && (
        <div className="px-4 py-5 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
        </div>
      )}
      <div className="flex gap-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function LeftPanel({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cn(
        "w-64 flex-shrink-0 border-r border-gray-200 bg-white h-full flex flex-col",
        className,
      )}
    >
      {title && (
        <div className="flex-shrink-0 bg-white z-10 px-4 py-5 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900 text-lg">{title}</h2>
        </div>
      )}
      <div className="flex-1 overflow-y-auto py-2">{children}</div>
    </div>
  );
}

function RightPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 flex flex-col bg-white",
        isMobile ? "overflow-y-auto" : "overflow-hidden",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RightPanelHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex bg-white px-3 py-3 mt-3 sm:px-6 sm:py-4",
        isMobile
          ? "flex-col gap-4"
          : "flex-row items-center border-b border-gray-300 gap-4 sticky top-0 z-10",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RightPanelContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { isMobile } = useSidebar();

  return (
    <div
      className={cn(
        "flex-1 p-2 sm:p-6",
        isMobile ? "" : "min-h-0 overflow-y-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

function RightPanelFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex-shrink-0 bg-white border-t border-gray-200",
        className,
      )}
    >
      {children}
    </div>
  );
}

export {
  LeftPanel,
  RightPanel,
  RightPanelContent,
  RightPanelFooter,
  RightPanelHeader,
  TwoColumnLayout,
};
