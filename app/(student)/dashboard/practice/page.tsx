import { QuestionPracticeClient } from '@/components/student/question-practice-client';
import { requireStudentPage } from '@/lib/auth/server';

export default async function QuestionPracticePage() {
  await requireStudentPage();

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Question Practice</h1>
        <p className="text-sm text-muted-foreground">
          Practice by topic, timed sets, random questions, previous years, or weak areas.
        </p>
      </div>
      <QuestionPracticeClient />
    </main>
  );
}
