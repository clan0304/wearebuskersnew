import Hero from './(Home)/Hero';
import Induction from './(Home)/Induction';
import CallToAction from './(Home)/CallToAction';

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />
      <CallToAction />
      <Induction />
    </main>
  );
}
