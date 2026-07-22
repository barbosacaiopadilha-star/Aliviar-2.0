import Link from "next/link";

import {
  LANDING_INVITE_GESTURE,
  LANDING_INVITE_HREF,
  buildFarewellLine,
  buildInviteLines,
} from "./invite-model";

const INVITE_LINES = buildInviteLines();
const FAREWELL_LINE = buildFarewellLine();

export function LimiarInviteSection() {
  return (
    <>
      <section className="limiar__invite">
        <p
          className="limiar__voice limiar__reveal-line limiar__reveal-line--1"
          style={{ animationDelay: `${INVITE_LINES[0].delayMs}ms` }}
        >
          {INVITE_LINES[0].text}
        </p>
        <p
          className="limiar__voice limiar__reveal-line limiar__reveal-line--2"
          style={{ animationDelay: `${INVITE_LINES[1].delayMs}ms` }}
        >
          <Link href={LANDING_INVITE_HREF} className="limiar__invite-gesture">
            {LANDING_INVITE_GESTURE}
          </Link>
        </p>
      </section>

      <p
        className="limiar__voice limiar__farewell limiar__reveal-line"
        style={{ animationDelay: `${FAREWELL_LINE.delayMs}ms` }}
      >
        {FAREWELL_LINE.text}
      </p>
    </>
  );
}
