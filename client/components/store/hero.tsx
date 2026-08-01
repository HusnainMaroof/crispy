// hero.tsx
import styles from "./hero.module.css";

export default function Hero() {
  return (
    <section className="relative w-full px-6  xl:px-10 ">
      <div className="relative w-full aspect-video h-[60vh] xl:h-[68vh] 2xl:h-[80vh]">
        {/* Background image — clipped separately, doesn't trap the ribbon */}
        <div
          className="absolute inset-0 overflow-hidden rounded-t-[20px]"
          style={{
            background:
              "url('/images/heroimage.png') lightgray 50% / cover no-repeat",
          }}
        />

        {/* Ribbon — always exactly 50/50 across the hero/about boundary,
            at every viewport width, no coordination with About needed */}
        <div className="absolute inset-x-0 bottom-0 z-50 translate-y-1/2">
          <div
            className={`${styles.ribbon} mx-auto flex w-[95%] md:w-[90%] items-center justify-center`}
          >
            <p
              className="select-none whitespace-nowrap text-center capitalize text-white"
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