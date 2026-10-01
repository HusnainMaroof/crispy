"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import Footer from "@/app/components/store/footer";
import FranchiseApplicationOverlay from "@/app/components/store/franchise-application-overlay";
import BrochureOverlay from "@/app/components/store/brochure-overlay";
import ScrollTabs from "@/app/components/store/scroll-tabs";
import HowToGetStarted from "@/app/components/store/how-to-get-started";
import { ArrowDown, ArrowUp, Download, FilePenLine } from "lucide-react";
import { useLenis } from "@/app/components/providers/smooth-scroll";
import Image from "next/image";

const KOROLEV = "font-[family-name:var(--font-korolev),Korolev,sans-serif]";
const INTER = "font-[family-name:var(--font-inter),Inter,sans-serif]";

const WHY_CHOOSE_ITEMS = [
  {
    title: "Proven Concept",
    titleAr: "مفهوم مثبت",
    description:
      "Crispies has already established a strong presence in the food industry with our unique blend of flavours and high-quality ingredients. Our menu items, ranging from crispy chicken tenders to flavourful wraps and salads, have garnered a loyal customer base.",
    descriptionAr: "أسست كريسبيز حضوراً قوياً في قطاع الطعام بمزيجها الفريد من النكهات والمكونات عالية الجودة. أصنافنا، من قطع الدجاج المقرمشة إلى الراب والسلطات، صنعت قاعدة عملاء أوفياء.",
  },
  {
    title: "Supportive Team",
    titleAr: "فريق داعم",
    description:
      "When you join the Crispies family, you'll receive comprehensive support every step of the way. From site selection and restaurant design to training and marketing assistance, our team is committed to helping you succeed.",
    descriptionAr: "عند انضمامك لعائلة كريسبيز تحصل على دعم كامل في كل خطوة. من اختيار الموقع وتصميم المطعم إلى التدريب والتسويق، فريقنا ملتزم بنجاحك.",
  },
  {
    title: "Operational Excellence",
    titleAr: "تميّز تشغيلي",
    description:
      "We provide our franchisees with access to our time-tested operational systems and processes, ensuring smooth day-to-day operations and consistent customer satisfaction.",
    descriptionAr: "نمنح أصحاب الامتياز أنظمتنا وعملياتنا المجرّبة، لضمان تشغيل يومي سلس ورضا ثابت للعملاء.",
  },
  {
    title: "Marketing Power",
    titleAr: "قوة تسويقية",
    description:
      "Benefit from our national marketing campaigns and promotional materials designed to drive foot traffic to your Crispies location. We'll also support you in developing local marketing strategies to attract customers in your area.",
    descriptionAr: "استفد من حملاتنا التسويقية الوطنية والمواد الترويجية التي تجذب الزوار إلى فرعك. وندعمك أيضاً في بناء تسويق محلي لعملائك.",
  },
  {
    title: "Flexible Models",
    titleAr: "نماذج مرنة",
    description:
      "Whether you're interested in opening a standalone restaurant, a food truck, or a kiosk in a high-traffic location, Crispies offers flexible franchise models to suit your preferences and budget.",
    descriptionAr: "سواء أردت مطعماً مستقلاً أو عربة طعام أو كيوسكاً في موقع مزدحم، تقدم كريسبيز نماذج امتياز مرنة تناسب تفضيلك وميزانيتك.",
  },
  {
    title: "Community Engagement",
    titleAr: "التواصل مع المجتمع",
    description:
      "At Crispies, we believe in giving back to the communities we serve. As a franchisee, you'll have the opportunity to engage with local schools, charities, and events, strengthening your brand presence while making a positive impact.",
    descriptionAr: "في كريسبيز نؤمن برد الجميل للمجتمعات التي نخدمها. كصاحب امتياز يمكنك المشاركة مع المدارس والجمعيات والفعاليات المحلية، وتعزيز حضورك مع أثر إيجابي.",
  },
];

const GET_STARTED_ITEMS = [
  {
    title: "Submit Your Inquiry",
    titleAr: "أرسل استفسارك",
    description:
      "Fill out our franchise inquiry form to express your interest in joining the Crispies family. Tell us a bit about yourself and why you're excited about the opportunity.",
    descriptionAr: "املأ نموذج استفسار الامتياز للتعبير عن رغبتك في الانضمام لعائلة كريسبيز. أخبرنا عنك ولماذا تهمك هذه الفرصة.",
  },
  {
    title: "Initial Consultation",
    titleAr: "استشارة أولى",
    description:
      "Once we receive your inquiry, a member of our franchise development team will reach out to schedule an initial consultation. This is your chance to ask questions and learn more about the franchise process.",
    descriptionAr: "بعد استلام استفسارك، يتواصل معك أحد فريق تطوير الامتياز لتحديد استشارة أولى. هذه فرصتك للأسئلة ومعرفة خطوات الامتياز.",
  },
  {
    title: "FDD",
    titleAr: "وثيقة الإفصاح",
    description:
      "Upon approval of your application, you'll receive our Franchise Disclosure Document (FDD) for review. This document contains important information about the franchise agreement, financial obligations, and support provided by Crispies.",
    descriptionAr: "بعد الموافقة على طلبك ستصلك وثيقة إفصاح الامتياز للمراجعة. تتضمن معلومات مهمة عن الاتفاقية والالتزامات المالية والدعم الذي تقدمه كريسبيز.",
  },
  {
    title: "Training",
    titleAr: "التدريب",
    description:
      "With the help of our experienced team, you'll select the perfect location for your Crispies restaurant. You'll also undergo comprehensive training to ensure you're equipped with the knowledge and skills to run a successful operation.",
    descriptionAr: "بمساعدة فريقنا الخبير تختار الموقع المناسب لمطعم كريسبيز. وتخضع أيضاً لتدريب شامل يجهّزك لتشغيل ناجح.",
  },
  {
    title: "Grand Opening",
    titleAr: "الافتتاح الكبير",
    description:
      "Finally, it's time to celebrate! We'll work closely with you to plan and execute a memorable grand opening event, generating excitement and attracting eager customers to your new Crispies location.",
    descriptionAr: "حان وقت الاحتفال. نعمل معك على تخطيط وتنفيذ حفل افتتاح مميز يجذب العملاء إلى فرع كريسبيز الجديد.",
  },
];

function localizedItems<T extends { title: string; titleAr: string; description: string; descriptionAr: string }>(items: T[], locale: string) {
  return items.map((item) => locale === "ar"
    ? { title: item.titleAr, description: item.descriptionAr }
    : { title: item.title, description: item.description });
}

export default function PartnerPage() {
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const { locale, t } = useLocale();
  const whyItems = localizedItems(WHY_CHOOSE_ITEMS, locale);
  const startItems = localizedItems(GET_STARTED_ITEMS, locale);
  const become = t("franchise.become").split("\n");
  const [atBottom, setAtBottom] = useState(false);
  const lenis = useLenis();

  // Track whether the page is scrolled to the very bottom so the button
  // can flip between "go to bottom" and "back to top".
  useEffect(() => {
    const onScroll = () => {
      const remaining =
        document.documentElement.scrollHeight -
        (window.innerHeight + window.scrollY);
      setAtBottom(remaining < 48);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleScrollToggle = () => {
    const target = atBottom ? 0 : document.documentElement.scrollHeight;
    // Lenis is disabled under reduced motion, so jump instead of smooth-scrolling.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, target);
      return;
    }
    lenis.scrollTo(target);
  };

  return (
    <>
      {/* 1. Hero — Grow With Crispies */}
      <section className="w-full ">
        <div className=" w-full aspect-[16/6]  bg-top bg-cover" 
          style={{ backgroundImage: "url('/images/frinchies-inquiry-hero-section.avif')" }}/> 

        <div className="px-6 py-16 sm:px-10 sm:py-20 md:px-12  bg-white">
          <div className="flex flex-col md:flex-row   md:justify-center md:items-center   gap-5  md:gap-10  xl:gap-20">
       <div className="flex flex-col gap-6   items-start justify-center">
             <h1
              className={`m-0 ${KOROLEV} capitalize text-black text-5xl lg:text-[60px] xl:text-[100px] `}
              style={{
           
                fontWeight: 900,
                lineHeight: "100%",
              }}
            >
              {t("franchise.grow")} <span className="text-[#FF0931]">Crispies</span>
            </h1>
            <p
              className={`m-0   ${INTER} capitalize text-black text-[14px] sm:text-[16px] md:text-[14px]  xl:text-[24px] `}
              style={{

                fontWeight: 400,
                lineHeight: "100%",
                letterSpacing: "0.54px",
              }}
            >
              {t("franchise.intro")}
            </p>
       </div>
       <button
         type="button"
         onClick={() => setBrochureOpen(true)}
         aria-haspopup="dialog"
         className="bg-[#FF0931] text-white py-16 px-16 text-3xl rounded-2xl hover:bg-[#ff0000] transition-colors duration-300 flex items-center gap-6 cursor-pointer"
       >
      {t("franchise.brochure")} 
<Download  className="w-16 h-16 sm:w-16 sm:h-16  text-white "/>
       </button>
          </div>
        </div>
      </section>

      {/* 2. Why Choose Crispies */}
      <section className="bg-white w-full">
        <ScrollTabs
          theme="dark"
          heading={
            <h2
              className={`m-0 shrink-0 ${KOROLEV} capitalize    text-2xl sm:text-4xl  lg:text-[90px] xl:text-[120px]`}
              style={{
                fontWeight: 900,
                lineHeight: "100%",
              }}
            >
              <span className="block text-white">{t("franchise.why")}</span>
              <span className="block text-[#FF0931]">Crispies ?</span>
            </h2>
          }
          items={whyItems}
        />
      </section>
      {/* 3. How To Get Started */}
      <section className="bg-[#FF0931] w-full">
        <HowToGetStarted
          heading={
            <div className=" flex items-center justify-between gap-6 sm:gap-12  lg:gap-0">
              <h2
                className={`m-0 shrink-0 ${KOROLEV} capitalize  text-[44px] sm:text-[70px] md:text-[80px] lg:text-[100px]   2xl:text-[120px]`}
                style={{
                  fontWeight: 900,
                  lineHeight: "100%",
                }}
              >
                <span className="lg:block text-black"> {t("franchise.started")}</span>
                <span className="lg:block text-white ps-3 lg:ps-0">
                  {t("franchise.startedAccent")}
                </span>
              </h2>

              <div className="  p-5   rounded-[10px] max-sm:translate-x-0 bg-white lg:hidden  ">
                <FilePenLine
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-[162px] lg:h-[162px] text-black "
                  strokeWidth={1.5}
                />
              </div>
            </div>
          }
          items={startItems}
        />
      </section>

      {/* 4. Become A Partner */}
      <section className="bg-black relative py-24 sm:py-40 ">
        <div className="h-[50%] w-full bg-white absolute top-0" />
        <div className="h-[50%] w-full bg-black absolute bottom-0  " />

        <div className="w-[90%] xl:w-[80%] mx-auto rounded-4xl px-8 py-12 sm:px-14 sm:py-16 bg-[#FEFEFE] relative border-[#C4C4C4] border-2">
          {/* Three children in a 273px box: the logo was pushed off-screen.
              Stack until lg, where the row has room again. */}
          <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-12 lg:items-center">
            <div className="w-full lg:w-1/2">
              <h2
                className={`m-0 ${KOROLEV} uppercase text-black`}
                style={{
                  fontSize: "clamp(36px, 8vw, 200px)",
                  fontWeight: 900,
                  lineHeight: "100%",
                  letterSpacing: "0.54px",
                }}
              >
                {become[0]}
                <br />{become[1]}
              </h2>

              <button
                type="button"
                onClick={() => setApplicationOpen(true)}
                className="mt-8 inline-flex justify-between items-center gap-4 rounded-[10px] lg:rounded-2xl bg-[#FF0000]  px-2 py-3 lg:px-7 lg:py-6 text-white transition-transform hover:scale-105  w-fit  lg:w-[380px] cursor-pointer"
              >
                <span
                  className={`${INTER}  lg:text-[30px] font-semibold text-nowrap`}
                >
                  {t("franchise.contact")}
                </span>
                <div className="flex items-center justify-center w-[10px] lg:w-auto">
                  {" "}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="33"
                    height="33"
                    viewBox="0 0 33 33"
                    fill="none"
                  >
                    <path
                      d="M3.36031 33L0 29.6441L24.9869 4.64668H5.68668L5.72977 0H33V27.2777H28.3042L28.3473 8.00261L3.36031 33Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </button>
            </div>

            <div className="h-[clamp(10px,20vw,490px)] w-px shrink-0 self-stretch">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                viewBox="0 0 1 490"
                preserveAspectRatio="none"
                fill="none"
              >
                <path d="M0.5 0V490" stroke="url(#paint0_linear_697_3103)" />

                <defs>
                  <linearGradient
                    id="paint0_linear_697_3103"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="490"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#A2A1A3" stopOpacity="0" />
                    <stop offset="0.4904" stopColor="#3D3C3D" />
                    <stop offset="1" stopColor="#686769" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="w-full lg:w-1/2 flex justify-center lg:justify-end">
              <img
                src="/images/svgLogo.svg"
                alt="Crispies Logo"
                className="w-[220px ]      sm:w-[280px]  md:w-[300px]  lg:w-[480px] xl:max-w-[520px] h-auto"
              />
            </div>
          </div>
        </div>
      </section>
      {/* Scroll indicator — jumps to the page bottom, then back to the top once there */}
      {!brochureOpen && !applicationOpen && (
        <button
          type="button"
          onClick={handleScrollToggle}
          aria-label={atBottom ? t("scroll.toTop") : t("scroll.toBottom")}
          className="fixed bottom-5 end-5 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[#FF0931] bg-white text-[#FF0931] shadow-[0_10px_30px_rgba(255,9,49,0.25)] transition duration-200 hover:scale-105 hover:bg-[#FF0931] hover:text-white cursor-pointer"
        >
          {atBottom ? (
            <ArrowUp className="w-6 h-6" />
          ) : (
            <ArrowDown className="w-6 h-6" />
          )}
        </button>
      )}
      <Footer />
      {brochureOpen && (
        <BrochureOverlay onClose={() => setBrochureOpen(false)} />
      )}
      {applicationOpen && (
        <FranchiseApplicationOverlay
          onClose={() => setApplicationOpen(false)}
        />
      )}
    </>
  );
}
