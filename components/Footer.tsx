import { Instagram } from 'lucide-react';
import { Youtube } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <section className="min-h-[100px] flex px-10 md:px-20 lg:px-30 justify-between bg-[#01182F] text-white items-center">
      <p className="font-roboto">WE ARE BUSKERS</p>
      <div className="flex gap-3">
        <Link href="https://www.instagram.com/wearebuskers">
          <Instagram className="hover:scale-110" />
        </Link>
        <Link href="https://www.youtube.com/@WeAreBuskers">
          <Youtube className="hover:scale-110" />
        </Link>
      </div>
    </section>
  );
};

export default Footer;
