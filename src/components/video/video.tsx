"use client";

import clsx from "clsx";
import { HTMLAttributes, useEffect, useRef } from "react";
import { useIntersectionObserver } from "usehooks-ts";
import s from "./video.module.scss";

interface VideoProps extends HTMLAttributes<HTMLDivElement> {
  id: string;
}
export const OBSERVER = {
  threshold: 0,
  root: null,
  rootMargin: "0px",
};

export const Video = ({ id, ...props }: VideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isIntersecting, ref: containerRef } =
    useIntersectionObserver(OBSERVER);

  useEffect(() => {
    if (isIntersecting && videoRef.current) {
      videoRef.current.play().catch(() => {
        // ignore error
      });
    } else if (videoRef.current) {
      videoRef.current.pause();
    }
  }, [isIntersecting]);

  return (
    <div
      {...props}
      ref={containerRef}
      className={clsx(s.video, props.className)}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={`/video/${id}.webp`}
        data-ref={id}
      >
        <source src={`/video/${id}.mp4`} type="video/mp4" />
        <source src={`/video/${id}.webm`} type="video/webm" />
      </video>
    </div>
  );
};
