import Navbar from "@/components/store/navbar";
import Footer from "@/components/store/footer";
import SmoothScroll from "@/components/providers/smooth-scroll";
import ScrollProgressIndicator from "@/components/store/scroll-progress";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-black">
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ScrollProgressIndicator />
      </div>
    </SmoothScroll>
  );
}