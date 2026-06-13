import Link from 'next/link';
import { MapPin, Mail, Phone, ChevronsRight } from 'lucide-react';
import { FacebookIcon } from '@/components/icons/facebook';
import { YoutubeIcon } from '@/components/icons/youtube';
import { InstagramIcon } from '@/components/icons/instagram';
import { LinkedinIcon } from '@/components/icons/linkedin';

export default function Footer() {
  const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="group relative inline-flex items-center gap-2">
      <ChevronsRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
      <span className="text-slate-300 group-hover:text-white transition-colors relative inline-block">
        {children}
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
      </span>
    </Link>
  );

  return (
    <footer className="relative bg-gradient-to-b from-slate-950 to-slate-900 text-slate-300 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 h-96 w-96 bg-blue-500/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 h-96 w-96 bg-blue-600/5 blur-3xl rounded-full" />
        <div className="absolute top-1/3 right-1/4 h-80 w-80 bg-blue-400/5 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Brand Section */}
          <div className="lg:col-span-5">
            <Link href="/" className="inline-block group">
              <div className="h-16 w-auto flex items-center gap-3 group-hover:scale-105 transition-transform">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  P
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                  ProfessorLMS
                </span>
              </div>
            </Link>

            <p className="mt-6 text-slate-400 leading-8 max-w-md">
              বাংলাদেশের শিক্ষার্থীদের জন্য আধুনিক অনলাইন লার্নিং প্ল্যাটফর্ম।
              লাইভ ক্লাস, মডেল টেস্ট, প্রিমিয়াম কোর্স এবং স্মার্ট প্রস্তুতি একসাথে।
            </p>

            {/* Newsletter */}
            <div className="mt-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-12 flex-1 rounded-lg bg-slate-800/50 border border-slate-700 px-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 transition-all"
                />

                <button
                  type="submit"
                  className="h-12 px-6 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Social */}
            <div className="flex items-center gap-3 mt-8">
              {[
                { Icon: FacebookIcon, href: "#", label: "Facebook" },
                { Icon: YoutubeIcon, href: "#", label: "YouTube" },
                { Icon: InstagramIcon, href: "#", label: "Instagram" },
                { Icon: LinkedinIcon, href: "#", label: "LinkedIn" },
              ].map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="h-11 w-11 rounded-lg bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-gradient-to-br hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/50 transition-all duration-300 group"
                >
                  <social.Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </a>
              ))}
            </div>
          </div>

          {/* Right Links */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">

              {/* Links */}
              <div>
                <h3 className="text-white font-bold text-lg mb-6">
                  Platform
                </h3>

                <ul className="space-y-4">
                  {[
                    "Courses",
                    "Model Test",
                    "Live Class",
                    "Books",
                    "Blog",
                  ].map((item, index) => (
                    <li key={index}>
                      <FooterLink href="#">{item}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company */}
              <div>
                <h3 className="text-white font-bold text-lg mb-6">
                  Company
                </h3>

                <ul className="space-y-4">
                  {[
                    "About Us",
                    "Contact",
                    "Privacy Policy",
                    "Refund Policy",
                    "Terms & Conditions",
                  ].map((item, index) => (
                    <li key={index}>
                      <FooterLink href="#">{item}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-white font-bold text-lg mb-6">
                  Contact
                </h3>

                <div className="space-y-5 text-slate-400">

                  <div className="flex items-start gap-3 group cursor-pointer">
                    <MapPin className="w-5 h-5 mt-0.5 text-cyan-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="group-hover:text-cyan-300 transition-colors">Dhaka, Bangladesh</p>
                  </div>

                  <div className="flex items-start gap-3 group cursor-pointer">
                    <Mail className="w-5 h-5 mt-0.5 text-purple-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="group-hover:text-purple-300 transition-colors">support@professorlms.com</p>
                  </div>

                  <div className="flex items-start gap-3 group cursor-pointer">
                    <Phone className="w-5 h-5 mt-0.5 text-blue-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <p className="group-hover:text-blue-300 transition-colors">+880 1600-000000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Gateway */}       
        <div className="inline-flex items-center px-4 py-2 mb-8">

          {/* Payment Image */}
          <div className="flex-1 w-full">
            <img
              src="https://banglabaz.com/sslcommerz.png"
              alt="SSLCommerz"
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="py-6 border-t border-slate-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            <p className="text-sm text-slate-500 text-center md:text-left">
              © 2026 ProfessorLMS. All rights reserved.
            </p>

            <div className="flex items-center gap-6 text-sm">
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>

              <FooterLink href="/terms">Terms & Conditions</FooterLink>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
