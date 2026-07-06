function Icon({ size = 24, strokeWidth = 1.8, children, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HomeIcon = (p) => (
  <Icon {...p}>
    <path d="M4 11.2 12 4.5l8 6.7V19a1.6 1.6 0 0 1-1.6 1.6h-3.6v-5.4H9.2v5.4H5.6A1.6 1.6 0 0 1 4 19z" />
  </Icon>
)

export const BoxIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.2l7.6 4.2v9.2L12 20.8l-7.6-4.2V7.4z" />
    <path d="M4.6 7.6 12 11.8l7.4-4.2" />
    <path d="M12 11.8v8.6" />
  </Icon>
)

export const ClipboardIcon = (p) => (
  <Icon {...p}>
    <rect x="5.5" y="4.5" width="13" height="16.5" rx="2.2" />
    <path d="M9 4.5a3 3 0 0 1 6 0" />
    <path d="M9.2 13.4l2 2.1 3.8-4.4" />
  </Icon>
)

export const UsersIcon = (p) => (
  <Icon {...p}>
    <circle cx="9.2" cy="8.4" r="3.3" />
    <path d="M3.4 19.4c.7-3.2 3-5 5.8-5s5.1 1.8 5.8 5" />
    <path d="M15.5 5.9a2.9 2.9 0 1 1 1.3 5.5" />
    <path d="M16.6 14.6c2.3.3 3.8 1.8 4.3 4.2" />
  </Icon>
)

export const BellIcon = (p) => (
  <Icon {...p}>
    <path d="M6.3 9.8a5.7 5.7 0 0 1 11.4 0c0 4.2 1.6 5.6 1.6 5.6H4.7s1.6-1.4 1.6-5.6z" />
    <path d="M10 18.8a2.1 2.1 0 0 0 4 0" />
  </Icon>
)

export const AlertIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4.2 21 19.5H3z" />
    <path d="M12 10.2v4" />
    <path d="M12 16.9v.1" strokeWidth="2.4" />
  </Icon>
)

export const ClockIcon = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.6V12l3 2.2" />
  </Icon>
)

export const ShareIcon = (p) => (
  <Icon {...p}>
    <path d="M12 3.4v11" />
    <path d="m8.2 6.8 3.8-3.6 3.8 3.6" />
    <path d="M6.5 11H6a2 2 0 0 0-2 2v5.5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V13a2 2 0 0 0-2-2h-.5" />
  </Icon>
)

export const SearchIcon = (p) => (
  <Icon {...p}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.6 15.6 4.2 4.2" />
  </Icon>
)

export const ChevronIcon = (p) => (
  <Icon {...p}>
    <path d="m9.5 6.5 5.5 5.5-5.5 5.5" />
  </Icon>
)

export const PlusIcon = (p) => (
  <Icon {...p}>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
)

export const MinusIcon = (p) => (
  <Icon {...p}>
    <path d="M5.5 12h13" />
  </Icon>
)

export const CheckIcon = (p) => (
  <Icon {...p}>
    <path d="m5 12.8 4.4 4.4L19 7.5" />
  </Icon>
)

export const LogoutIcon = (p) => (
  <Icon {...p}>
    <path d="M14.5 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.5a2 2 0 0 0 2-2v-2" />
    <path d="M10 12h10.2" />
    <path d="m17 8.8 3.2 3.2-3.2 3.2" />
  </Icon>
)

export const TrashIcon = (p) => (
  <Icon {...p}>
    <path d="M4.5 6.8h15" />
    <path d="M9 6.5V5a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5v1.5" />
    <path d="M6.3 6.8 7 19a1.8 1.8 0 0 0 1.8 1.7h6.4A1.8 1.8 0 0 0 17 19l.7-12.2" />
    <path d="M10 10.5v6M14 10.5v6" />
  </Icon>
)

export const BackspaceIcon = (p) => (
  <Icon {...p}>
    <path d="M8.6 5.5h9.4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8.6a2 2 0 0 1-1.5-.7L3 12l4.1-5.8a2 2 0 0 1 1.5-.7z" />
    <path d="m11 9.5 5 5M16 9.5l-5 5" />
  </Icon>
)

export const SparkleIcon = (p) => (
  <Icon {...p}>
    <path d="M12 4.5 13.8 10 19.3 12l-5.5 2-1.8 5.5L10.2 14l-5.5-2 5.5-2z" />
  </Icon>
)

export const NoteIcon = (p) => (
  <Icon {...p}>
    <path d="M16.8 3.8a2.2 2.2 0 0 1 3.1 3.1L8.5 18.3l-4.2 1.1 1.1-4.2z" />
  </Icon>
)

export function LogoMark({ size = 64 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="pantri-tile" x1="8" y1="6" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7B750" />
          <stop offset="1" stopColor="#EE9424" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#pantri-tile)" />
      <g stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M17 34.5h30c0 9.2-6.4 15.5-15 15.5s-15-6.3-15-15.5z" />
        <path d="M13.5 34.5h37" />
        <path d="M25.5 26.5c-2.4-2.6-.4-4.6 0-6.4" opacity="0.9" />
        <path d="M32.5 25.8c-2.4-2.6-.4-5.4 0-7.3" opacity="0.9" />
        <path d="M39.5 26.5c-2.4-2.6-.4-4.6 0-6.4" opacity="0.9" />
      </g>
    </svg>
  )
}
