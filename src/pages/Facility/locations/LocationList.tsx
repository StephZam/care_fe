import { useQuery } from "@tanstack/react-query";
import React from "react";

import { useLocationState } from "@/hooks/useLocationState";

import query from "@/Utils/request/query";
import LocationContent from "@/pages/Facility/locations/LocationContent";
import LocationNavbar from "@/pages/Facility/locations/LocationNavbar";
import { LocationRead as LocationListType } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

export default function LocationList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId?: string;
}) {
  const {
    selectedLocationId,
    selectedLocation,
    expandedLocations,
    searchQuery,
    currentPage,
    handleLocationSelect,
    handleToggleExpand,
    handleSearchChange,
    handlePageChange,
  } = useLocationState(
    `/facility/${facilityId}/encounters/locations`,
    "encounters",
    locationId,
  );

  // Fetch location details if locationId is provided
  const { data: locationDetail } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
    enabled: !!locationId,
  });

  const displayLocation = React.useMemo(() => {
    if (!locationDetail) return selectedLocation;
    return {
      ...locationDetail,
      has_children: false,
      current_encounter: undefined,
    } as LocationListType;
  }, [locationDetail, selectedLocation]);

  return (
    <div className="flex px-4 space-x-4 min-h-[calc(100vh-10rem)]">
      <LocationNavbar
        facilityId={facilityId}
        selectedLocationId={selectedLocationId}
        expandedLocations={expandedLocations}
        onLocationSelect={handleLocationSelect}
        onToggleExpand={handleToggleExpand}
      />
      <LocationContent
        facilityId={facilityId}
        selectedLocationId={selectedLocationId}
        selectedLocation={displayLocation}
        searchQuery={searchQuery}
        currentPage={currentPage}
        onLocationSelect={handleLocationSelect}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
