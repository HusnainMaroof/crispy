import styles from "./hero.module.css";

export default function Hero() {
  return (
    <section
      className={`${styles.heroFrame} relative w-full overflow-hidden px-2`}
    >
      {/* Background video — optimized for performance */}
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-y-0 left-0 right-0 z-0 mx-auto h-full w-[95%] rounded-t-3xl object-cover opacity-75 xl:rounded-t-[50px]"
      >
        <source src="/images/herobgvideo.mp4" type="video/mp4" />
      </video>

      {/* Bottom-left scrim — radial gradient anchored to the corner the
          headline sits in, so legibility comes from targeted darkening,
          not from further dimming the whole image */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 right-0 z-[5] mx-auto w-[95%] rounded-t-3xl bg-[radial-gradient(120%_120%_at_0%_100%,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.45)_35%,rgba(0,0,0,0)_70%)] xl:rounded-t-[50px]"
      />

      {/* Bottom-left headline */}
      <div className="absolute bottom-0  z-10 p-6 sm:p-10 md:p-14 lg:p-16">
        <h1 className="m-0 text-[clamp(48px,11vw,100px)] font-bold uppercase leading-[100%] tracking-[0.54px] text-white font-[family-name:var(--font-korolev),Korolev,sans-serif]">
          <span className="block">Always Good</span>
          <span className="block">Mood Food</span>
        </h1>
      </div>
    </section>
  );
}
