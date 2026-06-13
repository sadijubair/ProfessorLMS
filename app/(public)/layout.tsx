import Navbar from "@/components/public/navbar"
import Footer from "@/components/public/footer"
import { getCurrentProfile } from "@/lib/auth/server";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session } = await getCurrentProfile();
  const isStudentLoggedIn = session?.portal === 'student' && session.role === 'student';

  return (
    <>
      <Navbar isStudentLoggedIn={isStudentLoggedIn} />
      {children}
      <Footer />
    </>
  );
}
