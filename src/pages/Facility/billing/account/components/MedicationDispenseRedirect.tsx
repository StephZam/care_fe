import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "raviger";

interface MedicationDispenseRedirectProps {
  facilityId: string;
  service_resource_id: string;
}

const MedicationDispenseRedirect = ({
  facilityId,
  service_resource_id,
}: MedicationDispenseRedirectProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["medication_dispense", service_resource_id],
    queryFn: query(medicationDispenseApi.get, {
      pathParams: { id: service_resource_id },
    }),
    enabled: !!service_resource_id,
  });

  if (isLoading) {
    return <Loading />;
  }

  const locationId = data?.location?.id;
  const dispenseOrderId = data?.order?.id;
  if (facilityId && locationId && dispenseOrderId) {
    return (
      <Redirect
        to={`/facility/${facilityId}/locations/${locationId}/medication_dispense/order/${dispenseOrderId}`}
      />
    );
  }
  return <Loading />;
};

export default MedicationDispenseRedirect;
