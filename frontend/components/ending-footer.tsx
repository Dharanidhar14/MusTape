import { FooterQuote } from "@/components/ui/typography";
import { product } from "@/lib/design-tokens";

export function EndingFooter() {
  return (
    <section className="quiet-ending px-5 py-32 text-paper-100 sm:px-8 sm:py-40 lg:px-10">
      <div className="mx-auto max-w-[84rem]">
        <div className="max-w-3xl">
          <FooterQuote>{product.footerLine}</FooterQuote>
          <p className="mt-8 max-w-xl text-xl leading-9 text-paper-300">
            {product.footerEcho}
          </p>
        </div>

        <div className="mt-28 border-t border-paper-100/15 pt-8">
          <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-display text-3xl text-paper-100">{product.name}</p>
              <p className="mt-3 text-sm uppercase tracking-[0.18em] text-paper-300">{product.tagline}</p>
              <p className="mt-5 text-sm text-paper-300">Version {product.version}</p>
            </div>
            <nav aria-label="Ending" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-paper-300">
              <a className="transition hover:text-paper-100" href="https://github.com">GitHub</a>
              <a className="transition hover:text-paper-100" href="#compose">Privacy</a>
              <a className="transition hover:text-paper-100" href="#compose">Terms</a>
              <span>Made with intention.</span>
            </nav>
          </div>
        </div>
      </div>
    </section>
  );
}
