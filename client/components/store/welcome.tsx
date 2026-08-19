export default function Welcome() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl lg:rounded-[50px]  bg-white px-6 py-30 sm:px-10  md:px-14  lg:px-20 lg:py-50">
      <div className="relative z-10 mx-auto flex max-w-8xl flex-col items-center gap-10 md:flex-row md:items-center md:gap-16 lg:gap-24">
        {/* Text Content */}

        <div className="flex-1 text-center md:text-left">
          <h2 className="font-[family-name:var(--font-koulen),Koulen,sans-serif] text-[clamp(40px,10vw,150px)] font-black capitalize leading-[1] tracking-[0.54px] text-black">
            WELCOME{" "}
            <span className="text-nowrap">
              TO <span className="text-[#FF0931]">CRISPIES</span>
            </span>
          </h2>
          <p className="mt-6 max-w-lg font-[family-name:var(--font-inter),Inter,sans-serif] text-[clamp(16px,3vw,30px)] font-normal capitalize leading-[1] tracking-[0.54px] text-black md:mt-8">
            Crispies was founded with a mission to serve the best burgers &amp;
            chicken around. Our aim has always been to serve fresh, handmade
            food, bursting with flavours from around the globe.
          </p>
        </div>

        {/* Image — background unrotated, front rotated -5.059deg, both
            identical 3:2-ratio boxes so the front's tilted corners naturally
            reveal the blurred straight-edged copy behind them */}
        <div className="w-full flex-1 md:w-auto">
          <div className="relative mx-auto aspect-[3/2] max-w-[480px] md:max-w-[800px] md:mx-0">
            {/* Back layer: unrotated, blurred */}

            {/* Front layer: sharp, rotated -5.059deg per spec */}
            <div
              className="absolute inset-0  overflow-hidden rounded-2xl ring-1 ring-black/5 lg:rounded-3xl blur-[8px] opacity-70 "
              style={{
                background:
                  "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
              }}
            />
            <div
              className="absolute inset-0 -rotate-[8deg] overflow-hidden rounded-2xl ring-1 ring-black/5 lg:rounded-3xl translate-y-[10%]"
              style={{
                background:
                  "url('/images/aboutimage.jpg') lightgray 50% / cover no-repeat",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
