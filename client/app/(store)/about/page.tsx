"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useScrollReveal } from "@/lib/use-scroll-reveal";

type Value = { title: string; description: string };

type PrivacySection = {
  id: string;
  title: string;
  intro?: string;
  blocks?: { heading: string; body: string }[];
  list?: string[];
  table?: { purpose: string; basis: string }[];
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "when-we-collect-data",
    title: "When We Collect Data",
    intro:
      "Personal data, or personal information, means any information about an individual from which that person can be identified. It does not include data where the identity has been removed (anonymous data). Generally, we collect and process your information in the following ways:",
    list: [
      "When you make a reservation at any of our restaurants;",
      "When you purchase gift vouchers;",
      "When you visit or make transactions in the establishments that we own or manage;",
      "When you respond to our promotions, or subscribe to our mailing lists;",
      "When you participate in competitions, contests or games organised by us;",
      "When you attend events or functions organised by us, or conducted at our establishments, for example, property launches, private dining, ticketed events and hosted events, promotional and marketing events and other social events;",
      "When you use our services (or express an interest in doing so) including services and transactions in respect of properties that we own or manage;",
      "When you communicate with us by telephone, email, via our website or through other communication channels, for example, through social media platforms;",
      "When you visit our website, or register a user account with our website or mobile applications;",
      "When we seek information about you and receive your personal data in connection with your relationship with us; and",
      "When you submit your personal data to us for any other reason.",
    ],
  },
  {
    id: "the-data-we-collect",
    title: "The Data We Collect",
    intro:
      "We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:",
    blocks: [
      {
        heading: "Information you give us",
        body: "This is information about you that you give us by filling in forms on our website or app(s), or by corresponding with us by phone, e-mail or otherwise. It includes information you provide when you register to use our site; use our restaurant WiFi Service; search for a restaurant; book a table at one of our restaurants; participate in discussion boards or other social media functions on our site; enter a competition, promotion or survey; request marketing, subscribe to publications/newsletters and when you report a problem with our site. The information you give us may include your name, title, addresses, e-mail address, date of birth and phone numbers, financial and credit card information, personal description and demographic information (such as preferences and interests).",
      },
      {
        heading: "Information we collect about you",
        body: "With regard to each of your visits to our website or use of our app(s) or WiFi Service the following information will be collected: Technical Data including internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system (including device) and platform and other technology on the devices you use to access this website. As you interact with our website, we may automatically collect Technical Data about your equipment, browsing actions and patterns. We collect this personal data by using cookies, server logs and other similar technologies. Usage data about your visit and how you use our products and services, including information about how you use our website, the full Uniform Resource Locators (URL), clickstream to, through and from our site (including date and time), page response times, timestamp marking at restaurant, download errors, customer session duration, length of visits to certain pages, page interaction information (such as scrolling, clicks, and mouseovers), methods used to browse away from the page, and any phone number used to call our customer service number. Marketing and Communications Data including your preferences in receiving marketing from us and our third parties and your communication preferences. CCTV: Information provided through CCTV recordings at our restaurants for the purposes of security.",
      },
      {
        heading: "Information we receive from other sources (including third parties)",
        body: "This is information we receive about you if you use any of the other websites we operate or the other services we provide (including the WiFi Service in our restaurants). We are working closely with third parties (including, for example, business partners, our WiFi providers, sub-contractors in technical services, advertising networks, analytics providers, search information providers). We may receive personal data about you from various third parties and public sources including technical data from analytics providers such as Google based outside the EU or search information providers. Minors: If you are a minor under 16 years of age, please obtain consent from your parent or guardian before you submit any personal information to us. If you are a parent or guardian of a minor and you have reason to believe your child or ward has provided us with their personal information without your prior consent, please contact us to request for erasure of their personal data or for the minor to be unsubscribed from our mailing lists.",
      },
    ],
  },
  {
    id: "uses-of-information",
    title: "Uses Made of the Information",
    intro: "We use information held about you in the following ways:",
    blocks: [
      {
        heading: "Information you give to us",
        body: "We will use this information: to administer our site and WiFi Service; to obtain your feedback; to carry out our obligations arising from any contracts entered into between you and us and to provide you with the information, products and services that you request from us; to manage our relationship with you, including your restaurant bookings; to provide you with information about other products and services we offer that are similar to those that you have already purchased or enquired about; to provide you, or permit selected third parties to provide you, with information about products or services we feel may interest you; to notify you about changes to our service; to administer and manage your account and associated services including updating your records; to ensure that content from our site is presented in the most effective manner for you and for your computer or device.",
      },
      {
        heading: "Information we collect about you",
        body: "We will use this information: to administer our site and WiFi Service and for internal operations, including troubleshooting, data analysis, testing, research, statistical and survey purposes; to improve our site and WiFi Service to ensure that content is presented in the most effective manner for you and for your computer; to allow you to participate in interactive features of our service, when you choose to do so; as part of our efforts to keep our site safe and secure; to comply with laws and regulations that apply to us; to measure or understand the effectiveness of advertising we serve to you and others, and to deliver relevant advertising to you; to make suggestions and recommendations to you and other users of our site about products or services that may interest you or them.",
      },
      {
        heading: "Information we receive from other sources",
        body: "We will combine this information with information you give to us and information we collect about you. We will use this information and the combined information for the purposes set out above (depending on the types of information we receive). We will only use your personal data for the purposes for which we collected it, unless we reasonably consider that we need to use it for another reason and that reason is compatible with the original purpose. If you wish to get an explanation as to how the processing for the new purpose is compatible with the original purpose, please contact us. We do not carry out automated decision making.",
      },
    ],
  },
  {
    id: "purposes",
    title: "Purposes for Which We Will Use Your Personal Data",
    intro:
      "We have set out below, in a table format, a description of ways we plan to use your personal data, and which of the legal bases we rely on to do so. Note that we may process your personal data for more than one lawful ground depending on the specific purpose for which we are using your data. Please contact us if you need details about the specific legal ground we are relying on to process your personal data where more than one ground has been set out in the table below.",
    table: [
      { purpose: "To confirm a table booking", basis: "Necessary for our legitimate interests" },
      {
        purpose: "To provide you with access to our WiFi Service",
        basis: "(a) Performance of a contract with you (b) Necessary for our legitimate interests",
      },
      {
        purpose:
          "To manage our relationship with you which will include: (a) Notifying you about changes to our terms or privacy policy (b) Asking you to leave a review or take a survey",
        basis:
          "(a) Performance of a contract with you (b) Necessary to comply with a legal obligation (c) Necessary for our legitimate interests (to keep our records updated and to study how customers use our products/services)",
      },
      {
        purpose: "To enable you to partake in a prize draw, competition or complete a survey",
        basis:
          "(a) Performance of a contract with you (b) Necessary for our legitimate interests (to study how customers use our products/services, to develop them and grow our business)",
      },
      {
        purpose:
          "To administer and protect our business and our website and app(s) (including troubleshooting, data analysis, testing, system maintenance, support, reporting and hosting of data)",
        basis:
          "(a) Necessary for our legitimate interests (for running our business, provision of administration and IT services, network security, to prevent fraud and in the context of a business reorganisation or group restructuring exercise) (b) Necessary to comply with a legal obligation",
      },
      {
        purpose:
          "To deliver relevant website and app content and advertisements to you and measure or understand the effectiveness of the advertising we serve to you",
        basis:
          "Necessary for our legitimate interests (to study how customers use our services, to develop them, to grow our business and to inform our marketing strategy)",
      },
      {
        purpose:
          "To use data analytics to improve our website, products/services, marketing, customer relationships and experiences",
        basis:
          "Necessary for our legitimate interests (to define types of customers for our products and services, to keep our website updated and relevant, to develop our business and to inform our marketing strategy)",
      },
      {
        purpose:
          "To make suggestions and recommendations to you about services that may be of interest to you",
        basis:
          "Necessary for our legitimate interests (to develop our products/services and grow our business)",
      },
      {
        purpose: "CCTV in our restaurants",
        basis:
          "(a) Necessary for our legitimate interests (for security, crime prevention and customer and staff safety) (b) Necessary to comply with legal obligations",
      },
    ],
  },
  {
    id: "disclosure",
    title: "Disclosure of Your Personal Data",
    intro: "We may share your personal data with the parties set out below:",
    list: [
      "Other companies in our Group, including those which provide IT and system administration services and undertake leadership reporting.",
      "External third parties including: service providers who provide IT and system administration services, social media networks, data management companies, digital agencies, reservation booking platforms, gift voucher solutions providers, and professional advisers; HM Revenue & Customs, regulators and other authorities; business partners, suppliers and sub-contractors for the performance of any contract we enter into with them or you. This includes our WiFi providers for the purposes of the WiFi Service in our restaurants and business partners for the purpose of administering customer satisfaction surveys; advertisers and advertising networks that require the data to select and serve relevant adverts to you and others; and analytics and search engine providers that assist us in the improvement and optimisation of our site.",
      "Third parties to whom we may choose to sell, transfer, or merge parts of our business or our assets.",
      "If we are under a duty to disclose or share your personal data in order to comply with any legal obligation, or in order to enforce or apply our terms of use and other agreements; or to protect our rights, property, or safety, or that of our customers or others. This includes exchanging information with other companies and organisations for the purposes of fraud protection and credit risk reduction.",
    ],
  },
  {
    id: "where-we-store",
    title: "Where We Store Your Personal Data",
    list: [
      "We do sometimes transfer data outside the EEA but before doing so take steps to ensure that your data will be given adequate protection as required by the Data Protection Legislation. We will take all steps reasonably necessary to ensure that your data is treated securely and in accordance with this privacy policy.",
      "Unfortunately, the transmission of information via the internet is not completely secure. Although we will do our best to protect your personal data, we cannot guarantee the security of your data transmitted to our site; any transmission is at your own risk. Once we have received your information, we will use strict procedures and security features to try to prevent unauthorised access.",
    ],
  },
  {
    id: "data-security",
    title: "Data Security",
    list: [
      "We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.",
    ],
  },
  {
    id: "retention",
    title: "How Long Will You Use My Personal Data For?",
    list: [
      "We will only retain your personal data for as long as necessary to fulfil the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.",
    ],
  },
  {
    id: "your-rights",
    title: "Your Rights",
    intro:
      "You have the right to ask us not to process your personal data for marketing purposes. You can also exercise the right at any time by contacting us at info@crispiesuk.co.uk. We will usually inform you (before collecting your data) if we intend to use your data for such purposes or if we intend to disclose your information to any third party for such purposes.",
    list: [
      "Request access to your personal data (commonly known as a \u201Cdata subject access request\u201D). This enables you to receive details of the personal data we hold about you.",
      "Request correction of the personal data that we hold about you. This enables you to have any incomplete or inaccurate data we hold about you corrected.",
      "Request erasure of your personal data. This enables you to ask us to delete or remove personal data where there is no good reason for us continuing to process it. You also have the right to ask us to delete or remove your personal data where you have successfully exercised your right to object to processing (see below), where we may have processed your information unlawfully or where we are required to erase your personal data to comply with local law. Note, however, that we may not always be able to comply with your request of erasure for specific legal reasons which will be notified to you, if applicable, at the time of your request.",
      "Object to processing of your personal data where we are relying on a legitimate interest (or those of a third party) and there is something about your particular situation which makes you want to object to processing on this ground as you feel it impacts on your fundamental rights and freedoms.",
      "Request restriction of processing of your personal data. This enables you to ask us to suspend the processing of your personal data in the following scenarios: (a) if you want us to establish the data's accuracy; (b) where our use of the data is unlawful but you do not want us to erase it; (c) where you need us to hold the data even if we no longer require it as you need it to establish, exercise or defend legal claims; or (d) you have objected to our use of your data but we need to verify whether we have overriding legitimate grounds to use it.",
      "Request the transfer of your personal data to you or to a third party. We will provide to you, or a third party you have chosen, your personal data in a structured, commonly used, machine-readable format. This right only applies to automated information which you initially provided consent for us to use or where we used the information to perform a contract with you.",
      "Withdraw consent at any time where we are relying on consent to process your personal data. However, this will not affect the lawfulness of any processing carried out before you withdraw your consent. If you withdraw your consent, we may not be able to provide certain products or services to you. We will advise you if this is the case at the time you withdraw your consent.",
    ],
  },
  {
    id: "cookies",
    title: "Cookies",
    intro:
      "Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. A cookie is a small file of letters and numbers that we store on your browser or the hard drive of your computer if you agree. Cookies contain information that is transferred to your computer's hard drive. We use the following cookies:",
    list: [
      "Strictly necessary cookies. These are cookies that are required for the operation of our website. They include, for example, cookies that enable you to log into secure areas of our website, use a shopping cart or make use of e-billing services.",
      "Analytical/performance cookies (e.g. traffic log cookies). They allow us to recognise and count the number of visitors and to see how visitors move around our website when they are using it. This helps us to improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.",
      "Functionality cookies. These are used to recognise you when you return to our website. This enables us to personalise our content for you, greet you by name and remember your preferences (for example, your choice of language or region).",
      "Targeting cookies. These cookies record your visit to our website, the pages you have visited and the links you have followed. We will use this information to make our website and the advertising displayed on it more relevant to your interests. We may also share this information with third parties for this purpose.",
    ],
  },
];

const COOKIE_ANALYTICS_NOTE =
  "We also use software called Google Analytics which is a web analytics service provided by Google Inc. in order to understand how visitors to our website use the site. The Google Analytics cookies remember you from one page request to the next, for example to differentiate between \u2018new\u2019 and \u2018returning\u2019 visitors. We receive reports from Google Inc. about website usage (such as the number of visitors to our site or the number of unique page views). You can block and restrict cookies by activating the setting on your browser that allows you to refuse the setting of all or some cookies. You may wish to visit www.aboutcookies.org, which contains comprehensive information on how to do this on a wide variety of desktop browsers. However, if you use your browser settings to block all cookies (including essential cookies) you may not be able to access all or parts of our site.";

export default function AboutPage() {
  const [values, setValues] = useState<Value[]>([]);
  const pageRef = useScrollReveal("top 92%", [values]);

  useEffect(() => {
    api
      .get<Record<string, unknown>>("/store/homepage")
      .then((data) => {
        if (data && Array.isArray(data.about)) {
          setValues(data.about as Value[]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-black">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <h1 className="font-[family-name:var(--font-bebas)] text-[clamp(3rem,8vw,7rem)] leading-none tracking-[0.04em] text-white">
          About Crispies
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Born in London. Built on flavour. Crispies started with one simple
          idea: halal fast food that actually tastes good — made fresh, served
          fast, and priced fairly.
        </p>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="fade-up grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
              Our Story
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Crispies was founded with a clear mission: serve the best halal
              burgers and chicken in London, without the long waits or the
              inflated prices. We saw a gap in the market for fast food that
              respects both quality and community.
            </p>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              From our first location, we&apos;ve grown by doing the simple things
              right. Fresh chicken, hand-formed patties, house-made sauces, and a
              team that genuinely cares about every order. No shortcuts. No
              compromises.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                100%
              </span>
              <p className="mt-2 text-sm text-white/50">Halal certified</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                Fresh
              </span>
              <p className="mt-2 text-sm text-white/50">
                Delivered daily, never frozen
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-8">
              <span className="font-[family-name:var(--font-bebas)] text-5xl text-brand-red">
                London
              </span>
              <p className="mt-2 text-sm text-white/50">
                Built for the city, by the city
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      {values.length > 0 && (
        <section className="border-t border-white/10 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white text-center">
              What We Stand For
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {values.map((v) => (
                <div
                  key={v.title}
                  className="fade-up rounded-2xl bg-white/5 p-8 transition-colors hover:bg-white/10"
                >
                  <h3 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-brand-red">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/60">
                    {v.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Privacy Policy */}
      <section className="border-t border-white/10 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <p className="fade-up mb-3 text-center text-[11px] font-bold uppercase tracking-[0.3em] text-brand-red">
            Privacy Policy
          </p>
          <h2 className="fade-up text-center font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white md:text-5xl">
            Your Privacy
          </h2>

          <div className="fade-up mt-10 space-y-4 text-sm leading-relaxed text-white/60">
            <p>
              We are Crispiesuk trading as Crispies. We respect your privacy
              and are committed to protecting and respecting your personal data.
            </p>
            <p>
              We collect and use many different kinds of personal information to
              provide our dining experiences and services. This policy (together
              with any applicable terms of use and any other documents referred
              to on it) sets out how we collect and process your personal data
              through your use of this website (including the mobile optimised
              version of the website accessible from your portable hand-held
              device), our app(s), or our in-restaurant WiFi Service, and
              including any data you may provide through this website when you
              sign up to our newsletter, book a table or take part in a
              competition.
            </p>
            <p>
              It is important that you read this policy together with any other
              privacy notice or fair processing notice we may provide. By
              visiting our website or using our WiFi Service you are accepting
              and consenting to the practices described in this policy.
            </p>
            <p>
              Any changes we make to our privacy policy in the future will be
              posted on this page. Please check back frequently to see any
              updates or changes to our privacy policy.
            </p>
            <p>
              If you have any questions about this policy, including any
              requests to exercise your legal rights, please contact us at{" "}
              <a
                href="mailto:info@crispiesuk.co.uk"
                className="text-brand-red underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                info@crispiesuk.co.uk
              </a>
              .
            </p>
          </div>

          {/* Sections */}
          <div className="mt-16 space-y-12">
            {PRIVACY_SECTIONS.map((section) => (
              <div key={section.id} id={section.id} className="scroll-mt-32">
                <h3 className="fade-up font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-white md:text-4xl">
                  {section.title}
                </h3>

                {section.intro && (
                  <p className="fade-up mt-4 text-sm leading-relaxed text-white/60">
                    {section.intro}
                  </p>
                )}

                {section.blocks && (
                  <div className="mt-6 space-y-6">
                    {section.blocks.map((block) => (
                      <div
                        key={block.heading}
                        className="fade-up rounded-2xl bg-white/5 p-6"
                      >
                        <h4 className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-brand-red">
                          {block.heading}
                        </h4>
                        <p className="mt-3 text-sm leading-relaxed text-white/60">
                          {block.body}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {section.list && (
                  <ul className="fade-up mt-6 space-y-3">
                    {section.list.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm leading-relaxed text-white/60"
                      >
                        <span
                          aria-hidden
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-red"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="fade-up mt-6 overflow-x-auto rounded-2xl border border-white/10">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-white/40">
                          <th className="px-5 py-3 font-semibold">Purpose / Activity</th>
                          <th className="px-5 py-3 font-semibold">Lawful basis for processing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {section.table.map((row, i) => (
                          <tr key={i} className="align-top">
                            <td className="px-5 py-4 text-white/70">{row.purpose}</td>
                            <td className="px-5 py-4 text-white/50">{row.basis}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ICO complaint note */}
          <div className="fade-up mt-12 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm leading-relaxed text-white/60">
              You have the right to make a complaint at any time to the
              Information Commissioner&apos;s Office (ICO), the UK supervisory
              authority for data protection issues (
              <a
                href="https://www.ico.org.uk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-red underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                www.ico.org.uk
              </a>
              ). We would, however, appreciate the chance to deal with your
              concerns before you approach the ICO so please contact us in the
              first instance.
            </p>
          </div>

          {/* Google Analytics note */}
          <p className="fade-up mt-10 text-sm leading-relaxed text-white/50">
            {COOKIE_ANALYTICS_NOTE}
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 px-6 py-24 text-center">
        <h2 className="fade-up font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-white">
          Hungry Yet?
        </h2>
        <p className="fade-up mt-4 text-white/50">
          Taste the difference fresh makes.
        </p>
        <a
          href="/menu"
          className="fade-up mt-8 inline-block rounded-full bg-brand-red px-10 py-4 font-semibold text-white transition-all duration-300 hover:bg-red-700 hover:scale-105 active:scale-95 cursor-pointer"
        >
          View Menu
        </a>
      </section>
    </div>
  );
}
