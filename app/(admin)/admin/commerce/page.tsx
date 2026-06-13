import { redirect } from 'next/navigation';

import {
  BookMarked,
  BookOpen,
  ClipboardList,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  Ticket,
} from 'lucide-react';

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
import { requireAdminPage } from '@/lib/auth/server';
import {
  consumeCommunityToken,
  createBook,
  createPromoCode,
  listBooks,
  listCommunityTokens,
  listOrders,
  listPromoCodes,
  listWrittenSubmissions,
  updateOrderShipping,
  updateSubmissionStatus,
} from '@/services/commerce.service';

function money(value: number) {
  return `BDT ${value.toLocaleString()}`;
}

export default async function AdminCommercePage({
  searchParams,
}: {
  searchParams: Promise<{ book?: string; promo?: string; order?: string; token?: string; submission?: string }>;
}) {
  const { session } = await requireAdminPage(['admin', 'teacher', 'support', 'super_admin']);
  const params = await searchParams;

  const [books, promoCodes, orders, submissions, tokens] = await Promise.all([
    listBooks(true),
    listPromoCodes(true),
    listOrders(),
    listWrittenSubmissions(),
    listCommunityTokens(),
  ]);

  const activePromoCodes = promoCodes.filter((promoCode) => promoCode.is_active);
  const unusedTokens = tokens.filter((token) => token.status === 'unused');
  const pendingSubmissions = submissions.filter((submission) => submission.status === 'pending');

  async function addBook(formData: FormData) {
    'use server';

    await createBook(
      {
        title: String(formData.get('title') || '').trim(),
        author: String(formData.get('author') || '').trim() || undefined,
        description: String(formData.get('description') || '').trim() || undefined,
        priceBdt: Number(formData.get('priceBdt') || 0),
        stockQuantity: Number(formData.get('stockQuantity') || 0),
        imageUrl: String(formData.get('imageUrl') || '').trim() || undefined,
        isActive: formData.get('isActive') === 'on',
      },
      session.userId
    );

    redirect('/admin/commerce?book=created');
  }

  async function addPromoCode(formData: FormData) {
    'use server';

    const courseValues = String(formData.get('applicableCourses') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    await createPromoCode(
      {
        code: String(formData.get('code') || '').trim(),
        discountPercent: Number(formData.get('discountPercent') || 0),
        discountFixedBdt: formData.get('discountFixedBdt') ? Number(formData.get('discountFixedBdt')) : null,
        scope: String(formData.get('scope') || 'global') as 'global' | 'course_specific',
        applicableCourses: courseValues.length ? courseValues : null,
        maxUses: formData.get('maxUses') ? Number(formData.get('maxUses')) : null,
        validFrom: new Date(String(formData.get('validFrom') || new Date().toISOString())).toISOString(),
        validUntil: new Date(String(formData.get('validUntil') || new Date().toISOString())).toISOString(),
        isActive: formData.get('isActive') === 'on',
      },
      session.userId
    );

    redirect('/admin/commerce?promo=created');
  }

  async function updateOrder(formData: FormData) {
    'use server';

    await updateOrderShipping(
      String(formData.get('orderId') || ''),
      String(formData.get('shippingStatus') || 'pending') as 'pending' | 'shipped' | 'delivered' | 'cancelled',
      session.userId
    );

    redirect('/admin/commerce?order=updated');
  }

  async function reviewSubmission(formData: FormData) {
    'use server';

    await updateSubmissionStatus(
      String(formData.get('submissionId') || ''),
      String(formData.get('status') || 'pending') as 'pending' | 'evaluated' | 'published',
      session.userId
    );

    redirect('/admin/commerce?submission=updated');
  }

  async function consumeToken(formData: FormData) {
    'use server';

    await consumeCommunityToken(String(formData.get('tokenId') || ''), session.userId);
    redirect('/admin/commerce?token=used');
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Badge variant="secondary" className="w-fit gap-1.5">
          <BookMarked className="h-3.5 w-3.5" />
          Commerce
        </Badge>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Written workflow and commerce</h1>
          <p className="text-muted-foreground">
            Books, promo codes, written submissions, shipping, and community verification in one admin console.
          </p>
        </div>
      </div>

      {params.book || params.promo || params.order || params.token || params.submission ? (
        <Card className="border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-sm text-emerald-900 dark:text-emerald-100">
            Commerce update saved successfully.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-5">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Books</p><p className="mt-2 text-2xl font-bold">{books.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Orders</p><p className="mt-2 text-2xl font-bold">{orders.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Active promo codes</p><p className="mt-2 text-2xl font-bold">{activePromoCodes.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Pending submissions</p><p className="mt-2 text-2xl font-bold">{pendingSubmissions.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Unused tokens</p><p className="mt-2 text-2xl font-bold">{unusedTokens.length}</p></CardContent></Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book store
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={addBook} className="grid gap-3 md:grid-cols-2">
              <Input name="title" placeholder="Book title" required className="md:col-span-2" />
              <Input name="author" placeholder="Author" />
              <Input name="priceBdt" type="number" min="0" placeholder="Price BDT" required />
              <Input name="stockQuantity" type="number" min="0" placeholder="Stock quantity" required />
              <Input name="imageUrl" placeholder="Cover image URL" className="md:col-span-2" />
              <Textarea name="description" placeholder="Description" className="md:col-span-2" />
              <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
                <input type="checkbox" name="isActive" className="size-4" defaultChecked />
                Active in store
              </label>
              <div className="md:col-span-2">
                <Button type="submit" className="gap-2">
                  <PackagePlus className="h-4 w-4" />
                  Add book
                </Button>
              </div>
            </form>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>
                      <div className="font-medium">{book.title}</div>
                      <div className="text-xs text-muted-foreground">{book.author || 'No author'}</div>
                    </TableCell>
                    <TableCell>{book.stock_quantity}</TableCell>
                    <TableCell>{money(book.price_bdt)}</TableCell>
                    <TableCell>
                      <Badge variant={book.is_active ? 'default' : 'secondary'}>
                        {book.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!books.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                      No books available.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Promo codes and orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <form action={addPromoCode} className="grid gap-3 md:grid-cols-2">
              <Input name="code" placeholder="Promo code" required className="md:col-span-2" />
              <Input name="discountPercent" type="number" min="0" step="0.01" placeholder="Discount percent" />
              <Input name="discountFixedBdt" type="number" min="0" placeholder="Fixed discount BDT" />
              <select name="scope" className="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="global">Global</option>
                <option value="course_specific">Course specific</option>
              </select>
              <Input name="maxUses" type="number" min="1" placeholder="Max uses" />
              <Input name="validFrom" type="datetime-local" required />
              <Input name="validUntil" type="datetime-local" required />
              <Input name="applicableCourses" placeholder="Course IDs comma separated" className="md:col-span-2" />
              <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
                <input type="checkbox" name="isActive" className="size-4" defaultChecked />
                Active now
              </label>
              <div className="md:col-span-2">
                <Button type="submit" variant="outline" className="gap-2">
                  <Ticket className="h-4 w-4" />
                  Create promo code
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {promoCodes.map((promoCode) => (
                <div key={promoCode.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{promoCode.code}</p>
                    <Badge variant={promoCode.is_active ? 'default' : 'secondary'}>
                      {promoCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{promoCode.scope}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {promoCode.discount_percent > 0 ? `${promoCode.discount_percent}% off` : ''}
                    {promoCode.discount_fixed_bdt ? ` ${money(promoCode.discount_fixed_bdt)}` : ''}
                  </p>
                </div>
              ))}
              {!promoCodes.length ? (
                <p className="text-sm text-muted-foreground">No promo codes yet.</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Written submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      <div className="font-medium">{submission.exams?.title || 'Written exam'}</div>
                      <div className="text-xs text-muted-foreground">{submission.exams?.exam_type}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{submission.users?.full_name || 'Student'}</div>
                      <div className="text-xs text-muted-foreground">
                        {submission.users?.student_id || submission.student_id}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(submission.submitted_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={submission.status === 'published' ? 'default' : 'secondary'}>
                        {submission.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={reviewSubmission} className="flex items-center justify-end gap-2">
                        <input type="hidden" name="submissionId" value={submission.id} />
                        <select name="status" defaultValue={submission.status} className="h-9 rounded-md border bg-background px-2 text-xs">
                          <option value="pending">Pending</option>
                          <option value="evaluated">Evaluated</option>
                          <option value="published">Published</option>
                        </select>
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
                {!submissions.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No written submissions yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Community verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell>
                      <div className="font-medium">{token.users?.full_name || 'Student'}</div>
                      <div className="text-xs text-muted-foreground">
                        {token.users?.student_id || token.course_enrollments?.student_id}
                      </div>
                    </TableCell>
                    <TableCell>{token.course_enrollments?.courses?.title || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{token.token}</TableCell>
                    <TableCell>
                      <Badge variant={token.status === 'unused' ? 'default' : 'secondary'}>
                        {token.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {token.status === 'unused' ? (
                        <form action={consumeToken}>
                          <input type="hidden" name="tokenId" value={token.id} />
                          <Button type="submit" size="sm" variant="outline">
                            Consume
                          </Button>
                        </form>
                      ) : (
                        <span className="text-sm text-muted-foreground">Locked</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!tokens.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No community tokens yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-lg border bg-card">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">Order management</h2>
            <p className="text-sm text-muted-foreground">Track book purchases and shipping progress.</p>
          </div>
          <RefreshCw className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{order.users?.full_name || 'Student'}</div>
                    <div className="text-xs text-muted-foreground">{order.users?.student_id || order.student_id}</div>
                  </TableCell>
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
                  <TableCell className="text-right">
                    <form action={updateOrder} className="flex items-center justify-end gap-2">
                      <input type="hidden" name="orderId" value={order.id} />
                      <select name="shippingStatus" defaultValue={order.shipping_status} className="h-9 rounded-md border bg-background px-2 text-xs">
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Update
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {!orders.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No orders yet.
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
