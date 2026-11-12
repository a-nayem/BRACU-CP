import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PlannerApp from "@/components/planner/PlannerApp";

export const metadata = { title: "Course Planner | BRACU CSE Planner" };

export default function PlannerPage() {
  return (
    <main className="bg-page">
      <Navbar solid />
      <PlannerApp />
      <Footer />
    </main>
  );
}
