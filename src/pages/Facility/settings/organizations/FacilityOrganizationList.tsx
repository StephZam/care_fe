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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

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
    <>
      <Page
        title={t("departments_or_teams")}
        hideTitleOnPage
        className="p-0 flex flex-col"
      >
        <div className="shrink-0 container mx-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4">
            <h3>{t("departments_or_teams")}</h3>
          </div>
        </div>
        <div className="flex-1 flex">
          <div className="container mx-auto flex-1 flex min-h-0">
            <ResizablePanelGroup
              direction="horizontal"
              className="flex-1 rounded-lg h-full min-h-0"
            >
              <ResizablePanel
                defaultSize={20}
                minSize={15}
                maxSize={30}
                className="hidden md:flex flex-col overflow-hidden"
              >
                <div className="flex-1">
                  <div className="h-full w-full">
                    <FacilityOrganizationNavbar
                      facilityId={facilityId}
                      selectedOrganizationId={organizationId || null}
                      expandedOrganizations={expandedOrganizations}
                      onToggleExpand={handleToggleExpand}
                      onOrganizationSelect={handleOrganizationSelect}
                    />
                  </div>
                </div>
              </ResizablePanel>
              <ResizableHandle
                withHandle
                className="hidden md:flex items-center justify-center"
              />
              <ResizablePanel
                defaultSize={80}
                className="pl-0 md:pl-4 overflow-hidden"
              >
                <div className="flex flex-col h-full w-full">
                  <div className="flex-1 w-full h-full rounded-lg md:shadow-lg md:bg-white overflow-y-auto">
                    {organizationId && (
                      <div className="md:pt-2 flex items-center">
                        <Breadcrumb className="md:px-1">
                          <BreadcrumbList>
                            <BreadcrumbItem>
                              <BreadcrumbLink
                                asChild
                                className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                                onClick={() =>
                                  navigate(
                                    `/facility/${facilityId}/settings/departments`,
                                  )
                                }
                              >
                                <button type="button">
                                  {t("departments")}
                                </button>
                              </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem>
                              <BreadcrumbSeparator />
                            </BreadcrumbItem>
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
                                <BreadcrumbItem key={`ellipsis-${parent.id}`}>
                                  <BreadcrumbSeparator />
                                </BreadcrumbItem>
                              </React.Fragment>
                            ))}
                            <BreadcrumbItem key={org?.id}>
                              <span className="font-semibold text-gray-900">
                                {org?.name}
                              </span>
                            </BreadcrumbItem>
                          </BreadcrumbList>
                        </Breadcrumb>
                      </div>
                    )}
                    <Page
                      hideTitleOnPage
                      title={org?.name || ""}
                      className="flex flex-col flex-1"
                    >
                      {organizationId && org && (
                        <>
                          <div className="flex items-center">
                            <h2 className="text-xl font-semibold">
                              {org.name}
                            </h2>
                            {org.org_type && (
                              <Badge variant="indigo" className="ml-2 w-auto">
                                {t(
                                  `facility_organization_type__${org.org_type}`,
                                )}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2">
                            {org.description && (
                              <p className="text-sm text-gray-500 break-all whitespace-normal">
                                {org.description}
                              </p>
                            )}
                            <Tabs
                              defaultValue={currentTab}
                              className="w-full mt-2"
                              value={currentTab}
                              onValueChange={handleTabChange}
                            >
                              <TabsList className="w-full justify-start border-b border-gray-300 bg-transparent p-0 h-auto rounded-none">
                                {navItems.map((item) => (
                                  <TabsTrigger
                                    key={item.value}
                                    value={item.value}
                                    className="border-0 border-b-2 border-transparent px-2 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                                    data-cy={`${item.value}-tab`}
                                  >
                                    {item.title}
                                  </TabsTrigger>
                                ))}
                              </TabsList>
                            </Tabs>
                          </div>
                        </>
                      )}
                      <div className="mt-4 flex-1 overflow-y-auto">
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
                      </div>
                    </Page>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </Page>
    </>
  );
}
