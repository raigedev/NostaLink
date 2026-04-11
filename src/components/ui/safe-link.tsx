import React from "react";

interface SafeLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

/**
 * SafeLink renders user-generated links with security attributes enforced.
 * All user-content links must use this component instead of <a>.
 */
export function SafeLink({ href, children, className, ...rest }: SafeLinkProps) {
  // Only allow http/https/mailto/tel schemes
  const isSafe = /^(?:https?:\/\/|mailto:|tel:|#)/i.test(href);
  const safehref = isSafe ? href : "#";

  return (
    <a
      href={safehref}
      rel="noopener noreferrer nofollow"
      target="_blank"
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
}

export default SafeLink;
