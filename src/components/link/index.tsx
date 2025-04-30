"use client"

import clsx from "clsx"
import NextLink, { LinkProps as NextLinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { forwardRef, MouseEvent } from "react"

interface LinkProps extends Omit<NextLinkProps, "href"> {
  href: string
  title?: string
  className?: string
  children: React.ReactNode
  onClick?: (event: MouseEvent<HTMLAnchorElement | HTMLDivElement>) => void
  isActive?: boolean
  activeClassName?: string
  disabled?: boolean
}

export const Link = forwardRef<HTMLAnchorElement | HTMLDivElement, LinkProps>(
  (
    {
      href,
      title,
      className,
      onClick,
      children,
      isActive,
      activeClassName,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const pathname = usePathname()
    const isExternal = href.startsWith("http")
    const isAnchor = href.startsWith("#") || href.startsWith(`${pathname}#`)
    const isCurrentPath = !isExternal && !isAnchor && pathname === href
    const isCurrentActive = isActive !== undefined ? isActive : isCurrentPath

    const attr = isExternal
      ? { target: "_blank", rel: "noopener noreferrer" }
      : {}

    const handleClick = (e: MouseEvent<HTMLAnchorElement | HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault()
        return
      }

      if (isAnchor) {
        e.preventDefault()
        const targetId = href.includes("#") ? href.split("#")[1] : ""
        if (targetId) {
          const targetElement = document.getElementById(targetId)
          targetElement?.scrollIntoView({ behavior: "smooth" })
        }
      }
      onClick?.(e)
    }

    return (
      <NextLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        onClick={handleClick}
        href={href}
        title={title}
        className={clsx(
          className,
          isCurrentActive && activeClassName,
          disabled && "disabled"
        )}
        tabIndex={disabled ? -1 : undefined}
        aria-disabled={disabled}
        {...props}
        {...attr}
      >
        {children}
      </NextLink>
    )
  }
)

Link.displayName = "Link"
