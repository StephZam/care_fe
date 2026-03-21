import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { LocationRead, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

const LOCATION_NAV_PAGE_SIZE = RESULTS_PER_PAGE_LIMIT;

interface LocationTreeNodeProps {
  location: LocationRead;
  selectedLocationId: string | null;
  onSelect: (location: LocationRead) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
}

export function LocationTreeNode({
  location,
  selectedLocationId,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = location.id === selectedLocationId;
  const hasChildren = location.has_children;
  const { ref, inView } = useInView();
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  const {
    data: childrenData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          parent: location.id,
          mode: "kind",
          limit: LOCATION_NAV_PAGE_SIZE,
          offset: pageParam,
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LOCATION_NAV_PAGE_SIZE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: isExpanded && hasChildren,
  });

  const children = childrenData?.pages.flatMap((page) => page.results) ?? [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && isExpanded) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, isExpanded]);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 min-w-max",
          isSelected && "bg-blue-100 text-blue-800",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {isLoading ? (
          <Button variant="ghost" size="icon" className="size-6">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </Button>
        ) : hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          className="flex items-center flex-1 text-sm gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(location);
            onToggleExpand(location.id);
          }}
        >
          <Icon className="size-4 shrink-0" />
          <span className="whitespace-nowrap">{location.name}</span>
        </div>
      </div>
      {isExpanded && children.length > 0 && (
        <div className="pl-2">
          {children.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationId={selectedLocationId}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
            />
          ))}
          {hasNextPage && <div ref={ref} className="h-2" />}
          {isFetchingNextPage && (
            <div className="flex justify-center py-1">
              <div className="size-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface LocationNavbarProps {
  facilityId: string;
  selectedLocationId: string | null;
  expandedLocations: Set<string>;
  onLocationSelect: (location: LocationRead) => void;
  onToggleExpand: (locationId: string) => void;
}

export default function LocationNavbar({
  facilityId,
  selectedLocationId,
  expandedLocations,
  onLocationSelect,
  onToggleExpand,
}: LocationNavbarProps) {
  const { t } = useTranslation();
  const { ref, inView } = useInView();

  const {
    data: allLocations,
    isLoading: isLoadingLocations,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["locations", facilityId, "mine", "kind"],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: {
          mine: true,
          mode: "kind",
          limit: LOCATION_NAV_PAGE_SIZE,
          offset: pageParam,
        },
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * LOCATION_NAV_PAGE_SIZE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
  });

  const topLevelLocations =
    allLocations?.pages.flatMap((page) => page.results) || [];

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!isLoadingLocations && topLevelLocations.length === 0) {
    return null;
  }

  return (
    <div className="hidden md:block w-64 md:max-lg:w-72 md:max-lg:min-w-72 md:max-lg:shrink-0 shadow-lg bg-white rounded-lg">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t("locations")}</h2>
      </div>
      <div className="overflow-y-auto">
        <div className="p-2">
          {isLoadingLocations ? (
            <div className="p-4">
              <CardGridSkeleton count={3} />
            </div>
          ) : (
            topLevelLocations.map((location) => (
              <LocationTreeNode
                key={location.id}
                location={location}
                selectedLocationId={selectedLocationId}
                onSelect={onLocationSelect}
                expandedLocations={expandedLocations}
                onToggleExpand={onToggleExpand}
                facilityId={facilityId}
              />
            ))
          )}
          {hasNextPage && <div ref={ref} className="h-2" />}
          {isFetchingNextPage && (
            <div className="flex justify-center p-2">
              <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
