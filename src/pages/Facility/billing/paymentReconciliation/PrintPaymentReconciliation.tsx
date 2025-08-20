import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import {
  PAYMENT_RECONCILIATION_OUTCOME_COLORS,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

const statusMap: Record<
  PaymentReconciliationStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  draft: { label: "Draft", color: "secondary" },
  entered_in_error: { label: "Error", color: "destructive" },
};

const outcomeMap: Record<
  PaymentReconciliationOutcome,
  { label: string; color: string }
> = {
  complete: { label: "Complete", color: "success" },
  error: { label: "Error", color: "destructive" },
  queued: { label: "Queued", color: "secondary" },
  partial: { label: "Partial", color: "warning" },
};

const methodMap: Record<PaymentReconciliationPaymentMethod, string> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

type PrintPaymentReconciliationProps = {
  facilityId: string;
  paymentReconciliationId: string;
};

export function PrintPaymentReconciliation({
  facilityId,
  paymentReconciliationId,
}: PrintPaymentReconciliationProps) {
  const { t } = useTranslation();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
  });

  if (isLoading || !payment) {
    return <Loading />;
  }

  return (
    <PrintPreview title={`${t("payment_receipt")} #${payment.id}`}>
      <div className="w-full max-w-full min-w-0 box-border px-2 sm:px-4">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200 space-y-2 sm:space-y-0">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left w-full sm:w-auto order-2 sm:order-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold break-words">
                {t("payment_receipt")}
              </h1>
              <h2 className="text-gray-500 uppercase text-xs sm:text-sm tracking-wide mt-1 font-semibold">
                {t("payment")} #{payment.id}
                <span className="ml-2">
                  <Badge
                    variant={
                      PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                    }
                  >
                    {statusMap[payment.status]?.label}
                  </Badge>
                  <Badge
                    variant={
                      PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]
                    }
                    className="ml-2"
                  >
                    {outcomeMap[payment.outcome]?.label}
                  </Badge>
                </span>
              </h2>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 text-sm">
            <div className="min-w-0">
              <div className="font-semibold text-gray-500 mb-1 text-xs sm:text-sm">
                {t("payment_date")}
              </div>
              <div>
                <p>
                  {payment.payment_datetime
                    ? format(new Date(payment.payment_datetime), "MMM dd, yyyy")
                    : format(new Date(), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="text-left sm:text-right min-w-0">
              <div className="font-semibold text-gray-500 mb-1 text-xs sm:text-sm">
                {t("payment_method")}
              </div>
              <div>
                <p className="font-medium text-sm break-words">
                  {methodMap[payment.method]}
                </p>
              </div>
            </div>
            {(payment.reference_number || payment.authorization) && (
              <div className="sm:col-span-2 min-w-0">
                <div className="font-semibold text-gray-500 mb-1 text-xs sm:text-sm">
                  {t("reference_details")}
                </div>
                <div className="space-y-1">
                  {payment.reference_number && (
                    <p className="text-sm break-all">
                      {t("reference")}: {payment.reference_number}
                    </p>
                  )}
                  {payment.authorization && (
                    <p className="text-sm break-all">
                      {t("authorization")}: {payment.authorization}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-4 sm:my-6" />

          {/* Related Invoice */}
          {payment.target_invoice && (
            <>
              <h3 className="font-medium text-base sm:text-lg mb-3 break-words">
                {t("related_invoice")}
              </h3>
              <div className="mb-4 sm:mb-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">
                        {t("invoice_number")}
                      </TableHead>
                      <TableHead className="text-left">{t("title")}</TableHead>
                      <TableHead className="text-left">{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("amount")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="text-xs sm:text-sm break-all">
                          <div>#{payment.target_invoice.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{payment.target_invoice.number}</TableCell>
                      <TableCell>{payment.target_invoice.status}</TableCell>
                      <TableCell className="text-right">
                        <MonetaryDisplay
                          amount={String(payment.target_invoice.total_gross)}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {/* Additional Details */}
          <div className="mb-4 sm:mb-6">
            <h3 className="font-medium text-base sm:text-lg mb-3 break-words">
              {t("payment_details")}
            </h3>
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">{t("type")}</TableHead>
                    <TableHead className="text-left">{t("kind")}</TableHead>
                    <TableHead className="text-left">
                      {t("issuer_type")}
                    </TableHead>
                    <TableHead className="text-right">{t("amount")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {payment.reconciliation_type.charAt(0).toUpperCase() +
                        payment.reconciliation_type.slice(1)}
                    </TableCell>
                    <TableCell>
                      {payment.kind.charAt(0).toUpperCase() +
                        payment.kind.slice(1)}
                    </TableCell>
                    <TableCell>
                      {payment.issuer_type.charAt(0).toUpperCase() +
                        payment.issuer_type.slice(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      <MonetaryDisplay amount={payment.amount} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 mt-6">
            <div className="flex w-48 justify-between">
              <span className="text-gray-500">{t("amount")}</span>
              <MonetaryDisplay amount={payment.amount} />
            </div>
            {payment.method === "cash" && (
              <>
                <div className="flex w-48 justify-between">
                  <span className="text-gray-500">{t("tendered")}</span>
                  <MonetaryDisplay amount={payment.tendered_amount} />
                </div>
                <div className="flex w-48 justify-between">
                  <span className="text-gray-500">{t("returned")}</span>
                  <MonetaryDisplay amount={payment.returned_amount} />
                </div>
              </>
            )}
            <div className="flex w-48 justify-between font-bold border-t pt-2">
              <span>{t("total")}</span>
              <MonetaryDisplay amount={payment.amount} />
            </div>
          </div>

          {/* Notes */}
          {payment.note && (
            <div className="mt-6 sm:mt-8 text-sm text-gray-600 border-t pt-3 sm:pt-4 min-w-0">
              <h3 className="font-medium mb-2 break-words">{t("notes")}</h3>
              <p className="break-words whitespace-pre-wrap">{payment.note}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 sm:mt-12 border-t pt-3 sm:pt-4 text-center text-xs sm:text-sm text-gray-500">
            <p>{t("thank_you_for_your_payment")}</p>
            <p>{format(new Date(), "PPP")}</p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintPaymentReconciliation;
