import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, BookOpen, Award, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-slate-950">
        {/* Mobile-First Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 opacity-90"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Side - Text */}
            <div className="text-white space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                  Master Your
                  <br />
                  <span className="text-yellow-300">Competitive Exams</span>
                </h1>
                <p className="text-base sm:text-lg text-blue-100 max-w-md">
                  Join thousands of students preparing for BCS, NTRCA, and other exams with our expert instructors and interactive learning platform.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg">
                  <Link href="/signup">Start Free</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="border-2 border-white text-white hover:bg-white/10 font-semibold bg-transparent"
                >
                  <Link href="/courses">Explore Courses</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-col sm:flex-row gap-6 pt-8 text-sm text-blue-100">
                <div>
                  <p className="text-2xl font-bold text-white">5000+</p>
                  <p>Active Students</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">50+</p>
                  <p>Expert Courses</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">24/7</p>
                  <p>Support Available</p>
                </div>
              </div>
            </div>

            {/* Right Side - Feature Cards */}
            <div className="hidden md:grid grid-cols-1 gap-4">
              {[
                { icon: BookOpen, title: 'Self-Paced Learning', desc: 'Learn at your own speed' },
                { icon: Users, title: 'Expert Instructors', desc: 'Industry experts teaching' },
                { icon: Award, title: 'Certifications', desc: 'Earn recognized certs' },
                { icon: Zap, title: 'Live Exams', desc: 'Practice with real exams' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-white hover:bg-white/20 transition-all"
                >
                  <item.icon className="w-6 h-6 mb-2" />
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-blue-100">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-slate-50 dark:bg-slate-900">
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
  );
}
