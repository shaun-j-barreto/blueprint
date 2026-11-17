"use client";

import MotionProvider from "@/components/motion/MotionProvider";
import { useSession } from "@/lib/auth-client";
import CapabilityStrip from "./CapabilityStrip";
import CtaBand from "./CtaBand";
import FeatureBento from "./FeatureBento";
import Footer from "./Footer";
import Hero from "./Hero";
import Nav from "./Nav";
import Spotlight from "./Spotlight";
import Workflow from "./Workflow";

export default function MarketingPage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = Boolean(session?.user);

  return (
    <MotionProvider>
      <div className="brand-light bg-brand-100 text-brand-800 relative min-h-screen overflow-x-clip">
        <Nav isSignedIn={isSignedIn} isPending={isPending} />
        <main>
          <Hero isSignedIn={isSignedIn} />
          <CapabilityStrip />
          <FeatureBento />
          <Workflow />
          <Spotlight />
          <CtaBand isSignedIn={isSignedIn} />
        </main>
        <Footer isSignedIn={isSignedIn} />
      </div>
    </MotionProvider>
  );
}
