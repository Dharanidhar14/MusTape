import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { typographyTokens } from "@/lib/design-tokens";

type TypographyProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Text<T extends ElementType>({
  as,
  children,
  className,
  ...props
}: TypographyProps<T>) {
  const Component = as || "p";
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

export function HeroTitle<T extends ElementType = "h1">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.heroTitle, props.className)} />;
}

export function SectionTitle<T extends ElementType = "h2">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.sectionTitle, props.className)} />;
}

export function CardTitle<T extends ElementType = "h3">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.cardTitle, props.className)} />;
}

export function BodyText<T extends ElementType = "p">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.body, props.className)} />;
}

export function Caption<T extends ElementType = "p">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.caption, props.className)} />;
}

export function FooterQuote<T extends ElementType = "p">(props: TypographyProps<T>) {
  return <Text {...props} className={cx(typographyTokens.footerQuote, props.className)} />;
}
