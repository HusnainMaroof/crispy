import Navbar from "@/components/store/navbar";
import Hero from "@/components/store/hero";
import Welcome from "@/components/store/welcome";
import Flavours from "@/components/store/flavours";
import Locations from "@/components/store/locations";
import Instagram from "@/components/store/instagram";
import Partner from "@/components/store/partner";
import Footer from "@/components/store/footer";

const Page = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Welcome />
      <Flavours />
      <Locations />
      <Partner />
      <Instagram />
      <Footer />
    </div>
  );
};

export default Page;