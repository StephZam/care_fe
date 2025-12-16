import careConfig from "@careConfig";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TagSelectorPopover } from "@/components/Tags/TagAssignmentSheet";

import { useShortcutSubContext } from "@/context/ShortcutContext";
import FacilityOrganizationSelector from "@/pages/Facility/settings/organizations/components/FacilityOrganizationSelector";
import {
  ENCOUNTER_CLASS_ICONS,
  ENCOUNTER_PRIORITY,
  EncounterCreate,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import useTagConfigs from "@/types/emr/tagConfig/useTagConfig";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface Props {
  patientId: string;
  facilityId: string;
  patientName: string;
  appointment?: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  disableRedirectOnSuccess?: boolean;
  defaultStatus?:
    | EncounterStatus.PLANNED
    | EncounterStatus.IN_PROGRESS
    | EncounterStatus.ON_HOLD;
}

export default function CreateEncounterForm({
  patientId,
  facilityId,
  patientName,
  appointment,
  trigger,
  onSuccess,
  disableRedirectOnSuccess = false,
  defaultStatus = EncounterStatus.PLANNED,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  useShortcutSubContext();

  const encounterFormSchema = z.object({
    status: z.enum([
      EncounterStatus.PLANNED,
      EncounterStatus.IN_PROGRESS,
      EncounterStatus.ON_HOLD,
    ] as const),
    encounter_class: z.enum(careConfig.encounterClasses),
    priority: z.enum(ENCOUNTER_PRIORITY),
    organizations: z.array(z.string()).min(1, {
      message: t("at_least_one_department_is_required"),
    }),
    start_date: z.string(),
    tags: z.array(z.string()),
  });

  const form = useForm({
    resolver: zodResolver(encounterFormSchema),
    defaultValues: {
      status: defaultStatus,
      encounter_class: careConfig.defaultEncounterType,
      priority: "routine",
      organizations: [],
      start_date: new Date().toISOString(),
      tags: [],
    },
  });

  const tagIds = form.watch("tags");
  const tagQueries = useTagConfigs({ ids: tagIds, facilityId });
  const selectedTags = tagQueries
    .map((query) => query.data)
    .filter(Boolean) as TagConfig[];

  const { mutate: createEncounter, isPending } = useMutation({
    mutationFn: mutate(encounterApi.create),
    onSuccess: (data: EncounterRead) => {
      toast.success(t("encounter_created"));
      setIsOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["encounters", patientId] });
      onSuccess?.();
      if (!disableRedirectOnSuccess) {
        navigate(
          `/facility/${facilityId}/patient/${patientId}/encounter/${data.id}/updates`,
        );
      }
    },
  });

  function onSubmit(data: z.infer<typeof encounterFormSchema>) {
    const encounterRequest: EncounterCreate = {
      ...data,
      patient: patientId,
      facility: facilityId,
      period: {
        start: data.start_date,
      },
      tags: data.tags,
      appointment: appointment,
    };

    createEncounter(encounterRequest);
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="secondary"
            className="h-14 w-full justify-start text-lg"
          >
            <Stethoscope className="mr-4 size-6" />
            {t("create_encounter")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{t("initiate_encounter")}</SheetTitle>
          <SheetDescription>
            <Trans
              i18nKey="begin_clinical_encounter"
              values={{ patientName }}
              components={{
                strong: <strong className="font-semibold text-gray-950" />,
              }}
            />
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-4 space-y-2"
          >
            <div className="space-y-5">
              <div className="p-2 border rounded-md border-gray-200 bg-gray-100">
                <FormField
                  control={form.control}
                  name="organizations"
                  render={({ field }) => (
                    <FormItem>
                      <FacilityOrganizationSelector
                        facilityId={facilityId}
                        value={field.value}
                        onChange={(value) => {
                          if (value === null) {
                            form.setValue("organizations", []);
                          } else {
                            form.setValue("organizations", value);
                          }
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => {
                  const date = field.value ? new Date(field.value) : new Date();
                  return (
                    <FormItem>
                      <FormLabel className="text-gray-950">
                        {t("date_and_time")}
                      </FormLabel>
                      <div className="flex gap-2">
                        <DatePicker
                          date={date}
                          onChange={(newDate) => {
                            if (!newDate) return;
                            const updatedDate = new Date(newDate);
                            updatedDate.setHours(date.getHours());
                            updatedDate.setMinutes(date.getMinutes());
                            field.onChange(updatedDate.toISOString());
                          }}
                          className="h-9 flex-1"
                        />
                        <Input
                          type="time"
                          className="w-32 border-gray-400 text-sm sm:py-px shadow-sm"
                          value={date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          })}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            if (isNaN(hours) || isNaN(minutes)) return;
                            const updatedDate = new Date(date);
                            updatedDate.setHours(hours);
                            updatedDate.setMinutes(minutes);
                            field.onChange(updatedDate.toISOString());
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="encounter_class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("type_of_encounter")}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-3"
                      >
                        {careConfig.encounterClasses.map((value) => {
                          const Icon = ENCOUNTER_CLASS_ICONS[value];
                          return (
                            <div key={value} className="relative">
                              <RadioGroupItem
                                value={value}
                                id={`encounter-class-${value}`}
                                className="absolute left-2 top-2"
                              />
                              <Label
                                htmlFor={`encounter-class-${value}`}
                                className={cn(
                                  "flex h-30 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-gray-300 bg-white p-4 pt-6 text-lg",
                                  field.value === value &&
                                    "ring-2 ring-primary-500 text-primary-900 bg-primary-100",
                                )}
                              >
                                <Icon className="size-6" />
                                <div className="text-base font-semibold">
                                  {t(`encounter_class__${value}`)}
                                </div>
                                <div
                                  className={cn(
                                    "whitespace-normal break-words text-center text-base text-gray-600",
                                    field.value === value && "text-primary-700",
                                  )}
                                >
                                  {t(`encounter_class_description__${value}`)}
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("status")}
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-2"
                      >
                        {[
                          { value: EncounterStatus.PLANNED, label: "planned" },
                          {
                            value: EncounterStatus.IN_PROGRESS,
                            label: "in_progress",
                          },
                          { value: EncounterStatus.ON_HOLD, label: "on_hold" },
                        ].map(({ value, label }) => (
                          <div key={value} className="relative">
                            <RadioGroupItem
                              value={value}
                              id={`status-${value}`}
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                            />
                            <Label
                              htmlFor={`status-${value}`}
                              className={cn(
                                "flex h-9 cursor-pointer items-center rounded-md border-2 border-gray-300 bg-white py-2 pl-8 pr-3 text-sm text-gray-950",
                                field.value === value &&
                                  "border-primary-500 bg-primary-100",
                              )}
                            >
                              {t(label)}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("priority")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder={t("select_priority")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENCOUNTER_PRIORITY.map((priority) => (
                          <SelectItem key={priority} value={priority}>
                            {t(`encounter_priority__${priority}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-950">
                      {t("tags", { count: 2 })}
                    </FormLabel>
                    <FormControl className="mt-0">
                      <TagSelectorPopover
                        selected={selectedTags}
                        onChange={(tags) => {
                          field.onChange(tags.map((tag) => tag.id));
                        }}
                        resource={TagResource.ENCOUNTER}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  form.reset();
                }}
                className="bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
              >
                {t("cancel")}
                <ShortcutBadge actionId="cancel-action" />
              </Button>
              <Button
                type="submit"
                disabled={isPending || !form.watch("organizations").length}
              >
                {isPending ? t("creating") : t("create_encounter")}
                <ShortcutBadge actionId="submit-action" className="bg-white" />
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
