import Navbar from "@/components/store/navbar";
import Hero from "@/components/store/hero";
import React from "react";
import { About } from "@/components/store/about";
import Order from "@/components/store/order";
import Menu from "@/components/store/menu";
import Stats from "@/components/store/stats";
import Locations from "@/components/store/locations";
import Partner from "@/components/store/partner";
import Footer from "@/components/store/footer";

const page = () => {
  return (
    <div className="">
      <Navbar />
      <Hero />
      <About />
      <Order/>
      <Menu/>
      <Stats />
      <Locations />
      <Partner />
      <Footer />
    </div>
  );
};

export default page;
