// order.tsx
"use client";

export default function Order() {
  return (
    <section className="relative z-0 w-full bg-[#FF0931]">
      <div className="relative -mt-[90px] pt-[140px] md:-mt-[140px] md:pt-[180px]">
        <div className="mx-auto text-center">
          <h2 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-white m-0 text-center capitalize font-normal leading-[100%] tracking-[0.54px] text-[clamp(36px,10vw,150px)]">
            Order Crispies
          </h2>
          <h2 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-black m-0 mt-[clamp(4px,1vw,14px)] text-center capitalize font-normal leading-[100%] tracking-[0.54px] text-[clamp(36px,10vw,150px)]">
            Choose Your Way
          </h2>
        <p className="m-0 mt-4 mx-auto max-w-[1306px] font-[family-name:var(--font-koulen),Koulen,sans-serif] text-center text-[clamp(24px,4vw,60px)] font-normal capitalize leading-[100%] tracking-[0.54px] text-white">
        Choose how you enjoy Crispies. Download our app, order online for
            takeaway, or get your favourite burgers and crispy chicken delivered
            straight to your door.
        </p>

          {/* Cards */}
          <div className="bg-white mt-10 w-full">
            <div className="flex flex-col gap-10 lg:gap-0 items-center bg-[#FF0931] px-6 lg:px-0 rounded-b-[50px] lg:flex-row lg:items-end lg:justify-center">
              {/* Card 1 — Download App */}
              <div className="bg-white rounded-bl-[50px] w-full sm:w-auto">
                <div className="bg-[#FF0931] lg:rounded-b-[50px] pb-6  lg:p-10 lg:pt-0 pt-0 flex w-full h-[380px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] lg:w-[480px] lg:h-[480px] 2xl:w-[530px] 2xl:h-[530px]">
                  <div className="bg-[#C1001F] relative rounded-[20px] p-5 sm:p-6 pb-0 pt-6 sm:pt-8 text-left overflow-visible flex flex-col lg:flex-row w-full h-full mb-0 lg:mb-5">
                    <div className="w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] lg:w-[81px] lg:h-[81px] bg-[#FF0931] flex items-center justify-center absolute rounded-[12px] sm:rounded-[15px] bottom-6 sm:bottom-8 lg:bottom-10 z-[110]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        className="sm:w-[34px] sm:h-[34px] lg:w-10 lg:h-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 7h10v10" />
                        <path d="M7 17 17 7" />
                      </svg>
                    </div>
                    <div className="max-w-[210px] sm:max-w-[240px] lg:max-w-[268px]">
                      <h3 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-white m-0 text-left capitalize font-normal leading-[100%] tracking-[0.54px] text-[clamp(1.75rem,4.2vw,4.5rem)]">
                        Download Our App
                      </h3>
                      <p className="font-[family-name:var(--font-inter),Inter,sans-serif] text-white m-0 mt-[clamp(8px,1.2vw,14px)] text-left capitalize font-normal leading-[1.3] tracking-[0.2px] text-[clamp(0.95rem,1.6vw,1.5rem)]">
                        Download App For Exclusive{" "}
                        <span className="block">Offers</span>
                      </p>
                    </div>
                    <img
                      src="/images/downloadApp.png"
                      alt="Crispies App"
                      className="absolute bottom-0 right-0 z-[100] h-[220px] sm:h-[270px] md:h-[300px] lg:h-[350px] w-auto object-contain object-bottom"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2 — Order on the Website */}
           
              {/* Card 3 — Get It Delivered */}
              <div className="bg-white rounded-b-[50px] lg:rounded-br-[50px] lg:rounded-b-[0px] w-full sm:w-auto">
                <div className="bg-[#FF0931]  rounded-b-2xl lg:rounded-b-[50px] pb-6  lg:p-10 lg:pt-0 pt-0 w-full h-[380px] sm:w-[420px] sm:h-[420px] md:w-[460px] md:h-[460px] lg:w-[480px] lg:h-[480px] 2xl:w-[530px] 2xl:h-[530px]">
                  <div className="bg-[#C1001F] relative rounded-[20px] p-5 sm:p-6 pb-0 pt-6 sm:pt-8 text-left overflow-visible flex flex-col lg:flex-row w-full h-full mb-0 lg:mb-5">
                    <div className="w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] lg:w-[81px] lg:h-[81px] bg-[#FF0931] flex items-center justify-center absolute rounded-[12px] sm:rounded-[15px] bottom-6 sm:bottom-8 lg:bottom-10 z-[110]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28"
                        height="28"
                        className="sm:w-[34px] sm:h-[34px] lg:w-10 lg:h-10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M7 7h10v10" />
                        <path d="M7 17 17 7" />
                      </svg>
                    </div>
                    <div className="max-w-[210px] sm:max-w-[240px] lg:max-w-[268px]">
                      <h3 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-white m-0 text-left capitalize font-normal leading-[100%] tracking-[0.54px] text-[clamp(1.75rem,4.2vw,4.5rem)]">
                        Get It Delivered
                      </h3>
                      <p className="font-[family-name:var(--font-inter),Inter,sans-serif] text-white m-0 mt-[clamp(8px,1.2vw,14px)] text-left capitalize font-normal leading-[1.3] tracking-[0.2px] text-[clamp(0.95rem,1.6vw,1.5rem)]">
                        Delivered Hot & <br /> Fresh To Your{" "}
                        <span className="block">Door Step</span>
                      </p>
                    </div>
                    <img
                      src="/images/deliveredImage.png"
                      alt="Get it delivered"
                      className="absolute bottom-0 right-0 z-[100] h-[190px] sm:h-[230px] md:h-[260px] lg:h-[300px] 2xl:h-[320px] w-auto object-cover md:object-bottom"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}