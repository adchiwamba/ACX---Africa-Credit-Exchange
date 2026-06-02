// components/Footer.tsx
import { Twitter, Linkedin, Mail } from 'lucide-react';
import ACXText from '../img/ACX logoText.png';
import ACX from '../img/ACX logo.png';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-white mt-10 md:mt-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="col-span-2 md:col-span-1">
        <img src={ACXText} alt="ACX Logo" className="h-22 " />
            

            <p className="text-gray-400 text-xs md:text-sm leading-relaxed mb-3 mt-4">
              The unified credit and liquidity platform for the African continent.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="text-gray-400 hover:text-guava-orange transition-colors cursor-pointer">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2">Platform</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Credit Scoring</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Liquidity Pools</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">For Lenders</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">For Borrowers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2">Resources</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Documentation</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">API Status</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Research</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Support</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs md:text-sm font-black uppercase tracking-wider mb-2">Legal</h4>
            <ul className="space-y-1.5">
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Terms</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Regulatory</a></li>
              <li><a href="#" className="text-gray-400 hover:text-guava-orange text-xs md:text-sm transition-colors cursor-pointer">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-white/30">
          <p className="text-gray-500 text-[11px] md:text-xs text-center">
            &copy; {currentYear} African Credit Exchange. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}