import QuestionnaireResponsesList, {
  ResponseCard,
} from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName } from "@/Utils/utils";
import { t } from "i18next";
import { ArrowRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
        {isActive && <ArrowRight className="ml-2 shrink-5 text-gray-500" />}
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
    <div className="flex gap-3 h-full">
      <div className="w-1/5 flex flex-col gap-3 pt-1 sticky top-0 self-start h-screen">
        <div className="relative flex-shrink-0">
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
          />
          {selectedQuestionnaire && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedQuestionnaire(null);
                setSelectedResponseId(null);
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
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
      <div className="flex-1 overflow-y-auto h-screen">
        <div className="space-y-4 p-3 pt-13">
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
      </div>
    </div>
  );
};
