import { redirect } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { requireStudentPage } from '@/lib/auth/server';
import { supabaseAdmin } from '@/lib/db/supabase';
import {
  acknowledgeWrittenSubmission,
  createOrder,
  listBooks,
  listCommunityTokens,
  listOrders,
  listPromoCodes,
  listWrittenSubmissions,
} from '@/services/commerce.service';

type WrittenAttemptRow = {
  id: string;
  status: 'in_progress' | 'submitted' | 'evaluated';
  started_at: string;
  submitted_at: string | null;
  is_official: boolean;
  exams: {
    title: string;
    exam_type: 'written' | 'combined';
    window_end_at: string;
  };
};

function money(value: number) {
  return `BDT ${value.toLocaleString()}`;
}

export default async function StudentCommercePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; order?: string; submission?: string }>;
}) {
  const { session } = await requireStudentPage();
  const params = await searchParams;

  const [books, promoCodes, orders, submissions, communityTokens, writtenAttempts] = await Promise.all([
    listBooks(false),
    listPromoCodes(false),
    listOrders(session.userId),
    listWrittenSubmissions(session.userId),
    listCommunityTokens(session.userId),
    supabaseAdmin
      .from('exam_attempts')
      .select('id, status, started_at, submitted_at, is_official, exams!inner(title, exam_type, window_end_at)')
      .eq('student_id', session.userId)
      .order('started_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data || []) as WrittenAttemptRow[];
      }),
  ]);

  const acknowledgedAttemptIds = new Set(submissions.map((submission) => submission.attempt_id));
  const pendingAttempts = writtenAttempts.filter(
    (attempt) => ['written', 'combined'].includes(attempt.exams.exam_type)
  );

  async function acknowledgeSubmission(formData: FormData) {
    'use server';

    await acknowledgeWrittenSubmission({
      studentId: session.userId,
      attemptId: String(formData.get('attemptId') || ''),
      submissionPlatform: String(formData.get('submissionPlatform') || 'other') as
        | 'google_classroom'
        | 'google_drive'
        | 'teams'
        | 'other',
      submissionUrl: String(formData.get('submissionUrl') || '').trim() || undefined,
      submittedAt: new Date().toISOString(),
    });

    redirect('/dashboard/commerce?submission=created');
  }

  async function placeOrder(formData: FormData) {
    'use server';

    await createOrder({
      studentId: session.userId,
      bookId: String(formData.get('bookId') || ''),
      quantity: Number(formData.get('quantity') || 1),
      shippingAddress: String(formData.get('shippingAddress') || '').trim(),
      notes: String(formData.get('notes') || '').trim() || undefined,
    });

    redirect('/dashboard/commerce?order=created');
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit">Commerce</Badge>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Written workflow and commerce</h1>
          <p className="text-sm text-muted-foreground">
            Submit written exam acknowledgments, order books, and review active promo or community status.
          </p>
        </div>
      </div>

      {params.book || params.order || params.submission ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-sm text-emerald-900 dark:text-emerald-100">
            Your commerce request was saved.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Books</p><p className="mt-2 text-2xl font-bold">{books.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orders</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Promo codes</p><p className="mt-2 text-2xl font-bold">{promoCodes.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Community tokens</p><p className="mt-2 text-2xl font-bold">{communityTokens.length}</p></CardContent></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Written exam submissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingAttempts.map((attempt) => {
              const acknowledged = acknowledgedAttemptIds.has(attempt.id);

              return (
                <div key={attempt.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{attempt.exams.title}</p>
                    <Badge variant={attempt.exams.exam_type === 'combined' ? 'default' : 'secondary'}>
                      {attempt.exams.exam_type}
                    </Badge>
                    <Badge variant={attempt.status === 'submitted' ? 'default' : 'outline'}>
                      {attempt.status}
                    </Badge>
                    {acknowledged ? <Badge>Acknowledged</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Started {new Date(attempt.started_at).toLocaleString()}
                    {attempt.submitted_at ? ` • Submitted ${new Date(attempt.submitted_at).toLocaleString()}` : ''}
                  </p>

                  {acknowledged ? (
                    <p className="mt-3 text-sm text-muted-foreground">This submission is already in the review queue.</p>
                  ) : (
                    <form action={acknowledgeSubmission} className="mt-4 grid gap-3 md:grid-cols-3">
                      <input type="hidden" name="attemptId" value={attempt.id} />
                      <select name="submissionPlatform" className="h-10 rounded-md border bg-background px-3 text-sm">
                        <option value="google_classroom">Google Classroom</option>
                        <option value="google_drive">Google Drive</option>
                        <option value="teams">Teams</option>
                        <option value="other">Other</option>
                      </select>
                      <Input name="submissionUrl" placeholder="Submission URL (optional)" className="md:col-span-2" />
                      <div className="md:col-span-3">
                        <Button type="submit">I have submitted</Button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
            {!pendingAttempts.length ? (
              <p className="text-sm text-muted-foreground">No written or combined attempts yet.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Book store</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={placeOrder} className="grid gap-3 md:grid-cols-2">
              <select name="bookId" className="h-10 rounded-md border bg-background px-3 text-sm md:col-span-2" required>
                <option value="">Select a book</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title} - {money(book.price_bdt)}
                  </option>
                ))}
              </select>
              <Input name="quantity" type="number" min="1" defaultValue="1" required />
              <Input name="shippingAddress" placeholder="Shipping address" required />
              <Textarea name="notes" placeholder="Notes or delivery instructions" className="md:col-span-2" />
              <div className="md:col-span-2">
                <Button type="submit">Place order</Button>
              </div>
            </form>

            <div className="space-y-3">
              {books.map((book) => (
                <div key={book.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{book.title}</p>
                      <p className="text-sm text-muted-foreground">{book.author || 'Author not listed'}</p>
                    </div>
                    <Badge variant={book.is_active ? 'default' : 'secondary'}>
                      {money(book.price_bdt)}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Stock {book.stock_quantity}</p>
                </div>
              ))}
              {!books.length ? <p className="text-sm text-muted-foreground">No books available right now.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Shipping</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">{order.books?.title || order.book_id}</div>
                      <div className="text-xs text-muted-foreground">Qty {order.quantity}</div>
                    </TableCell>
                    <TableCell>{money(order.total_price_bdt)}</TableCell>
                    <TableCell>
                      <Badge variant={order.payment_status === 'approved' ? 'default' : 'secondary'}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={order.shipping_status === 'delivered' ? 'default' : 'outline'}>
                        {order.shipping_status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!orders.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promo codes and community status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3">
              {promoCodes.map((promoCode) => (
                <div key={promoCode.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{promoCode.code}</p>
                    <Badge variant={promoCode.is_active ? 'default' : 'secondary'}>
                      {promoCode.scope}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {promoCode.discount_percent > 0 ? `${promoCode.discount_percent}% off` : ''}
                    {promoCode.discount_fixed_bdt ? ` • ${money(promoCode.discount_fixed_bdt)}` : ''}
                  </p>
                </div>
              ))}
              {!promoCodes.length ? <p className="text-sm text-muted-foreground">No active promo codes.</p> : null}
            </div>

            <div className="space-y-3 rounded-lg border p-4">
              <div>
                <p className="font-semibold">Community verification</p>
                <p className="text-sm text-muted-foreground">Tokens issued after payment approval appear here.</p>
              </div>
              {communityTokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-3 text-sm">
                  <div>
                    <p className="font-medium">{token.course_enrollments?.courses?.title || 'Course'}</p>
                    <p className="text-xs text-muted-foreground">{token.token}</p>
                  </div>
                  <Badge variant={token.status === 'unused' ? 'default' : 'secondary'}>{token.status}</Badge>
                </div>
              ))}
              {!communityTokens.length ? <p className="text-sm text-muted-foreground">No tokens yet.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Recent written results</h2>
          <p className="text-sm text-muted-foreground">Review status published by the admin team.</p>
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Review</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>{submission.exams?.title || 'Written exam'}</TableCell>
                  <TableCell>
                    <Badge variant={submission.status === 'published' ? 'default' : 'secondary'}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    {submission.marks_entered_at ? new Date(submission.marks_entered_at).toLocaleString() : 'Pending'}
                  </TableCell>
                </TableRow>
              ))}
              {!submissions.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No submitted acknowledgments yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
