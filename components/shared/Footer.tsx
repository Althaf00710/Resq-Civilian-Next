'use client';
import Image from 'next/image';
import { Heart } from "lucide-react";

function Footer() {
    return (
        <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row justify-between items-center bg-blue-900 text-white px-6 md:px-12 py-6">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
                <Image
                    src="/images/Resq-white.png"
                    alt="ResQ"
                    width={80}
                    height={50}
                    priority
                />
            </div>
            
          <div className="text-center md:text-right opacity-80">
            <p>&copy; 2025 ResQ Emergency Response. All rights reserved.</p>
            <p className="text-sm mt-1">Saving lives, one emergency at a time.</p>
          </div>
        </div>
    )
}

export default Footer;