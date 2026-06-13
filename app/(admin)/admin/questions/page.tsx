import { QuestionBankManager } from '@/components/admin/question-bank-manager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireAdminPage } from '@/lib/auth/server';
import { listCourses } from '@/services/course.service';
import { listQuestions } from '@/services/question.service';

export default async function AdminQuestionsPage() {
  await requireAdminPage(['admin', 'teacher', 'super_admin']);

  const [courseResult, questions] = await Promise.all([
    listCourses(100, 0, undefined, undefined, true),
    listQuestions({ limit: 50 }),
  ]);
  const courses = courseResult.data || [];

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Question Bank</h1>
        <p className="text-muted-foreground">
          Add individual MCQs, bulk import CSV rows, and manage practice filters.
        </p>
      </div>

      <QuestionBankManager courses={courses.map((course) => ({ id: course.id, title: course.title }))} />

      <Card>
        <CardHeader>
          <CardTitle>Recent Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Topic</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Year</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-xl truncate font-medium">{question.content}</TableCell>
                  <TableCell>{question.subject || '-'}</TableCell>
                  <TableCell>{question.topic || '-'}</TableCell>
                  <TableCell className="capitalize">{question.difficulty_level}</TableCell>
                  <TableCell>{question.exam_year || '-'}</TableCell>
                </TableRow>
              ))}
              {!questions.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No questions yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
