import Navbar from "@/app/components/store/navbar";
import Hero from "@/app/components/store/hero";
import Welcome from "@/app/components/store/welcome";
import Flavours from "@/app/components/store/flavours";
import Locations from "@/app/components/store/locations";
import Instagram from "@/app/components/store/instagram";
import Partner from "@/app/components/store/partner";
import DownloadApp from "@/app/components/store/download-app";
import Footer from "@/app/components/store/footer";

const Page = () => {
  return (
    <div>
      <Navbar />
      {/* Hero + Welcome share one positioning context so the hero stays
          pinned exactly as long as the pinned Welcome panel is on screen,
          then scrolls away with it. */}
      <div className="relative">
        <Hero />
        <Welcome />
      </div>
      <Flavours />
      <Locations />
      <Partner />
      <Instagram />
      <Footer />
    </div>
  );
};

export default Page;
