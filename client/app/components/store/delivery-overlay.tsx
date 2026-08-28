"use client";

import { useEffect, useState } from "react";

const locations = [
  { id: "harrow-road-maida-vale", name: "Harrow Road - Maida Vale" },
  { id: "tower-hill", name: "Tower Hill" },
  { id: "kilburn", name: "Kilburn" },
  { id: "harrow", name: "Harrow" },
  { id: "elephant-and-castle", name: "Elephant & Castle" },
  { id: "edgware-road", name: "Edgware Road" },
  { id: "stockwell", name: "Stockwell" },
];

const platforms = [
  {
    id: "uber-eats",
    name: "Uber Eats",
    desc: "Fast and reliable delivery straight to your door with real-time tracking.",
    url: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="30"
        viewBox="0 0 40 30"
        fill="none"
      >
        <path
          d="M18.7824 24.905C18.7889 24.3114 18.6162 23.7292 18.2864 23.2325C17.9565 22.7357 17.4843 22.3469 16.9298 22.1153C16.3753 21.8836 15.7635 21.8197 15.172 21.9316C14.5805 22.0435 14.0362 22.3262 13.608 22.7437C13.1799 23.1612 12.8873 23.6948 12.7674 24.2766C12.6475 24.8584 12.7057 25.4623 12.9347 26.0114C13.1636 26.5605 13.553 27.0302 14.0532 27.3607C14.5535 27.6912 15.1422 27.8677 15.7444 27.8677C16.1421 27.8732 16.537 27.8005 16.9059 27.654C17.2749 27.5074 17.6105 27.2899 17.8933 27.0141C18.1761 26.7383 18.4004 26.4098 18.553 26.0477C18.7057 25.6856 18.7836 25.2972 18.7824 24.905ZM21.2641 20.0579V29.7531H18.7359V28.8748C17.8352 29.6066 16.7027 30.0038 15.5355 29.9971C12.5431 29.9971 10.2009 27.7311 10.2009 24.9021C10.2009 22.0731 12.5431 19.8081 15.5355 19.8081C16.7027 19.8014 17.8352 20.1986 18.7359 20.9304V20.0521L21.2641 20.0579ZM29.6684 27.5535H27.7707C27.1916 27.5535 26.8204 27.3076 26.8204 26.7914V22.2575H29.6723V20.0579H26.8165V17.2933H24.2655V20.054H22.3401V22.2536H24.2655V27.4149C24.2655 28.7167 25.2168 29.7492 26.9323 29.7492H29.6684V27.5535ZM35.4316 30C38.3538 30 40 28.6533 40 26.7914C40 25.4662 39.0259 24.4786 36.9848 24.0521L34.8287 23.6257C33.5765 23.4022 33.1816 23.1778 33.1816 22.7289C33.1816 22.1434 33.7854 21.7862 34.898 21.7862C36.1037 21.7862 36.9848 22.1004 37.2401 23.1778H39.7684C39.6288 21.1577 38.1212 19.8111 35.0604 19.8111C32.4164 19.8111 30.5613 20.866 30.5613 22.9084C30.5613 24.3215 31.5819 25.2427 33.7854 25.6906L36.1968 26.2293C37.1481 26.4088 37.4025 26.6557 37.4025 27.0383C37.4025 27.6433 36.6838 28.0249 35.5217 28.0249C34.0616 28.0249 33.2261 27.7106 32.9014 26.6333H30.3524C30.7236 28.6533 32.2778 30 35.4316 30ZM0 16.6239H9.53178V18.8684H2.57375V22.0751H9.34567V24.2522H2.57375V27.5057H9.53178V29.7502H0V16.6239Z"
          fill="black"
        />
        <path
          d="M39.7684 5.2511V3.48869H39.0903C38.0014 3.48869 37.2095 3.97662 36.7254 4.7456V3.56384H34.7872V13.1273H36.7452V7.68977C36.7452 6.20841 37.6747 5.25012 38.9547 5.25012L39.7684 5.2511ZM25.6979 7.46434C26.0473 6.00056 27.2679 5.0247 28.722 5.0247C30.1762 5.0247 31.3948 6.00056 31.7254 7.46434H25.6979ZM28.7606 3.3755C28.0952 3.37008 27.4353 3.4947 26.8191 3.74217C26.2028 3.98963 25.6424 4.35503 25.1702 4.81725C24.698 5.27947 24.3234 5.82935 24.0681 6.43512C23.8127 7.04088 23.6816 7.69053 23.6824 8.34652C23.6824 11.197 25.9691 13.3351 28.9349 13.3351C30.7375 13.3351 32.2095 12.5661 33.1984 11.2907L31.7838 10.2777C31.0473 11.2341 30.0782 11.6849 28.9349 11.6849C28.1498 11.6904 27.3885 11.4195 26.788 10.9209C26.1875 10.4223 25.7873 9.72882 25.6593 8.96521H33.7022V8.34652C33.7022 5.49506 31.6096 3.3755 28.7606 3.3755ZM17.5747 11.6849C16.9102 11.6799 16.262 11.4811 15.7119 11.1135C15.1619 10.7459 14.7345 10.2259 14.4837 9.61924C14.2329 9.01255 14.1699 8.34624 14.3026 7.70431C14.4354 7.06237 14.758 6.47355 15.2297 6.01207C15.7014 5.55058 16.3011 5.23709 16.9533 5.11111C17.6054 4.98513 18.2808 5.0523 18.8943 5.30416C19.5078 5.55601 20.032 5.98127 20.4007 6.52634C20.7694 7.07141 20.9661 7.71188 20.9661 8.36701C20.9647 8.80447 20.8758 9.23736 20.7046 9.64092C20.5333 10.0445 20.2831 10.4108 19.9681 10.719C19.6531 11.0271 19.2796 11.271 18.8689 11.4368C18.4583 11.6025 18.0185 11.6869 17.5747 11.6849ZM12.2451 13.1282H14.1833V11.926C14.6475 12.3803 15.1978 12.74 15.803 12.9847C16.4082 13.2293 17.0563 13.354 17.7104 13.3517C20.6177 13.3517 22.9044 11.1199 22.9044 8.36311C22.9044 5.58777 20.6177 3.355 17.7104 3.355C17.0601 3.35367 16.416 3.47912 15.8151 3.72414C15.2142 3.96916 14.6684 4.32891 14.2091 4.78268V0.000976812H12.2481L12.2451 13.1282ZM5.36527 11.5903C7.24609 11.5903 8.69828 10.1841 8.69828 8.10158V0.00195213H10.7335V13.1282H8.72105V11.9094C7.81033 12.8286 6.55019 13.3537 5.13562 13.3537C2.22827 13.3537 0 11.3092 0 8.21478V0H2.03326V8.09963C2.03326 10.2202 3.46664 11.5883 5.36626 11.5883"
          fill="black"
        />
      </svg>
    ),
    logoBg: "#06BB67",
    logoText: "Uber Eats",
  },
  {
    id: "deliveroo",
    name: "Deliveroo",
    desc: "Order Crispies through Deliveroo for exclusive rewards and premium delivery.",
    url: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="42"
        height="46"
        viewBox="0 0 42 46"
        fill="none"
      >
        <path
          d="M30.3234 0L28.1787 20.3063L24.4851 3.19691L12.9277 5.6242L16.6213 22.7336L0 26.2265L2.91915 39.9022L32.1702 46L38.8426 31.1403L42 1.18404L30.3234 0ZM21.0894 29.4234C20.4936 29.9562 19.7191 29.897 18.8255 29.6602C17.9915 29.3642 17.634 28.3578 17.9319 27.1737C18.1702 26.2857 19.3021 26.1081 19.8383 26.1081C20.0766 26.1081 20.2553 26.1673 20.434 26.2265C20.8511 26.4041 21.5064 26.7593 21.6255 27.3514C21.8638 28.1802 21.6851 28.8906 21.0894 29.4234ZM29.5489 30.3707C29.1319 31.1403 27.9404 31.1995 26.8085 30.6667C26.034 30.3115 26.034 29.3642 26.1532 28.7722C26.2128 28.4762 26.3319 28.1802 26.5106 27.9434C26.8085 27.5882 27.2255 27.1737 27.7617 27.1737C28.5957 27.1737 29.3702 27.529 29.7872 28.2394C30.2043 28.8314 29.966 29.601 29.5489 30.3707Z"
          fill="white"
        />
      </svg>
    ),
    logoBg: "#00CCBC",
    logoText: "D",
  },
  {
    id: "just-eat",
    name: "Just Eat",
    desc: "Savor the flavor with Just Eat's seamless ordering process.",
    url: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="41"
        height="41"
        viewBox="0 0 41 41"
        fill="none"
      >
        <path
          d="M19.1211 0.395917C19.5091 0.137778 19.9653 0 20.4319 0C20.8985 0 21.3546 0.137778 21.7426 0.395917C23.7633 1.66187 25.702 3.05328 27.5471 4.5619C27.5471 4.5619 28.0497 4.90888 28.0634 4.32111C28.0134 3.56213 28.0584 2.7999 28.1975 2.052C28.2718 1.85671 28.4038 1.68841 28.5761 1.56923C28.7483 1.45006 28.9527 1.38559 29.1624 1.38431C29.1624 1.38431 31.4418 1.49787 32.8892 1.69134C33.2037 1.73297 33.495 1.87866 33.7164 2.10502C33.9377 2.33137 34.0762 2.62525 34.1097 2.93946C34.1097 2.93946 35.0409 9.12218 35.2499 11.3513C35.2499 11.3513 35.4294 12.4869 37.0795 14.409C37.0795 14.409 40.4305 19.0829 40.8201 19.9766C40.8201 19.9766 41.5971 21.5928 39.9216 21.8125C39.9216 21.8125 36.8642 22.1196 36.5696 22.1869C36.3715 22.2104 36.1906 22.3101 36.0653 22.4647C35.94 22.6193 35.8804 22.8166 35.8992 23.0144C35.8992 23.0144 35.7387 33.77 34.948 38.937C34.948 38.937 34.74 40.9874 33.6072 40.9401C33.6072 40.9401 30.4631 40.8402 29.7325 40.8602C29.7325 40.8602 29.4179 40.8602 29.4644 40.4396C29.4644 40.4396 31.0659 23.6684 29.9806 15.1903C29.9806 15.1903 29.9331 14.0957 29.0959 13.8549C29.0959 13.8549 28.3315 13.5479 27.601 14.5226C24.4303 18.9435 22.6947 24.2252 22.6273 29.6577C22.6273 29.6577 22.5397 32.3284 22.9493 32.9951C22.9493 32.9951 23.2027 33.463 24.5044 33.5692L26.1525 33.79C26.1525 33.79 26.4544 33.79 26.427 34.1895C26.427 34.1895 26.0522 39.1105 25.9455 39.9853C25.9381 40.1851 25.898 40.3807 25.8241 40.5657C25.8241 40.5657 25.7639 40.7329 25.2477 40.713C25.2477 40.713 17.982 40.6604 17.1638 40.713C17.1638 40.713 16.8217 40.7129 16.7488 40.5331C16.6749 40.3523 16.2453 34.1832 16.259 33.3095C16.2524 33.2208 16.2733 33.1322 16.3188 33.0557C16.3643 32.9792 16.4322 32.9184 16.5134 32.8815C17.068 32.5331 17.5367 32.0649 17.8848 31.5115C18.233 30.9582 18.4517 30.3339 18.5246 29.685C18.6133 28.7492 18.626 27.8102 18.5647 26.8733C18.5647 26.8733 18.8329 17.4405 18.9005 15.9242C18.9005 15.9242 18.9533 15.4101 18.2829 15.3175C18.122 15.2799 17.9528 15.3072 17.8121 15.3935C17.6714 15.4798 17.5708 15.6181 17.5322 15.7781V15.8306C17.5322 15.8843 17.0635 22.0533 17.15 24.5096C17.15 24.5096 17.3116 26.1184 16.1925 26.152C16.1925 26.152 15.1061 26.3129 15.0522 24.9712C15.0522 24.9712 15.1325 18.922 15.4006 15.9316C15.4017 15.7665 15.3413 15.607 15.2311 15.4837C15.121 15.3604 14.9688 15.2821 14.8041 15.2639C14.6333 15.2402 14.4599 15.2833 14.3202 15.384C14.1805 15.4847 14.0853 15.6353 14.0546 15.8044C14.0504 15.8216 14.0504 15.8397 14.0546 15.8569C14.0546 15.8569 13.5847 21.6464 13.6713 24.7041C13.6713 24.7041 13.8054 26.1867 12.6187 26.132C12.6187 26.132 11.6263 26.2456 11.5735 24.9302C11.5735 24.9302 11.8417 16.6455 11.9156 16.0052C11.907 15.8471 11.8423 15.6972 11.7331 15.5822C11.6238 15.4673 11.4771 15.3947 11.3191 15.3775H11.2515C11.0839 15.3635 10.9172 15.4127 10.7842 15.5153C10.6513 15.6179 10.5619 15.7665 10.5336 15.9316C10.5315 15.9515 10.5315 15.9716 10.5336 15.9915C10.5336 15.9915 10.0923 25.8986 10.1525 28.8091C10.1525 28.8091 10.1124 31.8006 12.3305 33.015C12.3305 33.015 12.6589 33.2022 12.6662 33.4893C12.6662 33.4893 12.9143 38.7435 13.1413 40.4396C13.1413 40.4396 13.2226 40.8465 12.8605 40.8465L7.27661 41C6.98392 40.9983 6.70292 40.8854 6.49101 40.6843C6.2791 40.4832 6.15226 40.2091 6.13639 39.918C5.41289 34.3509 5.06828 28.7414 5.10492 23.1279C5.12448 22.9202 5.06712 22.7126 4.94364 22.5441C4.82016 22.3756 4.63908 22.2579 4.43451 22.2131C4.43451 22.2131 1.5787 21.9534 0.888233 21.7799C0.710516 21.7339 0.54594 21.6475 0.407454 21.5274C0.268968 21.4073 0.160352 21.2569 0.090151 21.0879C0.0199501 20.9189 -0.00991952 20.736 0.00289233 20.5536C0.0157042 20.3712 0.070848 20.1942 0.163985 20.0366C4.80357 12.0651 11.3062 5.32722 19.1211 0.395917Z"
          fill="black"
        />
      </svg>
    ),
    logoBg: "#FF8000",
    logoText: "JE",
  },
];

export default function DeliveryOverlay({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>("");
  const [step, setStep] = useState<"branch" | "platform" | "redirect">(
    "branch",
  );
  const [platform, setPlatform] = useState<string | null>("");
  const selectedName = locations.find((l) => l.id === selected)?.name ?? "";
  const selectedPlatform = platforms.find((p) => p.id === platform);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Choose a branch to order delivery"
      className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto p-4 sm:p-6"
    >
      <div
        className="overlay-backdrop-in fixed inset-0 bg-black/85"
        onClick={onClose}
        aria-hidden
      />

      <div className="overlay-panel-in relative my-auto flex min-h-[85vh] max-h-[90vh] w-[90%] flex-col justify-center overflow-y-auto rounded-2xl border border-[#242424] bg-black px-4 pb-8 pt-12 shadow-[0_20px_60px_rgba(0,0,0,0.7)] sm:px-6 md:px-8 md:pb-10 md:pt-12">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="overlay-fade-in absolute right-4 top-4 flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {step === "branch" && (
          <>
            <h2 className="overlay-fade-up text-center font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[24px] font-bold uppercase leading-[1.18] tracking-[0.01em] text-white sm:text-[36px] md:text-[48px] lg:text-[80px]">
              Where are
              <br />
              you ordering from?
            </h2>

            <p className="overlay-fade-up stagger-1 mt-3 text-center text-[12px] font-normal text-[#8f8f8f] sm:text-[14px] md:text-[16px] lg:text-[25px]">
              Choose your nearest Crispies branch to continue.
            </p>

            <div className="mx-auto mt-6 grid w-full max-w-[85%] grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:mt-8 md:max-w-[75%] lg:max-w-[70%]">
              {locations.map((loc, i) => {
                const isSelected = selected === loc.id;

                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setSelected(loc.id)}
                    aria-pressed={isSelected}
                    className={`overlay-scale-in stagger-${Math.min(i + 2, 7)} relative flex min-h-[60px] cursor-pointer items-center justify-between overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 sm:h-16 sm:px-5 md:h-20 md:px-6 lg:h-[120px] ${
                      isSelected
                        ? "border-[#FF0931] bg-[#FF0931]/[0.07] shadow-[0_0_18px_rgba(255,9,49,0.15)]"
                        : "border-[#242424] bg-[#161616] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <span className="flex flex-col items-start gap-1.5 sm:gap-2">
                      <span className="text-[13px] font-semibold leading-snug text-white sm:text-[14px] md:text-[15px] lg:text-[20px]">
                        {loc.name}
                      </span>
                      <span className="inline-flex items-center justify-center gap-2 rounded-full bg-[#085B1F] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.06em] text-white sm:px-2.5 sm:py-1 sm:text-[9px] md:px-3 md:py-2 md:text-[10px]">
                        <span className="size-[4px] rounded-full bg-[#22c55e] sm:size-[8px]" />
                        Open Now
                      </span>
                    </span>

                    {!isSelected && (
                      <span
                        aria-hidden
                        className="size-[18px] shrink-0 self-center rounded-full bg-[#2b2b2b] sm:size-[20px] md:size-[22px]"
                      />
                    )}

                    {isSelected && (
                      <span
                        aria-hidden
                        className="flex size-[18px] items-center justify-center rounded-full bg-[#FF0931] sm:size-[20px] md:size-[22px]"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="10"
                          height="10"
                          viewBox="0 0 12 12"
                          fill="none"
                          className="sm:w-3 sm:h-3 md:w-[12px] md:h-[12px]"
                        >
                          <path
                            d="M9.99969 3L4.50024 8.4996L2.00049 5.99978"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!selected}
              onClick={() => setStep("platform")}
              className={`overlay-fade-up stagger-7 mx-auto mt-8 flex w-full max-w-[85%] cursor-pointer items-center justify-center gap-2 rounded-lg py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-all duration-200 sm:py-3.5 sm:text-[12px] md:mt-10 md:max-w-[75%] md:py-4 md:text-[13px] lg:max-w-[70%] ${
                selected
                  ? "bg-[#FF0931] hover:brightness-110 active:scale-[0.99]"
                  : "cursor-not-allowed bg-[#232323] opacity-60"
              }`}
            >
              Continue to platforms
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="md:w-4 md:h-4"
              >
                <path d="M4 12h16" />
                <path d="m13 5 7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {step === "platform" && (
          <>
            <button
              type="button"
              onClick={() => setStep("branch")}
              aria-label="Back to branch selection"
              className="overlay-fade-in absolute left-3 top-3 flex size-8 cursor-pointer items-center justify-center rounded-full border border-[#2b2b2b] bg-[#161616] text-white transition-colors hover:border-[#FF0931] hover:bg-[#FF0931] sm:left-4 sm:top-4 sm:size-9"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>

            <h2 className="overlay-fade-up text-center font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[24px] font-bold uppercase leading-[1.18] tracking-[0.01em] text-white sm:text-[36px] md:text-[48px] lg:text-[80px]">
              How would
              <br />
              you like to order?
            </h2>

            <p className="overlay-fade-up stagger-1 mt-3 text-center text-[12px] font-normal text-[#8f8f8f] sm:text-[14px] md:text-[16px] lg:text-[25px]">
              Choose your preferred delivery platform for{" "}
              <span className="font-bold text-[#FF0931]">{selectedName}</span>{" "}
              branch.
            </p>

            <div className="mx-auto mt-6 grid w-full max-w-[90%] grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 md:mt-8 md:max-w-[80%] lg:max-w-[70%]">
              {platforms.map((p, i) => {
                const isSelected = platform === p.id;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    aria-pressed={isSelected}
                    className={`overlay-scale-in stagger-${Math.min(i + 2, 4)} relative flex cursor-pointer flex-col items-center rounded-2xl border px-4 py-6 text-center transition-all duration-200 sm:rounded-3xl sm:px-5 sm:pb-5 sm:pt-7 md:pb-6 md:pt-8 ${
                      isSelected
                        ? "border-[#FF0931] bg-[#FF0931]/[0.07] shadow-[0_0_18px_rgba(255,9,49,0.15)]"
                        : "border-[#242424] bg-[#161616] hover:border-[#3a3a3a]"
                    }`}
                  >
                    <span
                      className="flex size-[56px] items-center justify-center rounded-full text-[10px] font-bold text-white sm:size-[64px] md:size-[80px] lg:size-[90px]"
                      style={{ backgroundColor: p.logoBg }}
                    >
                      {p.url}
                    </span>

                    <span className="mt-4 text-[16px] font-bold text-white sm:text-[18px] md:text-[22px] lg:text-[25px]">
                      {p.name}
                    </span>
                    <span className="mt-2 text-[13px] leading-relaxed text-[#9a9a9a] sm:text-[14px] md:text-[15px] lg:text-[16px] max-w-[180px] lg:max-w-[200px]">
                      {p.desc}
                    </span>

                    <span className="mt-5 flex h-[20px] items-center justify-center sm:mt-6 sm:h-[22px]">
                      {isSelected ? (
                        <span
                          aria-hidden
                          className="flex size-[20px] items-center justify-center rounded-full bg-[#FF0931] sm:size-[22px]"
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 12 12"
                            fill="none"
                            className="sm:w-3 sm:h-3"
                          >
                            <path
                              d="M9.99969 3L4.50024 8.4996L2.00049 5.99978"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      ) : (
                        <span
                          aria-hidden
                          className="size-[20px] rounded-full bg-[#2b2b2b] sm:size-[22px]"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!platform}
              onClick={() => {
                if (platform) {
                  setStep("redirect");
                }
              }}
              className={`overlay-fade-up stagger-4 mx-auto mt-8 flex w-full max-w-[90%] cursor-pointer items-center justify-center gap-2 rounded-lg py-3 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white transition-all duration-200 sm:py-3.5 sm:text-[12px] md:mt-10 md:max-w-[80%] md:py-4 md:text-[14px] lg:max-w-[70%] ${
                platform
                  ? "bg-[#FF0931] hover:brightness-110 active:scale-[0.99]"
                  : "cursor-not-allowed bg-[#232323] opacity-60"
              }`}
            >
              Continue to {selectedPlatform?.name ?? "platform"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="none"
                className="md:w-5 md:h-5"
              >
                <path
                  d="M4.16602 10H15.834M10 15.834L15.834 10L10 4.16602"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </>
        )}

        {step === "redirect" && (
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 md:py-10">
            {/* Red dashed spinner */}
            <div className="overlay-scale-in redirect-spinner mb-6 sm:mb-7 md:mb-8" />

            {/* Heading */}
            <h2 className="overlay-fade-up stagger-1 text-center font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[24px] font-bold uppercase leading-[1.1] text-white sm:text-[36px] md:text-[48px] lg:text-[56px]">
              TAKING YOU
              <br />
              TO YOUR ORDER...
            </h2>

            {/* Subtext */}
            <p className="overlay-fade-up stagger-2 mt-3 text-center text-[12px] font-normal text-[#8f8f8f] sm:text-[14px] md:mt-4 md:text-[16px] lg:text-[18px] max-w-[90%] sm:max-w-[80%] md:max-w-md">
              You&apos;ll be redirected to your selected delivery platform in a
              moment. <br className="hidden sm:block" /> Get ready for premium good mood food.
            </p>

            {/* Info pills */}
            <div className="overlay-fade-up stagger-3 mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 md:mt-8">
              {/* Branch pill */}
              <div
                className="flex items-center gap-1.5 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #333",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                    fill="#FF0931"
                  />
                </svg>
                <span
                  style={{
                    color: "#FFF",
                    fontWeight: 500,
                  }}
                  className="sm:text-[13px] md:text-[14px]"
                >
                  {selectedName} Branch
                </span>
              </div>

              {/* Platform pill */}
              <div
                className="flex items-center gap-3 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 md:px-6  md:py-3"
                style={{
                  background: "transparent",
                  border: "1px solid #FF0931",
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4"
                >
                  <g clipPath="url(#clip0_996_2749)">
                    <path
                      d="M10.6667 6.66579C10.6667 7.37309 10.3857 8.05142 9.88562 8.55156C9.38552 9.0517 8.70724 9.33267 8 9.33267C7.29276 9.33267 6.61448 9.0517 6.11438 8.55156C5.61428 8.05142 5.33333 7.37309 5.33333 6.66579M2.06836 4.0217H13.931M2.26667 3.64355C2.09357 3.87436 2 4.1551 2 4.44361V13.333C2 13.6866 2.14048 14.0258 2.39052 14.2759C2.64057 14.5259 2.97971 14.6664 3.33333 14.6664H12.6667C13.0203 14.6664 13.3594 14.5259 13.6095 14.2759C13.8595 14.0258 14 13.6866 14 13.333V4.44361C14 4.1551 13.9064 3.87436 13.7333 3.64355L12.4 1.86541C12.2758 1.6998 12.1148 1.56538 11.9296 1.47281C11.7445 1.38023 11.5403 1.33203 11.3333 1.33203H4.66667C4.45967 1.33203 4.25552 1.38023 4.07038 1.47281C3.88524 1.56538 3.7242 1.6998 3.6 1.86541L2.26667 3.64355Z"
                      stroke="#FF0931"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_996_2749">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                <span
                  style={{
                    color: "#FFF",
                    fontSize: "16px",
                    fontWeight: 500,
                  }}
                  className="sm:text-[13px] md:text-[14px]"
                >
                  {selectedPlatform?.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
