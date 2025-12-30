import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  LeftPanel,
  RightPanel,
  RightPanelHeader,
  TwoColumnLayout,
} from "@/components/Common/TwoColumnLayout";
import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  FacilityOrganizationParent,
  FacilityOrganizationRead,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import FacilityOrganizationUsers from "./FacilityOrganizationUsers";
import FacilityOrganizationView from "./FacilityOrganizationView";
import FacilityOrganizationNavbar from "./components/FacilityOrganizationNavbar";

interface Props {
  organizationId?: string;
  currentTab?: string;
}

export default function FacilityOrganizationList({
  organizationId,
  currentTab = "departments",
}: Props) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, md: false });
  const [expandedOrganizations, setExpandedOrganizations] = useState<
    Set<string>
  >(new Set([]));

  const { facility, facilityId } = useCurrentFacility();

  const { data: org } = useQuery({
    queryKey: ["facilityOrganization", organizationId],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: { facilityId, organizationId: organizationId! },
    }),
    enabled: !!organizationId,
  });

  const handleOrganizationSelect = useCallback(
    (organization: FacilityOrganizationRead) => {
      navigate(
        `/facility/${facilityId}/settings/departments/${organization.id}/${currentTab}`,
      );
    },
    [facilityId, currentTab],
  );

  const handleToggleExpand = useCallback((organizationId: string) => {
    setExpandedOrganizations((prev) => {
      const next = new Set(prev);
      if (next.has(organizationId)) {
        next.delete(organizationId);
      } else {
        next.add(organizationId);
      }
      return next;
    });
  }, []);

  // Auto-expand parent organizations when a child is selected
  useEffect(() => {
    if (org?.parent?.id) {
      setExpandedOrganizations((prev) => {
        const next = new Set(prev);
        let currentParent = org.parent;
        while (currentParent?.id) {
          next.add(currentParent.id);
          currentParent = currentParent.parent;
        }
        return next;
      });
    }
  }, [org?.parent]);

  const navItems = [
    ...(organizationId
      ? [
          {
            path: `/facility/${facilityId}/settings/departments/${organizationId}/users`,
            title: t("users"),
            value: "users",
          },
        ]
      : []),
    {
      path: organizationId
        ? `/facility/${facilityId}/settings/departments/${organizationId}/departments`
        : `/facility/${facilityId}/settings/departments`,
      title: t("departments_or_teams"),
      value: "departments",
    },
  ];

  const handleTabChange = useCallback(
    (tab: string) => {
      if (organizationId) {
        navigate(
          `/facility/${facilityId}/settings/departments/${organizationId}/${tab}`,
        );
      } else {
        navigate(`/facility/${facilityId}/settings/departments`);
      }
    },
    [facilityId, organizationId],
  );

  const handleParentClick = useCallback(
    (parentId: string) => {
      navigate(
        `/facility/${facilityId}/settings/departments/${parentId}/${currentTab}`,
      );
    },
    [facilityId, currentTab],
  );

  const orgParents: FacilityOrganizationParent[] = [];
  let currentParent = org?.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <TwoColumnLayout>
      {!isMobile && (
        <LeftPanel title={t("departments_or_teams")}>
          <FacilityOrganizationNavbar
            facilityId={facilityId}
            selectedOrganizationId={organizationId || null}
            expandedOrganizations={expandedOrganizations}
            onToggleExpand={handleToggleExpand}
            onOrganizationSelect={handleOrganizationSelect}
          />
        </LeftPanel>
      )}

      <RightPanel>
        {organizationId && org && (
          <RightPanelHeader className="border-b-0">
            <div className="w-full space-y-3">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                      onClick={() =>
                        navigate(`/facility/${facilityId}/settings/departments`)
                      }
                    >
                      <button type="button">{t("departments")}</button>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  {orgParents.reverse().map((parent) => (
                    <React.Fragment key={parent.id}>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          asChild
                          className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                          onClick={() => handleParentClick(parent.id)}
                        >
                          <button type="button">{parent.name}</button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                    </React.Fragment>
                  ))}
                  <BreadcrumbItem key={org?.id}>
                    <span className="font-semibold text-gray-900">
                      {org?.name}
                    </span>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center">
                <h2 className="text-xl font-semibold">{org.name}</h2>
                {org.org_type && (
                  <Badge variant="indigo" className="ml-2 w-auto">
                    {t(`facility_organization_type__${org.org_type}`)}
                  </Badge>
                )}
              </div>

              {org.description && (
                <p className="text-sm text-gray-500 break-all whitespace-normal">
                  {org.description}
                </p>
              )}

              <Tabs
                defaultValue={currentTab}
                className="w-full"
                value={currentTab}
                onValueChange={handleTabChange}
              >
                <TabsList className="justify-start border-b border-gray-300 bg-transparent p-0 h-auto rounded-none">
                  {navItems.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      className="border-0 border-b-2 border-transparent px-2 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                    >
                      {item.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </RightPanelHeader>
        )}

        {currentTab === "users" && organizationId ? (
          <FacilityOrganizationUsers
            id={organizationId}
            facilityId={facilityId}
            permissions={facility?.permissions ?? []}
          />
        ) : (
          <FacilityOrganizationView
            id={organizationId}
            facilityId={facilityId}
            permissions={facility?.permissions ?? []}
          />
        )}
      </RightPanel>
    </TwoColumnLayout>
  );
}
