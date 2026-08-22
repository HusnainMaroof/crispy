// locations.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef, useState } from "react";
import type { MapLocation } from "./locations-map";
import Footer from "@/app/components/store/footer";

const LocationsMap = dynamic(() => import("./locations-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center text-white/40 text-sm">
      Loading map…
    </div>
  ),
});

const locations = [
  {
    id: "tower-hill",
    name: "Tower Hill",
    address: "2 Tower Hill Ter, London EC3N 4EE, United Kingdom",
    status: "open" as const,
    hours: "11:00 AM – 11:00 PM",
    lat: 51.5098,
    lng: -0.0759,
  },
  {
    id: "camden-town",
    name: "Camden Town",
    address: "45 Camden High St, London NW1 7JH, United Kingdom",
    status: "open" as const,
    hours: "9:00 AM – 11:00 PM",
    lat: 51.539,
    lng: -0.1426,
  },
  {
    id: "shoreditch",
    name: "Shoreditch",
    address: "112 Shoreditch High St, London E1 6JN, United Kingdom",
    status: "open" as const,
    hours: "9:00 AM – 11:00 PM",
    lat: 51.5229,
    lng: -0.0777,
  },
  {
    id: "westminster",
    name: "Westminster",
    address: "9 Victoria St, London SW1H 0EX, United Kingdom",
    status: "open" as const,
    hours: "9:00 AM – 11:00 PM",
    lat: 51.4994,
    lng: -0.1248,
  },
];

const mapLocations: MapLocation[] = locations.map((l) => ({
  id: l.id,
  name: l.name,
  lat: l.lat,
  lng: l.lng,
}));

const INFO_CARDS = [
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF0931"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    title: "Near You",
    desc: "Find closest branch to your location",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF0931"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-4h6v4" />
        <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
      </svg>
    ),
    title: "All Locations",
    desc: "Explore our branches in your city",
  },
  {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#FF0931"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: "Easy Directions",
    desc: "Get directions to us in less time",
  },
];

/* ---------- Feature icons ---------- */

function MultipleLocationsIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 78 66"
      fill="none"
      className="h-9 w-auto sm:h-10"
    >
      <path
        d="M64.8903 34.3896C64.8903 33.5253 64.2861 33.0095 63.5491 33.0095L45.4766 33.0036C44.8069 33.0193 44.1546 33.5607 44.1546 34.3148L44.1469 58.41H7.59586L7.59009 28.3711C9.67982 27.7037 11.1634 26.3256 12.3276 24.4376C13.7592 27.1545 16.2607 28.5916 19.0124 28.566C21.7025 28.5405 24.1559 26.993 25.5818 24.3785C26.9403 26.9832 29.4303 28.5798 32.284 28.5739C35.1376 28.568 37.5602 26.9477 38.9053 24.4081C40.36 27.0757 42.8827 28.5444 45.5709 28.5601C48.259 28.5759 50.8683 27.0501 52.3077 24.3707C53.6585 26.9438 56.1157 28.4952 58.8655 28.5542C61.673 28.6153 64.2649 27.0206 65.6869 24.3392C66.6741 26.3748 68.2885 27.6565 70.3148 28.3554V58.4021L64.873 58.3942L64.8903 34.3896ZM37.8258 53.3346C38.6378 53.3346 39.1227 52.616 39.1227 51.9683V34.2793C39.1227 33.5981 38.6013 33.1355 37.947 33.0134L14.3153 33.0016C13.4513 33.0016 12.8067 33.5804 12.8048 34.5195L12.7894 51.9624C12.7894 52.7066 13.4071 53.3405 14.1652 53.3385L37.8277 53.3346H37.8258Z"
        fill="#FF0931"
      />
      <path
        d="M40.3651 22.5454C39.7327 23.2796 38.6904 23.5035 37.9911 22.742C35.4275 19.9561 33.1703 16.8965 31.368 13.5295C30.2929 11.52 29.8831 9.37734 30.3671 7.18743C30.9581 4.51598 32.6547 2.32109 34.7586 1.15645C37.3733 -0.291877 40.2848 -0.376488 42.8448 0.883957C46.1418 2.50773 48.1509 6.05515 47.8809 9.77551C47.7666 11.3545 47.184 12.7095 46.4507 14.0546C44.7627 17.1503 42.6879 19.8479 40.3639 22.5442L40.3651 22.5454ZM36.6278 12.4158C38.4764 13.7957 40.905 13.3379 42.2513 11.6407C43.5976 9.94349 43.3325 7.34172 41.7296 5.91952C40.1267 4.49732 37.6251 4.56949 36.1 6.17708C34.3755 7.99372 34.5835 10.8891 36.6278 12.4158Z"
        fill="#FF0931"
      />
      <path
        d="M62.5427 58.3982L46.5503 58.41V35.5236L62.5389 35.5157L62.5427 58.3982ZM50.1525 46.133C49.098 46.4894 48.6497 47.6608 49.023 48.6392C49.3982 49.6216 50.4796 50.1394 51.4495 49.7358C52.4193 49.3322 52.8599 48.2514 52.5039 47.2414C52.1768 46.3161 51.1704 45.7905 50.1525 46.133Z"
        fill="#FF0931"
      />
      <path
        d="M75.3428 64.1055C75.3293 64.9009 74.6655 65.3832 73.9093 65.3832H4.14569C3.48375 65.3832 2.63708 64.9776 2.62746 64.3614L2.5909 62.0462C2.57935 61.3001 3.37214 60.8433 4.14761 60.8433H73.7188C74.677 60.8433 75.3871 61.4595 75.3698 62.4144L75.339 64.1095L75.3428 64.1055Z"
        fill="#FF0931"
      />
      <path
        d="M74.4038 25.8275C72.3718 26.6268 70.6246 26.2016 69.0698 25.0578C67.667 24.0242 66.9377 22.2621 66.828 20.2737L66.7568 18.9822L60.7397 6.44528L68.8543 6.39409C71.7464 10.7214 75.1177 14.6156 77.7039 19.0728C78.7872 21.6459 76.7187 24.918 74.4057 25.8295L74.4038 25.8275Z"
        fill="#FF0931"
      />
      <path
        d="M64.5478 19.1476C64.9538 22.7858 62.8025 25.9417 59.3331 26.1721C55.7117 26.4122 52.9927 23.152 53.5199 19.4842L50.0794 6.43938H58.3671L64.5478 19.1476Z"
        fill="#FF0931"
      />
      <path
        d="M11.0845 20.0001C11.2769 23.1166 9.26996 25.6031 6.45863 26.1366C3.72813 26.6564 0.897559 24.8392 0.181739 21.9727C-0.0472461 21.0573 0.00278437 20.0867 0.00855711 19.0629L9.2257 6.39607L17.2998 6.45119L11.5868 18.2715C11.2769 18.7046 11.0441 19.3189 11.0864 19.9981L11.0845 20.0001Z"
        fill="#FF0931"
      />
      <path
        d="M24.458 19.1929C24.6197 21.2049 24.2406 22.9965 22.9898 24.3274C21.8045 25.5873 20.0323 26.4733 18.1754 26.1701C14.9061 25.6346 13.0703 22.6657 13.409 19.2165L19.7167 6.44922H27.9428L24.46 19.1929H24.458Z"
        fill="#FF0931"
      />
      <path
        d="M15.3852 50.8836L15.2467 47.3989L26.6055 35.5669H30.2115L23.8076 42.2192L15.3852 50.8836Z"
        fill="#FF0931"
      />
    </svg>
  );
}

function OpenEverydayIcon() {
  // No dedicated SVG was supplied for this label — using the original clock icon as the closest match.
  // Swap this out if you have the real clock+checkmark asset from the reference image.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FF0931"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-9 w-9 sm:h-10 sm:w-10"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function DineInTakeawayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 58 71"
      fill="none"
      className="h-9 w-auto sm:h-10"
    >
      <path
        d="M9.438 67.948L1.97123 67.1379C0.900085 67.0227 -0.135881 66.234 0.0146276 64.967L0.821899 58.1441L3.91611 35.0907L7.02401 12.4374L44.2152 12.9489L39.3715 69.6445C39.1565 70.4898 38.4587 71.0872 37.5557 70.9896L9.43996 67.9461L9.438 67.948ZM22.2664 25.2224L21.3516 32.9706C21.2167 33.2556 20.7359 33.6383 20.4642 33.607C20.2335 33.5797 19.8778 33.2341 19.7312 32.9765L20.6421 25.3297C20.6303 24.9276 20.2414 24.3478 19.8758 24.3361C19.6022 24.3263 19.1663 24.6289 18.8848 24.9061L17.9271 32.8691C17.6847 33.1678 17.2097 33.4508 16.9282 33.4059C16.5549 33.3474 16.3262 32.8008 16.3712 32.4084L17.198 25.1443C17.2312 24.8573 16.7953 24.2482 16.5138 24.2384C16.2324 24.2287 15.773 24.543 15.4877 24.8475L14.264 34.9072C14.0217 36.7696 14.9462 38.2142 16.6976 38.9873L14.784 54.7454C14.6589 55.7722 15.302 56.5765 16.1698 56.6605C17.2038 56.76 17.9407 56.0592 18.0463 55.0245L19.6745 39.1337C21.4826 38.7296 22.7277 37.5192 22.9271 35.6978L24.0451 25.3883C24.0881 24.992 23.4978 24.459 23.189 24.4942C22.8801 24.5293 22.4716 24.8631 22.2664 25.2184V25.2224ZM27.1941 41.6305L25.5228 55.9889C25.4056 56.9904 26.3633 57.7556 27.0787 57.7381C28.1616 57.7107 28.7109 57.0724 28.8242 56.0084L31.983 25.9681C32.0201 25.6167 31.8129 25.0916 31.6155 24.9393C29.9618 23.6801 27.5146 27.5474 26.7406 30.7588C26.0525 33.609 25.6499 36.4748 25.4173 39.4011C25.3235 40.5705 26.1952 41.1737 27.1941 41.6286V41.6305Z"
        fill="#FF0931"
      />
      <path
        d="M41.9028 70.6323C41.4278 70.8978 40.9822 70.1033 41.0213 69.6425L44.2719 30.8505L46.8031 1.79214C46.5823 1.61254 46.0467 1.3607 45.9138 1.50516L45.2531 2.22162L44.4927 9.84688C44.3872 10.3701 43.8966 11.3013 43.1753 11.2915L7.28398 10.8054C6.14833 10.7898 5.31369 10.1514 5.4642 8.94302L6.29492 2.33485C6.45716 1.0425 7.42276 -0.00583216 8.85356 2.44198e-05L38.1206 0.107395L46.7425 0.126917C48.0072 0.128869 48.6268 1.39194 48.7851 2.4266L50.6284 14.4638L53.9591 35.9301L57.974 62.5463C58.1225 63.5283 57.628 64.354 56.678 64.5688L50.6323 65.9392C49.9364 66.0974 49.6041 66.318 48.9963 66.6576L41.9028 70.6303V70.6323Z"
        fill="#FF0931"
      />
    </svg>
  );
}

function DeliveryAvailableIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 86 68"
      fill="none"
      className="h-9 w-auto sm:h-10"
    >
      <path
        d="M28.9507 18.8195L28.9603 35.0522C28.9603 36.0431 28.0063 36.9978 27.0715 37.013L24.2479 37.0586L25.2095 39.3989L31.5656 39.4293C32.5483 40.4828 33.713 41.4318 35.188 41.5989L47.0667 42.9503L46.5304 45.9513C44.5726 48.2632 42.5708 50.8465 44.3849 53.1793L45.4499 54.5479C46.1338 55.4286 46.7526 56.3074 47.9383 56.4707L54.4629 57.3685C55.8288 57.5564 57.0835 56.7687 57.5088 55.6545C58.0221 54.3087 57.4245 53.0161 56.2157 52.2511L54.8805 51.4046L57.9838 44.4574L59.319 41.8001C59.8324 40.777 58.3401 38.5144 59.2213 37.0623C59.4838 36.6296 60.2941 36.045 60.9052 35.9785L64.7306 35.5647L62.8323 31.0263C61.7289 31.9146 60.2462 32.019 59.5278 30.9599C59.2328 30.5252 59.0393 30.1987 58.5758 30.0545C58.1122 29.9102 57.6946 30.1057 57.2827 30.5442L48.9747 29.2573C48.105 29.1225 47.1587 28.648 46.653 27.9419L42.8217 22.5816C42.68 22.3861 42.0133 23.0314 42.1436 23.2535L44.5688 27.3421C43.6742 29.4983 42.9156 31.7058 42.4156 34.1127L52.1929 35.9197C54.5587 36.3562 56.0586 38.5524 55.5318 40.8985L53.1048 51.7197L55.7215 53.3274C56.2962 53.6804 56.6027 54.396 56.4494 54.992C56.2962 55.588 55.551 56.2429 54.8097 56.1309L50.1796 55.4343L48.2104 55.2483C47.2813 55.161 46.6012 54.4359 46.6779 53.428C46.7392 52.6213 47.1836 51.788 47.6146 51.1407L47.3809 50.2847L48.9804 41.6691L35.5864 40.0215C33.5022 39.7653 32.0081 38.0323 31.5521 36.081C31.2993 35.001 31.3127 33.883 31.4525 32.7422C32.033 28.0557 33.4812 23.561 35.8163 19.4819C36.7645 17.8249 37.8622 16.4791 39.3985 15.4123C42.3313 13.3776 46.176 14.2089 48.0035 17.3541L51.4018 23.9501L59.0853 26.243L59.2347 27.1048L61.7289 26.9947C62.8189 26.9472 63.3035 28.0349 63.7077 28.6878C64.6674 28.6518 65.7268 28.4259 66.5505 29.187C66.1252 28.3158 65.8666 27.6325 66.5601 26.896C66.993 26.4366 67.8818 26.076 68.5638 26.0741L71.5253 26.0703C73.7973 26.0665 71.9755 28.9649 73.5597 33.2016C73.7226 33.64 73.3624 34.3727 72.8433 34.3442L69.3147 34.1525L73.123 41.95C73.3528 42.4208 73.7379 43.4154 73.0961 43.6659L71.2667 44.3796L72.374 47.0047C77.3373 45.4843 82.4903 47.8095 84.7987 52.4372C86.6089 56.0702 86.402 60.2422 83.9826 63.5867C81.7969 66.6105 77.9254 68.463 73.9812 67.8993C68.0791 67.0546 64.0813 61.7892 64.8398 55.9639C65.2555 52.7674 66.9202 49.9753 69.7132 48.2556L68.5964 45.5849C67.3819 46.4258 66.1233 47.1604 65.4509 48.4321L61.4377 56.0151C60.0067 58.7181 57.7635 60.768 54.5606 60.7737L40.6628 60.8003C39.9521 60.8003 39.4579 60.5346 38.9196 60.0145L36.3833 59.9689C35.5883 63.4368 33.008 66.1986 29.8913 67.326C26.1578 68.6775 22.292 67.9012 19.3535 65.4374C15.4054 62.1252 14.5625 56.5162 16.98 52.067C18.5279 49.2198 21.1657 47.4147 23.9969 46.8035C27.5102 46.0462 30.7725 47.0123 33.3835 49.2521C32.0502 46.9288 29.6289 45.4122 26.9259 45.0421L20.6887 44.1841C20.1868 44.1158 19.6159 43.609 19.4397 43.1781L18.5413 40.9896C18.2903 40.3765 18.6236 39.4255 19.3612 39.4122L22.4664 39.361L21.6446 37.0434L10.9478 37.0073C9.79072 37.0035 8.91912 36.1095 8.91912 34.9953V18.9504C8.91912 17.9767 9.73517 16.9935 10.7504 16.9935L27.0389 16.9859C27.8799 16.9859 28.9584 17.8419 28.9584 18.81L28.9507 18.8195ZM23.61 58.2587C23.1158 57.0534 23.7192 55.8025 24.4586 55.1799C25.5658 54.2518 26.6482 54.565 27.9125 54.863C29.0254 55.1249 30.3989 54.9541 31.6077 54.9731C30.7725 52.8168 28.6979 51.4824 26.5313 51.3932C24.269 51.2983 22.2193 52.4485 21.1139 54.4435C19.6753 57.0401 20.3305 60.3144 22.7422 62.0455C25.7631 64.2131 29.8894 63.1711 31.3951 59.8892L27.8148 59.7184C26.1769 60.3277 24.3418 60.0448 23.6081 58.2587H23.61ZM72.9946 55.6981L71.6671 52.7371C69.5235 54.4833 68.9086 57.2774 69.9814 59.7298C70.9526 61.9487 73.4237 63.4729 76.0692 63.1331C79.4426 62.7003 81.6666 59.6595 81.182 56.4403C80.705 53.2742 77.7492 50.8579 74.4064 51.471L75.7071 54.5479C77.5174 54.7662 78.5403 56.5428 78.0174 58.1296C77.4944 59.7165 75.7186 60.5156 74.1478 59.7487C72.5732 58.98 72.0502 57.2337 72.9927 55.6981H72.9946Z"
        fill="#FF0931"
      />
      <path
        d="M56.0376 15.7198C55.3211 16.4943 53.8633 17.2061 52.8634 16.6632L44.5879 12.1646C41.6973 10.593 42.0995 4.41651 46.1185 1.57691C48.6854 -0.235797 51.9094 -0.516719 54.7982 0.895485C57.2923 2.11598 59.2999 4.63289 59.3688 7.73822L59.0068 9.60218C58.7118 11.1264 58.5049 12.6696 57.6486 13.9755L56.0376 15.7179V15.7198ZM56.9801 13.3434C57.8095 11.4339 58.1831 9.81477 58.2597 8.00017L54.0128 7.27508C53.7082 7.22383 53.2025 7.68508 53.1603 7.92993L52.6891 10.4108C52.8864 10.7714 53.3576 11.3902 53.7388 11.5952L56.9801 13.3453V13.3434Z"
        fill="#FF0931"
      />
      <path
        d="M14.3786 44.1177L1.17619 44.1253C0.513386 44.1272 0 43.6621 0 43.1155C0 42.5195 0.452086 41.9709 1.11681 41.9709L14.4667 41.9842C15.0625 41.9842 15.5433 42.6163 15.505 43.0946C15.4629 43.6261 15.0012 44.1158 14.3786 44.1158V44.1177Z"
        fill="#FF0931"
      />
      <path
        d="M12.8212 49.3964L3.69331 49.3926C3.03242 49.3926 2.53245 48.9807 2.50563 48.4188C2.47498 47.764 2.93856 47.2951 3.63201 47.2951H12.9055C13.5836 47.2951 14.0338 47.8019 14.0013 48.4188C13.9706 48.9883 13.4764 49.3983 12.8212 49.3983V49.3964Z"
        fill="#FF0931"
      />
      <path
        d="M12.0128 54.6257L6.31196 54.6542C5.76984 54.6561 5.41737 53.8266 5.52081 53.3881C5.64149 52.8813 6.09933 52.5055 6.69892 52.5074L11.5493 52.5131C12.0397 52.5131 12.4975 52.8434 12.6756 53.2192C12.8538 53.595 12.5971 54.6219 12.0148 54.6238L12.0128 54.6257Z"
        fill="#FF0931"
      />
    </svg>
  );
}

function FeatureDivider() {
  const gradientId = useId();
  return (
    <svg
      className="hidden h-12 w-px shrink-0 self-center sm:block"
      viewBox="0 0 1 114"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M0.5 0L0.5 114" stroke={`url(#${gradientId})`} />
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="0"
          y2="114"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A2A1A3" stopOpacity="0" />
          <stop offset="0.4904" stopColor="#3D3C3D" />
          <stop offset="1" stopColor="#686769" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const FEATURES = [
  {
    icon: <MultipleLocationsIcon />,
    title: "Multiple Locations",
    desc: "Across London, closer to you.",
  },
  {
    icon: <OpenEverydayIcon />,
    title: "Open Everyday",
    desc: "Serving you fresh 7 days a week.",
  },
  {
    icon: <DineInTakeawayIcon />,
    title: "Dine-In Or Takeaway",
    desc: "Enjoy in-store or take it away.",
  },
  {
    icon: <DeliveryAvailableIcon />,
    title: "Delivery Available",
    desc: "Can't come to us? We'll come to you.",
  },
];

function ArrowIcon({
  className = "h-[54px] w-[54px]",
}: {
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 54 54"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect x="0.5" y="0.5" width="53" height="53" rx="9.5" stroke="#FF0931" />
      <path
        d="M18.8746 37.9291L16.7144 35.7717L32.7774 19.702H20.3701L20.3978 16.7148H37.9286V34.2505H34.9099L34.9376 21.8594L18.8746 37.9291Z"
        fill="#FF0931"
      />
    </svg>
  );
}

export default function Locations() {
  const [selectedId, setSelectedId] = useState<string>(locations[0].id);
  const [search, setSearch] = useState("");

  // Moving side-track indicator alongside the bordered location cards
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ top: 0, height: 92 });

  useEffect(() => {
    const idx = locations.findIndex((l) => l.id === selectedId);
    const el = itemRefs.current[idx];
    const track = trackRef.current;
    if (el && track) {
      const elRect = el.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();
      setIndicator({ top: elRect.top - trackRect.top, height: elRect.height });
    }
  }, [selectedId]);

  return (
    <>
      <section className="w-full bg-white">
        {/* Hero Section */}
        <div className="px-6 pt-10 pb-6 sm:px-10 md:px-12 xl:px-25">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <h1 className="m-0 capitalize leading-[1]">
                <span
                  className="font-[family-name:var(--font-korolev),Korolev,sans-serif] font-black text-black"
                  style={{ fontSize: "clamp(48px, 11vw, 150px)" }}
                >
                  Find your{" "}
                </span>
                <br className="hidden sm:block" />
                <span
                  className="font-[family-name:var(--font-korolev),Korolev,sans-serif] font-black text-[#FF0931]"
                  style={{ fontSize: "clamp(48px, 11vw, 150px)" }}
                >
                  nearest Crispies
                </span>
              </h1>
            </div>

            <div className="flex shrink-0 gap-4 sm:gap-5 lg:mt-4">
              {INFO_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="flex w-[140px] flex-col items-center gap-3 rounded-[16px] border border-[#E5E5E5] bg-white px-4 py-5 text-center sm:w-[160px] sm:px-5 sm:py-6"
                >
                  <div className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#FFF0F0]">
                    {card.icon}
                  </div>
                  <h3 className="m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[14px] font-bold leading-[1.2] text-black sm:text-[16px]">
                    {card.title}
                  </h3>
                  <p className="m-0 font-[family-name:var(--font-inter),Inter,sans-serif] text-[11px] leading-[1.3] text-[#666] sm:text-[12px]">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="px-6 py-6 sm:px-10 md:px-12 xl:px-25">
          <div className="flex flex-wrap items-center justify-between gap-y-4 rounded-[16px] border border-[#E5E5E5] bg-white px-6 py-5 sm:flex-nowrap sm:px-8 sm:py-6">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="flex flex-1 items-center gap-4 sm:gap-6"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[13px] font-bold leading-[1.2] text-black sm:text-[15px]">
                      {feat.title}
                    </h4>
                    <p className="m-0 font-[family-name:var(--font-inter),Inter,sans-serif] text-[11px] leading-[1.3] text-[#666] sm:text-[12px]">
                      {feat.desc}
                    </p>
                  </div>
                </div>
                {i < FEATURES.length - 1 && <FeatureDivider />}
              </div>
            ))}
          </div>
        </div>

        {/* Map + Locations List */}
        <div className="px-6 pb-6 sm:px-10 md:px-12 xl:px-25">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
            {/* Left — bordered location cards */}
            <div className="flex flex-1 min-w-0 gap-4 sm:gap-6">
              <div
                ref={trackRef}
                className="relative w-2 shrink-0 self-stretch rounded-[4px] bg-[#D9D9D9]"
              >
                <span
                  className="absolute left-0 w-2 rounded-[4px] bg-[#FF0931] transition-all duration-300 ease-out"
                  style={{ top: indicator.top, height: indicator.height }}
                />
              </div>

              <div className="flex max-h-[560px] flex-1 flex-col gap-4 overflow-y-auto p-1 sm:gap-5">
                {locations.map((loc, i) => {
                  const isActive = loc.id === selectedId;
                  const displayNum = String(i + 1).padStart(2, "0");

                  return (
                    <div
                      key={loc.id}
                      ref={(el) => {
                        itemRefs.current[i] = el;
                      }}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                      onClick={() => setSelectedId(loc.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(loc.id);
                        }
                      }}
                      className={`relative shrink-0 cursor-pointer rounded-[20px] border-2 bg-white p-6 transition-colors duration-200 sm:p-7 ${
                        isActive ? "border-[#FF0931]" : "border-[#EAEAEA]"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Show ${loc.name} on map`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(loc.id);
                        }}
                        className="absolute right-5 top-5 shrink-0 transition-transform duration-200 hover:scale-110 sm:right-6 sm:top-6"
                      >
                        <ArrowIcon className="h-[42px] w-[42px] sm:h-[48px] sm:w-[48px]" />
                      </button>

                      <div className="flex items-start gap-4 sm:gap-6 pr-14 sm:pr-16">
                        <span
                          className={`shrink-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[26px] font-bold leading-none sm:text-[30px] ${
                            isActive ? "text-[#FF0931]" : "text-[#F3B9C3]"
                          }`}
                        >
                          {displayNum}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span
                              className={`font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[22px] font-bold uppercase leading-none tracking-[0.54px] sm:text-[26px] ${
                                isActive ? "text-black" : "text-[#B3B3B3]"
                              }`}
                            >
                              {loc.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[10px] font-medium text-white sm:text-[11px] ${
                                isActive ? "bg-[#1F5C2E]" : "bg-[#A9C4AE]"
                              }`}
                            >
                              <span
                                className={`h-[5px] w-[5px] rounded-full ${
                                  isActive ? "bg-[#7CFF8A]" : "bg-white/70"
                                }`}
                              />
                              {loc.status === "open" ? "Open Now" : "Closed"}
                            </span>
                          </div>

                          <p
                            className={`m-0 mt-3 font-[family-name:var(--font-inter),Inter,sans-serif] text-[12px] leading-[1.4] sm:text-[13px] ${
                              isActive ? "text-[#999]" : "text-[#D2D2D2]"
                            }`}
                          >
                            {loc.address}
                          </p>

                          <p
                            className={`m-0 mt-4 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] font-bold sm:text-[15px] ${
                              isActive ? "text-black" : "text-[#D2D2D2]"
                            }`}
                          >
                            {loc.hours}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — map (unchanged) */}
            <div className="w-full lg:w-[420px] xl:w-[50%] shrink-0">
              <div className="relative h-[400px] w-full overflow-hidden rounded-[20px] bg-[#1A1A1A] lg:h-full lg:min-h-[560px] sm:rounded-[24px]">
                <LocationsMap
                  locations={mapLocations}
                  selectedId={selectedId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA — Can't Find Us */}
        <div className="px-6 pb-10 sm:px-10 md:px-12 xl:px-25">
          <div className="flex flex-col items-center gap-6 rounded-[20px] border border-[#E5E5E5] bg-[#FAFAFA] px-6 py-8 sm:flex-row sm:justify-between sm:px-10 sm:py-10">
            <div className="flex items-center gap-4">
              <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#FFF0F0]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FF0931"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div>
                <h3 className="m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[20px] font-bold uppercase leading-[1] tracking-[0.54px] text-black sm:text-[24px]">
                  Cant Find Us
                </h3>
                <p className="m-0 mt-1 font-[family-name:var(--font-inter),Inter,sans-serif] text-[13px] leading-[1.3] text-[#666] sm:text-[14px]">
                  Search in Your Area And Find Nearest Crispies
                </p>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="relative flex-1 sm:w-[300px]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter Your Area Or Postcode"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-[10px] border border-[#E5E5E5] bg-white py-3.5 pl-11 pr-4 font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-black outline-none placeholder:text-[#999] focus:border-[#FF0931] sm:py-4"
                />
              </div>
              <button
                type="button"
                className="flex h-[48px] w-[48px] shrink-0 cursor-pointer items-center justify-center rounded-[12px] bg-[#FF0931] text-white transition-transform hover:scale-105 sm:h-[52px] sm:w-[52px]"
                aria-label="Search location"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
