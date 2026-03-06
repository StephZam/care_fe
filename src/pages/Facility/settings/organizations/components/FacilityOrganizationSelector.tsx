import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Building,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Star,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface FacilityOrganizationSelectorProps {
  value?: string[] | null;
  onChange: (value: string[] | null) => void;
  facilityId: string;
  currentOrganizations?: FacilityOrganizationRead[];
  singleSelection?: boolean;
  optional?: boolean;
  favoriteList?: string;
}

export default function FacilityOrganizationSelector(
  props: FacilityOrganizationSelectorProps,
) {
  const { t } = useTranslation();
  const {
    value,
    onChange,
    facilityId,
    currentOrganizations,
    singleSelection = false,
    favoriteList,
  } = props;

  const queryClient = useQueryClient();

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
  const [hasAutoSelectedPreferred, setHasAutoSelectedPreferred] =
    useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Fetch preferred organizations
  const { data: preferredOrganizations, isLoading: isLoadingPreferred } =
    useQuery({
      queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      queryFn: query(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          favorite_list: favoriteList,
        },
      }),
      enabled: !!favoriteList,
    });

  const preferredOrgIds = useMemo(() => {
    return preferredOrganizations?.results?.map((org) => org.id) || [];
  }, [preferredOrganizations]);

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

  useEffect(() => {
    if (value && value.length > 0) {
      const resolvedOrganizations = value
        .map((id) => currentOrganizations?.find((org) => org.id === id))
        .filter((org) => org !== undefined)
        .map((org) => ({
          ...org,
          fullPath: [org.name],
        }));
      if (resolvedOrganizations.length > 0) {
        setSelectedOrganizations(resolvedOrganizations);
      }
    } else {
      setSelectedOrganizations([]);
    }
  }, [value, currentOrganizations, showAllOrgs]);

  const handleSelect = (org: FacilityOrganizationRead) => {
    const isAlreadySelected =
      !!currentOrganizations?.find((o) => o.id === org.id) ||
      selectedOrganizations.some((o) => o.id === org.id);
    if (isAlreadySelected) {
      setCurrentSelection(org);
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

        const newSelection = singleSelection
          ? [orgWithPath]
          : [...selectedOrganizations, orgWithPath];
        setSelectedOrganizations(newSelection);
        onChange(newSelection.map((org) => org.id));
      }
      setCurrentSelection(null);
      setNavigationLevels([]);
      setOpen(false);
    },
    [selectedOrganizations, onChange, navigationLevels, singleSelection],
  );

  const handleRemoveOrganization = (index: number) => {
    const newSelection = selectedOrganizations.filter((_, i) => i !== index);
    setSelectedOrganizations(newSelection);
    onChange(newSelection.map((org) => org.id));
  };

  const handleOrganizationViewChange = (value: string) => {
    setShowAllOrgs(value === "all");
    setCurrentSelection(null);
    setNavigationLevels([]);
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
      !isLoadingRoot &&
      !isLoadingPreferred &&
      preferredOrgIds.length === 0
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

  useEffect(() => {
    if (facilityOrgSearch.trim() === "" && navigationLevels.length === 0) {
      setCurrentSelection(null);
    }
  }, [facilityOrgSearch, navigationLevels]);

  useEffect(() => {
    if (props.value === null) {
      setSelectedOrganizations([]);
    }
  }, [props.value]);
  useEffect(() => {
    if (value && value.length > 0) {
      const resolvedOrganizations = value
        .map((id) => currentOrganizations?.find((org) => org.id === id))
        .filter((org) => org !== undefined)
        .map((org) => ({
          ...org,
          fullPath: [org.name],
        }));
      if (resolvedOrganizations.length > 0) {
        setSelectedOrganizations(resolvedOrganizations);
      }
    } else {
      setSelectedOrganizations([]);
      // Reset the auto-select flag when value is cleared (e.g., form reset)
      // setHasAutoSelectedPreferred(false);
    }
  }, [value, currentOrganizations, showAllOrgs]);

  // Auto-select preferred departments
  useEffect(() => {
    if (
      favoriteList &&
      preferredOrganizations?.results &&
      preferredOrganizations.results.length > 0 &&
      selectedOrganizations.length === 0 &&
      !hasAutoSelectedPreferred &&
      !value?.length
    ) {
      setSelectedOrganizations(
        preferredOrganizations.results.map((org) => ({
          ...org,
          fullPath: [org.name],
        })),
      );
      onChange(preferredOrganizations.results.map((org) => org.id));
      setHasAutoSelectedPreferred(true);
    }
  }, [
    favoriteList,
    preferredOrganizations,
    selectedOrganizations,
    hasAutoSelectedPreferred,
    value,
    onChange,
  ]);

  // Add favorite mutation
  const addFavoriteMutation = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(facilityOrganizationApi.addFavorite, {
        pathParams: { facilityId, organizationId },
      })({ favorite_list: favoriteList }),
    onSuccess: () => {
      toast.success(t("marked_as_preferred"));
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      });
    },
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (organizationId: string) =>
      mutate(facilityOrganizationApi.removeFavorite, {
        pathParams: { facilityId, organizationId },
      })({ favorite_list: favoriteList }),
    onSuccess: () => {
      toast.success(t("removed_from_preferred"));
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganization-favorites", facilityId, favoriteList],
      });
    },
  });

  const handleTogglePreferred = (
    e: React.MouseEvent,
    org: FacilityOrganizationRead,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const isPreferred = preferredOrgIds.includes(org.id);
    if (isPreferred) {
      removeFavoriteMutation.mutate(org.id);
    } else {
      addFavoriteMutation.mutate(org.id);
    }
  };

  const renderNavigationPath = () => {
    return (
      <Breadcrumb>
        <BreadcrumbList className="gap-1 sm:gap-1.5">
          {navigationLevels.map((org, index) => (
            <React.Fragment key={org.id}>
              <BreadcrumbItem>
                <BreadcrumbPage className="text-base text-gray-950">
                  {org.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
              {index < navigationLevels.length - 1 && (
                <BreadcrumbSeparator>
                  <ArrowRight className="size-2 sm:size-3 text-gray-700" />
                </BreadcrumbSeparator>
              )}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  const renderOrganizationCommand = (className?: string) => {
    return (
      <Command className={cn("flex flex-col", className)}>
        <div className="p-1 mb-1 shrink-0">
          <Tabs
            value={showAllOrgs ? "all" : "mine"}
            onValueChange={(value) => handleOrganizationViewChange(value)}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-2 text-medium">
              <TabsTrigger value="mine">{t("my_departments")}</TabsTrigger>
              <TabsTrigger value="all">{t("all_departments")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center px-2 mx-1 mb-1 border border-gray-300 rounded-md shrink-0">
          <CommandInput
            placeholder={t("search_department")}
            onValueChange={setFacilityOrgSearch}
            value={facilityOrgSearch}
            className="border-none focus:ring-0 text-medium text-gray-800 sm:text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[30vh]">
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
                        "flex items-center justify-between px-4 py-3 mb-1",
                        isSelected && "bg-gray-100",
                        "border-b border-gray-100",
                      )}
                    >
                      <div className="flex items-center gap-2 text-gray-950">
                        <span>{org.name}</span>
                      </div>
                      {org.has_children ? (
                        <ChevronRight className="size-4 text-gray-950" />
                      ) : (
                        <span className="size-1 rounded-full bg-black mr-1"></span>
                      )}
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </div>
        <div
          className={cn(
            "m-1 px-2 py-2 bg-gray-50 border rounded-md shrink-0",
            currentSelection ? "border-indigo-300" : "border-gray-200",
          )}
        >
          {currentSelection ? (
            isDisabled ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-1 flex-1">
                    <span className="text-sm text-gray-700 font-regular">
                      {t("selected")}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {currentSelection.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setCurrentSelection(null);
                      setNavigationLevels([]);
                    }}
                    className="text-sm text-gray-950 hover:text-gray-900 underline flex items-center gap-1 self-center"
                  >
                    <X className="size-4" />
                    <span>{t("clear")}</span>
                  </Button>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-md border whitespace-nowrap w-fit",
                    selectedOrganizations.some(
                      (org) => org.id === currentSelection.id,
                    )
                      ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                      : "bg-orange-100 text-orange-900 border-orange-300",
                  )}
                >
                  {selectedOrganizations.some(
                    (org) => org.id === currentSelection.id,
                  )
                    ? t("department_already_selected")
                    : t("department_already_linked")}
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-sm text-gray-700 font-regular block mb-1">
                      {t("selected")}
                    </span>
                    {navigationLevels.length > 0 && (
                      <div className="text-sm font-medium text-gray-900">
                        {renderNavigationPath()}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => {
                      setCurrentSelection(null);
                      setNavigationLevels([]);
                    }}
                    className="text-sm text-gray-950 hover:text-gray-900 underline self-center flex items-center gap-1"
                  >
                    <X className="size-4" />
                    <span>{t("clear")}</span>
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-indigo-200">
                  {navigationLevels.length > 1 ? (
                    <Button
                      variant="outline"
                      size="default"
                      className="gap-1 text-base font-regular flex items-center px-2 py-1"
                      onClick={() => {
                        setNavigationLevels(navigationLevels.slice(0, -1));
                        setCurrentSelection(
                          navigationLevels.length > 1
                            ? navigationLevels[navigationLevels.length - 2]
                            : null,
                        );
                      }}
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">{t("back")}</span>
                    </Button>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-3">
                    <Button
                      variant="ghost"
                      size="default"
                      className="underline hover:bg-transparent text-base text-gray-950 px-2 py-1"
                      onClick={() => {
                        setCurrentSelection(null);
                        setNavigationLevels([]);
                        setOpen(false);
                      }}
                    >
                      <span>{t("close")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="gap-2 border-primary-600 text-primary-700 bg-primary-50 hover:text-primary-600 px-2 py-1"
                      onClick={() =>
                        currentSelection &&
                        handleConfirmSelection(currentSelection)
                      }
                      disabled={!currentSelection || isDisabled}
                      data-cy="confirm-organization"
                    >
                      <Check className="text-primary-700 size-4" />
                      <span>{t("confirm")}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-between gap-2">
              {navigationLevels.length > 1 ? (
                <Button
                  variant="outline"
                  size="default"
                  className="gap-1 text-base sm:text-xs font-regular flex items-center px-2 py-1"
                  onClick={() => {
                    setNavigationLevels(navigationLevels.slice(0, -1));
                    setCurrentSelection(
                      navigationLevels.length > 1
                        ? navigationLevels[navigationLevels.length - 2]
                        : null,
                    );
                  }}
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">{t("back")}</span>
                </Button>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="default"
                  className="underline hover:bg-transparent text-base text-gray-950 px-2 py-1"
                  onClick={() => {
                    setCurrentSelection(null);
                    setNavigationLevels([]);
                    setOpen(false);
                  }}
                >
                  <span>{t("close")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="gap-2 border-primary-600 text-primary-700 bg-primary-50 hover:text-primary-600 px-2 py-1"
                  onClick={() =>
                    currentSelection && handleConfirmSelection(currentSelection)
                  }
                  disabled={!currentSelection || isDisabled}
                  data-cy="confirm-organization"
                >
                  <Check className="text-primary-700 size-4" />
                  <span>{t("confirm")}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
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
    <div className="space-y-2">
      {selectedOrganizations.length > 0 && (
        <>
          <span className="font-semibold text-sm text-gray-950 mt-3">
            {t("selected_department")}
          </span>
          {selectedOrganizations.map((org, index) => (
            <div
              key={index}
              className="relative flex justify-between items-center rounded-md border border-sky-300 bg-sky-50 px-2 py-1 mt-2"
            >
              <div className="flex flex-wrap items-center gap-1 text-base text-gray-900 ml-1 flex-1">
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
                        <ArrowRight className="mx-1 size-3 sm:size-3 text-gray-950 shrink-0" />
                      )}
                    </span>
                  ))
                ) : (
                  <span className="font-medium text-sm text-gray-900">
                    {org.name}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="text-gray-900 text-sm sm:text-sm -mr-2"
                onClick={() => handleRemoveOrganization(index)}
              >
                <X className="size-5" />
              </Button>
            </div>
          ))}
        </>
      )}
      <div className="mt-1">
        {selectedOrganizations.length > 0 ? (
          <Label className="mt-6">{t("select_another_department")}</Label>
        ) : (
          <Label>{t("select_department")}</Label>
        )}
      </div>

      <div className="space-y-3 mt-3">
        <div className="space-y-3">
          <div className="flex flex-col gap-4">
            {isMobile ? (
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
              <Popover
                open={open}
                onOpenChange={handleOpenChange}
                modal={false}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between border-gray-300 p-4 py-4"
                    data-cy="facility-organization"
                  >
                    {navigationLevels.length > 0 ? (
                      <div className="items-center py-1">
                        {renderNavigationPath()}
                      </div>
                    ) : (
                      <span className="text-base">
                        {t("select_department")}
                      </span>
                    )}
                    <ChevronDown className="ml-2 size-4 text-gray-950 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  sideOffset={4}
                  className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[52vh] overflow-auto"
                >
                  {renderOrganizationCommand()}
                </PopoverContent>
              </Popover>
            )}
            {selectedOrganizations.map((org, index) => {
              const isPreferred = preferredOrgIds.includes(org.id);
              return (
                <div
                  key={index}
                  className="flex-1 flex items-center gap-3 rounded-md border border-sky-100 bg-sky-50/50 p-2.5"
                >
                  <Building className="size-4 text-sky-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-sky-900 truncate">
                      {org.name}
                    </p>
                  </div>
                  {favoriteList && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "size-8 p-0",
                        isPreferred
                          ? "text-yellow-500 hover:text-yellow-600"
                          : "text-gray-400 hover:text-yellow-500",
                      )}
                      type="button"
                      onClick={(e) => handleTogglePreferred(e, org)}
                      disabled={
                        addFavoriteMutation.isPending ||
                        removeFavoriteMutation.isPending
                      }
                    >
                      <Star
                        className={cn("size-4", isPreferred && "fill-current")}
                      />
                      <span className="sr-only">
                        {isPreferred
                          ? t("remove_from_preferred")
                          : t("mark_as_preferred")}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 p-0 text-gray-500 hover:text-gray-900"
                    type="button"
                    onClick={() => handleRemoveOrganization(index)}
                  >
                    <X className="size-4" />
                    <span className="sr-only">{t("remove_organization")}</span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
