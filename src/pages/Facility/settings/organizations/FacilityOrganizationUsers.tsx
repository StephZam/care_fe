import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import {
  RightPanelContent,
  RightPanelFooter,
  RightPanelHeader,
} from "@/components/Common/TwoColumnLayout";
import { UserCard } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import AddUserSheet from "@/pages/Organization/components/AddUserSheet";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { OrganizationUserRole } from "@/types/organization/organization";

import useAuthUser from "@/hooks/useAuthUser";
import EditFacilityUserRoleSheet from "./components/EditFacilityUserRoleSheet";
import LinkFacilityUserSheet from "./components/LinkFacilityUserSheet";

interface Props {
  id: string;
  facilityId: string;
  permissions: string[];

  isServiceAccount?: boolean;
}

export default function FacilityOrganizationUsers({
  id,
  facilityId,
  permissions,
  isServiceAccount = false,
}: Props) {
  const [sheetState, setSheetState] = useState<{
    sheet: string;
    username: string;
  }>({
    sheet: "",
    username: "",
  });
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });
  const { t } = useTranslation();

  const authUser = useAuthUser();

  const openAddUserSheet = sheetState.sheet === "add";
  const openLinkUserSheet = sheetState.sheet === "link";

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: [
      "facilityOrganizationUsers",
      facilityId,
      id,
      qParams,
      isServiceAccount,
    ],
    queryFn: query.debounced(facilityOrganizationApi.listUsers, {
      pathParams: { facilityId, organizationId: id },
      queryParams: {
        search_text: qParams.search || undefined,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        is_service_account: isServiceAccount,
      },
    }),
    enabled: !!id,
  });

  const { hasPermission } = usePermissions();

  if (!id) {
    return null;
  }

  const {
    canManageFacilityOrganizationUsers,
    canCreateUser,
    canCreateServiceAccount,
  } = getPermissions(hasPermission, permissions);

  const { isGeoAdmin } = getPermissions(
    hasPermission,
    authUser?.permissions || [],
  );

  return (
    <>
      <RightPanelHeader className="flex-row items-center -mt-3 gap-4 border-0">
        <div className="relative">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
          />
          <Input
            placeholder={t("search_by_username")}
            value={qParams.search || ""}
            onChange={(e) => {
              updateQuery({ search: e.target.value || undefined });
            }}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0 justify-end ml-auto">
          {(isGeoAdmin || canCreateUser || canCreateServiceAccount) && (
            <AddUserSheet
              open={openAddUserSheet}
              setOpen={(open) => {
                setSheetState({ sheet: open ? "add" : "", username: "" });
              }}
              onUserCreated={(user) => {
                setSheetState({ sheet: "link", username: user.username });
              }}
              isServiceAccount={isServiceAccount}
            />
          )}
          {(isGeoAdmin || canManageFacilityOrganizationUsers) && (
            <LinkFacilityUserSheet
              facilityId={facilityId}
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                setSheetState({
                  sheet: open ? "link" : "",
                  username: "",
                });
              }}
              preSelectedUsername={sheetState.username}
              isServiceAccount={isServiceAccount}
            />
          )}
        </div>
      </RightPanelHeader>
      <RightPanelContent>
        {isLoadingUsers ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <CardGridSkeleton count={2} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:pb-6">
              {!users?.results?.length ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_users_found")}
                  </CardContent>
                </Card>
              ) : (
                users.results.map((userRole: OrganizationUserRole) => (
                  <UserCard
                    key={userRole.user.id}
                    user={userRole.user}
                    roleName={userRole.role.name}
                    facility={facilityId}
                    editRoleAction={
                      (isGeoAdmin || canManageFacilityOrganizationUsers) && (
                        <EditFacilityUserRoleSheet
                          facilityId={facilityId}
                          organizationId={id}
                          userRole={userRole}
                          trigger={
                            <Button
                              variant="link"
                              size="sm"
                              className="underline text-gray-500"
                            >
                              <span>{t("edit")}</span>
                            </Button>
                          }
                        />
                      )
                    }
                    isServiceAccount={isServiceAccount}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </RightPanelContent>
      <RightPanelFooter>
        {(users?.results || []).length > 0 &&
          users?.count &&
          users.count > resultsPerPage && (
            <Pagination totalCount={users.count} />
          )}
      </RightPanelFooter>
    </>
  );
}
