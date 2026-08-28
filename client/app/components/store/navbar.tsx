"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode, SVGProps } from "react";
import DeliveryOverlay from "./delivery-overlay";

const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/locations", label: "Locations" },
  { href: "/franchise-inquiries", label: "Franchise inquiry" },
];

// --- Social icons ---
function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 13 13"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_706_1644)">
        <path
          d="M6.5 12.5938C9.86549 12.5938 12.5938 9.86549 12.5938 6.5C12.5938 3.13451 9.86549 0.40625 6.5 0.40625C3.13451 0.40625 0.40625 3.13451 0.40625 6.5C0.40625 9.86549 3.13451 12.5938 6.5 12.5938Z"
          stroke="currentColor"
        />
        <path
          d="M7.51562 4.0625H5.48438C4.6991 4.0625 4.0625 4.6991 4.0625 5.48438V7.51562C4.0625 8.3009 4.6991 8.9375 5.48438 8.9375H7.51562C8.3009 8.9375 8.9375 8.3009 8.9375 7.51562V5.48438C8.9375 4.6991 8.3009 4.0625 7.51562 4.0625Z"
          stroke="currentColor"
        />
        <path
          d="M6.5182 7.15359C6.88853 7.15359 7.18874 6.85337 7.18874 6.48304C7.18874 6.11271 6.88853 5.8125 6.5182 5.8125C6.14787 5.8125 5.84766 6.11271 5.84766 6.48304C5.84766 6.85337 6.14787 7.15359 6.5182 7.15359Z"
          stroke="currentColor"
        />
        <path
          d="M7.5541 5.64922C7.75603 5.64922 7.91973 5.48552 7.91973 5.28359C7.91973 5.08166 7.75603 4.91797 7.5541 4.91797C7.35217 4.91797 7.18848 5.08166 7.18848 5.28359C7.18848 5.48552 7.35217 5.64922 7.5541 5.64922Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_706_1644">
          <rect width="13" height="13" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 13 13"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_706_1638)">
        <path
          d="M6.5 12.5938C9.86549 12.5938 12.5938 9.86549 12.5938 6.5C12.5938 3.13451 9.86549 0.40625 6.5 0.40625C3.13451 0.40625 0.40625 3.13451 0.40625 6.5C0.40625 9.86549 3.13451 12.5938 6.5 12.5938Z"
          stroke="currentColor"
        />
        <path
          d="M7.27187 3.65625H8.125V5.07812H7.3125V5.89062H8.125V7.3125H7.3125V9.75H5.6875V7.3125H4.875V5.89062H5.6875V4.97656C5.6875 4.14375 6.21562 3.65625 7.27187 3.65625Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_706_1638">
          <rect width="13" height="13" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 13 13"
      fill="none"
      {...props}
    >
      <g clipPath="url(#clip0_706_1641)">
        <path
          d="M6.5 12.5938C9.86549 12.5938 12.5938 9.86549 12.5938 6.5C12.5938 3.13451 9.86549 0.40625 6.5 0.40625C3.13451 0.40625 0.40625 3.13451 0.40625 6.5C0.40625 9.86549 3.13451 12.5938 6.5 12.5938Z"
          stroke="currentColor"
        />
        <path
          d="M7.51562 3.45312C7.75938 4.18437 8.26719 4.7125 8.9375 4.875V5.95156C8.42969 5.93125 7.9625 5.76875 7.51562 5.48438V7.82031C7.51562 8.9375 6.74375 9.64844 5.72813 9.64844C4.77344 9.64844 4.0625 8.9375 4.0625 8.02344C4.0625 7.06875 4.83438 6.3375 5.78906 6.3375C5.93125 6.3375 6.05313 6.35781 6.19531 6.39844V7.475C6.07344 7.39375 5.93125 7.35313 5.78906 7.35313C5.38281 7.35313 5.07812 7.65781 5.07812 8.02344C5.07812 8.38906 5.38281 8.69375 5.78906 8.69375C6.21563 8.69375 6.5 8.38906 6.5 7.86094V3.45312H7.51562Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_706_1641">
          <rect width="13" height="13" fill="currentColor" />
        </clipPath>
      </defs>
    </svg>
  );
}

// --- Bag / bike icons: converted to components sized via className, not hardcoded w/h ---
function BagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 30"
      fill="none"
      {...props}
    >
      <path
        d="M3.90538 28.7104L0.815683 28.3681C0.372449 28.3195 -0.0562265 27.9862 0.00605279 27.4509L0.340096 24.5679L1.62046 14.8271L2.90649 5.25526L18.2959 5.47137L16.2917 29.4272C16.2027 29.7844 15.914 30.0368 15.5403 29.9956L3.90619 28.7096L3.90538 28.7104ZM9.21368 10.6573L8.83515 13.9312C8.77934 14.0517 8.58037 14.2133 8.46794 14.2001C8.3725 14.1886 8.2253 14.0426 8.16463 13.9337L8.54155 10.7027C8.53669 10.5328 8.37574 10.2878 8.22449 10.2828C8.11125 10.2787 7.93089 10.4066 7.81442 10.5237L7.41809 13.8883C7.3178 14.0146 7.12126 14.1342 7.00479 14.1152C6.8503 14.0904 6.75567 13.8595 6.77427 13.6937L7.1164 10.6243C7.13015 10.5031 6.94978 10.2457 6.83331 10.2416C6.71684 10.2375 6.52677 10.3703 6.40868 10.499L5.90236 14.7495C5.80207 15.5364 6.18464 16.1468 6.90934 16.4735L6.11751 23.1318C6.06574 23.5657 6.33185 23.9056 6.69096 23.941C7.11883 23.9831 7.42375 23.687 7.46743 23.2498L8.14118 16.5354C8.88934 16.3646 9.40456 15.8532 9.48706 15.0836L9.9497 10.7274C9.9675 10.56 9.72323 10.3348 9.59544 10.3497C9.46765 10.3645 9.2986 10.5056 9.21368 10.6557V10.6573ZM11.2527 17.5904L10.5612 23.6573C10.5126 24.0804 10.909 24.4038 11.205 24.3964C11.6531 24.3848 11.8804 24.1151 11.9273 23.6655L13.2343 10.9724C13.2497 10.824 13.164 10.6021 13.0823 10.5377C12.398 10.0057 11.3854 11.6398 11.0651 12.9967C10.7804 14.201 10.6137 15.4119 10.5175 16.6484C10.4787 17.1425 10.8394 17.3973 11.2527 17.5895V17.5904Z"
        fill="white"
      />
      <path
        d="M17.3391 29.8446C17.1426 29.9568 16.9581 29.6211 16.9743 29.4264L18.3194 13.0354L19.3668 0.757241C19.2754 0.681353 19.0538 0.574945 18.9988 0.635985L18.7254 0.938712L18.4108 4.16066C18.3671 4.38172 18.1641 4.77518 17.8656 4.77106L3.01406 4.56567C2.54413 4.55907 2.19877 4.28933 2.26105 3.77874L2.6048 0.986555C2.67193 0.440491 3.07149 -0.00246429 3.66354 1.03182e-05L15.774 0.0453782L19.3417 0.0536269C19.865 0.0544517 20.1214 0.588143 20.187 1.02532L20.9497 6.11147L22.3279 15.1817L23.9892 26.428C24.0507 26.8429 23.8461 27.1919 23.453 27.2826L20.9513 27.8616C20.6634 27.9285 20.5259 28.0217 20.2743 28.1652L17.3391 29.8438V29.8446Z"
        fill="white"
      />
    </svg>
  );
}

function BikeDeliveryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 38 29"
      fill="none"
      {...props}
    >
      <path
        d="M12.7922 8.02595L12.7964 14.9487C12.7964 15.3713 12.3749 15.7785 11.9618 15.785L10.7142 15.8044L11.1391 16.8025L13.9476 16.8154C14.3818 17.2647 14.8964 17.6695 15.5482 17.7407L20.7969 18.3171L20.5599 19.5969C19.6949 20.5828 18.8103 21.6846 19.6119 22.6794L20.0825 23.2631C20.3847 23.6387 20.6581 24.0135 21.1821 24.0831L24.065 24.466C24.6685 24.5461 25.2229 24.2102 25.4108 23.735C25.6377 23.1611 25.3736 22.6098 24.8395 22.2836L24.2495 21.9225L25.6208 18.9598L26.2107 17.8265C26.4376 17.3902 25.7782 16.4253 26.1676 15.806C26.2835 15.6214 26.6416 15.3721 26.9116 15.3438L28.6019 15.1673L27.7631 13.2318C27.2755 13.6107 26.6204 13.6552 26.303 13.2035C26.1726 13.0181 26.0872 12.8789 25.8823 12.8173C25.6775 12.7558 25.493 12.8392 25.311 13.0262L21.64 12.4774C21.2557 12.4199 20.8376 12.2175 20.6141 11.9164L18.9212 9.63037C18.8586 9.54699 18.564 9.82222 18.6216 9.91693L19.6932 11.6606C19.2979 12.5802 18.9627 13.5216 18.7418 14.548L23.062 15.3187C24.1073 15.5049 24.7701 16.4415 24.5373 17.442L23.4649 22.0569L24.6211 22.7426C24.8751 22.8931 25.0105 23.1983 24.9428 23.4525C24.8751 23.7067 24.5458 23.9859 24.2182 23.9382L22.1724 23.6411L21.3022 23.5618C20.8917 23.5245 20.5912 23.2153 20.6251 22.7855C20.6522 22.4414 20.8486 22.0861 21.039 21.81L20.9357 21.4449L21.6425 17.7706L15.7242 17.068C14.8033 16.9587 14.1431 16.2197 13.9416 15.3875C13.8299 14.9269 13.8358 14.4501 13.8976 13.9636C14.1541 11.965 14.794 10.0481 15.8258 8.30847C16.2448 7.60178 16.7298 7.02785 17.4086 6.57291C18.7045 5.70513 20.4033 6.05969 21.2108 7.40102L22.7124 10.214L26.1075 11.1919L26.1735 11.5594L27.2755 11.5124C27.7572 11.4922 27.9713 11.956 28.1499 12.2345C28.574 12.2191 29.0421 12.1228 29.406 12.4474C29.2181 12.0759 29.1038 11.7844 29.4103 11.4704C29.6016 11.2745 29.9943 11.1207 30.2956 11.1198L31.6042 11.1182C32.6081 11.1166 31.8031 12.3527 32.5031 14.1595C32.5751 14.3465 32.416 14.6589 32.1866 14.6468L30.6274 14.565L32.3101 17.8905C32.4117 18.0912 32.5819 18.5154 32.2983 18.6222L31.49 18.9266L31.9792 20.0461C34.1723 19.3977 36.4492 20.3894 37.4692 22.3629C38.2691 23.9123 38.1776 25.6915 37.1086 27.1179C36.1428 28.4074 34.4322 29.1975 32.6894 28.957C30.0815 28.5968 28.315 26.3513 28.6502 23.8669C28.8338 22.5038 29.5694 21.313 30.8035 20.5796L30.31 19.4406C29.7734 19.7992 29.2173 20.1125 28.9202 20.6549L27.1469 23.8888C26.5146 25.0415 25.5234 25.9158 24.1082 25.9182L17.9673 25.9295C17.6533 25.9295 17.4349 25.8162 17.197 25.5944L16.0764 25.575C15.7251 27.0539 14.5849 28.2317 13.2078 28.7126C11.5581 29.2889 9.84997 28.9579 8.55154 27.9071C6.80704 26.4946 6.43461 24.1025 7.50281 22.2051C8.18673 20.9908 9.35227 20.221 10.6033 19.9603C12.1557 19.6373 13.5971 20.0494 14.7508 21.0046C14.1617 20.0138 13.0918 19.367 11.8975 19.2091L9.14151 18.8432C8.91974 18.8141 8.6675 18.5979 8.58963 18.4142L8.19265 17.4808C8.08177 17.2194 8.22905 16.8138 8.55493 16.8082L9.927 16.7863L9.56388 15.7979L4.83738 15.7825C4.32613 15.7809 3.94101 15.3996 3.94101 14.9245V8.08181C3.94101 7.66654 4.30159 7.24722 4.7502 7.24722L11.9474 7.24398C12.319 7.24398 12.7956 7.60906 12.7956 8.0219L12.7922 8.02595ZM10.4323 24.8456C10.2139 24.3316 10.4806 23.7981 10.8073 23.5326C11.2965 23.1368 11.7748 23.2704 12.3334 23.3974C12.8252 23.5092 13.4321 23.4363 13.9662 23.4444C13.5971 22.5248 12.6805 21.9557 11.7231 21.9177C10.7235 21.8772 9.81781 22.3678 9.32942 23.2185C8.69374 24.3259 8.98322 25.7223 10.0489 26.4606C11.3837 27.385 13.2069 26.9406 13.8722 25.541L12.2902 25.4681C11.5665 25.728 10.7557 25.6074 10.4315 24.8456H10.4323ZM32.2534 23.7536L31.6669 22.4908C30.7197 23.2355 30.448 24.4271 30.922 25.473C31.3511 26.4193 32.443 27.0693 33.612 26.9244C35.1025 26.7398 36.0853 25.443 35.8711 24.0701C35.6603 22.7199 34.3543 21.6894 32.8773 21.9509L33.452 23.2631C34.2519 23.3562 34.7039 24.1138 34.4728 24.7906C34.2417 25.4673 33.4571 25.8081 32.763 25.4811C32.0672 25.1532 31.8361 24.4085 32.2526 23.7536H32.2534Z"
        fill="white"
      />
      <path
        d="M24.7608 6.70405C24.4442 7.03432 23.8001 7.33788 23.3582 7.10637L19.7016 5.18787C18.4244 4.5176 18.6021 1.88351 20.3779 0.672507C21.5122 -0.10056 22.9367 -0.220366 24.2131 0.381898C25.3152 0.902403 26.2023 1.97579 26.2327 3.30013L26.0728 4.09505C25.9424 4.74507 25.851 5.40319 25.4726 5.96012L24.7608 6.70324V6.70405ZM25.1772 5.69056C25.5437 4.87621 25.7088 4.18571 25.7427 3.41184L23.8661 3.10261C23.7315 3.08075 23.5081 3.27746 23.4894 3.38188L23.2812 4.43989C23.3684 4.5937 23.5766 4.85759 23.7451 4.94502L25.1772 5.69137V5.69056Z"
        fill="white"
      />
      <path
        d="M6.35335 18.8149L0.519712 18.8181C0.226845 18.8189 0 18.6206 0 18.3875C0 18.1333 0.199759 17.8994 0.493472 17.8994L6.39228 17.905C6.65552 17.905 6.86798 18.1746 6.85105 18.3786C6.83243 18.6052 6.62844 18.8141 6.35335 18.8141V18.8149Z"
        fill="white"
      />
      <path
        d="M5.66519 21.0661L1.63193 21.0645C1.33991 21.0645 1.11899 20.8888 1.10714 20.6492C1.0936 20.3699 1.29843 20.17 1.60484 20.17H5.70244C6.00208 20.17 6.20099 20.3861 6.1866 20.6492C6.17306 20.8921 5.95468 21.0669 5.66519 21.0669V21.0661Z"
        fill="white"
      />
      <path
        d="M5.308 23.2963L2.78901 23.3084C2.54946 23.3092 2.39372 22.9555 2.43943 22.7685C2.49275 22.5523 2.69505 22.392 2.95999 22.3929L5.10316 22.3953C5.31985 22.3953 5.52215 22.5361 5.60087 22.6964C5.67958 22.8567 5.56616 23.2946 5.30885 23.2954L5.308 23.2963Z"
        fill="white"
      />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://instagram.com", label: "Instagram", Icon: InstagramIcon },
  { href: "https://facebook.com", label: "Facebook", Icon: FacebookIcon },
  { href: "https://twitter.com", label: "Twitter", Icon: TwitterIcon },
];

const navItemClass =
  "text-white text-[18px] 2xl:text-[20px] font-normal uppercase tracking-[0.4px] " +
  "[font-family:var(--font-korolev),Korolev,sans-serif] " +
  "transition-colors duration-200 hover:text-[#FF0931]";

const PILL_PADDING = "px-4 py-2 2xl:px-6 2xl:py-2.5";

function PillButton({
  icon,
  lines,
  variant,
  className = "",
}: {
  icon?: ReactNode;
  lines: string[];
  variant: "filled" | "outline";
  className?: string;
}) {
  const base =
    `btn-press group flex shrink-0 items-center gap-2 rounded-[4px] ${PILL_PADDING} text-left h-[42px] 2xl:h-[48px] ` +
    " font-semibold capitalize leading-[1.15] tracking-[0.3px] " +
    "[font-family:var(--font-inter),Inter,sans-serif] transition-colors duration-200";
  const variantClass =
    variant === "filled"
      ? "bg-[#FF0931] text-white hover:bg-[#e0072b]"
      : "border text-[#FF0931] hover:bg-[#FF0931]/10 hover:text-white";

  return (
    <div className={`${base} ${variantClass} ${className}`} role="presentation">
      {icon}
      <span className="flex flex-col">
        {lines.map((line) => (
          <span className="text-[12px] 2xl:text-[13px]" key={line}>
            {line}
          </span>
        ))}
      </span>
    </div>
  );
}

function SocialRail({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {SOCIAL_LINKS.map(({ href, label, Icon }) => (
        <Link
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="group flex h-6 w-6 shrink-0 items-center justify-center   text-white transition-colors duration-200 hover:border-[#FF0931] hover:text-[#FF0931]"
        >
          <Icon className="h-full w-full transition-transform duration-200 group-hover:scale-110" />
        </Link>
      ))}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const sync = () => {
      document.documentElement.style.setProperty(
        "--navbar-h",
        `${el.offsetHeight}px`,
      );
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full bg-black">
      {/* Desktop navbar — fluid width capped at 1422px so it never over-stretches on ultrawide */}
      <nav className="nav-enter mx-auto hidden w-[90%] items-center justify-between gap-4 px-6 py-4 xl:flex xl:px-8 pr-4">
        <Link
          href="/"
          className="text-4xl shrink-0 [font-family:var(--font-korolev),Korolev,sans-serif]"
          aria-label="Crispies home"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="198"
            height="58"
            viewBox="0 0 198 58"
            fill="none"
          >
            <path
              d="M24.1728 14.8284V12.5241C24.1728 5.15341 19.1684 0.00963323 12.0864 0.00963323C5.0044 0.00963323 0 5.15341 0 12.5241V42.7764C0 50.0741 4.9268 55.2135 12.0864 55.2135C19.246 55.2135 24.1728 50.0697 24.1728 42.7764V40.1647H16.634V43.0064C16.634 46.8454 14.4788 47.9976 12.0908 47.9976C9.70282 47.9976 7.47224 46.8454 7.47224 43.0064V12.2941C7.47224 8.45507 9.70504 7.22773 12.0908 7.22773C14.4766 7.22773 16.634 8.45507 16.634 12.2941V14.8284H24.1728Z"
              fill="white"
            />
            <path
              d="M45.8862 26.0372C45.8862 31.9483 43.2675 32.9479 40.3429 32.9479H37.2631V7.77525H40.3429C43.1922 7.77525 45.8862 8.92519 45.8862 13.7638V26.0372ZM53.2764 26.4972V13.7461C53.2764 5.14586 48.3496 0.539461 41.2676 0.539461H29.72V54.6752H37.2587V40.0798H40.4161C41.4937 42.6892 44.2653 52.0568 45.3429 54.6752H53.5025L47.3429 38.0143C50.9615 36.1722 53.2719 32.5631 53.2719 26.4972"
              fill="white"
            />
            <path
              d="M84.3007 0.00884759C77.5247 0.00884759 72.5202 4.23267 72.5202 10.9886C72.5202 14.1354 72.9837 17.2071 76.6023 22.5057L86.3007 36.7871C88.4558 40.0113 88.9947 41.5461 88.9947 43.6204C88.9947 46.4598 86.9171 47.9968 84.4537 47.9968C81.9903 47.9968 79.5269 46.7672 79.5269 42.7756H72.0591C72.0591 50.5289 77.2164 55.2901 84.376 55.2901C91.5357 55.2901 96.4624 50.7611 96.4624 43.8504C96.4624 40.0113 95.6931 36.9397 92.1521 31.7185L82.4514 17.5056C80.6776 14.9714 80.0657 12.8992 80.0657 11.0571C80.0657 8.44543 81.9903 7.06329 84.2231 7.06329C86.4559 7.06329 88.6887 8.36803 88.6887 12.1319H96.0057C96.0057 4.61303 91.0013 0 84.3051 0"
              fill="white"
            />
            <path
              d="M117.322 27.4199C117.322 32.2563 114.551 33.4085 111.779 33.4085H108.699V7.77584H111.779C114.628 7.77584 117.322 8.92578 117.322 13.7644V27.4199ZM124.712 27.5725V13.6759C124.712 5.23048 119.786 0.546686 112.704 0.546686H101.156V54.6758H108.695V40.5492H112.699C119.781 40.5492 124.708 36.018 124.708 27.5725"
              fill="white"
            />
            <path
              d="M67.2844 0.00963323H59.8166V54.623H67.2844V0.00963323Z"
              fill="white"
            />
            <path
              d="M143.419 3.25362H135.952V57.3827H143.419V3.25362Z"
              fill="white"
            />
            <path
              d="M171.289 3.25603H151.043V57.3851H171.289V50.167H158.509V33.1213H168.057V26.5202H158.509V10.4719H171.289V3.25603Z"
              fill="white"
            />
            <path
              d="M185.836 2.71657C179.062 2.71657 174.058 6.94039 174.058 13.6963C174.058 16.8454 174.519 19.917 178.138 25.2134L187.838 39.4948C189.993 42.719 190.532 44.256 190.532 46.3281C190.532 49.1698 188.455 50.7045 185.989 50.7045C183.523 50.7045 181.062 49.4772 181.062 45.4833H173.597C173.597 53.2388 178.754 58 185.914 58C193.073 58 198 53.4688 198 46.5581C198 42.7191 197.231 39.6496 193.687 34.4284L183.991 20.2244C182.217 17.6901 181.603 15.6158 181.603 13.7737C181.603 11.1642 183.528 9.78208 185.761 9.78208C187.993 9.78208 190.226 11.0868 190.226 14.8485H197.543C197.543 7.32961 192.541 2.71657 185.843 2.71657"
              fill="white"
            />
            <path
              d="M133.431 17.6409L129.27 23.0964L132.74 25.4339L126.496 30.1089V17.6409H133.431Z"
              fill="#FF0931"
            />
            <path
              d="M117.85 47.0849L110.38 42.0274V49.1526C110.36 52.0761 112.711 54.4645 115.642 54.4976C117.411 54.4888 118.963 53.3189 119.456 51.6228C119.968 49.9222 119.318 48.0889 117.85 47.0849Z"
              fill="#FF0931"
            />
          </svg>
        </Link>

        <div className="flex min-w-0 items-center gap-4 2xl:gap-16">
          <div className="flex items-center gap-10">
            {" "}
            {NAV_LINKS.map((l) => {
              const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`link-underline shrink-0 ${navItemClass} ${isActive ? "border-b-2 border-[#FF0931] pb-0.5" : ""}`}
                  style={isActive ? { color: "#FF0931" } : undefined}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className=" flex items-center gap-8">
            <PillButton
              variant="filled"
              icon={<BagIcon className="h-4 w-3.5 2xl:h-5 2xl:w-4" />}
              lines={["Click", "& Collect"]}
              className="w-[150px] 2xl:w-[160px] justify-center"
            />
            <button
              type="button"
              onClick={() => setDeliveryOpen(true)}
              aria-haspopup="dialog"
              className="cursor-pointer"
            >
              <PillButton
                variant="filled"
                icon={<BikeDeliveryIcon className="h-4 w-6 2xl:h-5 2xl:w-7" />}
                lines={["Get It", "Delivered"]}
                className="w-[150px] 2xl:w-[160px] justify-center"
              />
            </button>
          </div>

          <SocialRail className="flex-col gap-1.5" />
        </div>
      </nav>

      {/* Mobile navbar */}
      <nav className="flex h-14 items-center justify-between px-5 xl:hidden">
        <Link href="/" aria-label="Crispies home">
          <Image
            src="/images/cripieslogoblack.png"
            alt="Crispies"
            width={48}
            height={48}
            className="block"
            priority
          />
        </Link>
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="px-2.5 py-1.5 text-[12px] font-semibold capitalize tracking-[0.4px] text-white [font-family:var(--font-inter),Inter,sans-serif]"
        >
          {open ? "Close" : "Menu"}
        </button>
      </nav>

      {open && (
        <>
          <div
            className="backdrop-in fixed inset-0 top-16 bg-black/60 xl:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="menu-drop absolute inset-x-0 top-full border-b border-white/10 bg-black xl:hidden">
            <div className="flex flex-col gap-1 px-5 py-5">
              {NAV_LINKS.map((l, i) => {
                const isActive = pathname === l.href || pathname.startsWith(l.href + "/");
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    style={{ animationDelay: `${0.05 + i * 0.08}s`, ...(isActive ? { color: "#FF0931" } : {}) }}
                    className={`menu-item rounded-md px-4 py-3 transition-colors hover:bg-white/5 ${navItemClass} ${isActive ? "border-b-2 border-[#FF0931]" : ""}`}
                  >
                    {l.label}
                  </Link>
                );
              })}

              {/* Stacked, not a horizontal row — a horizontal row of 3 pill
                  buttons + social rail cannot fit a phone viewport */}
              <div
                style={{ animationDelay: `${0.05 + NAV_LINKS.length * 0.08}s` }}
                className="menu-item mt-2 flex flex-col gap-2.5"
              >
                <PillButton
                  variant="filled"
                  icon={<BagIcon className="h-4 w-3.5" />}
                  lines={["Click", "& Collect"]}
                  className="w-full justify-center"
                />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDeliveryOpen(true);
                  }}
                  aria-haspopup="dialog"
                  className="cursor-pointer"
                >
                  <PillButton
                    variant="filled"
                    icon={<BikeDeliveryIcon className="h-4 w-6" />}
                    lines={["Get It", "Delivered"]}
                    className="w-full justify-center"
                  />
                </button>
              </div>

              <div
                style={{
                  animationDelay: `${0.05 + (NAV_LINKS.length + 1) * 0.08}s`,
                }}
                className="menu-item mt-4 flex justify-center"
              >
                <SocialRail className="flex-row gap-4" />
              </div>
            </div>
          </div>
        </>
      )}
      {deliveryOpen && <DeliveryOverlay onClose={() => setDeliveryOpen(false)} />}
    </header>
  );
}
