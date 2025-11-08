import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { WalletMinimal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChargeItemDefinitionPicker } from "@/components/Common/ChargeItemDefinitionPicker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { ResourceCategorySubType } from "@/types/base/resourceCategory/resourceCategory";
import { ScheduleTemplate } from "@/types/scheduling/schedule";
import { useForm } from "react-hook-form";
import { z } from "zod";

interface ScheduleChargeItemDefinitionSelectorProps {
  facilityId: string;
  scheduleTemplate: ScheduleTemplate;
  onChange: (value: {
    charge_item_definition_slug: string;
    re_visit_allowed_days: number;
    re_visit_charge_item_definition_slug: string | null;
  }) => void;
}

export default function ScheduleChargeItemDefinitionSelector({
  facilityId,
  scheduleTemplate,
  onChange,
}: ScheduleChargeItemDefinitionSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const scheduleChargeItemSchema = z
    .object({
      charge_item_definition_slug: z
        .string()
        .min(1, "Consultation charge is required"),
      re_visit_allowed_days: z
        .number()
        .min(0, "Re-visit allowed days cannot be negative"),
      re_visit_charge_item_definition_slug: z.string().nullable(),
    })
    .refine((data) => {
      if (data.re_visit_allowed_days === 0) {
        return data.re_visit_charge_item_definition_slug === null;
      }
      return true;
    });

  type FormValues = z.infer<typeof scheduleChargeItemSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(scheduleChargeItemSchema),
    defaultValues: {
      charge_item_definition_slug:
        scheduleTemplate.charge_item_definition?.slug || "",
      re_visit_allowed_days: scheduleTemplate.revisit_allowed_days,
      re_visit_charge_item_definition_slug:
        scheduleTemplate.revisit_charge_item_definition?.slug || "",
    },
  });

  const reVisitDays = form.watch("re_visit_allowed_days");

  useEffect(() => {
    if (reVisitDays === 0) {
      form.setValue("re_visit_charge_item_definition_slug", null);
    }
  }, [reVisitDays, form]);

  const handleSheetOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset({
        charge_item_definition_slug:
          scheduleTemplate.charge_item_definition?.slug || "",
        re_visit_allowed_days: scheduleTemplate.revisit_allowed_days,
        re_visit_charge_item_definition_slug:
          scheduleTemplate.revisit_charge_item_definition?.slug || null,
      });
    }
  };

  const onSubmit = (data: FormValues) => {
    onChange(data);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-full gap-2">
          <WalletMinimal className="size-4" />
          <span className="text-gray-950 font-medium">
            {t("manage_charges")}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[90%] sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("select_charge_item_definitions")}</SheetTitle>
          <SheetDescription>
            {t("select_or_create_charge_item_definitions")}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 flex flex-col gap-6"
          >
            <FormField
              control={form.control}
              name="charge_item_definition_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("consulation charge")}</FormLabel>
                  <FormControl>
                    <ChargeItemDefinitionPicker
                      facilityId={facilityId}
                      resourceSubType={
                        ResourceCategorySubType.charge_item_definition_schedule_practitioner
                      }
                      value={field.value}
                      onValueChange={(value) => field.onChange(value || "")}
                      placeholder={t("select_charge_item_definition")}
                      className="flex-1"
                      showCreateButton={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="re_visit_allowed_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("re_visit_allowed_days")}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => {
                        const value =
                          e.target.value === "" ? 0 : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="re_visit_charge_item_definition_slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel
                    className={reVisitDays === 0 ? "text-gray-400" : ""}
                  >
                    {t("re_visit_consultation_charge")}
                  </FormLabel>
                  <FormControl>
                    <ChargeItemDefinitionPicker
                      facilityId={facilityId}
                      resourceSubType={
                        ResourceCategorySubType.charge_item_definition_schedule_practitioner
                      }
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value || "")}
                      placeholder={t("select_charge_item_definition")}
                      className="flex-1"
                      showCreateButton={true}
                      disabled={reVisitDays === 0}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("cancel")}
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                {t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
