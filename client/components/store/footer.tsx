// footer.tsx

const quickLinks = [
  { label: "Menu", href: "/menu" },
  { label: "Locations", href: "/locations" },
  { label: "Career", href: "/career" },
  { label: "Franchise Enquiries", href: "/franchise" },
];

function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.64 9.13 8.4 9.93v-7.02H7.9v-2.91h2.36V9.84c0-2.34 1.4-3.63 3.53-3.63 1.02 0 2.09.18 2.09.18v2.3h-1.18c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.91h-2.18V22c4.76-.8 8.4-4.94 8.4-9.93Z" />
    </svg>
  );
}

function TikTokIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.28 6.34 6.34 0 0 0 9.49 21.6a6.34 6.34 0 0 0 6.34-6.34V8.77a8.2 8.2 0 0 0 4.76 1.52V6.86a4.85 4.85 0 0 1-1-.17Z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

const socials = [
  {
    label: "Facebook",
    href: "https://facebook.com/crispiesuk",
    icon: FacebookIcon,
  },
  {
    label: "TikTok",
    href: "https://tiktok.com/@crispiesuk",
    icon: TikTokIcon,
  },
  {
    label: "Instagram",
    href: "https://instagram.com/crispiesuk",
    icon: InstagramIcon,
  },
];

export default function Footer() {
  return (
    <footer className="relative w-full bg-black">
      {/* Top red line */}
      <div className="h-[3px] w-full bg-[#FF0931]" />

      <div className="mx-auto max-w-[1280px] px-5 sm:px-6 xl:px-10 pt-12 sm:pt-14 md:pt-16 pb-0">
        {/* Main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-8 lg:gap-0">
          {/* Logo */}
          <div className="flex items-start justify-center sm:justify-start lg:justify-center lg:border-r lg:border-white/10 lg:pr-8">
            <a
              href="/"
              className="block w-[120px] h-[120px] sm:w-[130px] sm:h-[130px] md:w-[140px] md:h-[140px] rounded-[4px] overflow-hidden transition-transform duration-300 hover:scale-[1.04] will-change-transform"
              aria-label="Crispies home"
            >
              <img
                src="/images/WhiteLogo.svg"
                alt="Crispies"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </a>
          </div>

          {/* Quick Links */}
          <div className="lg:border-r lg:border-white/10 lg:px-8 xl:px-10">
            <h3
              className="m-0 text-[#FF0931] uppercase font-normal leading-[100%] tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                fontSize: "clamp(18px, 2vw, 22px)",
              }}
            >
              Quick Links
            </h3>
            <ul className="m-0 mt-5 sm:mt-6 p-0 list-none flex flex-col gap-3.5 sm:gap-4">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="inline-block text-white/80 font-normal leading-none transition-all duration-300 hover:text-white hover:translate-x-1"
                    style={{
                      fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Get In Touch */}
          <div className="lg:border-r lg:border-white/10 lg:px-8 xl:px-10">
            <h3
              className="m-0 text-[#FF0931] uppercase font-normal leading-[100%] tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                fontSize: "clamp(18px, 2vw, 22px)",
              }}
            >
              Get In Touch
            </h3>
            <ul className="m-0 mt-5 sm:mt-6 p-0 list-none flex flex-col gap-4 sm:gap-5">
              <li>
                <a
                  href="tel:02012345678"
                  className="inline-block text-white/80 font-normal leading-none transition-colors duration-300 hover:text-white"
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    fontSize: "clamp(14px, 1.4vw, 16px)",
                  }}
                >
                  020 1234 5678
                </a>
              </li>
              <li>
                <a
                  href="mailto:Info@Crispiesuk.Co.Uk"
                  className="inline-block text-white/80 font-normal leading-[140%] transition-colors duration-300 hover:text-white break-all"
                  style={{
                    fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                    fontSize: "clamp(14px, 1.4vw, 16px)",
                  }}
                >
                  Info@Crispiesuk.Co.Uk
                </a>
              </li>
            </ul>
          </div>

          {/* Socials */}
          <div className="lg:pl-8 xl:pl-10">
            <h3
              className="m-0 text-[#FF0931] uppercase font-normal leading-[110%] tracking-[0.04em]"
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                fontSize: "clamp(18px, 2vw, 22px)",
              }}
            >
              Follow
              <br />
              Us On Socials
            </h3>
            <div className="mt-5 sm:mt-6 flex items-center gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-8 h-8 rounded-full border border-white/40 text-white flex items-center justify-center transition-all duration-300 hover:border-[#FF0931] hover:bg-[#FF0931] hover:scale-110 hover:text-white"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </a>
                );
              })}
            </div>
            <a
              href="https://instagram.com/crispiesuk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3.5 text-white/80 font-normal leading-none transition-colors duration-300 hover:text-[#FF0931]"
              style={{
                fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
                fontSize: "clamp(13px, 1.3vw, 15px)",
              }}
            >
              @Crispiesuk
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 sm:mt-14 md:mt-16 border-t border-white/10 py-5 sm:py-6 text-center">
          <p
            className="m-0 text-white/50 font-normal leading-none"
            style={{
              fontFamily: "var(--font-koulen), 'Koulen', sans-serif",
              fontSize: "clamp(12px, 1.2vw, 14px)",
            }}
          >
            © 2026 Crispiesuk. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
