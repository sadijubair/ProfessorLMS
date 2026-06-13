import { NextRequest, NextResponse } from 'next/server';
import { getCourseBySlug } from '@/services/course.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Course slug is required' },
        { status: 400 }
      );
    }

    const result = await getCourseBySlug(slug);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
