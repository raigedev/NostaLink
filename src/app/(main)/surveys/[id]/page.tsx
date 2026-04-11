import { notFound } from "next/navigation";
import { getSurvey } from "@/app/actions/surveys";
import SurveyTaker from "@/components/surveys/SurveyTaker";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SurveyPage({ params }: Props) {
  const { id } = await params;
  const survey = await getSurvey(id);
  if (!survey) notFound();

  return (
    <div className="max-w-2xl mx-auto">
      <SurveyTaker survey={survey} />
    </div>
  );
}
