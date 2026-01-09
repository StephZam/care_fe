import { useView } from "@/Utils/useView";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { AnimatedWrapper } from "@/components/Common/AnimatedWrapper";
import Pagination from "@/components/Common/Pagination";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useLocationManagement } from "@/hooks/useLocationManagement";

import query from "@/Utils/request/query";
import { LocationTreeNode } from "@/pages/Facility/locations/LocationNavbar";
import facilityApi from "@/types/facility/facilityApi";
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
import LocationMap from "./LocationMap";
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
  const [activeTab, setActiveTab] = useView("locations", "list");
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

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId },
    }),
  });

  const { data: mapLocations } = useQuery({
    queryKey: ["locations", facilityId, "map"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        limit: 1000,
      },
    }),
    enabled: activeTab === "map",
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

  const tabSwitcher = (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "list" | "map")}
    >
      <TabsList className="flex">
        <TabsTrigger
          value="list"
          id="location-list-view"
          className="data-[state=active]:text-primary"
        >
          <CareIcon icon="l-list-ul" className="text-lg" />
          <span>{t("list")}</span>
        </TabsTrigger>
        <TabsTrigger
          value="map"
          id="location-map-view"
          className="data-[state=active]:text-primary"
        >
          <CareIcon icon="l-map" className="text-lg" />
          <span>{t("map")}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );

  const headerContent =
    activeTab === "map" ? (
      <div className="flex justify-end w-full">{tabSwitcher}</div>
    ) : (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
        <Input
          placeholder={t("search_by_name")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full lg:w-72"
        />
        <div className="flex gap-2 justify-between sm:justify-start sm:w-auto">
          {tabSwitcher}
          <Button
            variant="primary"
            onClick={handleAddLocation}
            className="px-6 sm:w-auto"
          >
            <CareIcon icon="l-plus" className="h-4 w-4 mr-2" />
            {t("add_location")}
          </Button>
        </div>
      </div>
    );

  const mainContent =
    activeTab === "map" ? (
      <LocationMap
        locations={mapLocations?.results || []}
        onLocationClick={handleLocationSelect}
        onLocationEdit={handleEditLocation}
        facilityName={facilityData?.name || t("facility")}
        searchQuery={searchQuery}
        isEditing={isSheetOpen}
      />
    ) : (
      <>
        <div className="hidden lg:block">
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
        </div>
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
      </>
    );

  return (
    <TwoColumnLayout>
      {!isMobile && activeTab !== "map" ? (
        <ResizablePanelGroup direction="horizontal" className="h-full gap-0">
          <ResizablePanel
            defaultSize={15}
            minSize={10}
            maxSize={20}
            className="overflow-hidden"
          >
            <LeftPanel title={t("locations")} className="w-full">
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
          </ResizablePanel>
          <ResizableHandle
            withHandle
            className="w-px bg-gray-300 hover:w-1 hover:bg-gray-500 transition-all cursor-col-resize m-0 p-0"
          />
          <ResizablePanel
            defaultSize={80}
            className="flex flex-col overflow-hidden"
          >
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
              <RightPanel className="flex flex-col h-full">
                <RightPanelHeader className="shrink-0">
                  {headerContent}
                </RightPanelHeader>
                <RightPanelContent className="flex-1 overflow-auto">
                  {mainContent}
                </RightPanelContent>
                <RightPanelFooter>
                  {activeTab === "list" &&
                    childLocations &&
                    childLocations.count > ITEMS_PER_PAGE && (
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
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <>
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
              <RightPanelHeader className="mt-0">
                {headerContent}
              </RightPanelHeader>
              <RightPanelContent>{mainContent}</RightPanelContent>
              <RightPanelFooter>
                {activeTab === "list" &&
                  childLocations &&
                  childLocations.count > ITEMS_PER_PAGE && (
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
        </>
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
