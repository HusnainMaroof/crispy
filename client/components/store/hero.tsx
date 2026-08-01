// hero.tsx
import styles from "./hero.module.css";

export default function Hero() {
  return (
    <section className="w-full px-6 py-6 xl:px-10 xl:py-10">
      <div className="relative w-full overflow-hidden rounded-[20px] aspect-video md:h-[80vh]">
        {/* Background image */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "url('/images/heroimage.png') lightgray 50% / cover no-repeat",
          }}
        />

        {/* Ribbon */}
        <div className="absolute inset-x-0 bottom-5 z-50">
          <div
            className={`${styles.ribbon} flex w-[90%] md:w-[%80] mx-auto items-center justify-center`}
          >
            <p
              className="select-none whitespace-nowrap  text-center capitalize text-white"
              style={{
                fontFamily: "var(--font-koulen), Koulen, sans-serif",
                fontSize: "clamp(22px, 7vw, 130px)",
              }}
            >
              Always Good Mood Food
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}