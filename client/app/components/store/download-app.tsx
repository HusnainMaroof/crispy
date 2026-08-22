import { ArrowUpRightIcon } from "lucide-react";

export default function DownloadApp() {
  return (
    <div
      className="relative    bg-[#FF0931] h-[130px] lg:h-[237px]"
      style={{
        borderRadius: "30px",
        border: "1px solid #E2E2E2",
        
      }}
    >
      <img
        src="/images/downloadApp.png"
        alt="Crispies app on phone"
        className="absolute    left-[100px] md:left-[180px] xl:left-[250px]   h-[110%] lg:h-[120%] xl:h-[130%]  -top-2  md:-top-5 xl:-top-10 w-auto object-contain z-50"
      />
      {/* Left — overlapping food + phone images */}
     
        <img
          src="/images/orderOnimage.png"
          alt="Crispies food"
          className="absolute bottom-0 left-0 h-[60%] xl:h-[100%] w-auto object-contain"
        />
      

      {/* Center — text */}
      <div className="flex flex-1   gap-2 md:gap-5 absolute  left-[40%] xl:left-[35%] top-1/2 -translate-y-1/2 flex-col">
        <h2 className="m-0 leading-[100%] tracking-[3px]! uppercase font-bold  text-2xl md:text-6xl 2xl:text-[100px] ">
          <span
            className="text-white"
            style={{
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
            }}
          >
            Download{" "}
          </span>
          <span
            className="text-black"
            style={{
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
            }}
          >
            Our App
          </span>
        </h2>
        <p
          className=" text-white capitalize tracking-[0.54px]  text-[12px] xl:text-2xl"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
        
            fontWeight: 400,
            lineHeight: "100%",
          }}
        >
          Download App For Exclusive Offers
        </p>
      </div>

      {/* Right — arrow button */}
      <div className="absolute right-5 md:right-20 top-1/2 -translate-y-1/2">
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-[15px] border-none bg-white transition-transform hover:scale-105 w-[50px] h-[50px] md:w-[84px] md:h-[84px]"
          aria-label="Download app"
        >
          <ArrowUpRightIcon className="md:h-12 w-8 h-8 md:w-12 text-[#FF0931]" />
        </button>
      </div>
    </div>
  );
}
