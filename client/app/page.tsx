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
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="flex flex-col gap-10">
          {" "}
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-red-500">
            This Deployment{" "}
            <span className="text-xl text-gray-800">
              is paused by the owner.
            </span>
          </h3>
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-green-500">
            Your connection
            <span className="text-xl text-gray-800">is working correctly</span>
          </h3>
          <h3 className="text-black text-2xl font-semibold pl-3.5 border-l-3 border-green-500">
            Vercel
            <span className="text-xl text-gray-800">is working correctly.</span>
          </h3>
          <div className="border-[2px] border-gray-600 rounded-[5px]  p-5 flex-col items-center justify-center">
            <h3 className="text-black text-2xl font-semibold ">
              503
              <span className="text-xl text-gray-800">
                : SERVICE_UNAVAILABLE
              </span>
            </h3>
            <h3 className="text-black text-2xl font-semibold ">
              Code
              <span className="text-xl text-gray-800">: DEPLOYMENT_FAILED</span>
            </h3>
            <h3 className="text-black text-2xl font-semibold ">
              ID:
              <span className="text-xl text-gray-800">
                : sin1::wqcnm-1789489241339-94fbb6045e93
              </span>
            </h3>
          </div>
          <span className="text-xl text-gray-800">
            If you are a visitor, contact the website owner or try again later.
          </span>
        </div>
      </div>

      {/* <Navbar />
      <div className="relative">
        <Hero />
        <Welcome />
      </div>
      <Flavours />
      <Locations />
      <Partner />
      <Instagram />
      <Footer /> */}
    </div>
  );
};

export default Page;
