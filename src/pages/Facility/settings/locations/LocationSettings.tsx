import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { AnimatedWrapper } from "@/components/Common/AnimatedWrapper";
import Pagination from "@/components/Common/Pagination";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import { useLocationManagement } from "@/hooks/useLocationManagement";

import query from "@/Utils/request/query";
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import { LocationRead as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

import {
  LeftPanel,
  RightPanel,
  RightPanelContent,
  RightPanelFooter,
  RightPanelHeader,
  TwoColumnLayout,
} from "@/components/Common/TwoColumnLayout";
import useBreakpoints from "@/hooks/useBreakpoints";
import LocationSheet from "./LocationSheet";
import LocationView from "./LocationView";
import { LocationCard } from "./components/LocationCard";
import { LocationTable } from "./components/LocationTable";

interface LocationSettingsProps {
  facilityId: string;
  locationId?: string;
}

export default function LocationSettings({
  facilityId,
  locationId,
}: LocationSettingsProps) {
  const { t } = useTranslation();
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const isMobile = useBreakpoints({ default: true, md: false });

  const { data: parentLocations } = useQuery({
    queryKey: ["locations", facilityId, "top"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mode: "kind",
        parent: "",
        limit: 100,
      },
    }),
  });

  const ITEMS_PER_PAGE = 14;

  const {
    page: currentPage,
    setPage: setCurrentPage,
    searchQuery,
    setSearchQuery,
    selectedLocation: locationToEdit,
    isSheetOpen,
    children: childLocations,
    isLoading,
    currentPageItems,
    handleMove,
    handleAddLocation,
    handleEditLocation,
    handleSheetClose,
    isLastPage,
  } = useLocationManagement({
    facilityId,
    parentId: locationId,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // Reset page to 1 when locationId changes
  useEffect(() => {
    setCurrentPage(1);
  }, [locationId, setCurrentPage]);

  const handleLocationSelect = useCallback(
    (location: LocationListType) => {
      navigate(`/facility/${facilityId}/settings/locations/${location.id}`);
    },
    [facilityId],
  );

  const handleToggleExpand = useCallback((locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  }, []);

  const handleMoveUp = useCallback(
    (location: LocationListType) => handleMove(location, "up"),
    [handleMove],
  );

  const handleMoveDown = useCallback(
    (location: LocationListType) => handleMove(location, "down"),
    [handleMove],
  );

  return (
    <TwoColumnLayout>
      {!isMobile && (
        <LeftPanel title={t("locations")}>
          <div className="p-4">
            {parentLocations?.results?.length ? (
              parentLocations.results.map((location) => (
                <LocationTreeNode
                  key={location.id}
                  location={location}
                  facilityId={facilityId}
                  selectedLocationId={locationId || null}
                  expandedLocations={expandedLocations}
                  onToggleExpand={handleToggleExpand}
                  onSelect={handleLocationSelect}
                />
              ))
            ) : (
              <div className="p-4 text-sm text-gray-500">
                {t("no_locations_available")}
              </div>
            )}
          </div>
        </LeftPanel>
      )}
      {locationId ? (
        <LocationView
          id={locationId}
          facilityId={facilityId}
          isNested={true}
          onBackToParent={() =>
            navigate(`/facility/${facilityId}/settings/locations`)
          }
          onSelectLocation={handleLocationSelect}
        />
      ) : (
        <RightPanel>
          <RightPanelHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <Input
                placeholder={t("search_by_name")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full lg:w-72"
              />
              <div className="w-full sm:w-auto flex justify-center sm:justify-start">
                <Button
                  variant="primary"
                  onClick={handleAddLocation}
                  className="w-full sm:w-auto"
                >
                  <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
                  {t("add_location")}
                </Button>
              </div>
            </div>
          </RightPanelHeader>
          <RightPanelContent>
            {isLoading ? (
              <TableSkeleton count={5} />
            ) : currentPageItems?.length ? (
              <LocationTable
                locations={currentPageItems}
                onEdit={handleEditLocation}
                onView={handleLocationSelect}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                facilityId={facilityId}
                isFirstPage={currentPage === 1}
                isLastPage={isLastPage}
                currentPage={currentPage}
                setPage={setCurrentPage}
              />
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  {t("no_locations_found")}
                </CardContent>
              </Card>
            )}
            <div className="lg:hidden flex flex-col gap-4 sm:px-4">
              {isLoading ? (
                <CardGridSkeleton count={3} />
              ) : currentPageItems?.length ? (
                <div className="flex flex-col gap-4">
                  {currentPageItems.map((childLocation, index) => (
                    <AnimatedWrapper
                      key={childLocation.id}
                      keyValue={childLocation.id}
                    >
                      <LocationCard
                        location={childLocation}
                        onEdit={handleEditLocation}
                        onView={handleLocationSelect}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                        facilityId={facilityId}
                        index={index}
                        totalCount={currentPageItems.length}
                        isFirstPage={currentPage === 1}
                        isLastPage={isLastPage}
                        currentPage={currentPage}
                        setPage={setCurrentPage}
                      />
                    </AnimatedWrapper>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-gray-500">
                    {t("no_locations_found")}
                  </CardContent>
                </Card>
              )}
            </div>
          </RightPanelContent>
          <RightPanelFooter>
            {childLocations && childLocations.count > ITEMS_PER_PAGE && (
              <div className="flex justify-center">
                <Pagination
                  data={{ totalCount: childLocations.count }}
                  onChange={setCurrentPage}
                  defaultPerPage={ITEMS_PER_PAGE}
                  cPage={currentPage}
                />
              </div>
            )}
          </RightPanelFooter>
        </RightPanel>
      )}
      <LocationSheet
        open={isSheetOpen}
        onOpenChange={handleSheetClose}
        location={locationToEdit || undefined}
        facilityId={facilityId}
        parentId={locationId || undefined}
      />
    </TwoColumnLayout>
  );
}
