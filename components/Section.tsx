import type { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20 ${className}`}>
      {children}
    </section>
  );
}
