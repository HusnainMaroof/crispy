// stats.tsx

export default function Stats() {
  return (
    <section className="relative w-full bg-white">
      <div className="relative  bg-[#FF0931] rounded-b-[40px] sm:rounded-b-[50px] md:rounded-b-[60px] pt-[90px] sm:pt-[100px] md:pt-[110px] pb-[56px] sm:pb-[64px] md:pb-[72px] px-6">
        {/* Icon — sits on the white/red seam */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-[50px] sm:-top-[52px] md:-top-[55px] z-10 ">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="0 0 255 255"
            fill="none"
            className="w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] md:w-[110px] md:h-[110px] "
            aria-hidden="true"
          >
            <rect width="255" height="255" rx="30" fill="#1E1E1E" />
            <path
              d="M182.57 146.016L170.92 146.036C168.81 146.036 167.47 147.626 167.65 149.576C167.81 151.356 169.43 152.696 171.4 152.356L178.06 152.496L188.59 183.836C188.59 183.836 74.7 185.176 71.99 184.586L84.72 152.356L88.76 152.416H94.3C96.15 152.416 97.54 150.966 97.57 149.326C97.61 147.756 96.32 146.056 94.49 146.046L80.05 146.016L67 183.936V190.126L196.3 189.956V186.906L182.57 146.016Z"
              fill="white"
            />
            <path
              d="M167.71 86.1256C163.41 77.9356 156.43 71.6856 147.92 67.9956C139.22 64.2356 129.57 64.0756 120.56 67.1756C113.28 69.6856 106.7 73.8856 101.51 79.5656C95.3596 86.2956 91.9596 94.7456 91.1196 103.776C89.5396 120.906 96.4396 137.586 106.72 151.096C113.54 160.056 121.92 167.476 131.34 173.566C132.64 174.406 133.8 174.176 135 173.396C138.39 171.166 141.57 168.986 144.67 166.286C155.7 156.656 164.12 144.466 168.9 130.566C173.77 116.376 174.77 99.5656 167.7 86.1256H167.71ZM135.64 138.186C118.16 140.296 102.24 127.756 100.14 110.266C98.0596 92.9556 110.42 76.8556 128.12 74.7856C145.88 72.7056 161.65 85.5656 163.57 102.976C165.49 120.376 153.02 136.086 135.63 138.186H135.64Z"
              fill="#E21E2F"
            />
            <path
              d="M150.13 96.9952C138.91 82.9852 107.21 92.0552 113.11 100.925C113.84 102.015 115.14 102.485 116.71 102.485L147.8 102.465C149.12 102.465 150.6 102.015 151.02 100.975C151.54 99.7152 150.99 98.0552 150.13 96.9852V96.9952ZM123.78 97.9252C122.83 98.2152 121.74 97.5552 121.45 96.5452C121.18 95.6252 121.79 94.5152 122.93 94.2652C123.94 94.0452 124.88 94.7152 125.1 95.5152C125.41 96.6252 124.82 97.6152 123.78 97.9352V97.9252ZM132.11 96.1252C131.06 96.3252 130.05 95.6052 129.87 94.5752C129.68 93.5152 130.36 92.5352 131.59 92.3452C132.56 92.1952 133.52 93.0052 133.67 93.8552C133.86 94.9552 133.12 95.9352 132.11 96.1252ZM141.36 97.5852C140.45 98.0752 139.43 97.7652 138.94 97.1552C138.16 96.1852 138.44 94.9652 139.6 94.3152C140.57 93.7652 141.71 94.2552 142.13 95.1552C142.53 96.0052 142.16 97.1452 141.35 97.5852H141.36Z"
              fill="white"
            />
            <path
              d="M150.57 114.375C150.93 117.775 148.99 120.585 145.62 120.585H117.63C114.86 120.585 113.11 118.535 112.79 115.985C112.71 115.385 112.68 113.665 113.62 113.665L149.02 113.615C149.54 113.615 150.52 113.965 150.57 114.375Z"
              fill="white"
            />
            <path
              d="M142.66 104.526C146.31 104.206 150.67 104.746 150.65 107.936C150.64 109.586 148.79 111.336 146.88 111.346L118.66 111.436C115.75 111.436 112.99 110.656 112.76 108.276C112.53 105.896 114.79 104.506 117.8 104.506H132.19L137.46 109.916L142.66 104.516V104.526Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Headline */}
        <h2
          className="m-0 text-center text-white uppercase font-normal leading-[100%] tracking-[0.02em]"
          style={{
            fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
            fontSize: "clamp(32px, 6.5vw, 72px)",
          }}
        >
          Good Food, No Compromise
        </h2>

        {/* Stats */}
        <div className="mt-10 sm:mt-12 md:mt-14 flex flex-row items-start justify-center gap-6 sm:gap-12 md:gap-20 lg:gap-28">
          <div className="flex flex-col items-center text-center min-w-0">
            <span
              className="text-white font-normal leading-[100%] tracking-[0.02em]"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(36px, 7vw, 72px)",
              }}
            >
              10+
            </span>
            <span
              className="mt-2 sm:mt-3 text-white uppercase font-normal leading-[120%] tracking-[0.12em]"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "clamp(10px, 1.4vw, 14px)",
              }}
            >
              London Locations
            </span>
          </div>

          <div className="flex flex-col items-center text-center min-w-0">
            <span
              className="text-white font-normal leading-[100%] tracking-[0.02em]"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(36px, 7vw, 72px)",
              }}
            >
              100%
            </span>
            <span
              className="mt-2 sm:mt-3 text-white uppercase font-normal leading-[120%] tracking-[0.12em]"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "clamp(10px, 1.4vw, 14px)",
              }}
            >
              Halal Certified
            </span>
          </div>

          <div className="flex flex-col items-center text-center min-w-0">
            <span
              className="text-white font-normal leading-[100%] tracking-[0.02em]"
              style={{
                fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif",
                fontSize: "clamp(36px, 7vw, 72px)",
              }}
            >
              12K+
            </span>
            <span
              className="mt-2 sm:mt-3 text-white uppercase font-normal leading-[120%] tracking-[0.12em]"
              style={{
                fontFamily: "var(--font-inter), Inter, sans-serif",
                fontSize: "clamp(10px, 1.4vw, 14px)",
              }}
            >
              Five-Star Reviews
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
