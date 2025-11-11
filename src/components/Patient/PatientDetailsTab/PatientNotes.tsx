import { NoteManager } from "@/components/Notes/NoteManager";

import { PatientProps } from ".";

export const PatientNotesTab = (props: PatientProps) => {
  return (
    <div className="w-full h-full mt-1 md:mt-4 rounded-lg border overflow-hidden">
      <NoteManager
        canAccess={true}
        canWrite={true}
        patientId={props.patientData.id}
        encounterId={undefined}
        hideEncounterNotes={true}
      />
    </div>
  );
};
