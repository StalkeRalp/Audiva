import Image from "next/image";

export function AuthBrand({ className = "" }) {
  return <>
    <Image src="/logoAudiva4png" alt="Audiva" width={1254} height={1254} priority className={`auth-brand-mark auth-brand-mark--audiva ${className}`} />
    <Image src="/audiva_apple2.png" alt="Audiva" width={512} height={512} priority className={`auth-brand-mark auth-brand-mark--apple ${className}`} />
  </>;
}
