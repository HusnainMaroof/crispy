// locations.tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
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
  {
    id: "canary-wharf",
    name: "Canary Wharf",
    address: "1 Canada Sq, London E14 5AB, United Kingdom",
    status: "closed" as const,
    hours: "11:00 AM – 11:00 PM",
    lat: 51.5054,
    lng: -0.0235,
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
      width="78"
      height="66"
      viewBox="0 0 78 66"
      fill="none"
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
      width="70"
      height="68"
      viewBox="0 0 70 68"
      fill="none"
    >
      <path
        d="M4.82953 40.9989C6.27641 46.8771 9.23379 52.0511 13.5157 56.0474C21.1498 63.1701 31.8456 65.5238 41.6345 62.1732L44.1058 65.7897C30.9354 70.9938 16.0425 66.6981 7.3318 55.3281C3.31087 50.0805 0.704204 43.8226 0.128387 37.0812C-0.88133 25.2646 4.11832 13.7407 13.2351 6.68823C26.5686 -3.62455 45.2003 -1.82964 56.4507 10.8184C63.124 18.3208 66.3848 28.657 64.8074 38.9999L61.0083 37.4442C61.9218 29.2475 59.5941 21.0458 54.4248 14.7544C47.8543 6.75682 37.7865 2.9211 27.5474 4.7779C18.3212 6.4507 10.1391 12.9813 6.37918 22.2034C3.96988 28.1151 3.25052 34.5854 4.82953 40.9972V40.9989Z"
        fill="#FF0931"
      />
      <path
        d="M67.3342 62.3254C64.1876 66.6763 59.2222 68.7255 54.0104 67.7687C49.3077 66.9055 45.2394 63.3424 43.6996 58.3943C42.0651 53.1434 43.6245 47.4074 47.652 43.7306C53.172 38.6905 61.6282 39.2442 66.5234 44.8714C70.7874 49.7727 71.2132 56.9641 67.3342 62.3254ZM49.2865 55.293L53.3743 59.674C54.1263 60.4803 55.1817 60.1842 55.8423 59.4666L63.7357 50.8918C64.398 50.1725 63.6917 48.8276 63.1419 48.4997C62.2578 47.9711 61.5026 48.3057 60.8207 49.0467L54.4704 55.9303L51.7284 53.0163C51.1395 52.3907 50.0597 52.5379 49.5116 53.0782C49.0744 53.5098 48.6862 54.6523 49.2848 55.2946L49.2865 55.293Z"
        fill="#FF0931"
      />
      <path
        d="M44.8431 36.0575L32.8488 36.101C31.8374 36.1043 30.7233 35.4185 30.7233 34.209L30.7347 17.8592C30.7347 16.7467 31.9353 16.1094 32.7558 16.1847C33.7313 16.2733 34.5583 17.0646 34.5583 18.1837L34.5534 32.1448H44.3341C45.414 32.1431 46.2655 32.7838 46.4139 33.8394C46.5297 34.6657 46.0045 36.0525 44.8431 36.0558V36.0575Z"
        fill="#FF0931"
      />
      <path
        d="M11.7132 35.1609L8.38067 35.2295C7.67762 35.2445 7.14421 34.7561 7.07407 34.1388C6.99577 33.468 7.4574 32.7019 8.21265 32.7136L11.8127 32.7671C12.2564 32.7738 12.5631 33.6085 12.5566 33.9749C12.55 34.3412 12.2107 35.1508 11.7149 35.1609H11.7132Z"
        fill="#FF0931"
      />
      <path
        d="M33.8145 11.4105C33.8161 12.277 33.4899 12.8759 32.7444 12.9612C31.9989 13.0465 31.3742 12.4878 31.3791 11.6548L31.4019 8.47478C31.4068 7.78224 32.0528 7.35066 32.609 7.36237C33.2321 7.37575 33.8047 7.91439 33.8063 8.64707L33.8145 11.4105Z"
        fill="#FF0931"
      />
      <path
        d="M57.2435 35.1977H53.7543C53.1475 35.196 52.7577 34.4767 52.7577 33.9782C52.7577 33.4797 53.1524 32.732 53.7136 32.7336L57.3267 32.7387C57.8748 32.7387 58.2173 33.5199 58.2173 33.9765C58.2173 34.4031 57.8585 35.196 57.2451 35.196L57.2435 35.1977Z"
        fill="#FF0931"
      />
      <path
        d="M33.7981 59.3277C33.7981 59.9651 33.2876 60.4736 32.7656 60.5505C32.1718 60.6392 31.4035 60.2143 31.4019 59.4917L31.3889 56.1394C31.3856 55.4703 32.0658 54.9668 32.596 54.9818C33.3137 55.0019 33.7916 55.5372 33.7933 56.31L33.7998 59.3294L33.7981 59.3277Z"
        fill="#FF0931"
      />
      <path
        d="M22.1399 13.9264C22.3601 14.3045 21.9458 14.9769 21.6815 15.2044C21.3635 15.4771 20.4549 15.713 20.2004 15.2797L18.7715 12.8441C18.5529 12.4711 18.9069 11.7752 19.1776 11.5293C19.5218 11.2148 20.4842 11.0776 20.7338 11.5059L22.1399 13.9281V13.9264Z"
        fill="#FF0931"
      />
      <path
        d="M45.5119 15.733C45.2574 16.1345 44.4385 16.0074 44.1139 15.7966C43.8219 15.6076 43.3146 14.9385 43.5348 14.5805L45.1416 11.9743C45.3275 11.6732 46.1431 11.8337 46.4498 12.0027C46.7565 12.1717 47.3339 12.8575 47.0745 13.2673L45.5119 15.7314V15.733Z"
        fill="#FF0931"
      />
      <path
        d="M20.8007 56.2983C20.5234 56.7767 19.6621 56.7048 19.269 56.4706C18.933 56.2699 18.4893 55.5104 18.7503 55.0755L20.1449 52.7587C20.3586 52.404 21.2411 52.4743 21.5592 52.6984C21.8577 52.9075 22.3487 53.6252 22.1432 53.9781L20.7974 56.2983H20.8007Z"
        fill="#FF0931"
      />
      <path
        d="M53.4004 24.2894C52.8653 24.6256 52.1215 24.6808 51.7235 24.2124C51.4299 23.8678 51.1281 22.9863 51.655 22.5145C52.27 21.9642 53.097 21.5326 53.9485 21.2014C54.3187 21.0575 54.8685 21.5326 55.0397 21.817C55.2322 22.1365 55.3382 23.0649 55.0202 23.2673L53.4004 24.2877V24.2894Z"
        fill="#FF0931"
      />
      <path
        d="M11.7018 47.4576C11.2239 47.7486 10.6285 47.1832 10.4702 46.8771C10.2794 46.5041 10.2011 45.5924 10.5632 45.3766L12.6871 44.1137C13.072 43.8845 13.7473 44.3947 13.9186 44.7159C14.1111 45.0755 14.2269 45.9203 13.8517 46.1478L11.7018 47.4559V47.4576Z"
        fill="#FF0931"
      />
      <path
        d="M13.7637 21.6748C14.1551 21.9056 14.1372 22.7203 13.9561 23.1034C13.793 23.4496 13.1438 23.9632 12.7213 23.7758C11.8861 23.4061 11.2565 23.0281 10.5012 22.4844C10.2174 22.2787 10.2941 21.4055 10.4784 21.0994C10.6741 20.7732 11.3576 20.2546 11.7622 20.4938L13.762 21.6765L13.7637 21.6748Z"
        fill="#FF0931"
      />
    </svg>
  );
}

function DineInTakeawayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="58"
      height="71"
      viewBox="0 0 58 71"
      fill="none"
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
      width="86"
      height="68"
      viewBox="0 0 86 68"
      fill="none"
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
  const [indicator, setIndicator] = useState({ top: 0, height: 90 });

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
        <div className="px-6 py-20 sm:px-10 md:px-12 xl:px-25">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between w-full">
            <div className="flex-1">
              <h1 className="m-0 capitalize leading-[1] sm:text-nowrap">
                <span
                  className="font-[family-name:var(--font-korolev),Korolev,sans-serif] font-black text-black"
                  style={{ fontSize: "clamp(48px, 11vw, 150px)" }}
                >
                  Find your{" "}
                </span>
                <br className="" />
                <span
                  className="font-[family-name:var(--font-korolev),Korolev,sans-serif] font-black text-[#FF0931]"
                  style={{ fontSize: "clamp(48px, 11vw, 150px)" }}
                >
                  nearest Crispies
                </span>
              </h1>
            </div>

            <div className="flex lg:justify-end gap-4 sm:gap-5 lg:mt-4">
              <img
                src="/images/locationimages.png"
                alt=""
                className=" w-[80%]"
              />
            </div>
          </div>
        </div>

        {/* Features Bar */}
        <div className="px-6 py-6 sm:px-10 md:px-12 xl:px-25">
          <div className="grid min-h-[223px] grid-cols-1 rounded-[30px] border-[1.5px] border-[#C4C4C4] bg-[#FDFDFD] sm:grid-cols-2 xl:grid-cols-4 lg:items-stretch">
            {FEATURES.map((feat, i) => (
              <div
                key={feat.title}
                className="relative flex items-center sm:justify-center px-6 py-6 sm:px-4 lg:py-0"
              >
                {i > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 hidden h-[50%] translate-y-1/2 w-px bg-linear-to-b from-transparent via-[#3D3C3D] to-transparent lg:block"
                  />
                )}
                <div className="flex lg:items-center gap-8">
                  <div className="flex h-12 shrink-0 items-center">
                    {feat.icon}
                  </div>
                  <div className="min-w-0">
                    <h4 className="m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[30px] font-black capitalize leading-[100%] text-black">
                      {feat.title}
                    </h4>
                    <p className=" max-w-[180px]  pl-1 font-[family-name:var(--font-inter),Inter,sans-serif] text-[20px] font-normal leading-normal text-[#6B6B6B]">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map + Locations List */}
        <div className="px-6 pb-6 sm:px-10 md:px-12 xl:px-25 my-20">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-stretch lg:gap-20">
            {/* Left — bordered location cards */}
            <div className="flex flex-1 min-w-0 gap-5 sm:gap-20">
              <div
                ref={trackRef}
                className="relative w-2 shrink-0 self-stretch rounded-[4px] bg-[#D9D9D9]"
              >
                <span
                  className="absolute left-0 w-2 rounded-[4px] bg-[#FF0931] transition-all duration-300 ease-out h-[50px] translate-y-[150%]"
                  style={{ top: indicator.top }}
                />
              </div>

              <div className="flex flex-1 flex-col gap-4 sm:gap-10">
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
                      className={`relative shrink-0 cursor-pointer flex items-center rounded-[20px] border-2 bg-white px-6 py-6 transition-colors duration-200 sm:h-[221px] sm:px-7 sm:py-0 ${
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
                        className="absolute right-5  shrink-0 transition-transform duration-200 hover:scale-110 sm:right-6"
                      >
                        <ArrowIcon className="h-[42px] w-[42px] sm:h-[44px] sm:w-[44px]" />
                      </button>

                      <div className="flex w-full items-center gap-4 pr-14 sm:gap-10 sm:pl-10 sm:pr-0 lg:gap-20 ">
                        <span
                          className={`shrink-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[30px] font-bold leading-none sm:text-[34px] ${
                            isActive ? "text-[#FF0931]" : "text-[#F3B9C3]"
                          }`}
                        >
                          {displayNum}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-5">
                            <span
                              className={`font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[26px] font-bold uppercase leading-none tracking-[0.54px] sm:text-[40px] ${
                                isActive ? "text-black" : "text-[#B3B3B3]"
                              }`}
                            >
                              {loc.name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-2  rounded-full px-[12px] py-[4px] text-[14px] font-medium text-white sm:text-[14px] ${
                                isActive ? "bg-[#1F5C2E]" : "bg-[#A9C4AE]"
                              }`}
                            >
                              <span
                                className={`h-[6px] w-[6px] rounded-full ${
                                  isActive ? "bg-[#7CFF8A]" : "bg-white/70"
                                }`}
                              />
                              {loc.status === "open" ? "Open Now" : "Closed"}
                            </span>
                          </div>

                          <p
                            className={`m-0 mt-3 max-w-[280px] font-[family-name:var(--font-inter),Inter,sans-serif] text-[13px] leading-[1.4] sm:mt-8 sm:text-[20px] ${
                              isActive ? "text-[#999]" : "text-[#D2D2D2]"
                            }`}
                          >
                            {loc.address}
                          </p>

                          <p
                            className={`m-0 mt-2 text-center font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] font-bold sm:mt-4 ${
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
              <div className="relative h-[400px] w-full overflow-hidden rounded-[20px] bg-[#1A1A1A] lg:h-full sm:rounded-[24px]">
                <LocationsMap
                  locations={mapLocations}
                  selectedId={selectedId}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer CTA — Can't Find Us */}
        <div className="px-6  sm:px-10 md:px-12 xl:px-25 py-20">
          <div className="flex flex-col items-center gap-8 rounded-[30px] border-[1.5px] border-[#C4C4C4] bg-[#FDFDFD] px-6 py-8 lg:flex-row lg:justify-between xl:gap-30 lg:px-10 lg:py-10">
            <div className="flex  justify-between gap-20 w-full lg:w-auto  items-center">
              {" "}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="85"
                height="82"
                viewBox="0 0 85 82"
                fill="none"
              >
                <path
                  d="M75.7059 53.0703L68.0744 53.0834C66.6922 53.0834 65.8145 54.125 65.9324 55.4023C66.0372 56.5684 67.0984 57.4462 68.3889 57.2234L72.7516 57.3151L79.6494 77.8449C79.6494 77.8449 5.04401 78.7227 3.26878 78.3362L11.6078 57.2234L14.2542 57.2627H17.8833C19.0952 57.2627 20.0057 56.3129 20.0254 55.2386C20.0516 54.2101 19.2065 53.0965 18.0078 53.09L8.54861 53.0703L0 77.9104V81.9653L84.7 81.8539V79.856L75.7059 53.0703Z"
                  fill="#E21E2F"
                />
                <path
                  d="M65.9718 13.8387C63.155 8.47369 58.5826 4.37953 53.008 1.96234C47.3089 -0.500706 40.9876 -0.605516 35.0854 1.42519C30.3165 3.0694 26.0062 5.82068 22.6064 9.54145C18.5778 13.95 16.3505 19.4853 15.8003 25.4006C14.7653 36.6219 19.2852 47.5484 26.0193 56.3983C30.4869 62.2677 35.9763 67.1283 42.147 71.1176C42.9986 71.6679 43.7585 71.5172 44.5446 71.0063C46.7652 69.5455 48.8483 68.1174 50.8791 66.3488C58.1044 60.0405 63.6201 52.0552 66.7513 42.9498C69.9415 33.6544 70.5965 22.6428 65.9652 13.8387H65.9718ZM44.9638 47.9414C33.5133 49.3236 23.0846 41.1091 21.709 29.652C20.3464 18.3128 28.4431 7.76622 40.0377 6.41024C51.6717 5.0477 62.0021 13.4718 63.2598 24.8765C64.5175 36.2747 56.3489 46.5658 44.9573 47.9414H44.9638Z"
                  fill="black"
                />
                <path
                  d="M54.4556 20.9596C47.1058 11.7821 26.3402 17.7235 30.2051 23.534C30.6833 24.248 31.5349 24.5559 32.5633 24.5559L52.9293 24.5428C53.794 24.5428 54.7635 24.248 55.0386 23.5667C55.3793 22.7413 55.019 21.6539 54.4556 20.953V20.9596ZM37.1947 21.5688C36.5723 21.7587 35.8583 21.3264 35.6684 20.6648C35.4915 20.0621 35.8911 19.335 36.6379 19.1712C37.2995 19.0271 37.9152 19.466 38.0593 19.9901C38.2624 20.7172 37.8759 21.3657 37.1947 21.5753V21.5688ZM42.6514 20.3897C41.9635 20.5207 41.3019 20.049 41.184 19.3743C41.0595 18.6799 41.505 18.038 42.3107 17.9135C42.9461 17.8152 43.575 18.3459 43.6733 18.9027C43.7977 19.6232 43.313 20.2652 42.6514 20.3897ZM48.7107 21.3461C48.1146 21.667 47.4464 21.464 47.1255 21.0644C46.6145 20.429 46.7979 19.6298 47.5578 19.204C48.1932 18.8437 48.94 19.1647 49.2151 19.7542C49.4771 20.311 49.2348 21.0578 48.7042 21.3461H48.7107Z"
                  fill="#E21E2F"
                />
                <path
                  d="M54.7438 32.3455C54.9796 34.5727 53.7088 36.4135 51.5012 36.4135H33.166C31.3514 36.4135 30.2051 35.0706 29.9954 33.4002C29.943 33.0071 29.9234 31.8804 30.5391 31.8804L53.7285 31.8477C54.0691 31.8477 54.7111 32.0769 54.7438 32.3455Z"
                  fill="#E21E2F"
                />
                <path
                  d="M49.5624 25.8924C51.9533 25.6828 54.8094 26.0365 54.7963 28.1262C54.7898 29.207 53.5779 30.3534 52.3267 30.3599L33.8408 30.4189C31.9345 30.4189 30.1265 29.9079 29.9759 28.3489C29.8252 26.7898 31.3057 25.8793 33.2774 25.8793H42.7038L46.156 29.4232L49.5624 25.8858V25.8924Z"
                  fill="#E21E2F"
                />
              </svg>
              <div>
                <h3 className="m-0 font-[family-name:var(--font-korolev),Korolev,sans-serif] text-[36px] font-black uppercase leading-[100%] tracking-[0.54px] text-[#010101] sm:text-[50px]">
                  Cant find us
                </h3>
                <p className="m-0 mt-2 font-[family-name:var(--font-inter),Inter,sans-serif] text-[16px] font-normal capitalize leading-[100%] tracking-[0.54px] text-[#696969]  sm:text-[20px]">
                  Search for your area and
                  <br />
                  find nearest crispies
                </p>
              </div>
            </div>

            <div className="flex w-full items-center gap-4 lg:contents">
              <div className="relative flex-1 rounded-[20px] border border-[#C4C4C4] bg-white h-[84px] pl-12 pr-6 font-[family-name:var(--font-inter),Inter,sans-serif] text-[14px] text-black outline-none placeholder:text-[#999] focus:border-[#FF0931] sm:text-[16px] flex items-center gap-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="32"
                  viewBox="0 0 24 32"
                  fill="none"
                >
                  <path
                    d="M8.85742 1.11133C11.3883 0.239895 14.0878 0.286972 16.5156 1.33691C18.8751 2.36081 20.8063 4.08169 22.0146 6.32617L22.0693 6.42871C24.0548 10.2059 23.7922 14.9826 22.3906 19.0693C21.1051 22.8103 18.9011 26.123 16.0186 28.8047L15.4326 29.332C14.5513 30.1001 13.6434 30.7238 12.6543 31.375C12.5176 31.4639 12.4247 31.4937 12.3604 31.499C12.3076 31.5034 12.2359 31.4949 12.126 31.4238C9.40719 29.6648 6.9956 27.5264 5.03613 24.9502C2.07171 21.0513 0.115631 16.2808 0.563477 11.4199C0.800749 8.86737 1.75919 6.49437 3.48047 4.60938C4.94197 3.00872 6.79769 1.82091 8.85645 1.11035L8.85742 1.11133ZM11.3652 2.32715L10.8525 2.37402C5.38608 3.01385 1.57071 7.98868 2.21289 13.3369C2.86123 18.7399 7.77579 22.6151 13.1748 21.9629L13.1738 21.9619C18.5418 21.3121 22.3906 16.4596 21.7979 11.084C21.2236 5.8734 16.6375 1.98117 11.3652 2.32715Z"
                    stroke="#696969"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Enter Your Area Or Postcode"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className=" w-full outline-0 hover:border-0 placeholder:text-xl"
                />
              </div>
              <button
                type="button"
                className="flex  shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#FF0931] text-white transition-transform hover:scale-105"
                aria-label="Search location"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="84"
                  height="84"
                  viewBox="0 0 84 84"
                  fill="none"
                >
                  <rect width="84" height="84" rx="15" fill="#FF0000" />
                  <path
                    d="M29.3603 59L26 55.6441L50.9869 30.6467H31.6867L31.7298 26H59V53.2777H54.3042L54.3473 34.0026L29.3603 59Z"
                    fill="white"
                  />
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
