import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { useEffect } from "react";

interface OrganizationTreeNodeProps {
  organization: FacilityOrganizationRead;
  selectedOrganizationId: string | null;
  onSelect: (organization: FacilityOrganizationRead) => void;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  level?: number;
  facilityId: string;
}

function OrganizationTreeNode({
  organization,
  selectedOrganizationId,
  onSelect,
  expandedOrganizations,
  onToggleExpand,
  level = 0,
  facilityId,
}: OrganizationTreeNodeProps) {
  const isExpanded = expandedOrganizations.has(organization.id);
  const isSelected = organization.id === selectedOrganizationId;

  // Query for this node's children
  const { data: children, isLoading } = useQuery({
    queryKey: ["facilityOrganization", "list", facilityId, organization.id],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: organization.id,
      },
    }),
    enabled: isExpanded,
  });

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 rounded-md cursor-pointer transition-colors min-w-max",
          isSelected ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {organization.has_children ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(organization.id);
            }}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="w-6 flex-shrink-0" />
        )}
        <div
          onClick={() => {
            onSelect(organization);
            if (organization.has_children) {
              onToggleExpand(organization.id);
            }
          }}
          data-cy="organization-tree-node-parent"
          className="flex items-center flex-1 text-sm gap-2 cursor-pointer min-w-0"
        >
          <span
            title={organization.name}
            className={cn(
              "flex items-center text-sm gap-2 cursor-pointer rounded-md px-2 py-1 whitespace-nowrap",
              isSelected ? "bg-blue-100 text-blue-800" : "hover:bg-gray-100",
            )}
          >
            {organization.name}
          </span>
        </div>
      </div>
      {isExpanded && children?.results && children.results.length > 0 && (
        <div className="pl-2" data-cy="organization-tree-node-children">
          {children.results.map((child) => (
            <OrganizationTreeNode
              key={child.id}
              organization={child}
              selectedOrganizationId={selectedOrganizationId}
              onSelect={onSelect}
              expandedOrganizations={expandedOrganizations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FacilityOrganizationNavbarProps {
  facilityId: string;
  selectedOrganizationId: string | null;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  onOrganizationSelect: (organization: FacilityOrganizationRead) => void;
}

const LIMIT = 20;

export default function FacilityOrganizationNavbar({
  facilityId,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
  onOrganizationSelect,
}: FacilityOrganizationNavbarProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["facilityOrganization", "list", facilityId],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = query(facilityOrganizationApi.list, {
          pathParams: { facilityId },
          queryParams: {
            parent: "",
            limit: LIMIT,
            offset: pageParam,
          },
        });
        const result = await response({ signal });
        return result;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const offset = allPages.flatMap((page) => page.results).length;
        return offset < lastPage.count ? offset : undefined;
      },
    });
  const organizations = data?.pages.flatMap((p) => p.results) || [];
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="w-full min-h-[calc(100vh-14rem)] shadow-lg bg-white rounded-lg flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-4">
        <div className="inline-block min-w-full">
          {isLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            organizations.map((organization) => (
              <OrganizationTreeNode
                key={organization.id}
                organization={organization}
                selectedOrganizationId={selectedOrganizationId}
                onSelect={onOrganizationSelect}
                expandedOrganizations={expandedOrganizations}
                onToggleExpand={onToggleExpand}
                facilityId={facilityId}
              />
            ))
          )}
          <div ref={ref} className="p-4">
            {isFetchingNextPage && <Skeleton className="h-8 w-full" />}
          </div>
        </div>
      </div>
    </div>
  );
}
