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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreVertical } from "lucide-react";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { FilterTabs } from "@/components/ui/filter-tabs";
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
          fullPath: [
            ...navigationLevels.map((o) => o.name),
            ...(navigationLevels.length &&
            navigationLevels[navigationLevels.length - 1].id === org.id
              ? []
              : [org.name]),
          ],
        };

        const newSelection = [...selectedOrganizations, orgWithPath];
        setSelectedOrganizations(newSelection);
        onChange(newSelection.map((org) => org.id));
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

  const renderNavigationPath = (linkStyle: boolean = false) => {
    return (
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {navigationLevels.map((org, index) => (
          <div key={org.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setNavigationLevels(navigationLevels.slice(0, index + 1));
                setFacilityOrgSearch("");
              }}
              className={`text-sm font-medium cursor-pointer ${
                linkStyle && index < navigationLevels.length - 1
                  ? "text-sky-600 underline underline-offset-4 hover:text-sky-700"
                  : "text-gray-950 hover:text-sky-600"
              }`}
            >
              {org.name}
            </button>
            {index < navigationLevels.length - 1 && (
              <ArrowRight className="!size-2 sm:!size-3 text-gray-950 flex-shrink-0" />
            )}
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
                      "flex items-center justify-between px-4 py-4 mb-1",
                      isSelected && "bg-gray-100",
                      "border-b border-gray-100",
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
            {currentSelection && (
              <div className="md:m-0 m-4 flex items-center justify-between px-4 py-2  bg-indigo-50 border-sky-200 rounded-md">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-700 mb-0.5">
                    {t("selected")}
                  </span>
                  {navigationLevels.length > 0 && (
                    <div className="items-center py-1">
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
                    <CareIcon
                      icon="l-check"
                      className="!size-4 text-gray-950"
                    />
                    <span>{t("confirm")}</span>
                  </Button>
                </div>
              </div>
            )}
          </CommandGroup>
        </CommandList>
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
      <FilterTabs
        value={showAllOrgs ? t("all_organizations") : t("my_organizations")}
        onValueChange={(value: string) => {
          handleOrganizationViewChange(
            value === t("all_organizations") ? "all" : "mine",
          );
        }}
        options={[t("my_organizations"), t("all_organizations")]}
        variant="underline"
        showAllOption={false}
        className="w-auto overflow-x-auto"
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Label>{t("select_department")}</Label>
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
                        className="w-full flex flex-row items-center justify-between border-gray-100 text-left px-2 py-5 gap-1 sm:gap-3"
                        data-cy="facility-organization"
                        onClick={() => setOpen(true)}
                        type="button" // Prevents unintended form submission
                      >
                        <span className="flex-1 break-words whitespace-normal text-sm sm:text-base">
                          {t("select_department")}
                        </span>
                        <ChevronDown className="size-4 shrink-0 opacity-50 self-center" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent className="min-h-[40vh] sm:min-h-[50vh] max-h-[75vh] sm:max-h-[85vh]">
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
                        <div className="items-center py-1">
                          {renderNavigationPath(true)}
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
                    className="relative flex justify-between rounded-md border border-sky-300 bg-sky-50/100 p-2"
                  >
                    <div className="flex flex-wrap items-center gap-1 text-sm text-gray-900 ml-1">
                      {org.fullPath && org.fullPath.length > 0 ? (
                        org.fullPath.map((name, idx) => (
                          <span key={idx} className="flex items-center">
                            <span
                              className={
                                idx === org.fullPath.length - 1
                                  ? "font-semibold"
                                  : "text-gray-950"
                              }
                            >
                              {name}
                            </span>
                            {idx < org.fullPath.length - 1 && (
                              <ArrowRight className="mx-1 size-3 sm:size-3 text-gray-500 flex-shrink-0" />
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="font-medium text-sm text-gray-900">
                          {org.name}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start flex-shrink-0 pr-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 sm:size-9 flex-shrink-0"
                          >
                            <MoreVertical className="size-3 sm:size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-auto min-w-0"
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 w-full justify-start text-xs sm:text-sm"
                            onClick={() => handleRemoveOrganization(index)}
                          >
                            <X className="size-4" />
                            <span>{t("remove")}</span>
                          </Button>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
