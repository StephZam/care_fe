import { useQueries, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { NavTabs } from "@/components/ui/nav-tabs";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface FacilityOrganizationSelectorProps {
  value?: string[] | null;
  onChange: (value: string[] | null) => void;
  facilityId: string;
  currentOrganizations?: FacilityOrganizationRead[];
  singleSelection?: boolean;
  optional?: boolean;
}

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const {
    onChange,
    facilityId,
    currentOrganizations,
    singleSelection = false,
  } = props;

  const [selectedOrganizations, setSelectedOrganizations] = useState<
    (FacilityOrganizationRead & { fullPath: string[] })[]
  >([]);
  const [currentSelection, setCurrentSelection] =
    useState<FacilityOrganizationRead | null>(null);
  const [navigationLevels, setNavigationLevels] = useState<
    FacilityOrganizationRead[]
  >([]);
  const [facilityOrgSearch, setFacilityOrgSearch] = useState("");
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [open, setOpen] = useState(false);
  const [, setAlreadySelected] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { data: rootOrganizations, isLoading: isLoadingRoot } = useQuery({
    queryKey: ["facilityOrganization", facilityOrgSearch, showAllOrgs],
    queryFn: query.debounced(
      showAllOrgs
        ? facilityOrganizationApi.list
        : facilityOrganizationApi.listMine,
      {
        pathParams: { facilityId },
        queryParams: {
          parent: "",
          name: facilityOrgSearch,
        },
      },
    ),
  });

  const organizationQueries = useQueries({
    queries: navigationLevels.map((level) => ({
      queryKey: ["organizations", level.id, facilityOrgSearch],
      queryFn: query.debounced(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: level.id,
          name: facilityOrgSearch,
        },
      }),
      enabled: !!level.id,
    })),
  });

  const handleSelect = (org: FacilityOrganizationRead) => {
    const isAlreadySelected = !!currentOrganizations?.find(
      (o) => o.id === org.id,
    );
    if (isAlreadySelected) {
      setAlreadySelected(true);
      setCurrentSelection(org);
      setFacilityOrgSearch("");
      return;
    }
    if (org.has_children) {
      setNavigationLevels([...navigationLevels, org]);
    } else {
      handleConfirmSelection(org);
    }
    setCurrentSelection(org);
    setFacilityOrgSearch("");
  };

  const handleConfirmSelection = useCallback(
    (org: FacilityOrganizationRead) => {
      if (!selectedOrganizations.some((o) => o.id === org.id)) {
        const orgWithPath = {
          ...org,
          fullPath: [...navigationLevels.map((o) => o.name), org.name],
        };

        const newSelection = [...selectedOrganizations, orgWithPath];
        setSelectedOrganizations(newSelection);
        onChange(newSelection.map((org) => org.id));
        setAlreadySelected(true);
      }
      setCurrentSelection(null);
      setNavigationLevels([]);
      setOpen(false);
    },
    [selectedOrganizations, onChange, navigationLevels],
  );

  const handleRemoveOrganization = (index: number) => {
    const newSelection = selectedOrganizations.filter((_, i) => i !== index);
    setSelectedOrganizations(newSelection);
    onChange(
      newSelection.length > 0 ? newSelection.map((org) => org.id) : null,
    );
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setSelectedOrganizations([]);
    setCurrentSelection(null);
    setNavigationLevels([]);
    onChange(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setNavigationLevels([]);
      setFacilityOrgSearch("");
    }
  };

  const getCurrentLevelOrganizations = useCallback(() => {
    if (navigationLevels.length === 0) {
      return rootOrganizations?.results || [];
    }
    const lastQuery = organizationQueries[navigationLevels.length - 1];
    return lastQuery?.data?.results || [];
  }, [navigationLevels, rootOrganizations, organizationQueries]);

  // Auto-select when there's only one organization available
  useEffect(() => {
    const availableOrganizations = getCurrentLevelOrganizations();

    // Only auto-select if:
    // 1. We're at the root level (no navigation levels)
    // 2. There's exactly one organization
    // 3. No search is active
    // 4. No organizations are currently selected
    // 5. Not loading
    if (
      navigationLevels.length === 0 &&
      availableOrganizations.length === 1 &&
      !facilityOrgSearch &&
      selectedOrganizations.length === 0 &&
      !isLoadingRoot
    ) {
      const singleOrg = availableOrganizations[0];

      // Check if this organization is already selected in currentOrganizations prop
      const isAlreadyInCurrent = currentOrganizations?.find(
        (org) => org.id === singleOrg.id,
      );

      if (!isAlreadyInCurrent && !props.optional) {
        handleConfirmSelection(singleOrg);
      }
    }
  }, [
    getCurrentLevelOrganizations,
    handleConfirmSelection,
    navigationLevels,
    facilityOrgSearch,
    selectedOrganizations,
    isLoadingRoot,
    currentOrganizations,
    props.optional,
  ]);

  const renderNavigationPath = () => {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {navigationLevels.map((org, index) => (
          <div key={org.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setNavigationLevels(navigationLevels.slice(0, index + 1));
                setFacilityOrgSearch("");
              }}
              className="text-sm font-medium text-gray-950 hover:text-sky-600 cursor-pointer"
            >
              {org.name}
            </button>
            <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  };

  const renderOrganizationCommand = (className?: string) => {
    return (
      <Command className={className}>
        <div className="flex items-center px-3 py-3 border-b">
          <Search className="size-3 mr-2 text-gray-700" />
          <span className="font-medium text-sm text-gray-700">
            {t("search_department")}
          </span>
        </div>
        <CommandList onWheel={(e) => e.stopPropagation()}>
          <CommandEmpty>
            {isLoadingRoot ||
            organizationQueries[navigationLevels.length - 1]?.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">
                  {t("loading_organizations")}
                </span>
              </div>
            ) : (
              t("no_organizations_found")
            )}
          </CommandEmpty>
          <CommandGroup>
            {!(
              isLoadingRoot ||
              organizationQueries[navigationLevels.length - 1]?.isLoading
            ) &&
              getCurrentLevelOrganizations().map((org) => {
                const isSelected = currentSelection?.id === org.id;
                return (
                  <CommandItem
                    key={org.id}
                    value={org.name}
                    onSelect={() => handleSelect(org)}
                    className={cn(
                      "flex items-center justify-between px-4 py-4",
                      isSelected && "bg-gray-100",
                      "border-b border-gray-200",
                    )}
                  >
                    <div className="flex items-center gap-2 text-gray-950">
                      <span>{org.name}</span>
                    </div>
                    {org.has_children ? (
                      <ChevronRight className="size-4 text-gray-500" />
                    ) : (
                      <span className="size-1 rounded-full bg-black mr-1"></span>
                    )}
                  </CommandItem>
                );
              })}
          </CommandGroup>
        </CommandList>
        {currentSelection && (
          <div className="md:m-0 m-4 flex items-center justify-between px-4 py-2  bg-indigo-50 border-sky-200 rounded-md mx-1 mb-1">
            <div className="flex flex-col">
              <span className="text-xs text-gray-700 mb-0.5">
                {t("selected")}
              </span>
              {navigationLevels.length > 0 && (
                <div className="items-center py-1 border-b">
                  {renderNavigationPath()}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 underline"
                onClick={() => setCurrentSelection(null)}
              >
                <span>{t("cancel")}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-primary-600 text-primary-700"
                onClick={() => handleConfirmSelection(currentSelection)}
                disabled={isDisabled}
                data-cy="confirm-organization"
              >
                <CareIcon icon="l-check" className="size-4" />
                <span>{t("confirm")}</span>
              </Button>
            </div>
          </div>
        )}
      </Command>
    );
  };

  const isDisabled = useMemo(() => {
    return (
      selectedOrganizations.some((org) => org.id === currentSelection?.id) ||
      (!!currentOrganizations &&
        currentOrganizations.some((org) => org.id === currentSelection?.id))
    );
  }, [currentSelection, currentOrganizations, selectedOrganizations]);

  return (
    <div className="space-y-4">
      <NavTabs
        tabs={{
          mine: { label: t("my_organizations"), component: <></> },
          all: { label: t("all_organizations"), component: <></> },
        }}
        currentTab={showAllOrgs ? "all" : "mine"}
        onTabChange={handleOrganizationViewChange}
        tabContentClassName="hidden"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Label>
            {t("select_department")}
            {!props.optional && <span className="text-red-500 ml-0.5">*</span>}
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex flex-col gap-4">
            {(!singleSelection ||
              (singleSelection && selectedOrganizations.length < 1)) &&
              (isMobile ? (
                <>
                  <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between border-gray-100"
                        data-cy="facility-organization"
                        onClick={() => setOpen(true)}
                        type="button" // Prevents unintended form submission
                      >
                        {open || navigationLevels.length > 0 ? (
                          <div className="items-center py-1 border-b">
                            {renderNavigationPath()}
                          </div>
                        ) : (
                          <span>{t("select_department")}</span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="min-h-[50vh] max-h-[85vh]">
                      {renderOrganizationCommand()}
                    </DrawerContent>
                  </Drawer>
                </>
              ) : (
                <Popover open={open} onOpenChange={handleOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between border-gray-300"
                      data-cy="facility-organization"
                    >
                      {open || navigationLevels.length > 0 ? (
                        <div className="items-center py-1 border-b">
                          {renderNavigationPath()}
                        </div>
                      ) : (
                        <span>{t("select_department")}</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={4}
                    className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[80vh] overflow-auto"
                  >
                    {renderOrganizationCommand()}
                  </PopoverContent>
                </Popover>
              ))}
            {selectedOrganizations.length > 0 && (
              <>
                <span className="font-semibold text-sm text-gray-950 mt-3">
                  {t("newly_added_organizations")}
                </span>
                {selectedOrganizations.map((org, index) => (
                  <div
                    key={index}
                    className="flex-1 flex items-center gap-3 rounded-md border border-sky-300 bg-sky-50/100"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap ml-3">
                        {org.fullPath && org.fullPath.length > 0 ? (
                          org.fullPath.map((name, idx) => (
                            <span
                              key={idx}
                              className="flex items-center text-sm text-gray-900"
                            >
                              <span
                                className={
                                  idx === org.fullPath.length - 1
                                    ? "font-semibold"
                                    : "text-gray-700"
                                }
                              >
                                {name}
                              </span>
                              {idx < org.fullPath.length - 1 && (
                                <ArrowRight className="mx-1 h-3.5 w-3.5 text-gray-500" />
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="font-medium text-sm text-gray-900">
                            {org.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-gray-500 hover:text-gray-900"
                      onClick={() => handleRemoveOrganization(index)}
                    >
                      <X className="size-4" />
                      <span className="sr-only">
                        {t("remove_organization")}
                      </span>
                    </Button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
