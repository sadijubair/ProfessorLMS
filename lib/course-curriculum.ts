export type CourseCurriculumSection = {
  title: string;
  items: string[];
};

export const COURSE_CURRICULUM_SUGGESTIONS = [
  'Syllabus',
  'PDF Study',
  'Video Batch',
  'PDF Batch',
  'Question Bank',
  'Daily Exam',
  'Weekly Exam',
  'Open Book Exam',
  'Final Exam',
  'Messenger',
  'Support',
  'Live Class',
] as const;

export function normalizeCourseCurriculumSections(sections: CourseCurriculumSection[]) {
  return sections
    .map((section) => ({
      title: section.title.trim(),
      items: section.items.map((item) => item.trim()).filter(Boolean),
    }))
    .filter((section) => section.title.length > 0 || section.items.length > 0);
}