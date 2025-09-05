import { Fragment } from "react";
import { Logo, Link } from "~/components/common";
import { Socials } from "./socials";

interface FooterNavLink {
  label: string;
  list: Array<{
    to: string;
    label: string;
    target?: React.HTMLAttributeAnchorTarget;
  }>;
}
export interface FooterProps {
  navLinks: FooterNavLink[];
}
export const Footer = ({ navLinks }: FooterProps) => {
  return (
    <Fragment>
      <footer className="bg-neutral text-neutral-content py-8 sm:py-10">
        <div className="container footer md:footer-horizontal gap-x-8 gap-y-4">
          <aside className="md:max-w-sm max-md:mb-6">
            <Link className="mb-2" to="/">
              <Logo />
            </Link>
            <p>
              Edit any photo with simple words using our advanced AI.
              Nano Banana delivers consistent results for effortless image transformation.
            </p>
            <Socials className="mt-2" iconSize={24} />
          </aside>
          {navLinks.map((navLink, i) => (
            <div key={i}>
              <label className="footer-title mb-0">{navLink.label}</label>
              <nav className="flex flex-row md:flex-col gap-x-4 gap-y-2 flex-wrap">
                {navLink.list.map((link, i) => (
                  <Link
                    key={`${navLink.label}_${i}`}
                    className="link link-hover"
                    target={link.target}
                    to={link.to}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>
      </footer>
      <div className="bg-neutral text-neutral-content border-t border-neutral-700">
        <div className="container text-sm p-4">
          <p className="text-center leading-none text-neutral-400">
            © {new Date().getFullYear()}{" "}
            <span className="text-neutral-50">
              Nano Banana
            </span>{" "}
            All Rights Reserved.
          </p>
        </div>
      </div>
    </Fragment>
  );
};
