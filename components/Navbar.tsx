'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Logo from '@/public/assets/logo.png';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (pathname === '/sign-up' || pathname === '/sign-in') {
    return null;
  }

  async function handleSignOut() {
    const {} = await supabase.auth.signOut();
    router.push('/auth');
  }

  return (
    <nav className="flex justify-between items-center px-5 py-1 min-h-[60px] bg-[#01182F]">
      <Link href="/">
        <Image
          src={Logo}
          alt="Logo Image"
          width={120}
          height={50}
          className="hover:scale-110"
        />
      </Link>
      <div className="gap-2 flex items-center">
        <Link href="/buskers">
          <button className=" text-lg text-white font-semibold rounded-lg px-4 py-1 hover:opacity-70 hover:cursor-pointer">
            Buskers
          </button>
        </Link>
        <Link href="/livemap">
          <button className=" text-lg text-white font-semibold rounded-lg px-4 py-1 hover:opacity-70 hover:cursor-pointer">
            Live
          </button>
        </Link>

        {isSignedIn ? (
          <div className="relative">
            <button
              className="flex items-center gap-2 text-white hover:opacity-80 hover:cursor-pointer"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#01182F] font-bold">
                {user?.user_metadata?.username[0].toUpperCase() || 'U'}
              </div>
            </button>

            {isMenuOpen && (
              <>
                {/* Backdrop for closing the modal when clicking outside */}
                <div
                  className="fixed inset-0 z-10 "
                  onClick={() => setIsMenuOpen(false)}
                ></div>

                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link href="/auth">
            <button className="bg-white text-[#01182F] font-semibold rounded-lg px-6 py-2 hover:bg-opacity-90 transition-all">
              Sign In
            </button>
          </Link>
        )}
      </div>
      {/* <div className="md:hidden block z-40">
        {istoggleOpen ? (
          <X size={25} onClick={() => setIsToggleOpen(false)} />
        ) : (
          <AlignJustify size={25} onClick={() => setIsToggleOpen(true)} />
        )}
      </div> */}
    </nav>
  );
};

export default Navbar;
