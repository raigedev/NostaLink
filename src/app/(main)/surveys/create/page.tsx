import SurveyCreator from "@/components/surveys/SurveyCreator";

export default function CreateSurveyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create Survey</h1>
      <SurveyCreator />
    </div>
  );
}
