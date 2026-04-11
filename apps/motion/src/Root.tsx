import { Composition } from "remotion";
import { Intro } from "./Intro";
import { IntroMobile } from "./IntroMobile";

// Total: 860 frames @ 30fps = ~28.7 seconds
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Intro"
        component={Intro}
        durationInFrames={860}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="IntroMobile"
        component={IntroMobile}
        durationInFrames={860}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
}
