interface LogoProps {
  size?: number;
}

export function Logo({ size = 50 }: LogoProps) {
  return (
      <img
          src="/logo.PNG"
          alt="VitaminA Logo"
          width={size}
          height={size}
          style={{ objectFit: "contain",objectPosition: 'center' }}
      />
  );
}