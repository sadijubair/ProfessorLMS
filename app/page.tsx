import Navbar from '@/components/public/navbar'
import Footer from '@/components/public/footer'
import HoverButton from '@/components/hover-button'
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentProfile } from '@/lib/auth/server';
import { CheckCircle2, Users, BookOpen, Award, Zap, ArrowRight, Video, FileText, PlayCircle, BookMarked, Edit, Cloud, HelpCircle, BarChart3, BookOpenText, Trophy } from 'lucide-react';

export default async function HomePage() {
  const { session } = await getCurrentProfile();
  const isStudentLoggedIn = session?.portal === 'student' && session.role === 'student';

  return (
    <>
      <Navbar isStudentLoggedIn={isStudentLoggedIn} />
      <div className="bg-white dark:bg-slate-950">
      {/* Mobile-First Hero Section */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight">
                  Master Your
                  <br />
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Skills Today</span>
                </h1>
                <p className="text-lg text-slate-700 dark:text-slate-300 max-w-lg">
                  Learn from expert instructors with personalized courses designed for your success. Join 5,000+ students already learning.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full h-auto text-base transition-all hover:shadow-lg hover:shadow-blue-500/50">
                  <Link href="/signup">Start Learning</Link>
                </Button>
                <Button asChild className="border-2 border-blue-500 text-blue-500 dark:text-blue-400 dark:border-blue-400 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white font-semibold px-8 py-3 rounded-full bg-transparent h-auto text-base transition-all">
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div>
                  <p className="text-3xl font-bold text-blue-500">5K+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Students</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-500">50+</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Courses</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-500">24/7</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Support</p>
                </div>
              </div>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="hidden md:grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, title: 'Expert Teachers', desc: 'Learn from industry experts' },
                { icon: Users, title: 'Active Community', desc: 'Connect with peers' },
                { icon: Award, title: 'Certifications', desc: 'Earn verified certs' },
                { icon: Zap, title: 'Fast Learning', desc: 'Progress quickly' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all"
                >
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg w-fit mb-3">
                    <item.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Explore Our Courses
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Choose from our wide range of expertly-designed courses
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {['All', 'BCS', 'Bank Job', 'Campus to Career', 'Medical', 'Freelancing'].map((category) => (
              <button
                key={category}
                className={`px-4 sm:px-6 py-2 rounded-full font-semibold transition-all whitespace-nowrap ${
                  category === 'All'
                    ? 'bg-blue-500 text-white'
                    : 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-blue-500 dark:hover:border-blue-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'BCS Preparation Course',
                image: 'bg-gradient-to-br from-purple-500 to-indigo-600',
                students: '1,234',
              },
              {
                title: 'Bank Job Written Course',
                image: 'bg-gradient-to-br from-orange-500 to-red-600',
                students: '2,456',
              },
              {
                title: 'Campus to Career Program',
                image: 'bg-gradient-to-br from-green-500 to-teal-600',
                students: '891',
              },
              {
                title: 'Medical Entrance Exam',
                image: 'bg-gradient-to-br from-pink-500 to-rose-600',
                students: '1,567',
              },
              {
                title: 'English Grammar Mastery',
                image: 'bg-gradient-to-br from-blue-500 to-cyan-600',
                students: '3,204',
              },
              {
                title: 'Mathematics for Exams',
                image: 'bg-gradient-to-br from-yellow-500 to-orange-600',
                students: '2,102',
              },
              {
                title: 'General Knowledge Plus',
                image: 'bg-gradient-to-br from-indigo-500 to-purple-600',
                students: '1,843',
              },
              {
                title: 'Freelancing Mastery',
                image: 'bg-gradient-to-br from-teal-500 to-blue-600',
                students: '945',
              },
            ].map((course, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500"
              >
                {/* Large Image */}
                <div
                  className={`${course.image} h-40 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-all"></div>
                </div>

                {/* Content Area */}
                <div className="p-6 space-y-4">
                  {/* Title */}
                  <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
                    {course.title}
                  </h3>

                  {/* Student Count */}
                  <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span className="text-blue-500 font-semibold">{course.students}</span>
                    <span>Students Enrolled</span>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <HoverButton href="/course-details" variant="outline">Details</HoverButton>
                    <HoverButton href="/enroll">Enroll</HoverButton>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View All Button */}
          <div className="text-center mt-12">
            <Button asChild className="bg-blue-500 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full h-auto text-base transition-all">
              <Link href="/courses">View All Courses</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
<section className="relative py-14 sm:py-20 bg-gradient-to-br from-blue-50 via-slate-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-slate-900 overflow-hidden">
  {/* Decorative Background Elements */}
  <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/20 dark:bg-blue-600/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
  <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/20 dark:bg-cyan-600/10 rounded-full blur-3xl -ml-48 -mb-48"></div>
  
  {/* Circles */}
  <div className="absolute top-20 left-12 w-12 h-12 border-2 border-blue-400/40 dark:border-blue-600/40 rounded-full"></div>
  <div className="absolute bottom-32 right-20 w-20 h-20 border-2 border-cyan-400/30 dark:border-cyan-600/30 rounded-full"></div>
  <div className="absolute top-2/3 right-1/4 w-8 h-8 border-2 border-blue-400/25 dark:border-blue-600/25 rounded-full"></div>
  
  {/* Lines */}
  <div className="absolute top-1/4 left-1/4 w-32 h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-400/40 to-blue-400/0 dark:via-blue-600/40 transform -rotate-45"></div>
  <div className="absolute bottom-1/3 right-1/3 w-48 h-0.5 bg-gradient-to-r from-cyan-400/0 via-cyan-400/30 to-cyan-400/0 dark:via-cyan-600/30"></div>
  <div className="absolute top-1/2 right-12 w-24 h-0.5 bg-gradient-to-r from-blue-400/0 via-blue-400/35 to-blue-400/0 dark:via-blue-600/35 transform rotate-45"></div>
  
  {/* Large Background Icons */}
  <div className="absolute top-12 right-1/4 opacity-10 dark:opacity-5 transform -rotate-12">
    <BookOpenText className="w-48 h-48 text-blue-600 dark:text-blue-400" />
  </div>
  <div className="absolute bottom-12 left-1/4 opacity-10 dark:opacity-5 transform rotate-12">
    <Trophy className="w-48 h-48 text-cyan-600 dark:text-cyan-400" />
  </div>
  
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    {/* Header */}
    <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
      <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 px-4 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 mb-4">
        What We Offer
      </span>

      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
        Complete Learning <br className="hidden sm:block" />
        Experience
      </h2>

      <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base md:text-lg leading-relaxed">
        Everything students need for smart preparation and better results.
      </p>
    </div>

    {/* Services */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {[
        {
          icon: Video,
          title: "Live Classes",
          desc: "Interactive live sessions",
        },
        {
          icon: FileText,
          title: "PDF Notes",
          desc: "Premium study materials",
        },
        {
          icon: PlayCircle,
          title: "Video Replay",
          desc: "Watch anytime later",
        },
        {
          icon: BookMarked,
          title: "Practice Book",
          desc: "Topic-wise practice",
        },
        {
          icon: Edit,
          title: "Daily Practice",
          desc: "Daily exams & MCQs",
        },
        {
          icon: Cloud,
          title: "Offline & Online",
          desc: "Flexible learning mode",
        },
        {
          icon: HelpCircle,
          title: "Q&A Support",
          desc: "Get help instantly",
        },
        {
          icon: BarChart3,
          title: "Analysis Report",
          desc: "Track your performance",
        },
      ].map((service, i) => (
        <div
          key={i}
          className="group rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 transition-all duration-300 hover:border-blue-500 dark:hover:border-blue-600 hover:shadow-lg"
        >
          {/* Icon */}
          <div className="mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center transition-colors duration-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40">
              <service.icon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {service.title}
            </h3>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {service.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">
              Why Choose ProfessorLMS?
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Everything you need to succeed in competitive exams
            </p>
          </div>

          {/* Features Grid - Mobile First */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Expert Courses',
                description: 'Curated courses from industry experts with years of experience',
              },
              {
                icon: Users,
                title: 'Community Support',
                description: 'Join thousands of students in our active learning communities',
              },
              {
                icon: Award,
                title: 'Certifications',
                description: 'Earn recognized certificates upon course completion',
              },
              {
                icon: CheckCircle2,
                title: 'Self-Paced',
                description: 'Learn at your own speed with flexible scheduling',
              },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                  <Icon className="w-10 h-10 text-blue-600 dark:text-blue-400 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
            Ready to Start Learning?
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto">
            Join thousands of students preparing for competitive exams. Get access to expert courses, live exams, and community support.
          </p>
          <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg">
            <Link href="/signup">Create Your Account</Link>
          </Button>
        </div>
      </section>
    </div>
    <Footer />
    </>
  );
}


