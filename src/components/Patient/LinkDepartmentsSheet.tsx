import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Blocks, Building, Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import DottedDivider from "@/components/ui/dotteddivider";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import { BatchRequestBody } from "@/types/base/batch/batch";
import batchApi from "@/types/base/batch/batchApi";
import deviceApi from "@/types/device/deviceApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import locationApi from "@/types/location/locationApi";

interface Props {
  entityType: "encounter" | "location" | "device";
  entityId: string;
  currentOrganizations: FacilityOrganizationRead[];
  facilityId: string;
  trigger?: React.ReactNode;
  onUpdate?: () => void;
  orgType?: "organization" | "managing_organization";
  open?: boolean;
  setOpen?: (open: boolean) => void;
}

type MutationRoute =
  | typeof encounterApi.addOrganization
  | typeof encounterApi.removeOrganization
  | typeof locationApi.addOrganization
  | typeof locationApi.removeOrganization
  | typeof deviceApi.addOrganization
  | typeof deviceApi.removeOrganization;

interface EncounterPathParams {
  encounterId: string;
}

interface LocationPathParams {
  facilityId: string;
  id: string;
}

interface DevicePathParams {
  facilityId: string;
  id: string;
}

type PathParams = EncounterPathParams | LocationPathParams | DevicePathParams;

interface MutationParams {
  route: MutationRoute;
  pathParams: PathParams;
  queryKey: string[];
}

function getMutationParams(
  entityType: "encounter" | "location" | "device",
  entityId: string,
  facilityId: string,
  isAdd: boolean,
): MutationParams {
  if (entityType === "encounter") {
    return {
      route: isAdd
        ? encounterApi.addOrganization
        : encounterApi.removeOrganization,
      pathParams: { encounterId: entityId } as EncounterPathParams,
      queryKey: ["encounter", entityId],
    };
  } else if (entityType === "location") {
    return {
      route: isAdd
        ? locationApi.addOrganization
        : locationApi.removeOrganization,
      pathParams: {
        facilityId,
        id: entityId,
      } as LocationPathParams,
      queryKey: ["location", entityId],
    };
  }

  return {
    route: isAdd ? deviceApi.addOrganization : deviceApi.removeOrganization,
    pathParams: {
      facilityId,
      id: entityId,
    } as DevicePathParams,
    queryKey: ["device", entityId],
  };
}

function getInvalidateQueries(
  entityType: "encounter" | "location" | "device",
  entityId: string,
) {
  if (entityType === "encounter") {
    return ["encounter", entityId];
  } else if (entityType === "location") {
    return ["location", entityId, "organizations"];
  }
  return ["device", entityId, "organizations"];
}

function DeleteOrganizationButton({
  organizationId,
  entityType,
  entityId,
  facilityId,
  onSuccess,
}: {
  organizationId: string;
  entityType: "encounter" | "location" | "device";
  entityId: string;
  facilityId: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();

  const { mutate: removeOrganization, isPending } = useMutation({
    mutationFn: (organizationId: string) => {
      const { route, pathParams } = getMutationParams(
        entityType,
        entityId,
        facilityId,
        false,
      );
      return mutate(route, {
        pathParams,
        body: { organization: organizationId },
      })({ organization: organizationId });
    },
    onSuccess: () => {
      const { queryKey } = getMutationParams(
        entityType,
        entityId,
        facilityId,
        false,
      );
      queryClient.invalidateQueries({ queryKey });
      toast.success(t("organization_removed_successfully"));
      onSuccess?.();
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={() => removeOrganization(organizationId)}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin mr-1" />
      ) : (
        <Trash2 className="size-4 text-red-700" />
      )}
      <span className="text-sm">{t("delete")}</span>
    </Button>
  );
}

export default function LinkDepartmentsSheet({
  entityType,
  entityId,
  currentOrganizations,
  facilityId,
  trigger,
  onUpdate,
  ...props
}: Props) {
  const { t } = useTranslation();

  const [open, _setOpen] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[] | null>(null);
  const queryClient = useQueryClient();

  const getOrganizationPath = useCallback(
    (org: FacilityOrganizationRead): string[] => {
      const path: string[] = [org.name];
      let currentParent = org.parent;
      while (currentParent) {
        path.unshift(currentParent.name);
        currentParent = currentParent.parent;
      }
      return path;
    },
    [],
  );

  useEffect(() => {
    if (props.open != null) {
      _setOpen(props.open);
    }
  }, [props.open]);

  const setOpen = (open: boolean) => {
    _setOpen(open);
    props.setOpen?.(open);
  };

  const { mutate: submitBatch, isPending: isAdding } = useMutation({
    mutationFn: mutate(batchApi.batchRequest, { silent: true }),
    onSuccess: () => {
      const invalidateQueries = getInvalidateQueries(entityType, entityId);
      queryClient.invalidateQueries({ queryKey: invalidateQueries });
      toast.success(t("organization_added_successfully"));
      setSelectedOrgs(null);
      setOpen(false);
      onUpdate?.();
    },
    onError: (error) => {
      try {
        const errorData = error.cause as {
          results?: {
            data?: { detail?: string; errors?: { msg: string }[] };
          }[];
        };

        const errorMessages = errorData?.results
          ?.flatMap(
            (result) =>
              result?.data?.errors?.map((err) => err.msg) || // Extract from `errors[].msg`
              (result?.data?.detail ? [result.data.detail] : []), // Extract from `data.detail`
          )
          .filter(Boolean); // Remove undefined/null values

        if (errorMessages?.length) {
          errorMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error("An unexpected error occurred");
        }
      } catch {
        toast.error("An unexpected error occurred");
      }
    },
  });

  const handleAddOrganizations = () => {
    if (!selectedOrgs?.length) return;

    const { route, pathParams } = getMutationParams(
      entityType,
      entityId,
      facilityId,
      true,
    );

    const batchRequest: BatchRequestBody = {
      requests: selectedOrgs.map((orgId) => {
        const resolvedPath = route.path
          .replace("{facilityId}", facilityId)
          .replace("{id}", entityId)
          .replace("{encounterId}", entityId);

        return {
          url: resolvedPath,
          method: "POST",
          reference_id: `Add Organization ${orgId}`,
          body: {
            ...(entityType === "device"
              ? {
                  managing_organization: orgId,
                }
              : {
                  organization: orgId,
                }),
          },
          pathParams,
        };
      }),
    };

    submitBatch(batchRequest);
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Building className="mr-2 size-4" />
            {t("manage_department/team", {
              count: entityType === "device" ? 1 : 2,
            })}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-full overflow-auto sm:max-w-none md:w-[50vw] lg:w-[25vw]">
        <SheetHeader>
          <SheetTitle>
            {t("manage_department/team", {
              count: entityType === "device" ? 1 : 2,
            })}
          </SheetTitle>
          <SheetDescription className="text-gray-700">
            {t("manage_department/team_description", {
              entityType,
              count: entityType === "device" ? 1 : 2,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-6">
              <div className="space-y-3">
                {currentOrganizations.length > 0 ? (
                  <>
                    <h3 className="text-sm font-semibold text-gray-950">
                      {t("linked_department", {
                        count: entityType === "device" ? 1 : 0,
                      })}
                    </h3>
                    <div className="space-y-2">
                      {currentOrganizations.map((org) => (
                        <div
                          key={org.id}
                          className="flex items-start sm:items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2"
                        >
                          <div className="flex-1 min-w-0">
                            <div
                              className="flex flex-wrap items-center gap-1 text-base text-gray-900 break-words"
                              data-cy="link-organisation-name"
                            >
                              {getOrganizationPath(org).map(
                                (name, idx, arr) => (
                                  <span key={idx} className="flex items-center">
                                    <span
                                      className={
                                        idx === arr.length - 1
                                          ? "font-semibold"
                                          : "text-gray-900"
                                      }
                                    >
                                      {name}
                                    </span>
                                    {idx < arr.length - 1 && idx !== 0 && (
                                      <ArrowRight className="mx-1 size-3 text-gray-700" />
                                    )}
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <DeleteOrganizationButton
                              organizationId={org.id}
                              entityType={entityType}
                              entityId={entityId}
                              facilityId={facilityId}
                              onSuccess={onUpdate}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-50 px-4 py-2 sm:p-6 rounded-md space-y-2 sm:space-y-3 text-center border-t-2 border-x border-gray-200">
                    <Blocks className="size-5 sm:size-6 mx-auto" />
                    <p className="text-sm sm:text-base text-gray-950 font-medium">
                      {t("no_department_linked_yet", {
                        count: entityType === "device" ? 1 : 2,
                      })}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t(
                        "start_by_adding_departments/teams_from_your_organizations",
                      )}
                    </p>
                  </div>
                )}
              </div>
              <DottedDivider />
              <FacilityOrganizationSelector
                facilityId={facilityId}
                value={selectedOrgs}
                onChange={setSelectedOrgs}
                currentOrganizations={currentOrganizations}
                singleSelection={entityType === "device"}
              />

              <div className="flex gap-2 justify-end mt-4">
                <Button
                  variant="outline"
                  data-cy="cancel-organization"
                  onClick={() => setSelectedOrgs(null)}
                  disabled={!selectedOrgs?.length}
                >
                  {t("cancel")}
                </Button>
                <Button
                  data-cy="add-organization"
                  onClick={handleAddOrganizations}
                  disabled={!selectedOrgs?.length || isAdding}
                >
                  {isAdding && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t("save_departments", {
                    count: entityType === "device" ? 1 : 0,
                  })}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
