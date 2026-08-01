import styles from "./hero.module.css";

export default function Hero() {
  return (
    <section
      className={`${styles.heroFrame} relative w-full px-6 xl:px-10`}
    >
      {/* Hero image — clipped here (not on the section) so the ribbon is
          free to overhang the bottom edge and straddle the seam with the
          white About section. */}
      <div className="absolute inset-0 overflow-hidden rounded-t-[20px] w-[96%] mx-auto ">
        <div
          className="absolute inset-0"
          style={{
            background:
              "url('/images/heroimage.png') lightgray 50% / cover no-repeat",
          }}
        />
      </div>

      {/* Ribbon — hangs 20px (bottom-5) above the hero's bottom edge and
          straddles the seam with the white About section: its lower half
          overlaps About (which is z-below it), so the white shows through
          behind the ribbon's middle center. Ribbon is the top-most element. */}
      <div className="absolute inset-x-0 bottom-5 z-[60] translate-y-1/2">
        <div
          className={`${styles.ribbon} mx-auto flex w-[95%] md:w-[90%] items-center justify-center`}
        >
          <p
            className={`${styles.ribbonText} select-none whitespace-nowrap text-center capitalize text-white`}
          >
            Always Good Mood Food
          </p>
        </div>
      </div>
    </section>
  );
}
