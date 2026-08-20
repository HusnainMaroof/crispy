export default function DownloadApp() {
  return (
    <div
      className="relative flex items-center overflow-hidden bg-[#FF0931]"
      style={{
        borderRadius: "30px",
        border: "1px solid #E2E2E2",
        height: "237px",
      }}
    >
      {/* Left — overlapping food + phone images */}
      <div className="relative h-full w-[420px] shrink-0">
        <img
          src="/images/orderOnimage.png"
          alt="Crispies food"
          className="absolute bottom-0 left-0 h-[85%] w-auto object-contain"
        />
        <img
          src="/images/downloadApp.png"
          alt="Crispies app on phone"
          className="absolute bottom-0 left-[140px] h-[105%] w-auto object-contain"
        />
      </div>

      {/* Center — text */}
      <div className="flex flex-1 flex-col items-center justify-center gap-3 pr-[100px]">
        <h2 className="m-0 leading-[100%] tracking-[0.54px] capitalize">
          <span
            className="text-white"
            style={{
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
              fontSize: "100px",
              fontWeight: 400,
            }}
          >
            Download{" "}
          </span>
          <span
            className="text-black"
            style={{
              fontFamily: "var(--font-korolev), Korolev, sans-serif",
              fontSize: "100px",
              fontWeight: 400,
            }}
          >
            Our App
          </span>
        </h2>
        <p
          className="m-0 text-white capitalize tracking-[0.54px]"
          style={{
            fontFamily: "var(--font-inter), Inter, sans-serif",
            fontSize: "25px",
            fontWeight: 400,
            lineHeight: "100%",
          }}
        >
          Download App For Exclusive Offers
        </p>
      </div>

      {/* Right — arrow button */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2">
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center rounded-[15px] border-none bg-white transition-transform hover:scale-105"
          style={{ width: "84px", height: "84px" }}
          aria-label="Download app"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="84"
            height="84"
            viewBox="0 0 84 84"
            fill="none"
          >
            <path
              d="M29.3603 59L26 55.6441L50.9869 30.6467H31.6867L31.7298 26H59V53.2777H54.3042L54.3473 34.0026L29.3603 59Z"
              fill="#FF0000"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
