import Hero from './(Home)/Hero';
import Induction from './(Home)/Induction';
import CallToAction from './(Home)/CallToAction';
import BuskingMap from './(Home)/BuskingMap';

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <CallToAction />
      <Induction />
      <BuskingMap />
    </main>
  );
}
