
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// A simple SVG for a Rakhi icon
const RakhiIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 12a2 2 0 1 0 4 0 2 2 0 1 0-4 0"/>
        <path d="M12 12a6 6 0 1 0 8.5 6 6 6 0 1 0-8.5-6Z"/>
        <path d="M4 12h.01"/>
        <path d="M6 12h.01"/>
        <path d="M8 12h.01"/>
        <path d="M16 12h.01"/>
        <path d="M18 12h.01"/>
        <path d="M20 12h.01"/>
    </svg>
)

export function OfferBanner() {
    const router = useRouter();

    const handleDepositClick = () => {
        router.push('/wallet');
    };

    return (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white shadow-lg">
            <div className="absolute -bottom-10 -right-10 opacity-20">
                <RakhiIcon className="h-40 w-40 text-white" />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                <h2 className="text-4xl font-bold">
                    Happy Raksha Bandhan!
                </h2>
                <p className="text-lg font-semibold">
                    Celebrate with us! Deposit today and get a <span className="text-yellow-300 font-bold">20% bonus!</span>
                </p>
                <Button onClick={handleDepositClick} variant="secondary" size="lg">
                    Deposit Now
                </Button>
            </div>
        </div>
    );
}
