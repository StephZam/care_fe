import QuestionnaireResponsesList, {
  ResponseCard,
} from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ArrowRight, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QuestionnaireDetail } from "./../../../types/questionnaire/questionnaire";

interface ResponsesCardProps {
  response: QuestionnaireResponse;
  isActive: boolean;
  onClick: () => void;
  showTitle?: boolean;
}
function ResponsesCard({
  response,
  isActive,
  onClick,
  showTitle = true,
}: ResponsesCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer p-3 text-sm border hover:border-primary-500 transition-colors",
        isActive && "border-primary-600 bg-primary-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          {showTitle && (
            <div className="mt-1 font-medium pb-1">
              {response.questionnaire?.title}
            </div>
          )}
          <div className="font-medium text-xs">
            {formatDateTime(response.created_date)}
          </div>
          <div className="text-gray-600">
            {t("filed_by")}{" "}
            <span className="font-medium text-gray-800">
              {formatName(response.created_by)}
            </span>
          </div>
        </div>
        {isActive && <ArrowRight className="size-4 text-gray-500" />}
      </div>
    </Card>
  );
}

export const EncounterResponsesTab = () => {
  const {
    selectedEncounter: encounter,
    patientId,
    canReadSelectedEncounter: canAccess,
  } = useEncounter();
  const { t } = useTranslation();
  const [selectedQuestionnaire, setSelectedQuestionnaire] =
    useState<QuestionnaireDetail | null>(null);
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(
    null,
  );
  const responseRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useEffect(() => {
    if (selectedResponseId && responseRefs.current[selectedResponseId]) {
      responseRefs.current[selectedResponseId]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedResponseId]);

  return (
    <div className="flex flex-col md:flex-row gap-3 h-auto md:h-screen">
      <div className="w-full md:w-1/5 flex flex-col gap-3 pt-1 md:sticky md:top-0 md:self-start md:h-screen">
        <div className="relative w-full">
          <QuestionnaireSearch
            placeholder={
              selectedQuestionnaire
                ? selectedQuestionnaire.title
                : t("select_questionnaire")
            }
            subjectType="encounter"
            onSelect={(q) => {
              setSelectedQuestionnaire(q);
              setSelectedResponseId(null);
            }}
            trigger={
              <Button
                variant="outline"
                role="combobox"
                className="w-full border border-primary-600 justify-between h-auto min-h-[2.5rem] py-2"
              >
                <div className="flex justify-start items-center gap-2 text-primary-800 flex-1">
                  <Plus className="size-4 flex-shrink-0" />
                  <span className="text-left whitespace-normal break-words">
                    {selectedQuestionnaire
                      ? selectedQuestionnaire.title
                      : t("select_questionnaire")}
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  {selectedQuestionnaire && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedQuestionnaire(null);
                        setSelectedResponseId(null);
                      }}
                      className="h-5 w-5 p-0 hover:bg-gray-100"
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              </Button>
            }
          />
        </div>
        <div className="hidden md:flex-1 md:overflow-hidden md:block">
          <QuestionnaireResponsesList
            encounter={encounter}
            patientId={patientId}
            canAccess={canAccess}
            questionnaireId={selectedQuestionnaire?.id}
            renderItem={(response: QuestionnaireResponse) => (
              <ResponsesCard
                response={response}
                isActive={selectedResponseId === response.id}
                onClick={() => {
                  setSelectedResponseId(response.id);
                }}
                showTitle={!selectedQuestionnaire}
              />
            )}
          />
        </div>
      </div>
      <div className="flex-1 h-auto md:h-screen md:overflow-hidden">
        <ScrollArea className="h-auto md:h-full">
          <div className="space-y-4 p-3">
            <QuestionnaireResponsesList
              encounter={encounter}
              patientId={patientId}
              canAccess={canAccess}
              questionnaireId={selectedQuestionnaire?.id}
              renderItem={(response: QuestionnaireResponse) => {
                return (
                  <div
                    key={response.id}
                    ref={(el) => {
                      responseRefs.current[response.id] = el;
                    }}
                  >
                    <Card
                      className={cn(
                        "shadow-sm border rounded-lg",
                        selectedResponseId === response.id &&
                          "ring-2 ring-primary-500",
                      )}
                    >
                      <ResponseCard
                        item={response}
                        onTitleClick={(questionnaireId) => {
                          setSelectedQuestionnaire({
                            id: questionnaireId,
                            slug: "",
                            questions: [],
                            title: response.questionnaire?.title || "",
                            status: "active",
                            subject_type: "encounter",
                            tags: [],
                          });
                          setSelectedResponseId(null);
                        }}
                      />
                    </Card>
                  </div>
                );
              }}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
