
"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Gift } from "lucide-react";


export function OfferBanner() {
    const router = useRouter();

    const handleDepositClick = () => {
        router.push('/wallet');
    };

    return (
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white shadow-lg">
            <div className="absolute -bottom-10 -right-10 opacity-20">
                <Gift className="h-48 w-48 text-white" />
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
