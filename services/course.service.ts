import { supabaseAdmin } from '@/lib/db/supabase';
import { normalizeCourseCurriculumSections } from '@/lib/course-curriculum';
import { logAuditEvent } from './auth.service';
import type { Database } from '@/lib/db/types';

type CourseInsert = Database['public']['Tables']['courses']['Insert'];
type CategoryInsert = Database['public']['Tables']['course_categories']['Insert'];

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export async function listCourseCategories(includeInactive = false) {
  try {
    let query = supabaseAdmin
      .from('course_categories')
      .select('*')
      .order('name', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error listing course categories:', error);
    if ((error as Error).message.includes('course_categories')) {
      return {
        success: true,
        data: [
          {
            id: 'fallback-bcs',
            name: 'BCS',
            slug: 'bcs',
            description: 'Bangladesh Civil Service preparation',
            is_active: true,
            created_by: null,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
          {
            id: 'fallback-bank',
            name: 'Bank',
            slug: 'bank',
            description: 'Bank job preparation',
            is_active: true,
            created_by: null,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
          {
            id: 'fallback-admission',
            name: 'Admission',
            slug: 'admission',
            description: 'University admission preparation',
            is_active: true,
            created_by: null,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
          {
            id: 'fallback-academic',
            name: 'Academic',
            slug: 'academic',
            description: 'Academic courses',
            is_active: true,
            created_by: null,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
          {
            id: 'fallback-skill',
            name: 'Skill',
            slug: 'skill',
            description: 'Skill-based learning',
            is_active: true,
            created_by: null,
            created_at: new Date(0).toISOString(),
            updated_at: new Date(0).toISOString(),
          },
        ],
        fallback: true,
      };
    }

    return { success: false, error: (error as Error).message };
  }
}

export async function createCourseCategory(
  categoryData: {
    name: string;
    description?: string;
    isActive?: boolean;
  },
  createdByUserId: string
) {
  try {
    const name = categoryData.name.trim();
    const slug = generateSlug(name);

    if (!name || !slug) {
      throw new Error('Category name is required');
    }

    const { data, error } = await supabaseAdmin
      .from('course_categories')
      .insert({
        name,
        slug,
        description: categoryData.description || null,
        is_active: categoryData.isActive ?? true,
        created_by: createdByUserId,
      } satisfies CategoryInsert)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(createdByUserId, 'course_category_created', 'course_categories', data.id, null, {
      name,
      slug,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Error creating course category:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCourseCategory(
  categoryId: string,
  categoryData: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
  },
  updatedByUserId: string
) {
  try {
    const updatePayload: Database['public']['Tables']['course_categories']['Update'] = {};

    if (categoryData.name !== undefined) {
      updatePayload.name = categoryData.name.trim();
      updatePayload.slug = generateSlug(categoryData.name);
    }

    if (categoryData.description !== undefined) {
      updatePayload.description = categoryData.description;
    }

    if (categoryData.isActive !== undefined) {
      updatePayload.is_active = categoryData.isActive;
    }

    const { data, error } = await supabaseAdmin
      .from('course_categories')
      .update(updatePayload)
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(updatedByUserId, 'course_category_updated', 'course_categories', categoryId, null, updatePayload);

    return { success: true, data };
  } catch (error) {
    console.error('Error updating course category:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function createCourse(
  courseData: {
    title: string;
    shortDescription?: string;
    description?: string;
    category: string;
    pricingType: 'paid' | 'free';
    priceBdt: number;
    durationDays?: number;
    isFree: boolean;
    isSelfPaced: boolean;
    hasSupport: boolean;
    hasFacebookGroup: boolean;
    hasGoogleClassroom: boolean;
    hasLiveExam: boolean;
    hasWrittenExam: boolean;
    requiresManualPayment: boolean;
    curriculumSections?: Array<{
      title: string;
      items: string[];
    }>;
    promoCode?: string;
    discountType?: 'flat' | 'percentile';
    discountValueBdt?: number;
    expiryPeriod?: 'lifetime' | 'limited';
    expiryMonths?: number;
    courseStatus?: 'active' | 'private' | 'upcoming' | 'pending' | 'draft' | 'inactive';
    thumbnailUrl?: string;
    maxStudents?: number;
    teacherId: string;
  },
  createdByUserId: string
) {
  try {
    // Generate slug
    const slug = generateSlug(courseData.title);

    // Check for duplicate slug
    const { data: existing } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      throw new Error('A course with this name already exists');
    }

    const publishedAt = courseData.courseStatus === 'active' ? new Date().toISOString() : null;

    const fullCoursePayload = {
        title: courseData.title,
        short_description: courseData.shortDescription || null,
        description: courseData.description ?? null,
        slug,
        category: courseData.category,
        pricing_type: courseData.pricingType,
        price_bdt: courseData.priceBdt ?? null,
        promo_code: courseData.promoCode || null,
        discount_type: courseData.discountType || 'flat',
        discount_value_bdt: courseData.discountValueBdt ?? null,
        expiry_period: courseData.expiryPeriod || 'lifetime',
        expiry_months: courseData.expiryMonths ?? null,
        course_status: courseData.courseStatus || 'draft',
        duration_days: courseData.durationDays ?? null,
        is_free: courseData.isFree ?? false,
        is_self_paced: courseData.isSelfPaced ?? false,
        has_support: courseData.hasSupport ?? false,
        has_facebook_group: courseData.hasFacebookGroup ?? false,
        has_google_classroom: courseData.hasGoogleClassroom ?? false,
        has_live_exam: courseData.hasLiveExam ?? false,
        has_written_exam: courseData.hasWrittenExam ?? false,
        requires_manual_payment: courseData.requiresManualPayment ?? false,
        curriculum_sections: normalizeCourseCurriculumSections(courseData.curriculumSections || []),
        page_sections: [],
        thumbnail_url: courseData.thumbnailUrl ?? null,
        max_students: courseData.maxStudents ?? null,
        teacher_id: courseData.teacherId ?? null,
        published_at: publishedAt,
      } satisfies CourseInsert;

    const legacyCoursePayload = {
      title: courseData.title,
      description: courseData.description ?? null,
      slug,
      category: courseData.category,
      price_bdt: courseData.priceBdt ?? null,
      duration_days: courseData.durationDays ?? null,
      is_free: courseData.isFree ?? false,
      is_self_paced: courseData.isSelfPaced ?? false,
      has_support: courseData.hasSupport ?? false,
      has_facebook_group: courseData.hasFacebookGroup ?? false,
      has_google_classroom: courseData.hasGoogleClassroom ?? false,
      has_live_exam: courseData.hasLiveExam ?? false,
      has_written_exam: courseData.hasWrittenExam ?? false,
      requires_manual_payment: courseData.requiresManualPayment ?? false,
      page_sections: [],
      thumbnail_url: courseData.thumbnailUrl ?? null,
      max_students: courseData.maxStudents ?? null,
      teacher_id: courseData.teacherId ?? null,
      published_at: publishedAt,
    } satisfies Partial<CourseInsert>;

    // Create course, then gracefully fall back if the live schema has not caught up yet.
    let insertResult = await supabaseAdmin
      .from('courses')
      .insert(fullCoursePayload)
      .select()
      .single();

    if (insertResult.error && isMissingCourseSchemaColumnError(insertResult.error.message)) {
      insertResult = await supabaseAdmin
        .from('courses')
        .insert(legacyCoursePayload as unknown as CourseInsert)
        .select()
        .single();
    }

    const { data, error } = insertResult;

    if (error) throw error;

    // Log audit event
    await logAuditEvent(
      createdByUserId,
      'course_created',
      'courses',
      data.id,
      {},
      {
        title: courseData.title,
        category: courseData.category,
        price: courseData.priceBdt,
      }
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error creating course:', error);
    return { success: false, error: (error as Error).message };
  }
}

function isMissingCourseSchemaColumnError(message: string) {
  return (
    message.includes('schema cache') &&
    (message.includes('course_status') ||
      message.includes('curriculum_sections') ||
      message.includes('page_sections'))
  );
}

export async function getCourse(courseId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching course:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getCourseBySlug(slug: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .not('published_at', 'is', null) // Only published courses
      .single();

    if (error) throw error;

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching course by slug:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function listCourses(
  limit: number = 20,
  offset: number = 0,
  category?: string,
  searchQuery?: string,
  includeUnpublished = false
) {
  try {
    let query = supabaseAdmin
      .from('courses')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (!includeUnpublished) {
      query = query.not('published_at', 'is', null);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    return { success: true, data, total: count };
  } catch (error) {
    console.error('Error listing courses:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function publishCourse(courseId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ published_at: new Date().toISOString() })
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error publishing course:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function unpublishCourse(courseId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('courses')
      .update({ published_at: null })
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error unpublishing course:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCourse(
  courseId: string,
  courseData: Database['public']['Tables']['courses']['Update'],
  updatedByUserId: string
) {
  try {
    const { data, error } = await supabaseAdmin
      .from('courses')
      .update(courseData)
      .eq('id', courseId)
      .select()
      .single();

    if (error) throw error;

    await logAuditEvent(updatedByUserId, 'course_updated', 'courses', courseId, null, courseData);

    return { success: true, data };
  } catch (error) {
    console.error('Error updating course:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    // Check if course has enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('course_enrollments')
      .select('id')
      .eq('course_id', courseId)
      .limit(1);

    if (enrollments && enrollments.length > 0) {
      throw new Error(
        'Cannot delete course with active enrollments. Unpublish first.'
      );
    }

    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false, error: (error as Error).message };
  }
}
