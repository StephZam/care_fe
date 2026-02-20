import query from "@/Utils/request/query";
import Loading from "@/components/Common/Loading";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";
import { useQuery } from "@tanstack/react-query";
import { Redirect } from "raviger";

interface MedicationDispenseRedirectProps {
  facilityId: string;
  serviceResourceId: string;
}

const MedicationDispenseRedirect = ({
  facilityId,
  serviceResourceId,
}: MedicationDispenseRedirectProps) => {
  const { data, isLoading } = useQuery({
    queryKey: ["medication_dispense", serviceResourceId],
    queryFn: query(medicationDispenseApi.get, {
      pathParams: { id: serviceResourceId },
    }),
    enabled: !!serviceResourceId,
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
